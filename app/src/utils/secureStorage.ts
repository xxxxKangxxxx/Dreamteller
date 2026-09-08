import * as SecureStore from 'expo-secure-store';

/**
 * 키-값 보관소의 플랫폼 공용 인터페이스.
 *
 * 네이티브는 Keychain/Keystore를 쓰는 SecureStore, 웹은 localStorage(`.web.ts`).
 * `expo-secure-store`는 웹 구현이 아예 없어서 import만 해도 웹 번들이 깨지므로,
 * 네이티브 모듈을 직접 부르는 곳은 이 파일 하나로 모은다.
 */
export const secureStorage = {
  getItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};
