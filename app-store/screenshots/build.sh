#!/usr/bin/env bash
# DreamTeller App Store 스크린샷 합성 빌드 (총 6컷)
#  - 컷 1·2: 랜딩 기기를 가로 대각으로 띄운 hero (hero.html, 좌/우 슬라이스)
#  - 컷 3·6: 폰 좌 / 텍스트 우  (side.html, phone-left)
#  - 컷 4   : 폰 우 / 텍스트 좌  (side.html, phone-right)
#  - 컷 5   : 폰 하 / 텍스트 상  (flat.html)
# 각 컷: 제목(h1) + 작은 설명(p). 출력 out/screenshot-1.png ~ 6.png (1284x2778, 6.5")
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
RAW="$DIR/raw"
OUT="$DIR/out"
TMP="$DIR/.tmp"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

mkdir -p "$OUT" "$TMP"

render() { # html_path  out_png
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=1 --virtual-time-budget=1500 \
    --window-size=1284,2778 \
    --screenshot="$2" "file://$1" >/dev/null 2>&1
}

# ── 컷 1·2: 가로 대각 hero (랜딩) ─────────────────
if [[ -f "$RAW/01-landing.png" ]]; then
  for slice in "1:0" "2:-1284"; do
    n="${slice%%:*}"; sx="${slice##*:}"
    html="$TMP/hero-$n.html"
    sed -e "s|__SHIFT__|$sx|g" -e "s|__IMG__|file://$RAW/01-landing.png|g" \
        "$DIR/hero.html" > "$html"
    render "$html" "$OUT/screenshot-$n.png"
    echo "  ✓ slot $n (hero/가로) -> out/screenshot-$n.png"
  done
else
  echo "  - skip hero (01-landing.png 필요)"
fi

# 공통: side/flat 컷 렌더
# slot | tpl(side/flat) | side(phone-left/phone-right/-) | raw | 제목(<br>) | 설명(<br>)
SHOTS=(
  "3|side|phone-left|02-record.png|AI가 먼저 물어보며<br>꿈을 완성해요|막막한 빈 화면 대신,<br>Luna의 질문에 답하다 보면<br>흐릿한 꿈이 또렷해져요."
  "4|side|phone-right|03-interpret.png|상징·심리·무의식<br>세 관점의 해몽|하나의 꿈을 세 가지 시선으로<br>깊이 풀어내, 오늘의 나를<br>돌아보게 해줘요."
  "5|flat|-|04-archive.png|기록한 꿈이<br>차곡차곡 쌓여요|지난 꿈을 다시 꺼내 보고,<br>반복되는 패턴 속에서<br>새로운 나를 발견하세요."
  "6|side|phone-left|05-insights.png|별빛으로 풀어내는<br>꿈 해몽의 순간|잠든 사이의 이야기가<br>별이 되어 떠오르는<br>감성적인 해몽 경험."
)
for shot in "${SHOTS[@]}"; do
  IFS='|' read -r slot tpl side file title sub <<< "$shot"
  raw="$RAW/$file"
  if [[ ! -f "$raw" ]]; then echo "  - skip slot $slot ($file 없음)"; continue; fi
  html="$TMP/shot-$slot.html"
  sed -e "s|__SIDE__|$side|g" \
      -e "s|__TITLE__|$title|g" \
      -e "s|__SUB__|$sub|g" \
      -e "s|__IMG__|file://$raw|g" \
      "$DIR/$tpl.html" > "$html"
  render "$html" "$OUT/screenshot-$slot.png"
  echo "  ✓ slot $slot ($tpl/$side) -> out/screenshot-$slot.png"
done

echo ""
echo "완료 (out/)"
