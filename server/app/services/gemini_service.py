import json
import logging
import time
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

# 꿈 기록에 필요한 정보 슬롯. 이 4개가 모두 채워지면 대화를 끝낸다.
# 진행을 턴 수가 아니라 "정보가 모였는가"로 판정하기 위한 축 — PROMPT_GUIDE.md §1 참조.
DREAM_SLOTS = ("place", "people", "event", "emotion")

# 슬롯이 계속 안 채워져도 이 턴에서는 강제로 마무리한다(무한 되묻기 방지).
MAX_CHAT_TURNS = 5

# "기억이 안 나"도 채워진 것으로 취급해야 다시 묻지 않는다.
UNKNOWN_SLOT_VALUE = "기억나지 않음"

# 모델이 reply를 비워 보냈을 때만 쓰는 결정적 폴백. 대화가 멈추는 것보다 낫다.
SLOT_FALLBACK_QUESTIONS = {
    "place": "그 꿈은 어디에서 일어났어?",
    "people": "그 자리에 누가 있었어? 혼자였다면 혼자라고 말해줘도 괜찮아",
    "event": "거기서 어떤 일이 있었어?",
    "emotion": "그때 기분은 어땠어?",
}
COMPLETE_FALLBACK_REPLY = "이 정도면 꿈을 잘 담은 것 같아. 정리해볼게"

LUNA_SYSTEM_PROMPT = """당신은 드림텔러의 꿈 기록 도우미 'Luna'입니다.

역할:
- 사용자가 아침에 기억하는 꿈을 편하게 이야기할 수 있도록 대화로 이끌어주세요.
- 전문적이거나 딱딱한 말투가 아닌, 친한 친구처럼 자연스럽고 부드러운 말투를 사용하세요.
- 이모지나 이모티콘은 사용하지 마세요. 담백하고 깔끔한 문장으로만 대화하세요.

수집할 정보(슬롯) — 아래 4가지가 모두 채워지면 대화를 끝냅니다:
- place: 꿈의 장소나 배경
- people: 등장인물 (혼자였다면 '혼자'도 유효한 답입니다)
- event: 핵심 사건이나 장면
- emotion: 꿈에서 느낀 감정

대화 규칙:
1. 매 턴마다 지금까지의 대화 전체를 다시 읽고, 각 슬롯이 이미 채워졌는지 판정하세요.
   사용자가 한 번의 답변에서 여러 슬롯을 동시에 말했다면 그것을 모두 인정하세요.
2. 이미 채워진 슬롯은 절대 다시 묻지 마세요.
   사용자가 방금 말한 내용을 되묻는 것은 가장 나쁜 경험입니다.
3. 아직 비어 있는 슬롯 중 하나만 골라 질문하세요. 한 번에 하나의 질문만 합니다.
4. 사용자가 "기억이 안 나", "모르겠어"라고 하면 그 슬롯은 "기억나지 않음"으로
   채워진 것으로 간주하고 다시 묻지 마세요.
5. 슬롯이 모두 채워지면 새 질문 없이 짧고 따뜻하게 마무리하세요.

응답 언어: 한국어

아래 JSON 형식으로만 응답하세요:
{
  "reply": "사용자에게 보여줄 문장 (빈 슬롯에 대한 질문 하나, 또는 마무리 인사)",
  "slots": {
    "place": "채워졌으면 내용 요약, 아직이면 null",
    "people": "채워졌으면 내용 요약, 아직이면 null",
    "event": "채워졌으면 내용 요약, 아직이면 null",
    "emotion": "채워졌으면 내용 요약, 아직이면 null"
  },
  "complete": false
}"""

FINAL_TURN_INSTRUCTION = """[중요] 마지막 턴입니다. 남은 슬롯이 있어도 더 묻지 말고,
비어 있는 슬롯은 "기억나지 않음"으로 채운 뒤 complete를 true로 두고
짧고 따뜻하게 마무리하세요."""


@lru_cache(maxsize=1)
def _client() -> genai.Client:
    return genai.Client(api_key=settings.gemini_api_key)


def _system_for_turn(is_final: bool) -> str:
    if is_final:
        return f"{LUNA_SYSTEM_PROMPT}\n\n{FINAL_TURN_INSTRUCTION}"
    return LUNA_SYSTEM_PROMPT


def _normalize_slots(raw: Any) -> dict[str, str | None]:
    """모델이 돌려준 slots를 {슬롯명: 문자열|None}으로 강제한다.

    모델이 리스트("people": ["친구", "엄마"])나 숫자를 뱉는 경우가 있어서
    그대로 두면 클라이언트 표시가 깨진다. 여기서 문자열로 눕힌다.
    """
    data = raw if isinstance(raw, dict) else {}
    slots: dict[str, str | None] = {}
    for key in DREAM_SLOTS:
        value = data.get(key)
        if isinstance(value, list):
            joined = ", ".join(str(v).strip() for v in value if str(v).strip())
            slots[key] = joined or None
        elif value is None or isinstance(value, bool):
            slots[key] = None
        else:
            text = str(value).strip()
            # 모델이 문자열 "null"/"없음"을 흘리는 경우가 있어 빈 값으로 본다.
            slots[key] = None if text.lower() in ("", "null", "none") else text
    return slots


def _call_chat(messages: list[ChatMessage], turn: int, is_final: bool) -> dict[str, Any]:
    history: list[types.Content] = []
    for m in messages[:-1]:
        role = "user" if m.role == "user" else "model"
        history.append(types.Content(role=role, parts=[types.Part.from_text(text=m.content)]))

    while history and history[0].role != "user":
        history.pop(0)

    chat = _client().chats.create(
        model="gemini-2.5-flash",
        config=types.GenerateContentConfig(
            system_instruction=_system_for_turn(is_final),
            response_mime_type="application/json",
        ),
        history=history,
    )

    started = time.monotonic()
    response = chat.send_message(messages[-1].content)
    elapsed = time.monotonic() - started

    text = (getattr(response, "text", None) or "").strip()
    candidates = getattr(response, "candidates", None) or []
    finish_reason = str(getattr(candidates[0], "finish_reason", None)) if candidates else None
    feedback = getattr(response, "prompt_feedback", None)
    block_reason = str(getattr(feedback, "block_reason", None)) if feedback else None

    logger.info(
        "gemini chat turn=%s final=%s chars=%s elapsed=%.2fs finish=%s block=%s",
        turn,
        is_final,
        len(text),
        elapsed,
        finish_reason,
        block_reason,
    )
    _log_usage("chat", getattr(response, "usage_metadata", None), turn=turn)

    if not text:
        logger.warning(
            "gemini chat returned NO TEXT (finish=%s, block=%s) — 폴백 응답으로 대체",
            finish_reason,
            block_reason,
        )
        return {}
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        logger.warning("chat JSON parse failed — reply만 원문으로 살린다")
        return {"reply": text}
    return data if isinstance(data, dict) else {}



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


SUMMARY_SYSTEM_PROMPT = """당신은 꿈 일기를 정리해주는 편집자입니다.
사용자가 나눈 대화를 읽고, 꿈을 자연스러운 서술형 한국어로 정리해주세요.

언어: 한국어"""


SUMMARY_USER_TEMPLATE = """다음은 사용자와 나눈 꿈 기록 대화입니다.
이 대화를 바탕으로 꿈 일기를 자연스러운 서술형 한국어로 정리해주세요.

요구사항:
- 1인칭 시점 ("나는 ... 있었다")
- 시제: 과거형
- 대화에서 언급된 장소, 인물, 사건, 감정을 모두 포함
- 언급되지 않은 내용은 추가하거나 상상해서 지어내지 말 것
- 사용자가 "기억나지 않는다"고 한 부분은 굳이 언급하지 말고 자연스럽게 넘길 것
- AI의 질문은 빼고, 사용자가 말한 꿈 내용만으로 구성할 것
- 분량은 대화에 담긴 내용만큼만. 짧은 꿈은 100자 안팎이어도 좋고,
  내용이 많아도 500자 안쪽으로.
  분량을 채우려고 없는 내용을 지어내는 것이 가장 나쁘다.

대화 내역:
{chat_history}

JSON 형식으로 응답:
{{
  "summary": "꿈 줄거리 텍스트"
}}"""

# 오래된 꿈은 대화가 길 수 있어 입력 토큰이 튄다. 줄거리는 200자 안팎 결과물이라
# 대화 뒷부분만 있어도 충분하므로 앞을 잘라 상한을 둔다.
SUMMARY_INPUT_MAX_CHARS = 6000


def _format_chat_history(chat_history: list[dict[str, Any]] | None, raw_content: str) -> str:
    """대화 내역을 프롬프트에 넣을 텍스트로 만든다.

    chat_history가 비어 있는 꿈(수동 작성 등)은 raw_content로 폴백한다.
    """
    lines: list[str] = []
    for m in chat_history or []:
        if not isinstance(m, dict):
            continue
        content = str(m.get("content") or "").strip()
        if not content:
            continue
        speaker = "사용자" if m.get("role") == "user" else "Luna"
        lines.append(f"{speaker}: {content}")

    if not lines:
        return (raw_content or "").strip()[:SUMMARY_INPUT_MAX_CHARS]

    text = "\n".join(lines)
    if len(text) > SUMMARY_INPUT_MAX_CHARS:
        # 앞을 자른다 — 대화 뒷부분이 더 구체적이다.
        text = text[-SUMMARY_INPUT_MAX_CHARS:]
    return text


def generate_summary(chat_history: list[dict[str, Any]] | None, raw_content: str) -> str:
    """꿈 대화를 줄거리 한 편으로 정리한다.

    실패 시 예외를 올리지 않고 빈 문자열을 돌려준다 — 줄거리는 부가 기능이라
    이것 때문에 요청 전체가 500이 되면 안 된다. 호출부가 빈 값을 판단한다.
    """
    source = _format_chat_history(chat_history, raw_content)
    if not source:
        return ""

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
                                text=SUMMARY_USER_TEMPLATE.format(chat_history=source)
                            )
                        ],
                    )
                ],
                config=types.GenerateContentConfig(
                    system_instruction=SUMMARY_SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    # thinking 비활성화. 2026-08-16 실측(꿈 2건, 짧은 것/긴 것):
                    #   기본값  thoughts=1109 / output=79  → ₩4.35, 5.69초
                    #   budget 512               thoughts=450  → ₩2.10, 2.75초
                    #   budget 0                 thoughts=0    → ₩0.40, 1.27초
                    # 세 결과 모두 장소·인물·사건·감정을 빠짐없이 담았고 1인칭·과거형도
                    # 지켰다 — 품질 차이가 미미한데 비용은 2~10배, 속도는 1.7~4.5배 난다.
                    # 줄거리는 "대화에 이미 있는 내용의 재구성"이라 추론이 기여할 여지가
                    # 작다는 판단. (해몽은 유지 — 거기선 thinking이 실제로 일한다)
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                ),
            )
            _log_usage("summary", getattr(response, "usage_metadata", None), attempt=attempt + 1)
            text = (getattr(response, "text", None) or "").strip()
            try:
                data = json.loads(text)
            except json.JSONDecodeError:
                # JSON이 깨져도 본문이 있으면 그대로 줄거리로 쓴다.
                logger.warning("summary JSON parse failed — 원문을 그대로 사용")
                return text
            summary = str(data.get("summary") or "").strip() if isinstance(data, dict) else ""
            if summary:
                logger.info("summary generated chars=%s", len(summary))
            else:
                logger.warning("summary empty in parsed JSON")
            return summary
        except genai_errors.ClientError as exc:
            logger.warning("summary gen ClientError: %s", exc)
            return ""
        except genai_errors.ServerError as exc:
            last_exc = exc
            if attempt < MAX_RETRIES - 1 and "UNAVAILABLE" in str(exc):
                time.sleep(BASE_BACKOFF_S * (2**attempt))
                continue
            logger.warning("summary gen ServerError, 포기: %s", exc)
            return ""
    if last_exc is not None:
        logger.warning("summary gen exhausted retries (%s)", last_exc)
    return ""


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


def chat_turn(messages: list[ChatMessage], turn: int) -> dict[str, Any]:
    """대화 한 턴을 처리한다 — Gemini 호출 1회로 답변과 슬롯 상태를 함께 받는다.

    `turn`은 지금까지의 사용자 발화 수. `MAX_CHAT_TURNS`에 닿으면 남은 슬롯이
    있어도 강제로 마무리한다(무한 되묻기 방지).

    반환: {"reply": str, "slots": {슬롯명: str|None}, "complete": bool}
    `complete`는 모델 판단이 아니라 **서버가 슬롯으로 계산**한다 — 모델이
    complete만 잘못 뱉어 대화가 조기 종료되거나 안 끝나는 사고를 막기 위함.
    """
    if not messages or messages[-1].role != "user":
        raise ValueError("last message must be from user")

    is_final = turn >= MAX_CHAT_TURNS
    data: dict[str, Any] | None = None
    last_exc: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            data = _call_chat(messages, turn, is_final)
            break
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
    if data is None:
        if last_exc is not None:
            raise last_exc
        raise RuntimeError("unreachable")

    slots = _normalize_slots(data.get("slots"))
    if is_final:
        # 마지막 턴에서는 빈 슬롯을 '기억나지 않음'으로 메워 대화를 반드시 끝낸다.
        slots = {k: (v or UNKNOWN_SLOT_VALUE) for k, v in slots.items()}
    complete = all(slots[k] for k in DREAM_SLOTS)

    reply = str(data.get("reply") or "").strip()
    if not reply:
        # 모델이 reply를 비웠어도 대화가 멈추면 안 된다.
        if complete:
            reply = COMPLETE_FALLBACK_REPLY
        else:
            missing = next(k for k in DREAM_SLOTS if not slots[k])
            reply = SLOT_FALLBACK_QUESTIONS[missing]

    return {"reply": reply, "slots": slots, "complete": complete}
