from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps.auth import get_current_user_id
from app.schemas.dream import CreateDreamPayload, UpdateDreamPayload
from app.services.gemini_service import generate_title
from app.services.supabase_client import get_supabase
from app.utils.envelope import success
from app.utils.interpretation import serialize_interpretation
from app.utils.usage import ensure_dream_quota

router = APIRouter()

UserId = Annotated[str, Depends(get_current_user_id)]


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
            "chatHistory": row.get("chat_history") or [],
            "interpretation": interp,
            "characters": [],
            "places": [],
        }
    )


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
