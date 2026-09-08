/**
 * useAppFonts의 웹 구현.
 *
 * 번들된 .otf(각 1.5MB, 합계 6MB)를 쓰지 않고 Pretendard 가변 폰트의 다이나믹
 * 서브셋 스타일시트를 붙인다. unicode-range로 잘게 쪼개져 있어 브라우저가 실제로
 * 화면에 뜬 글리프의 청크만 내려받는다.
 *
 * 폰트를 기다리지 않고 곧바로 true를 반환하는 것이 의도다 — 서브셋 CSS가
 * `font-display: swap`이라 시스템 폰트로 먼저 그려지고 나중에 교체된다.
 * 여기서 기다리면 CDN이 느릴 때 흰 화면만 길어진다.
 */
const STYLESHEET_ID = 'pretendard-dynamic-subset';
const STYLESHEET_URL =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css';

function ensureStylesheet() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLESHEET_ID)) return;

  const link = document.createElement('link');
  link.id = STYLESHEET_ID;
  link.rel = 'stylesheet';
  link.href = STYLESHEET_URL;
  document.head.appendChild(link);
}

ensureStylesheet();

export function useAppFonts(): boolean {
  return true;
}
