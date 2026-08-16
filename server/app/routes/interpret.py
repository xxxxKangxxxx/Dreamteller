import logging
from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.deps.auth import get_current_user_id
from app.schemas.dream import ChatMessage
from app.services.gemini_service import chat_turn, generate_interpretation
from app.services.supabase_client import get_supabase
from app.utils.envelope import success
from app.utils.interpretation import serialize_interpretation
from app.utils.usage import ensure_chat_quota, ensure_interpretation_quota

logger = logging.getLogger("interpret")
router = APIRouter()
UserId = Annotated[str, Depends(get_current_user_id)]

_jobs: dict[str, str] = {}


class ChatPayload(BaseModel):
    sessionId: str = Field(max_length=64)
    messages: list[ChatMessage] = Field(min_length=1, max_length=30)
    step: int = Field(ge=0, le=5)


class GeneratePayload(BaseModel):
    dreamId: str


@router.post("/chat")
def chat(payload: ChatPayload, user_id: UserId) -> dict[str, Any]:
    ensure_chat_quota(user_id)
    # payload.step은 build 8 하위 호환을 위해 받기만 하고 진행 판정에는 쓰지 않는다.
    # 진실 소스는 messages — 사용자 발화 수가 곧 현재 턴이다(서버는 stateless 유지).
    turn = sum(1 for m in payload.messages if m.role == "user")
    logger.info(
        "interpret/chat enter session=%s turn=%s msgs=%s last_role=%s last_len=%s",
        payload.sessionId,
        turn,
        len(payload.messages),
        payload.messages[-1].role if payload.messages else None,
        len(payload.messages[-1].content) if payload.messages else 0,
    )

    result = chat_turn(payload.messages, turn)
    slots: dict[str, str | None] = result["slots"]
    filled = sum(1 for v in slots.values() if v)

    logger.info(
        "interpret/chat done session=%s turn=%s chars=%s filled=%s/%s complete=%s",
        payload.sessionId,
        turn,
        len(result["reply"]),
        filled,
        len(slots),
        result["complete"],
    )

    return success(
        {
            "text": result["reply"],
            # build 8은 이 값으로 "N/5단계"를 표시한다. 턴이 아니라 채워진 슬롯 수로
            # 환산해 내려주므로, 한 번에 다 말하면 옛 앱에서도 단계가 건너뛰어 보인다.
            "nextStep": min(filled + 1, 5),
            "complete": result["complete"],
            "slots": slots,
        }
    )


def _payload_for_db(result: dict[str, Any]) -> dict[str, Any]:
    """gemini_service 결과에서 DB에 저장할 구조화 payload만 추린다."""
    return {
        "symbolAnalysis": result.get("symbolAnalysis") or {},
        "psychologicalMeaning": result.get("psychologicalMeaning") or {},
        "unconsciousMessage": result.get("unconsciousMessage") or {},
    }


def _run_interpretation(dream_id: str, raw_content: str) -> None:
    try:
        result = generate_interpretation(raw_content)
        sb = get_supabase()
        try:
            sb.table("interpretations").insert(
                {
                    "dream_id": dream_id,
                    "symbol_analysis": result.get("symbolAnalysisText", ""),
                    "psychological_meaning": result.get("psychologicalMeaningText", ""),
                    "unconscious_message": result.get("unconsciousMessageText", ""),
                    "payload": _payload_for_db(result),
                }
            ).execute()
        except Exception as exc:
            if "duplicate key" not in str(exc):
                raise
    except Exception:
        logger.exception("interpretation generation failed for dream_id=%s", dream_id)
    finally:
        # 종료 상태는 /status의 DB 폴백이 진실 소스 — 엔트리를 남기면 무한 누적
        _jobs.pop(dream_id, None)


@router.post("/generate")
def generate(
    payload: GeneratePayload,
    user_id: UserId,
    background_tasks: BackgroundTasks,
) -> dict[str, Any]:
    sb = get_supabase()
    dream_res = (
        sb.table("dreams")
        .select("id, raw_content")
        .eq("id", payload.dreamId)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not dream_res.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="DREAM_NOT_FOUND")

    existing = (
        sb.table("interpretations")
        .select("dream_id")
        .eq("dream_id", payload.dreamId)
        .limit(1)
        .execute()
    )
    if existing.data:
        return success({"jobId": payload.dreamId, "status": "completed"})

    if _jobs.get(payload.dreamId) == "processing":
        return success({"jobId": payload.dreamId, "status": "processing"})

    # 한도 체크는 새 잡을 시작할 때만 — 이미 생성된 해석 조회는 막지 않는다
    ensure_interpretation_quota(sb, user_id)

    raw_content = dream_res.data[0]["raw_content"]
    _jobs[payload.dreamId] = "processing"
    background_tasks.add_task(_run_interpretation, payload.dreamId, raw_content)
    return success({"jobId": payload.dreamId, "status": "processing"})


@router.get("/status/{job_id}")
def job_status(job_id: str, _user_id: UserId) -> dict[str, Any]:
    s = _jobs.get(job_id)
    if s is not None:
        return success({"status": s})

    sb = get_supabase()
    res = (
        sb.table("interpretations")
        .select("dream_id")
        .eq("dream_id", job_id)
        .limit(1)
        .execute()
    )
    if res.data:
        return success({"status": "completed"})
    return success({"status": "failed"})


@router.get("/{dream_id}")
def get_interpretation(dream_id: str, user_id: UserId) -> dict[str, Any]:
    sb = get_supabase()
    dream_res = (
        sb.table("dreams")
        .select("id")
        .eq("id", dream_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not dream_res.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="DREAM_NOT_FOUND")

    res = (
        sb.table("interpretations")
        .select("*")
        .eq("dream_id", dream_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="INTERPRETATION_NOT_FOUND")

    return success(serialize_interpretation(res.data[0]))
