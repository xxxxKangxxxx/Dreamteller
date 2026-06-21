# App Store 스크린샷 (6.5" / 1284×2778, 총 6컷)

App Store Connect 이 앱 레코드는 **6.5" 디스플레이** 슬롯을 요구합니다 (허용: 1242×2688 또는 1284×2778).
`build.sh`가 raw 캡처를 브랜드 합성해 **1284×2778** 6컷을 `out/`에 생성합니다.

## 재생성
```bash
cd dreamteller/app-store/screenshots
./build.sh        # raw/ → out/screenshot-1.png ~ 6.png
```
> Chrome(headless) + 시스템 Pretendard 폰트로 렌더링. raw 캡처는 어떤 기기로 찍어도 됩니다(프레임 안에 합성됨).

## 6컷 구성

| 컷 | 화면(raw) | 레이아웃 | 제목 |
|---|---|---|---|
| 1·2 | 01-landing | 가로 대각 hero (한 기기가 두 컷에 걸침) | 흘려보낸 간밤의 꿈, → 이제 붙잡으세요 |
| 3 | 02-record | 폰 좌 / 텍스트 우 | AI가 먼저 물어보며 꿈을 완성해요 |
| 4 | 03-interpret | 폰 우 / 텍스트 좌 | 상징·심리·무의식 세 관점의 해몽 |
| 5 | 04-archive(홈) | 제목 상단 / 폰 중앙 / 설명 하단 | 기록한 꿈이 차곡차곡 쌓여요 |
| 6 | 05-insights(로딩) | 폰 좌 / 텍스트 우 | 별빛으로 풀어내는 꿈 해몽의 순간 |

## 파일 구성
- `raw/` — 원본 캡처 (01~05, 각 393×852)
- `hero.html` — 컷 1·2 (가로 대각, 좌/우 슬라이스). 각도=`.hero`의 `rotateZ`(현재 -64°), 크기=`width`
- `side.html` — 컷 3·4·6 (좌우 분할). `body.phone-left` / `body.phone-right` 클래스로 위치 제어
- `flat.html` — 컷 5 (상단 제목 / 중앙 폰 / 하단 설명)
- `build.sh` — 컷별 템플릿·캡션·설명 매핑 + 렌더링
- `template.html` — (구버전 정면 템플릿, 현재 미사용)
- `out/` — 최종 산출물 (업로드용)

캡션·설명 문구 수정: `build.sh`의 `SHOTS` 배열(컷 3~6) / `hero.html`의 `.cap-left`·`.cap-right`(컷 1·2).

## raw 재캡처 (더 선명하게 하고 싶을 때)
현재 raw는 393×852(@1x)라 합성 시 약간 부드럽습니다. 더 선명히 하려면 iOS 시뮬레이터에서 **File > Save Screen(⌘S)** 으로 native 해상도 캡처 후 같은 파일명으로 `raw/`에 교체하고 `./build.sh` 재실행.

## 업로드
App Store Connect → 앱 → (버전) → 미리보기 및 스크린샷 → **6.5" 디스플레이** 슬롯에
`out/screenshot-1.png ~ 6.png`를 순서대로 드래그.
