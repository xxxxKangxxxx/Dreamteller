"""모델이 돌려준 JSON 텍스트를 안전하게 dict로 바꾸는 유틸.

Gemini는 `response_mime_type="application/json"`을 줘도 아주 가끔 JSON을
끝맺지 못한 채 응답을 끊는다. 2026-08-29 실제 사고에서는 줄거리 본문(725토큰)을
다 쓰고 마지막 `"` 와 `}` 두 글자만 빠진 응답이 왔고, 그때 호출부가 원문을
그대로 살리는 폴백을 타면서 `{ "summary": "..." ` 가 사용자 화면에 노출됐다.

그래서 파싱을 두 단계로 나눈다.
1) 그대로 파싱
2) "잘린 것으로 보이면" 닫는 따옴표/괄호를 채워 한 번만 복구 시도

복구는 **잘림에만** 적용한다. 구조 자체가 어긋난 응답(닫는 괄호가 먼저 나온다든가)은
복구 대상이 아니라 재시도 대상이므로 None을 돌려준다.
"""

import json
import logging
import re
from typing import Any

logger = logging.getLogger("gemini")

_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)

# 파싱에 성공했더라도 값 안에 JSON 껍데기가 그대로 들어앉은 경우를 걸러내기 위한 패턴.
_RAW_JSON_RE = re.compile(r'^\s*[{\[].*"[A-Za-z_]+"\s*:', re.DOTALL)


def strip_code_fence(text: str) -> str:
    """```json ... ``` 로 감싸 온 응답에서 펜스를 벗긴다."""
    stripped = (text or "").strip()
    if stripped.startswith("```"):
        stripped = _FENCE_RE.sub("", stripped).strip()
    return stripped


def repair_truncated_json(text: str) -> str | None:
    """잘린 JSON에 닫는 따옴표/괄호를 채워 돌려준다. 잘림이 아니면 None."""
    stack: list[str] = []
    in_string = False
    escaped = False

    for ch in text:
        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == "{":
            stack.append("}")
        elif ch == "[":
            stack.append("]")
        elif ch in "}]":
            if not stack or stack[-1] != ch:
                # 구조가 어긋났다 — 잘린 게 아니므로 손대지 않는다.
                return None
            stack.pop()

    if not in_string and not stack:
        # 괄호가 다 닫혀 있는데 파싱이 실패했다면 잘림이 아닌 다른 문제다.
        return None

    repaired = text
    if escaped:
        # 반쪽짜리 이스케이프(`\`로 끝남)는 그대로 두면 못 살린다.
        repaired = repaired[:-1]
    if in_string:
        repaired += '"'
    else:
        # 문자열 밖에서 끊겼다면 매달린 콤마/콜론을 정리한다.
        repaired = repaired.rstrip()
        if repaired.endswith(","):
            repaired = repaired[:-1]
        elif repaired.endswith(":"):
            repaired += " null"
    repaired += "".join(reversed(stack))
    return repaired


def parse_model_json(text: str, call: str) -> dict[str, Any] | None:
    """모델 JSON 응답을 dict로. 실패하면 None (호출부가 재시도/폴백을 정한다).

    원문을 그대로 되살리는 폴백은 절대 두지 않는다 — 그 값이 사용자에게
    노출되고 DB에 저장되는 것이 정확히 위의 사고였다.
    """
    cleaned = strip_code_fence(text)
    if not cleaned:
        return None

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        repaired = repair_truncated_json(cleaned)
        if repaired is None:
            logger.warning("%s JSON parse failed (복구 불가): %s", call, exc)
            return None
        try:
            data = json.loads(repaired)
        except json.JSONDecodeError as exc2:
            logger.warning("%s JSON 복구 시도 실패: %s", call, exc2)
            return None
        logger.warning("%s JSON 잘림 감지 — 닫는 괄호를 채워 복구했다 (chars=%s)", call, len(cleaned))

    return data if isinstance(data, dict) else None


def looks_like_raw_json(value: str) -> bool:
    """사용자에게 보여줄 텍스트에 JSON 껍데기가 남아 있는지 검사한다.

    저장 직전 마지막 방어선. 파싱이 성공해도 모델이 값 안에 통째로 JSON을
    넣어 보내는 경우가 있어서, 텍스트 필드에는 이 검사를 한 번 더 건다.
    """
    return bool(_RAW_JSON_RE.match(value or ""))
