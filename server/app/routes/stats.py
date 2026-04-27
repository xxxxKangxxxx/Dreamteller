from datetime import date, datetime, timedelta, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query

from app.deps.auth import get_current_user_id
from app.services.supabase_client import get_supabase
from app.utils.envelope import success

router = APIRouter()
UserId = Annotated[str, Depends(get_current_user_id)]


@router.get("/monthly")
def monthly(
    user_id: UserId,
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
) -> dict[str, Any]:
    sb = get_supabase()

    start = date(year, month, 1)
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    start_iso = start.isoformat()
    end_iso = end.isoformat()

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

    profile_res = sb.table("profiles").select("plan").eq("id", user_id).limit(1).execute()
    plan = (profile_res.data[0]["plan"] if profile_res.data else "FREE") or "FREE"

    today = datetime.now(timezone.utc).date()
    start = date(today.year, today.month, 1)
    end = date(today.year + 1, 1, 1) if today.month == 12 else date(today.year, today.month + 1, 1)
    start_iso = start.isoformat()
    end_iso = end.isoformat()

    dreams_res = (
        sb.table("dreams")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .gte("recorded_at", start_iso)
        .lt("recorded_at", end_iso)
        .execute()
    )
    dreams_used = dreams_res.count or 0

    interp_res = (
        sb.table("interpretations")
        .select("dream_id, dreams!inner(user_id)", count="exact")
        .eq("dreams.user_id", user_id)
        .gte("created_at", start_iso)
        .lt("created_at", end_iso)
        .execute()
    )
    interp_used = interp_res.count or 0

    limits = {"FREE": (30, 5), "PREMIUM": (9999, 9999)}
    dream_limit, interp_limit = limits.get(plan, limits["FREE"])

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
