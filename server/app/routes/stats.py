from datetime import date, datetime, timedelta, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query

from app.deps.auth import get_current_user_id
from app.services.supabase_client import get_supabase
from app.utils.envelope import success
from app.utils.usage import (
    count_dreams_this_month,
    count_interpretations_this_month,
    get_limits,
    get_plan,
    month_range,
)

router = APIRouter()
UserId = Annotated[str, Depends(get_current_user_id)]


@router.get("/monthly")
def monthly(
    user_id: UserId,
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
) -> dict[str, Any]:
    sb = get_supabase()

    start_iso, end_iso = month_range(year, month)

    res = (
        sb.table("dreams")
        .select("emotion, recorded_at")
        .eq("user_id", user_id)
        .gte("recorded_at", start_iso)
        .lt("recorded_at", end_iso)
        .execute()
    )
    rows = res.data or []
    total = len(rows)

    emotion_dist: dict[str, int] = {"POSITIVE": 0, "NEGATIVE": 0, "NEUTRAL": 0, "MIXED": 0}
    for r in rows:
        emo = r.get("emotion") or "NEUTRAL"
        if emo in emotion_dist:
            emotion_dist[emo] += 1

    streak_res = (
        sb.table("dreams")
        .select("recorded_at")
        .eq("user_id", user_id)
        .order("recorded_at", desc=True)
        .limit(365)
        .execute()
    )
    dream_dates: set[date] = set()
    for r in streak_res.data or []:
        iso = r["recorded_at"].replace("Z", "+00:00")
        dream_dates.add(datetime.fromisoformat(iso).date())

    streak = 0
    cursor = datetime.now(timezone.utc).date()
    while cursor in dream_dates:
        streak += 1
        cursor -= timedelta(days=1)

    return success(
        {
            "totalDreams": total,
            "streak": streak,
            "emotionDistribution": emotion_dist,
            "dreamTypeDistribution": {},
            "topThemes": [],
        }
    )


@router.get("/usage")
def usage(user_id: UserId) -> dict[str, Any]:
    sb = get_supabase()

    # 강제 로직(utils/usage)과 같은 함수를 써서 표시와 강제가 항상 일치한다.
    # 꿈 카운트는 recorded_at이 아닌 created_at 기준(백데이트 우회 방지).
    plan = get_plan(sb, user_id)
    dreams_used = count_dreams_this_month(sb, user_id)
    interp_used = count_interpretations_this_month(sb, user_id)
    dream_limit, interp_limit = get_limits(plan)

    return success(
        {
            "plan": plan,
            "currentMonth": {
                "dreams": {"used": dreams_used, "limit": dream_limit},
                "interpretations": {"used": interp_used, "limit": interp_limit},
                "illustrations": {"used": 0, "limit": 0},
            },
        }
    )
