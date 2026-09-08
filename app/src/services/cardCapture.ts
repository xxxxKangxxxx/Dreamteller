import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

export type SaveResult = 'saved' | 'permission-denied' | 'failed';
export type ShareResult = 'shared' | 'unsupported' | 'failed';

/**
 * ViewShot이 캡처 결과를 어떤 형태로 돌려줄지.
 * 네이티브는 임시 파일 경로가 MediaLibrary/Sharing에 그대로 들어가서 편하다.
 * 웹은 파일 시스템이 없어 data URI를 쓴다(`cardCapture.web.ts`).
 */
export const CAPTURE_RESULT = 'tmpfile' as const;

/** 저장 성공 시 사용자에게 보여줄 문구 — 저장 위치가 플랫폼마다 다르다 */
export const SAVE_SUCCESS_MESSAGE = '사진 앱에 저장됐어요';

export async function saveCardImage(uri: string): Promise<SaveResult> {
  try {
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) return 'permission-denied';
    await MediaLibrary.saveToLibraryAsync(uri);
    return 'saved';
  } catch {
    return 'failed';
  }
}

export async function shareCardImage(uri: string): Promise<ShareResult> {
  try {
    if (!(await Sharing.isAvailableAsync())) return 'unsupported';
    await Sharing.shareAsync(uri, {
      dialogTitle: '해몽 카드 공유',
      mimeType: 'image/png',
      UTI: 'public.png',
    });
    return 'shared';
  } catch {
    return 'failed';
  }
}
