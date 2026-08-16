"""사용량 한도 계산·강제 유틸.

/stats/usage(표시)와 각 라우트(강제)가 같은 로직을 공유한다.
강제 카운트는 클라이언트가 지정하는 recorded_at이 아닌 서버가 찍는
created_at 기준 — recorded_at 백데이트로 한도를 우회할 수 없게 한다.
"""
from datetime import date, datetime, timezone
from typing import Any

# 플랜별 월간 한도: (꿈 기록, 해몽)
#
# 해몽 한도는 2026-08-16에 5 → 30으로 상향했다(S-3).
# 5는 7/15에 정한 값인데 그때는 ① Gemini 실단가를 몰랐고(실측은 8/11) ② 출시 전이라
# 사용자가 0명이었다. 실사용해보니 **꿈은 30건인데 해몽은 5건(1/6)** 이라 불균형이
# 컸고, "기록한 꿈은 다 해몽 받을 수 있다"가 훨씬 이해하기 쉽다.
#
# 비용(실측 기준 해몽 ₩9~15, 나머지 ₩1.6): 극단 사용자 월 약 ₩408.
# Gemini 월 지출 캡 ₩15,000 기준 약 36명 수용 — 현재 실사용자의 10배다.
# 캡은 백스톱이고 1차 방어선은 이 한도라는 구조는 그대로다(IMPROVEMENTS 1-1a).
PLAN_LIMITS: dict[str, tuple[int, int]] = {"FREE": (30, 30), "PREMIUM": (9999, 9999)}

# 기록 대화(chat) 유저별 일일 호출 한도 — 정상 사용은 하루 10~20회 수준
CHAT_DAILY_LIMIT = 100


class QuotaExceededError(Exception):
    """사용량 한도 초과 — main.py 핸들러가 429로 변환한다."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def month_range(year: int, month: int) -> tuple[str, str]:
    start = date(year, month, 1)
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    return start.isoformat(), end.isoformat()


def current_month_range() -> tuple[str, str]:
    today = datetime.now(timezone.utc).date()
    return month_range(today.year, today.month)


def get_plan(sb: Any, user_id: str) -> str:
    res = sb.table("profiles").select("plan").eq("id", user_id).limit(1).execute()
    return (res.data[0]["plan"] if res.data else "FREE") or "FREE"


def get_limits(plan: str) -> tuple[int, int]:
    return PLAN_LIMITS.get(plan, PLAN_LIMITS["FREE"])


def count_dreams_this_month(sb: Any, user_id: str) -> int:
    start, end = current_month_range()
    res = (
        sb.table("dreams")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .gte("created_at", start)
        .lt("created_at", end)
        .execute()
    )
    return res.count or 0


def count_interpretations_this_month(sb: Any, user_id: str) -> int:
    start, end = current_month_range()
    res = (
        sb.table("interpretations")
        .select("dream_id, dreams!inner(user_id)", count="exact")
        .eq("dreams.user_id", user_id)
        .gte("created_at", start)
        .lt("created_at", end)
        .execute()
    )
    return res.count or 0


def ensure_dream_quota(sb: Any, user_id: str) -> None:
    dream_limit, _ = get_limits(get_plan(sb, user_id))
    if count_dreams_this_month(sb, user_id) >= dream_limit:
        raise QuotaExceededError(
            "DREAM_LIMIT_EXCEEDED",
            "이번 달 꿈 기록 한도에 도달했어요. 다음 달에 다시 기록할 수 있어요.",
        )


def ensure_interpretation_quota(sb: Any, user_id: str) -> None:
    _, interp_limit = get_limits(get_plan(sb, user_id))
    if count_interpretations_this_month(sb, user_id) >= interp_limit:
        raise QuotaExceededError(
            "INTERPRETATION_LIMIT_EXCEEDED",
            "이번 달 꿈 해석 한도에 도달했어요. 다음 달에 다시 이용할 수 있어요.",
        )


# chat 일일 카운터 — 인메모리 best-effort(재시작 시 리셋). 날짜가 바뀌면
# 전체를 비우므로 지난 날짜 엔트리가 누적되지 않는다.
_chat_day: date | None = None
_chat_counts: dict[str, int] = {}


def ensure_chat_quota(user_id: str) -> None:
    global _chat_day
    today = datetime.now(timezone.utc).date()
    if _chat_day != today:
        _chat_day = today
        _chat_counts.clear()
    used = _chat_counts.get(user_id, 0)
    if used >= CHAT_DAILY_LIMIT:
        raise QuotaExceededError(
            "CHAT_LIMIT_EXCEEDED",
            "오늘은 대화 요청이 많았어요. 내일 다시 시도해 주세요.",
        )
    _chat_counts[user_id] = used + 1
