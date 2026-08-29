import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps.auth import get_current_user_id
from app.schemas.dream import CreateDreamPayload, UpdateDreamPayload
from app.services.gemini_service import generate_summary, generate_title
from app.services.supabase_client import get_supabase
from app.utils.envelope import success
from app.utils.interpretation import serialize_interpretation
from app.utils.model_json import looks_like_raw_json
from app.utils.usage import ensure_dream_quota

logger = logging.getLogger("dreams")
router = APIRouter()

UserId = Annotated[str, Depends(get_current_user_id)]


def _usable_summary(raw: Any) -> str:
    """저장된 줄거리 중 사용자에게 보여줘도 되는 것만 돌려준다.

    2026-08-29 이전 버전은 Gemini가 끝맺지 못한 JSON 원문을 그대로 저장했다.
    그런 값은 없는 것으로 취급해서, 상세를 열면 자동으로 다시 생성되게 한다.
    """
    text = (raw or "").strip() if isinstance(raw, str) else ""
    return "" if looks_like_raw_json(text) else text


def _to_summary(row: dict[str, Any], has_interpretation: bool = False) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "title": row.get("title") or "",
        "rawContent": row["raw_content"],
        "emotion": row["emotion"],
        "illustrationUrl": row.get("illustration_url"),
        "tags": [],
        "hasInterpretation": has_interpretation,
        "recordedAt": row["recorded_at"],
    }


@router.post("")
def create_dream(payload: CreateDreamPayload, user_id: UserId) -> dict[str, Any]:
    sb = get_supabase()
    ensure_dream_quota(sb, user_id)
    title = generate_title(payload.raw_content)
    row = {
        "user_id": user_id,
        "raw_content": payload.raw_content,
        "chat_history": [m.model_dump() for m in payload.chat_history],
        "emotion": payload.emotion,
        "recorded_at": payload.recorded_at.isoformat(),
        "title": title,
    }
    res = sb.table("dreams").insert(row).execute()
    if not res.data:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="INSERT_FAILED")
    saved = res.data[0]
    return success(
        {
            "id": str(saved["id"]),
            "title": saved.get("title") or "",
            "rawContent": saved["raw_content"],
            "tags": [],
        }
    )


@router.get("")
def list_dreams(
    user_id: UserId,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    emotion: str | None = Query(None),
    from_: str | None = Query(None, alias="from"),
    to: str | None = Query(None),
) -> dict[str, Any]:
    sb = get_supabase()
    q = (
        sb.table("dreams")
        .select("id, title, raw_content, emotion, illustration_url, recorded_at", count="exact")
        .eq("user_id", user_id)
        .order("recorded_at", desc=True)
    )
    if emotion:
        q = q.eq("emotion", emotion)
    if from_:
        q = q.gte("recorded_at", from_)
    if to:
        q = q.lte("recorded_at", to)

    offset = (page - 1) * limit
    res = q.range(offset, offset + limit - 1).execute()

    rows = res.data or []
    interp_set: set[str] = set()
    if rows:
        ids = [str(r["id"]) for r in rows]
        ires = sb.table("interpretations").select("dream_id").in_("dream_id", ids).execute()
        interp_set = {str(r["dream_id"]) for r in (ires.data or [])}

    dreams = [_to_summary(r, has_interpretation=str(r["id"]) in interp_set) for r in rows]
    return success(
        {
            "dreams": dreams,
            "pagination": {"page": page, "limit": limit, "total": res.count or 0},
        }
    )


@router.get("/{dream_id}")
def get_dream(dream_id: str, user_id: UserId) -> dict[str, Any]:
    sb = get_supabase()
    res = (
        sb.table("dreams")
        .select("*")
        .eq("id", dream_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="DREAM_NOT_FOUND")
    row = res.data[0]

    ires = sb.table("interpretations").select("*").eq("dream_id", dream_id).limit(1).execute()
    interp = serialize_interpretation(ires.data[0]) if ires.data else None

    return success(
        {
            **_to_summary(row, has_interpretation=interp is not None),
            # 줄거리는 상세에서만 내려준다 — 목록(E1)은 컬럼을 일부러 줄여둔 곳이다.
            # 깨진 값은 null로 내려 앱의 자동 생성 경로를 다시 태운다.
            "summary": _usable_summary(row.get("summary")) or None,
            "chatHistory": row.get("chat_history") or [],
            "interpretation": interp,
            "characters": [],
            "places": [],
        }
    )


@router.post("/{dream_id}/summary")
def create_summary(dream_id: str, user_id: UserId) -> dict[str, Any]:
    """꿈 대화를 줄거리로 정리한다 (S-2).

    해몽(12초)과 달리 150~300자 재구성이라 비동기 잡 없이 동기로 처리한다.

    **멱등** — 이미 줄거리가 있으면 Gemini를 부르지 않고 기존 값을 돌려준다.
    이것이 사실상의 비용 상한이라(꿈 1건당 최대 1회) 별도 사용량 한도를 두지 않는다.
    해몽 한도를 다 써도 줄거리 경로는 살아 있어야 하기 때문이기도 하다(B9-3).
    """
    sb = get_supabase()
    res = (
        sb.table("dreams")
        .select("id, summary, chat_history, raw_content")
        .eq("id", dream_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="DREAM_NOT_FOUND")
    row = res.data[0]

    existing = _usable_summary(row.get("summary"))
    if existing:
        return success({"dreamId": dream_id, "summary": existing, "cached": True})

    summary = generate_summary(row.get("chat_history"), row.get("raw_content") or "")
    # 저장 직전 마지막 방어선. 여기를 통과하지 못한 값은 DB에 남기지 않는다 —
    # 한 번 저장되면 멱등 캐시 때문에 영구히 그 값이 노출되기 때문이다.
    if not summary or looks_like_raw_json(summary):
        if summary:
            logger.warning("summary rejected before save dream_id=%s", dream_id)
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, detail="SUMMARY_GENERATION_FAILED"
        )

    sb.table("dreams").update({"summary": summary}).eq("id", dream_id).eq(
        "user_id", user_id
    ).execute()
    return success({"dreamId": dream_id, "summary": summary, "cached": False})


@router.patch("/{dream_id}")
def update_dream(dream_id: str, payload: UpdateDreamPayload, user_id: UserId) -> dict[str, Any]:
    sb = get_supabase()
    patch: dict[str, Any] = {}
    if payload.raw_content is not None:
        patch["raw_content"] = payload.raw_content
    if payload.emotion is not None:
        patch["emotion"] = payload.emotion
    if payload.title is not None:
        patch["title"] = payload.title
    if not patch:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="EMPTY_PATCH")

    res = (
        sb.table("dreams")
        .update(patch)
        .eq("id", dream_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="DREAM_NOT_FOUND")
    return success(_to_summary(res.data[0]))


@router.delete("/{dream_id}")
def delete_dream(dream_id: str, user_id: UserId) -> dict[str, Any]:
    sb = get_supabase()
    res = (
        sb.table("dreams")
        .delete()
        .eq("id", dream_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="DREAM_NOT_FOUND")
    return success({"success": True})
