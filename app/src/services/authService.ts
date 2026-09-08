import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import {
  isCurrentSessionAnonymous,
  readErrorMessage,
  sharedAuth,
  type SupabaseSessionResult,
} from '@/services/authService.shared';
import { mapSupabaseUser, supabase } from '@/services/supabase';

export { authService } from '@/services/authService.shared';
export type { SupabaseSessionResult } from '@/services/authService.shared';

WebBrowser.maybeCompleteAuthSession();

/**
 * 네이티브 인증. 공통 동작은 `sharedAuth`에서 가져오고, 플랫폼이 갈리는
 * OAuth(인앱 브라우저)와 Apple 로그인만 여기서 얹는다. 웹은 `authService.web.ts`.
 */
export const supabaseAuth = {
  ...sharedAuth,

  async signInWithGoogle(): Promise<SupabaseSessionResult> {
    const redirectTo = Linking.createURL('auth-callback');

    // 게스트(익명) 세션이면 linkIdentity로 같은 계정에 Google을 연결해 기록을 유지한다.
    const linkToGuest = await isCurrentSessionAnonymous();
    const { data, error } = linkToGuest
      ? await supabase.auth.linkIdentity({
          provider: 'google',
          options: { redirectTo, skipBrowserRedirect: true },
        })
      : await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo, skipBrowserRedirect: true },
        });
    if (error || !data?.url) {
      throw new Error(readErrorMessage(error, 'Google 로그인 URL을 받지 못했어요'));
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('로그인을 취소했어요');
    }
    if (result.type !== 'success' || !result.url) {
      throw new Error('Google 로그인에 실패했어요');
    }

    const fragment = result.url.includes('#') ? result.url.split('#')[1] ?? '' : '';
    const queryString = result.url.includes('?') ? result.url.split('?')[1]?.split('#')[0] ?? '' : '';
    const params = new URLSearchParams(fragment || queryString);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const oauthError = params.get('error_description') ?? params.get('error');
    if (oauthError) {
      throw new Error(decodeURIComponent(oauthError));
    }
    if (!accessToken || !refreshToken) {
      throw new Error('Google 로그인 토큰을 받지 못했어요');
    }

    const { data: sessionData, error: setError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (setError || !sessionData.session || !sessionData.user) {
      throw new Error(readErrorMessage(setError, 'Google 세션을 저장하지 못했어요'));
    }

    return {
      user: mapSupabaseUser(sessionData.user),
      accessToken: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
    };
  },

  // 기기에서 Sign in with Apple을 쓸 수 있는지 (iOS 13+ 실기기)
  async isAppleAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch {
      return false;
    }
  },

  async signInWithApple(): Promise<SupabaseSessionResult> {
    // nonce: 원본은 Supabase로, SHA-256 해시는 Apple로 전달해 재생 공격을 방지
    const rawNonce = `${Crypto.randomUUID()}${Crypto.randomUUID()}`.replace(/-/g, '');
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    let credential: AppleAuthentication.AppleAuthenticationCredential;
    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code?: string }).code === 'ERR_REQUEST_CANCELED'
      ) {
        throw new Error('로그인을 취소했어요');
      }
      throw new Error(readErrorMessage(err, 'Apple 로그인에 실패했어요'));
    }

    if (!credential.identityToken) {
      throw new Error('Apple 인증 토큰을 받지 못했어요');
    }

    // Apple은 최초 1회만 이름을 제공 → 받은 경우 메타데이터로 활용
    const fullName = [credential.fullName?.familyName, credential.fullName?.givenName]
      .filter(Boolean)
      .join('')
      .trim();

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });
    if (error || !data.session || !data.user) {
      throw new Error(readErrorMessage(error, 'Apple 로그인에 실패했어요'));
    }

    // 최초 로그인 시 이름이 비어 있으면 Apple이 준 이름으로 보강
    if (fullName && !data.user.user_metadata?.name) {
      await supabase.auth.updateUser({ data: { name: fullName } }).catch(() => {});
    }

    return {
      user: mapSupabaseUser(data.user),
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  },
};
