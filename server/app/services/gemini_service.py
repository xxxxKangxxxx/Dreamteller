import json
import time
from collections.abc import Iterator
from functools import lru_cache

from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from app.config import settings
from app.schemas.dream import ChatMessage

MAX_RETRIES = 3
BASE_BACKOFF_S = 1.5

LUNA_SYSTEM_PROMPT = """당신은 드림텔러의 꿈 기록 도우미 'Luna'입니다.

역할:
- 사용자가 아침에 기억하는 꿈을 편하게 이야기할 수 있도록 대화로 이끌어주세요.
- 전문적이거나 딱딱한 말투가 아닌, 친한 친구처럼 자연스럽고 부드러운 말투를 사용하세요.
- 이모지를 적절히 사용하되 과하지 않게 (메시지당 0~2개).

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
    if step >= 5:
        return (
            LUNA_SYSTEM_PROMPT
            + "\n\n[중요] 현재 Step 5/5: 충분한 정보를 수집했으니, 짧고 따뜻하게 마무리하면서"
            " 응답 끝에 반드시 다음 형식으로 끝내세요:"
            "\n'이 정도면 꿈을 잘 담은 것 같아! 정리해볼게 ✨ [RECORD_COMPLETE]'"
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

    parts: list[str] = []
    for chunk in chat.send_message_stream(messages[-1].content):
        text = getattr(chunk, "text", None)
        if text:
            parts.append(text)
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

JSON 형식으로 응답하세요. 각 항목 200~350자:
{{
  "symbolAnalysis": "꿈에 등장한 장소, 인물, 사물의 상징적 의미 분석. 구체적인 심볼을 언급하며 설명.",
  "psychologicalMeaning": "융 심리학 관점에서의 해석. 무의식, 그림자, 아니마/아니무스 개념 등 적절히 활용.",
  "unconsciousMessage": "이 꿈이 당신에게 전하는 메시지. 현재 상황이나 감정에 연결하여 따뜻하게."
}}"""


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
            text = response.text or "{}"
            data = json.loads(text)
            return {
                "symbolAnalysis": data.get("symbolAnalysis", ""),
                "psychologicalMeaning": data.get("psychologicalMeaning", ""),
                "unconsciousMessage": data.get("unconsciousMessage", ""),
            }
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
        except genai_errors.ServerError as exc:
            last_exc = exc
            if attempt < MAX_RETRIES - 1 and "UNAVAILABLE" in str(exc):
                time.sleep(BASE_BACKOFF_S * (2**attempt))
                continue
            raise
    if last_exc is not None:
        raise last_exc
