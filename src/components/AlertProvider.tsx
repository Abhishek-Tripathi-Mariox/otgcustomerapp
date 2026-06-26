import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Modal, Pressable, Text, View} from 'react-native';
import AppAlert, {AppAlertVariant} from './AppAlert';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {scale} from '../utils/scale';

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive' | 'primary';

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: AlertButtonStyle;
};

export type AlertConfig = {
  title?: string;
  message?: string;
  buttons?: AlertButton[];
  variant?: AppAlertVariant;
};

type AlertContextValue = {
  show: (config: AlertConfig) => void;
  hide: () => void;
};

const AlertContext = createContext<AlertContextValue | null>(null);

let externalShow: ((config: AlertConfig) => void) | null = null;

export const showAppAlert = (config: AlertConfig) => {
  if (externalShow) {
    externalShow(config);
  } else if (__DEV__) {
    console.warn(
      '[AlertProvider] showAppAlert called before AlertProvider mounted',
    );
  }
};

const inferVariant = (cfg: AlertConfig): AppAlertVariant => {
  if (cfg.variant) return cfg.variant;
  const t = (cfg.title || '').toLowerCase();
  if (t.includes('error') || t.includes('failed') || t.includes('delete')) {
    return 'error';
  }
  if (t.includes('success')) return 'success';
  return 'info';
};

export const AlertProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const configRef = useRef<AlertConfig>({});

  const show = useCallback((config: AlertConfig) => {
    configRef.current = config;
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  externalShow = show;

  const value = useMemo(() => ({show, hide}), [show, hide]);

  const cfg = configRef.current;
  const buttons: AlertButton[] =
    cfg.buttons && cfg.buttons.length > 0 ? cfg.buttons : [{text: 'OK'}];

  // 1-2 buttons → use existing AppAlert (yellow primary + outline secondary).
  // 3+ buttons → render a stacked themed dialog.
  const useAppAlert = buttons.length <= 2;

  const cancelBtn =
    buttons.find(b => b.style === 'cancel') ??
    (buttons.length === 2 ? buttons[0] : undefined);
  const primaryBtn =
    buttons.find(b => b.style === 'destructive' || b.style === 'primary') ??
    buttons[buttons.length - 1];

  const handlePrimary = () => {
    hide();
    primaryBtn?.onPress?.();
  };
  const handleSecondary = () => {
    hide();
    cancelBtn?.onPress?.();
  };
  const handleStacked = (btn: AlertButton) => {
    hide();
    btn.onPress?.();
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      {useAppAlert ? (
        <AppAlert
          visible={visible}
          title={cfg.title || ''}
          message={cfg.message}
          variant={inferVariant(cfg)}
          primaryLabel={primaryBtn?.text || 'OK'}
          secondaryLabel={
            cancelBtn && cancelBtn !== primaryBtn ? cancelBtn.text : undefined
          }
          onPrimary={handlePrimary}
          onSecondary={
            cancelBtn && cancelBtn !== primaryBtn ? handleSecondary : undefined
          }
          onDismiss={hide}
        />
      ) : (
        <StackedAlert
          visible={visible}
          title={cfg.title}
          message={cfg.message}
          buttons={buttons}
          onPress={handleStacked}
          onDismiss={hide}
        />
      )}
    </AlertContext.Provider>
  );
};

const StackedAlert: React.FC<{
  visible: boolean;
  title?: string;
  message?: string;
  buttons: AlertButton[];
  onPress: (btn: AlertButton) => void;
  onDismiss: () => void;
}> = ({visible, title, message, buttons, onPress, onDismiss}) => (
  <Modal
    transparent
    visible={visible}
    animationType="fade"
    statusBarTranslucent
    onRequestClose={onDismiss}>
    <Pressable
      onPress={onDismiss}
      style={{
        flex: 1,
        backgroundColor: COLORS.backgroundOverlay,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: scale(28),
      }}>
      <Pressable
        onPress={() => {}}
        style={{
          width: '100%',
          backgroundColor: COLORS.backgroundWhite,
          borderRadius: scale(20),
          paddingTop: scale(24),
          paddingHorizontal: scale(22),
          paddingBottom: scale(18),
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.25,
          shadowRadius: 12,
        }}>
        <View
          style={{
            alignSelf: 'center',
            width: scale(48),
            height: scale(4),
            borderRadius: scale(2),
            backgroundColor: COLORS.primary,
            marginBottom: scale(16),
          }}
        />
        {title ? (
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: scale(18),
              color: COLORS.secondary,
              textAlign: 'center',
              marginBottom: message ? scale(10) : scale(16),
            }}>
            {title}
          </Text>
        ) : null}
        {message ? (
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: scale(14),
              color: COLORS.textLight,
              lineHeight: scale(20),
              textAlign: 'center',
              marginBottom: scale(20),
            }}>
            {message}
          </Text>
        ) : null}
        <View style={{gap: scale(10)}}>
          {buttons.map((btn, idx) => {
            const isPrimary = btn.style === 'primary' || btn.style === 'destructive';
            const isCancel = btn.style === 'cancel';
            const bg = isPrimary
              ? btn.style === 'destructive'
                ? COLORS.error
                : COLORS.primary
              : COLORS.backgroundWhite;
            const fg = isPrimary
              ? btn.style === 'destructive'
                ? COLORS.textWhite
                : COLORS.secondary
              : isCancel
              ? COLORS.textLight
              : COLORS.secondary;
            const borderColor = isPrimary
              ? bg
              : isCancel
              ? COLORS.border
              : COLORS.secondary;
            return (
              <Pressable
                key={`${btn.text}-${idx}`}
                onPress={() => onPress(btn)}
                android_ripple={{color: COLORS.divider}}
                style={({pressed}) => ({
                  paddingVertical: scale(14),
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: scale(27),
                  borderWidth: isPrimary ? 0 : 1.5,
                  borderColor,
                  backgroundColor: pressed
                    ? isPrimary
                      ? COLORS.yellowBorder
                      : COLORS.backgroundLight
                    : bg,
                })}>
                <Text
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: scale(15),
                    color: fg,
                  }}>
                  {btn.text}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

export const useAlert = (): AlertContextValue => {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error('useAlert must be used inside AlertProvider');
  }
  return ctx;
};
