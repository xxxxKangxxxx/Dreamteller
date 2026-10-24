#!/usr/bin/env bash
# App Store 크리에이티브 자산 렌더 — scene.html 하나로 두 규격을 만든다.
#  header.png : 제품 페이지 헤더 21:9 (3840x1646)
#  search.png : 검색 결과 3:2 (3840x2560)
# 문구를 바꾸려면 scene.html의 <h1 id="title"> / .sub 를 수정 후 실행.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for spec in "header:3840:1646" "search:3840:2560"; do
  IFS=: read -r name w h <<< "$spec"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --virtual-time-budget=2500 --allow-file-access-from-files --window-size="$w,$h" \
    --screenshot="$DIR/$name.png" "file://$DIR/scene.html?w=$w&h=$h" >/dev/null 2>&1
  echo "  ✓ $name.png (${w}x${h})"
done
