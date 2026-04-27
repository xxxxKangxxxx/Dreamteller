import json
import logging
import traceback
from collections.abc import Iterator
from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.deps.auth import get_current_user_id
from app.schemas.dream import ChatMessage
from app.services.gemini_service import generate_interpretation, stream_chat
from app.services.supabase_client import get_supabase
from app.utils.envelope import success

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


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


@router.post("/chat")
def chat(payload: ChatPayload, _user_id: UserId) -> StreamingResponse:
    next_step = min(payload.step + 1, 5)

    def generator() -> Iterator[str]:
        try:
            for text in stream_chat(payload.messages, payload.step):
                yield _sse({"type": "text", "content": text})
            yield _sse({"type": "step", "nextStep": next_step})
            yield _sse({"type": "done"})
        except Exception as exc:
            logger.error("interpret/chat failed: %s\n%s", exc, traceback.format_exc())
            yield _sse({"type": "error", "message": f"{type(exc).__name__}: {exc}"})

    return StreamingResponse(generator(), media_type="text/event-stream")


def _run_interpretation(dream_id: str, raw_content: str) -> None:
    try:
        result = generate_interpretation(raw_content)
        sb = get_supabase()
        try:
            sb.table("interpretations").insert(
                {
                    "dream_id": dream_id,
                    "symbol_analysis": result["symbolAnalysis"],
                    "psychological_meaning": result["psychologicalMeaning"],
                    "unconscious_message": result["unconsciousMessage"],
                }
            ).execute()
        except Exception as exc:
            if "duplicate key" not in str(exc):
                raise
        _jobs[dream_id] = "completed"
    except Exception:
        logger.exception("interpretation generation failed for dream_id=%s", dream_id)
        _jobs[dream_id] = "failed"


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

    i = res.data[0]
    return success(
        {
            "dreamId": str(i["dream_id"]),
            "symbolAnalysis": i.get("symbol_analysis") or "",
            "psychologicalMeaning": i.get("psychological_meaning") or "",
            "unconsciousMessage": i.get("unconscious_message") or "",
            "status": "completed",
        }
    )
