import { Alert } from 'react-native';

import { useRecordStore } from '@/store/recordStore';

import { sessionStorage } from './sessionStorage';

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

let alreadyChecked = false;

export async function maybePromptResume(onResume: () => void): Promise<void> {
  if (alreadyChecked) return;
  alreadyChecked = true;

  const saved = await sessionStorage.load();
  if (!saved) return;

  if (saved.isCompleted) {
    await sessionStorage.clear();
    return;
  }

  const startedMs = new Date(saved.startedAt).getTime();
  if (!Number.isFinite(startedMs) || Date.now() - startedMs > MAX_AGE_MS) {
    await sessionStorage.clear();
    return;
  }

  Alert.alert(
    '꿈 기록을 이어할까요?',
    '진행 중이던 꿈 기록이 있어요. 이어서 작성할까요?',
    [
      {
        text: '버리기',
        style: 'destructive',
        onPress: () => {
          void sessionStorage.clear();
        },
      },
      {
        text: '이어하기',
        onPress: () => {
          useRecordStore.getState().hydrate(saved);
          onResume();
        },
      },
    ],
    { cancelable: false },
  );
}
