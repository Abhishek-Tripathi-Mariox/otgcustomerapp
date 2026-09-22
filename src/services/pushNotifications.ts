import {Platform} from 'react-native';
import {
  getMessaging,
  getToken,
  requestPermission,
  onTokenRefresh,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  setBackgroundMessageHandler,
  AuthorizationStatus,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import {navigationRef} from '../navigation/AppNavigator';
import {showAppAlert} from '../components/AlertProvider';
import authService from './authService';

let refreshUnsubscribe: (() => void) | null = null;
let tapListenersRegistered = false;

// Routes a notification's `data` payload to the specific screen it's about —
// same convention the backend already uses when calling sendPush() (see
// quotation.controller.ts's respondToQuotation / booking/vendorOrders
// controllers' dispatch pushes): `quotationId` or `bookingId` string fields.
const navigateForData = (data?: {[key: string]: string | object}) => {
  if (!data || !navigationRef.isReady()) return;
  const quotationId = data.quotationId as string | undefined;
  const bookingId = data.bookingId as string | undefined;
  if (quotationId) {
    navigationRef.navigate('MyQuotations', {focusId: quotationId});
  } else if (bookingId) {
    navigationRef.navigate('OrderDetails', {orderId: bookingId});
  }
};

/**
 * Wires up foreground/background/killed-state tap handling so a push
 * notification actually opens the relevant order/quotation instead of just
 * the app's home screen. Call once at app root (see App.tsx). Never throws —
 * mirrors registerPushToken()'s tolerance for Firebase not being fully
 * configured yet.
 */
export const setupNotificationTapHandling = (): void => {
  if (tapListenersRegistered) return;
  try {
    const messaging = getMessaging();
    tapListenersRegistered = true;

    // App was fully closed and opened via a notification tap.
    getInitialNotification(messaging)
      .then(message => {
        if (message) navigateForData(message.data);
      })
      .catch(() => {});

    // App was backgrounded and brought to the foreground via a tap.
    onNotificationOpenedApp(messaging, message => {
      navigateForData(message.data);
    });

    // App was in the background/killed when the message arrived — FCM
    // displays the system notification itself; we only need to react once
    // it's actually tapped (handled by the two listeners above), so this
    // just has to exist and resolve without throwing.
    setBackgroundMessageHandler(messaging, async () => {});

    // App was in the foreground — no system tray notification is shown
    // automatically, so surface an in-app alert the user can tap through.
    onMessage(messaging, (message: RemoteMessage) => {
      const title = message.notification?.title || 'New update';
      const body = message.notification?.body || '';
      showAppAlert({
        title,
        message: body,
        buttons: [
          {text: 'Dismiss', style: 'cancel'},
          {
            text: 'View',
            style: 'primary',
            onPress: () => navigateForData(message.data),
          },
        ],
      });
    });
  } catch (err) {
    console.warn(
      '[pushNotifications] setupNotificationTapHandling failed (Firebase not fully configured yet?):',
      err,
    );
  }
};

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
