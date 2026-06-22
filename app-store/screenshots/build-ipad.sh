#!/usr/bin/env bash
# DreamTeller App Store 스크린샷 — iPad 13" (2048x2732) 합성 빌드 (총 5컷)
# ipad.html(세로 중앙형) + raw 캡처로 브랜드 합성. 출력 out-ipad/screenshot-1.png ~ 5.png
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
RAW="$DIR/raw"
OUT="$DIR/out-ipad"
TMP="$DIR/.tmp-ipad"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

mkdir -p "$OUT" "$TMP"

render() { # html_path  out_png
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=1 --virtual-time-budget=1500 \
    --window-size=2048,2732 \
    --screenshot="$2" "file://$1" >/dev/null 2>&1
}

# slot | raw | 제목(<br>) | 설명(<br>)
SHOTS=(
  "1|04-archive.png|기록한 꿈이<br>차곡차곡 쌓여요|대화로 남긴 꿈이 한곳에 모여,<br>지난 밤의 이야기를 언제든 다시 만나요."
  "2|02-record.png|AI가 먼저 물어보며<br>꿈을 완성해요|막막한 빈 화면 대신, Luna의 질문에<br>답하다 보면 흐릿한 꿈이 또렷해져요."
  "3|03-interpret.png|상징·심리·무의식<br>세 관점의 해몽|하나의 꿈을 세 가지 시선으로 깊이 풀어내,<br>오늘의 나를 돌아보게 해줘요."
  "4|05-insights.png|별빛으로 풀어내는<br>꿈 해몽의 순간|잠든 사이의 이야기가 별이 되어 떠오르는<br>감성적인 해몽 경험."
  "5|01-landing.png|잊혀지는 간밤의 꿈,<br>이제 붙잡으세요|눈뜨면 사라지는 꿈을,<br>대화하며 나만의 기록으로 남겨보세요."
)
for shot in "${SHOTS[@]}"; do
  IFS='|' read -r slot file title sub <<< "$shot"
  raw="$RAW/$file"
  if [[ ! -f "$raw" ]]; then echo "  - skip slot $slot ($file 없음)"; continue; fi
  html="$TMP/ipad-$slot.html"
  sed -e "s|__TITLE__|$title|g" \
      -e "s|__SUB__|$sub|g" \
      -e "s|__IMG__|file://$raw|g" \
      "$DIR/ipad.html" > "$html"
  render "$html" "$OUT/screenshot-$slot.png"
  echo "  ✓ slot $slot -> out-ipad/screenshot-$slot.png"
done

echo ""
echo "완료 (out-ipad/)"
