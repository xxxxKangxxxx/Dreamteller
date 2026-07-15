import logging
from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel

from app.deps.auth import get_current_user_id
from app.schemas.dream import ChatMessage
from app.services.gemini_service import generate_interpretation, stream_chat
from app.services.supabase_client import get_supabase
from app.utils.envelope import success
from app.utils.interpretation import serialize_interpretation

logger = logging.getLogger("interpret")
router = APIRouter()
UserId = Annotated[str, Depends(get_current_user_id)]

_jobs: dict[str, str] = {}


class ChatPayload(BaseModel):
    sessionId: str
    messages: list[ChatMessage]
    step: int


class GeneratePayload(BaseModel):
    dreamId: str


RECORD_COMPLETE_TOKEN = "[RECORD_COMPLETE]"


@router.post("/chat")
def chat(payload: ChatPayload, _user_id: UserId) -> dict[str, Any]:
    next_step = min(payload.step + 1, 5)
    logger.info(
        "interpret/chat enter session=%s step=%s msgs=%s last_role=%s last_len=%s",
        payload.sessionId,
        payload.step,
        len(payload.messages),
        payload.messages[-1].role if payload.messages else None,
        len(payload.messages[-1].content) if payload.messages else 0,
    )

    parts: list[str] = list(stream_chat(payload.messages, payload.step))
    text = "".join(parts)
    complete = RECORD_COMPLETE_TOKEN in text
    if complete:
        text = text.replace(RECORD_COMPLETE_TOKEN, "").rstrip()

    logger.info(
        "interpret/chat done session=%s chars=%s next_step=%s complete=%s",
        payload.sessionId,
        len(text),
        next_step,
        complete,
    )

    return success({"text": text, "nextStep": next_step, "complete": complete})


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
