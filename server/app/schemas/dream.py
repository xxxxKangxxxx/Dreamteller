from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

Emotion = Literal["POSITIVE", "NEGATIVE", "NEUTRAL", "MIXED"]

# 길이 제한은 토큰 비용 증폭 방어용 — 정상 사용 범위의 5배 이상 여유.
# content 4000은 Gemini 응답(assistant 메시지)도 같은 스키마로 되돌아오는
# 구조라 AI 답변이 길어져도 다음 턴이 거부되지 않을 만큼 잡은 값.


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ChatMessage(BaseModel):
    role: Literal["assistant", "user"]
    content: str = Field(max_length=4000)


class CreateDreamPayload(CamelModel):
    raw_content: str = Field(max_length=5000)
    chat_history: list[ChatMessage] = Field(default=[], max_length=60)
    emotion: Emotion
    recorded_at: datetime


class UpdateDreamPayload(CamelModel):
    raw_content: str | None = Field(None, max_length=5000)
    emotion: Emotion | None = None
    title: str | None = Field(None, max_length=200)
