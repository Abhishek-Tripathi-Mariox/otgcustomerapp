import {Platform} from 'react-native';
import {
  getMessaging,
  getToken,
  requestPermission,
  onTokenRefresh,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import authService from './authService';

let refreshUnsubscribe: (() => void) | null = null;

// Sends whatever FCM token we currently have to the backend, swallowing
// failures — this must never block or crash the login/splash flow it's
// called from. Safe to call repeatedly (e.g. on every login).
const sendToken = async (token: string): Promise<void> => {
  try {
    await authService.updateFcmToken(token);
  } catch {
    // Backend unreachable or user not authenticated yet — the next
    // registerPushToken() call (next login/app open) will retry.
  }
};

/**
 * Requests notification permission (iOS; Android's POST_NOTIFICATIONS is
 * already requested separately in SplashScreen.tsx), fetches the current
 * FCM token, and sends it to the backend. Also subscribes to onTokenRefresh
 * so a later token rotation gets resent without requiring another login.
 * Call once after a successful login/session restore.
 *
 * Never throws — until android/app/google-services.json is added (see
 * android/build.gradle's comment), the native Firebase module isn't fully
 * usable and every call here resolves to a no-op rather than crashing.
 */
export const registerPushToken = async (): Promise<void> => {
  try {
    const messaging = getMessaging();

    if (Platform.OS === 'ios') {
      const authStatus = await requestPermission(messaging);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;
      if (!enabled) return;
    }

    const token = await getToken(messaging);
    if (token) await sendToken(token);

    if (!refreshUnsubscribe) {
      refreshUnsubscribe = onTokenRefresh(messaging, sendToken);
    }
  } catch (err) {
    console.warn(
      '[pushNotifications] registerPushToken failed (Firebase not fully configured yet?):',
      err,
    );
  }
};
