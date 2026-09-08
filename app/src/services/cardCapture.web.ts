export type SaveResult = 'saved' | 'permission-denied' | 'failed';
export type ShareResult = 'shared' | 'unsupported' | 'failed';

/**
 * 웹에는 파일 시스템이 없어 캡처 결과를 data URI로 받는다.
 * (`react-native-view-shot`의 웹 구현은 내부적으로 html2canvas를 쓰고,
 *  'tmpfile'을 넘기면 콘솔 경고를 내면서 어차피 data URI를 돌려준다)
 */
export const CAPTURE_RESULT = 'data-uri' as const;

/** 웹에서는 사진 앱이 아니라 브라우저 다운로드로 떨어진다 */
export const SAVE_SUCCESS_MESSAGE = '이미지를 다운로드했어요';

/**
 * 사진 앱 대신 브라우저 다운로드를 트리거한다.
 * 권한 개념이 없으므로 'permission-denied'는 반환되지 않는다.
 */
export async function saveCardImage(dataUri: string): Promise<SaveResult> {
  try {
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `dreamteller-card-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    return 'saved';
  } catch {
    return 'failed';
  }
}

/**
 * Web Share API로 이미지 파일을 공유한다.
 *
 * 파일 공유는 모바일 브라우저(특히 iOS Safari, Android Chrome)에서만 되고 데스크톱은
 * 대부분 지원하지 않는다. `canShare({ files })`로 미리 확인해서, 안 되면 호출부가
 * 공유 버튼을 숨기거나 안내할 수 있게 'unsupported'를 돌려준다.
 */
export async function shareCardImage(dataUri: string): Promise<ShareResult> {
  try {
    const blob = await (await fetch(dataUri)).blob();
    const file = new File([blob], 'dreamteller-card.png', { type: 'image/png' });

    if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
      return 'unsupported';
    }

    await navigator.share({ files: [file], title: '해몽 카드' });
    return 'shared';
  } catch (error) {
    // 사용자가 공유 시트를 그냥 닫으면 AbortError가 난다 — 실패로 표시하지 않는다
    if (error instanceof DOMException && error.name === 'AbortError') return 'shared';
    return 'failed';
  }
}
