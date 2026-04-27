from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

Emotion = Literal["POSITIVE", "NEGATIVE", "NEUTRAL", "MIXED"]


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ChatMessage(BaseModel):
    role: Literal["assistant", "user"]
    content: str


class CreateDreamPayload(CamelModel):
    raw_content: str
    chat_history: list[ChatMessage] = []
    emotion: Emotion
    recorded_at: datetime


class UpdateDreamPayload(CamelModel):
    raw_content: str | None = None
    emotion: Emotion | None = None
    title: str | None = None
