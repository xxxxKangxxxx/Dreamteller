import json
import logging
import time
from collections.abc import Iterator
from functools import lru_cache
from typing import Any

from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from app.config import settings
from app.schemas.dream import ChatMessage

logger = logging.getLogger("gemini")

MAX_RETRIES = 3
BASE_BACKOFF_S = 1.5

# gemini-2.5-flash 단가 (USD / 1M 토큰). thinking 토큰은 출력 단가로 과금된다.
# 단가가 바뀌면 여기만 고치면 되고, 로그에는 토큰 수가 원본 그대로 남으므로
# 나중에 다른 단가로 재계산하는 것도 가능하다.
PRICE_IN_PER_1M = 0.30
PRICE_OUT_PER_1M = 2.50


def _log_usage(call: str, usage: Any, **extra: Any) -> None:
    """Gemini 응답의 토큰 사용량을 한 줄로 남긴다.

    호출 종류(chat/title/interpret)별 실단가를 분리하기 위한 것 —
    지금은 꿈 1건 총액만 알고 대화:제목:해몽 비율을 모른다(IMPROVEMENTS S-1).

    `thoughts`는 thinking 토큰. 응답 본문에는 안 보이지만 출력 단가로 과금되므로
    cost 계산에 candidates와 함께 넣는다. total을 같이 남기는 이유는
    total == prompt + candidates + thoughts 가 실제로 성립하는지 로그로
    검증하기 위함 — SDK/모델에 따라 집계 방식이 다를 수 있어 가정하지 않는다.
    """
    if usage is None:
        logger.info("gemini usage call=%s usage=unavailable", call)
        return

    def _n(name: str) -> int:
        return getattr(usage, name, None) or 0

    prompt = _n("prompt_token_count")
    output = _n("candidates_token_count")
    thoughts = _n("thoughts_token_count")
    total = _n("total_token_count")

    usd = (prompt * PRICE_IN_PER_1M + (output + thoughts) * PRICE_OUT_PER_1M) / 1_000_000
    detail = "".join(f" {k}={v}" for k, v in extra.items())
    logger.info(
        "gemini usage call=%s%s prompt=%s output=%s thoughts=%s total=%s usd=%.6f",
        call,
        detail,
        prompt,
        output,
        thoughts,
        total,
        usd,
    )

LUNA_SYSTEM_PROMPT = """당신은 드림텔러의 꿈 기록 도우미 'Luna'입니다.

역할:
- 사용자가 아침에 기억하는 꿈을 편하게 이야기할 수 있도록 대화로 이끌어주세요.
- 전문적이거나 딱딱한 말투가 아닌, 친한 친구처럼 자연스럽고 부드러운 말투를 사용하세요.
- 이모지나 이모티콘은 사용하지 마세요. 담백하고 깔끔한 문장으로만 대화하세요.

대화 규칙:
1. 한 번에 하나의 질문만 하세요. 여러 질문을 동시에 하지 마세요.
2. 사용자의 답변에서 핵심 요소(장소, 인물, 사건, 감정)를 자연스럽게 끌어내세요.
3. 사용자가 "기억이 안 나", "모르겠어"라고 하면 압박하지 말고 다음 단계로 넘어가세요.
4. 각 단계별 질문 흐름:
   - Step 1 (장소): 꿈의 배경/공간
   - Step 2 (인물): 등장인물 (혼자였을 수도 있음)
   - Step 3 (사건): 핵심 사건이나 장면
   - Step 4 (감정): 꿈 속에서 느낀 감정
   - Step 5 (마무리): 충분한 정보 수집 후 요약 준비 신호

응답 언어: 한국어"""


@lru_cache(maxsize=1)
def _client() -> genai.Client:
    return genai.Client(api_key=settings.gemini_api_key)


def _system_for_step(step: int) -> str:
    # step 4(마지막 질문인 '감정'에 대한 답변)부터 마무리한다.
    # 사용자가 추가로 입력하지 않아도 이 응답에서 바로 완료 토큰을 내보내 종료되게 한다.
    if step >= 4:
        return (
            LUNA_SYSTEM_PROMPT
            + "\n\n[중요] 마무리 단계입니다. 장소·인물·사건·감정 정보를 충분히 모았으니"
            " 새로운 질문은 하지 말고, 짧고 따뜻하게 마무리하면서"
            " 응답 끝에 반드시 다음 형식으로 끝내세요:"
            "\n'이 정도면 꿈을 잘 담은 것 같아! 정리해볼게 [RECORD_COMPLETE]'"
        )
    return f"{LUNA_SYSTEM_PROMPT}\n\n현재 Step {step}/5"


def _collect_chunks(messages: list[ChatMessage], step: int) -> list[str]:
    history: list[types.Content] = []
    for m in messages[:-1]:
        role = "user" if m.role == "user" else "model"
        history.append(types.Content(role=role, parts=[types.Part.from_text(text=m.content)]))

    while history and history[0].role != "user":
        history.pop(0)

    chat = _client().chats.create(
        model="gemini-2.5-flash",
        config=types.GenerateContentConfig(system_instruction=_system_for_step(step)),
        history=history,
    )

    started = time.monotonic()
    parts: list[str] = []
    chunk_count = 0
    empty_chunk_count = 0
    last_finish_reason: str | None = None
    last_block_reason: str | None = None
    # 스트리밍은 청크마다 usage_metadata가 올 수 있고 뒤쪽 값이 누적치다.
    # 마지막으로 받은 것을 최종 사용량으로 본다.
    last_usage: Any = None
    for chunk in chat.send_message_stream(messages[-1].content):
        chunk_count += 1
        usage = getattr(chunk, "usage_metadata", None)
        if usage is not None:
            last_usage = usage
        text = getattr(chunk, "text", None)
        if text:
            parts.append(text)
        else:
            empty_chunk_count += 1
        candidates = getattr(chunk, "candidates", None) or []
        if candidates:
            fr = getattr(candidates[0], "finish_reason", None)
            if fr is not None:
                last_finish_reason = str(fr)
        feedback = getattr(chunk, "prompt_feedback", None)
        if feedback is not None:
            br = getattr(feedback, "block_reason", None)
            if br is not None:
                last_block_reason = str(br)

    elapsed = time.monotonic() - started
    total_chars = sum(len(p) for p in parts)
    logger.info(
        "gemini chat step=%s chunks=%s empty=%s parts=%s chars=%s elapsed=%.2fs finish=%s block=%s",
        step,
        chunk_count,
        empty_chunk_count,
        len(parts),
        total_chars,
        elapsed,
        last_finish_reason,
        last_block_reason,
    )
    _log_usage("chat", last_usage, step=step)
    if not parts:
        logger.warning(
            "gemini chat returned NO TEXT (chunks=%s, finish=%s, block=%s) — "
            "client will see SSE done with no content",
            chunk_count,
            last_finish_reason,
            last_block_reason,
        )
    return parts


INTERPRET_SYSTEM_PROMPT = """당신은 꿈 해석 전문가입니다.
한국의 전통 해몽 + 융(Jung) 심리학 + 현대 심리치료의 관점을 융합하여 해석해주세요.

해석 원칙:
- 단정적이거나 불안을 조장하는 해석을 하지 마세요.
- 부정적인 꿈도 성장과 내면 탐구의 신호로 긍정적으로 해석하세요.
- 전문 용어를 최대한 쉽게 풀어서 설명하세요.
- 사용자에게 "당신"이라고 직접 말하는 따뜻한 2인칭 톤으로 작성하세요.

언어: 한국어"""


INTERPRET_USER_TEMPLATE = """다음 꿈을 3가지 관점으로 해석해주세요:

꿈 내용:
{dream_content}

JSON 형식으로 응답하세요. 모든 텍스트는 한국어. 형식을 정확히 지키세요.
{{
  "symbolAnalysis": {{
    "headline": "한 줄 요약 (20~40자, 명사형/평서문). 카드 헤드라인으로 사용됨.",
    "keySymbols": [
      {{"symbol": "꿈에 나온 핵심 심볼(2~6자)", "meaning": "그 심볼의 의미(15~30자)"}}
    ],
    "detail": "꿈에 등장한 장소·인물·사물의 상징적 의미를 부드럽게 풀어 쓴 본문 (180~260자, 따뜻한 2인칭)."
  }},
  "psychologicalMeaning": {{
    "headline": "한 줄 요약 (20~40자).",
    "perspective": "관점 라벨 1개 (예: '융 심리학', '현대 심리치료', '내면 탐구' 중 적절한 것).",
    "detail": "융 심리학/현대 심리치료 관점의 해석 본문 (180~260자, 무의식·그림자·자기 같은 개념을 쉬운 말로)."
  }},
  "unconsciousMessage": {{
    "headline": "한 줄 요약 (20~40자).",
    "detail": "이 꿈이 당신에게 전하는 메시지 본문 (180~260자, 현재 상황·감정에 연결하여 따뜻하게).",
    "affirmation": "오늘 마음에 새길 한 문장 (20~40자, 격려/위로조)."
  }}
}}

필수:
- keySymbols는 2~4개. symbol과 meaning 둘 다 빈 문자열 금지.
- headline / affirmation은 마침표로 끝나지 않아도 됨. 이모지는 넣지 말 것.
- detail은 줄바꿈 없이 자연스러운 한 단락."""


def _coerce_part(value: Any) -> dict[str, Any]:
    """payload 한 파트를 안전하게 dict로 변환. 문자열로 들어오면 detail로 흡수."""
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        return {"detail": value}
    return {}


def _normalize_interpretation_payload(data: dict[str, Any]) -> dict[str, Any]:
    """Gemini가 돌려준 payload를 우리 스키마에 맞게 정규화 + flat 호환 필드 생성."""
    symbol = _coerce_part(data.get("symbolAnalysis"))
    psych = _coerce_part(data.get("psychologicalMeaning"))
    unconscious = _coerce_part(data.get("unconsciousMessage"))

    raw_symbols = symbol.get("keySymbols") or []
    key_symbols: list[dict[str, str]] = []
    if isinstance(raw_symbols, list):
        for item in raw_symbols:
            if isinstance(item, dict):
                s = str(item.get("symbol") or "").strip()
                m = str(item.get("meaning") or "").strip()
                if s and m:
                    key_symbols.append({"symbol": s, "meaning": m})

    structured = {
        "symbolAnalysis": {
            "headline": str(symbol.get("headline") or "").strip(),
            "keySymbols": key_symbols,
            "detail": str(symbol.get("detail") or "").strip(),
        },
        "psychologicalMeaning": {
            "headline": str(psych.get("headline") or "").strip(),
            "perspective": str(psych.get("perspective") or "").strip(),
            "detail": str(psych.get("detail") or "").strip(),
        },
        "unconsciousMessage": {
            "headline": str(unconscious.get("headline") or "").strip(),
            "detail": str(unconscious.get("detail") or "").strip(),
            "affirmation": str(unconscious.get("affirmation") or "").strip(),
        },
    }

    flat_symbol = structured["symbolAnalysis"]["detail"] or structured["symbolAnalysis"]["headline"]
    flat_psych = structured["psychologicalMeaning"]["detail"] or structured["psychologicalMeaning"][
        "headline"
    ]
    flat_unconscious = (
        structured["unconsciousMessage"]["detail"]
        or structured["unconsciousMessage"]["headline"]
    )

    return {
        **structured,
        "symbolAnalysisText": flat_symbol,
        "psychologicalMeaningText": flat_psych,
        "unconsciousMessageText": flat_unconscious,
    }


TITLE_SYSTEM_PROMPT = """당신은 꿈 일기의 짧은 제목을 만드는 도우미입니다.

규칙:
- 한국어 5~15자, 명사구 위주.
- 마침표·물음표·느낌표·이모지·따옴표·접두사 없음.
- 한 줄만 출력 (다른 설명 금지).

좋은 예: "어두운 숲의 호수", "구름 위에서 날다", "낯선 거리의 만남", "잃어버린 열쇠"."""


def generate_title(dream_content: str) -> str:
    snippet = (dream_content or "").strip()[:600]
    fallback = snippet[:20].strip() or "제목 없는 꿈"
    if not snippet:
        return fallback

    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            response = _client().models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_text(
                                text=f"다음 꿈을 5~15자 한국어 짧은 제목으로 만들어주세요.\n\n{snippet}\n\n제목만 한 줄로."
                            )
                        ],
                    )
                ],
                config=types.GenerateContentConfig(
                    system_instruction=TITLE_SYSTEM_PROMPT,
                    # thinking 비활성화. 2026-08-11 실측에서 제목 생성 한 번이
                    # thoughts 866 / output 7 토큰을 썼다 — 9글자 제목을 뽑는 데
                    # 그 호출 비용의 92%가 보이지 않는 추론에 들어갔다.
                    # 5~15자 결과물이라 추론이 품질에 기여할 여지가 없어서 끈다.
                    # (대화·해몽은 유지 — 해몽은 thinking이 실제로 일하는 것으로 판단)
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                ),
            )
            _log_usage("title", getattr(response, "usage_metadata", None))
            raw = (response.text or "").strip()
            title = raw.split("\n", 1)[0].strip().strip("\"'").rstrip(".!?")
            if len(title) > 30:
                title = title[:30].rstrip()
            if title:
                logger.info("title generated chars=%s", len(title))
                return title
        except (genai_errors.ServerError, genai_errors.ClientError) as exc:
            last_exc = exc
            logger.warning("title gen failed attempt=%s: %s", attempt + 1, exc)
            if attempt < 1:
                time.sleep(1)
                continue
    if last_exc is not None:
        logger.warning("title gen exhausted retries, using fallback (%s)", last_exc)
    return fallback


def generate_interpretation(dream_content: str) -> dict:
    last_exc: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            response = _client().models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_text(
                                text=INTERPRET_USER_TEMPLATE.format(dream_content=dream_content)
                            )
                        ],
                    )
                ],
                config=types.GenerateContentConfig(
                    system_instruction=INTERPRET_SYSTEM_PROMPT,
                    response_mime_type="application/json",
                ),
            )
            _log_usage("interpret", getattr(response, "usage_metadata", None), attempt=attempt + 1)
            text = response.text or "{}"
            try:
                data = json.loads(text)
            except json.JSONDecodeError:
                logger.warning("interpret JSON parse failed, falling back to plain text")
                data = {
                    "symbolAnalysis": text,
                    "psychologicalMeaning": "",
                    "unconsciousMessage": "",
                }
            return _normalize_interpretation_payload(data)
        except genai_errors.ServerError as exc:
            last_exc = exc
            if attempt < MAX_RETRIES - 1 and "UNAVAILABLE" in str(exc):
                time.sleep(BASE_BACKOFF_S * (2**attempt))
                continue
            raise
    if last_exc is not None:
        raise last_exc
    raise RuntimeError("unreachable")


def stream_chat(messages: list[ChatMessage], step: int) -> Iterator[str]:
    if not messages or messages[-1].role != "user":
        raise ValueError("last message must be from user")

    last_exc: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            parts = _collect_chunks(messages, step)
            for p in parts:
                yield p
            return
        except genai_errors.ClientError as exc:
            code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
            logger.error(
                "gemini ClientError code=%s attempt=%s/%s msg=%s",
                code,
                attempt + 1,
                MAX_RETRIES,
                exc,
            )
            raise
        except genai_errors.ServerError as exc:
            last_exc = exc
            code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
            is_unavailable = "UNAVAILABLE" in str(exc)
            logger.warning(
                "gemini ServerError code=%s unavailable=%s attempt=%s/%s msg=%s",
                code,
                is_unavailable,
                attempt + 1,
                MAX_RETRIES,
                exc,
            )
            if attempt < MAX_RETRIES - 1 and is_unavailable:
                time.sleep(BASE_BACKOFF_S * (2**attempt))
                continue
            raise
    if last_exc is not None:
        raise last_exc
