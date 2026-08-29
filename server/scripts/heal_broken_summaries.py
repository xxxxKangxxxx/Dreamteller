"""저장된 줄거리 중 JSON 원문이 그대로 들어간 값을 찾아 복구한다.

2026-08-29 사고 대응 일회성 스크립트. Gemini가 JSON을 끝맺지 못하고 끊은 응답을
예전 코드가 원문 그대로 저장해서 `{ "summary": "...` 가 화면에 노출됐다.
본문은 온전하므로 닫는 괄호만 채우면 Gemini를 다시 부르지 않고 살릴 수 있다.
복구가 안 되는 값은 NULL로 비워, 앱이 상세를 열 때 자동 재생성되게 둔다.

    python scripts/heal_broken_summaries.py           # dry-run (기본)
    python scripts/heal_broken_summaries.py --apply   # 실제 반영

서버와 같은 디렉터리에서 실행할 것 — .env의 SUPABASE 키를 그대로 쓴다.
"""

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv  # noqa: E402
from supabase import create_client  # noqa: E402

from app.utils.model_json import looks_like_raw_json, parse_model_json  # noqa: E402


def main() -> int:
    apply = "--apply" in sys.argv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    rows = sb.table("dreams").select("id,title,recorded_at,summary").execute().data or []
    broken = [r for r in rows if looks_like_raw_json(r.get("summary") or "")]
    print(f"전체 {len(rows)}건 중 깨진 줄거리 {len(broken)}건" + ("" if apply else " (dry-run)"))
    if not broken:
        return 0

    backup_dir = Path(__file__).resolve().parent / "backup"
    backup_dir.mkdir(exist_ok=True)

    for r in broken:
        old = r["summary"]
        data = parse_model_json(old, "heal")
        new = str((data or {}).get("summary") or "").strip()
        print(f"\n[{r['id']}] {r['title']} ({r['recorded_at']})")
        print(f"  BEFORE {len(old)}자: {old[:50]!r} … {old[-30:]!r}")

        if new and not looks_like_raw_json(new):
            print(f"  AFTER  {len(new)}자: {new[:50]!r} … {new[-30:]!r}")
            value = new
        else:
            print("  복구 불가 → summary를 비운다 (앱이 상세를 열 때 재생성)")
            value = None

        (backup_dir / f"{r['id']}.json").write_text(
            json.dumps(r, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        if apply:
            sb.table("dreams").update({"summary": value}).eq("id", r["id"]).execute()
            print("  -> UPDATED")
        else:
            print("  -> dry-run (미적용, --apply 로 반영)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
