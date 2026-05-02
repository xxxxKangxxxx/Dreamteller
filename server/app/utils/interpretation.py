"""interpretations 테이블 row를 클라이언트 응답 형태로 직렬화하는 헬퍼."""

from typing import Any


def _ensure_part(part: Any, *, with_perspective: bool = False, with_affirmation: bool = False) -> dict[str, Any]:
    if not isinstance(part, dict):
        part = {}
    out: dict[str, Any] = {
        "headline": str(part.get("headline") or "").strip(),
        "detail": str(part.get("detail") or "").strip(),
    }
    raw_symbols = part.get("keySymbols")
    if isinstance(raw_symbols, list):
        out["keySymbols"] = [
            {
                "symbol": str(s.get("symbol") or "").strip(),
                "meaning": str(s.get("meaning") or "").strip(),
            }
            for s in raw_symbols
            if isinstance(s, dict) and s.get("symbol") and s.get("meaning")
        ]
    else:
        out["keySymbols"] = []
    if with_perspective:
        out["perspective"] = str(part.get("perspective") or "").strip()
    if with_affirmation:
        out["affirmation"] = str(part.get("affirmation") or "").strip()
    return out


def serialize_interpretation(row: dict[str, Any]) -> dict[str, Any]:
    """DB row → 클라이언트 응답. payload(JSONB)가 있으면 구조화, 없으면 평문 호환."""
    payload = row.get("payload")
    flat_symbol = row.get("symbol_analysis") or ""
    flat_psych = row.get("psychological_meaning") or ""
    flat_unconscious = row.get("unconscious_message") or ""

    if isinstance(payload, dict) and payload:
        symbol = _ensure_part(payload.get("symbolAnalysis"))
        psych = _ensure_part(payload.get("psychologicalMeaning"), with_perspective=True)
        unconscious = _ensure_part(
            payload.get("unconsciousMessage"), with_affirmation=True
        )
    else:
        symbol = {"headline": "", "keySymbols": [], "detail": flat_symbol}
        psych = {"headline": "", "perspective": "", "detail": flat_psych}
        unconscious = {"headline": "", "detail": flat_unconscious, "affirmation": ""}

    return {
        "dreamId": str(row["dream_id"]),
        "status": "completed",
        "symbolAnalysis": symbol,
        "psychologicalMeaning": psych,
        "unconsciousMessage": unconscious,
        "symbolAnalysisText": symbol["detail"] or flat_symbol,
        "psychologicalMeaningText": psych["detail"] or flat_psych,
        "unconsciousMessageText": unconscious["detail"] or flat_unconscious,
    }
