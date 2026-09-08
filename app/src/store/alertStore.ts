import { create } from 'zustand';

import type { AlertButton } from '@/types/alert';

export interface AlertDialog {
  id: string;
  title: string;
  message?: string;
  buttons: AlertButton[];
  /** false면 배경 탭/Esc로 닫히지 않는다 */
  cancelable: boolean;
}

interface AlertState {
  /** 스택 — 버튼 onPress가 새 대화상자를 여는 경우(계정 삭제 2차 확인)를 지탱한다 */
  dialogs: AlertDialog[];
  push: (dialog: Omit<AlertDialog, 'id'>) => void;
  dismiss: (id: string) => void;
}

/** 웹 전용 확인 대화상자 큐. 네이티브는 OS 알럿을 쓰므로 이 스토어를 채우지 않는다. */
export const useAlertStore = create<AlertState>((set, get) => ({
  dialogs: [],

  push(dialog) {
    const id = `alert_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    set({ dialogs: [...get().dialogs, { ...dialog, id }] });
  },

  dismiss(id) {
    set({ dialogs: get().dialogs.filter((d) => d.id !== id) });
  },
}));
