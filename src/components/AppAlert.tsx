import React from 'react';
import {Modal, View, Text, Pressable} from 'react-native';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {scale} from '../utils/scale';

export type AppAlertVariant = 'info' | 'success' | 'error';

interface AppAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  variant?: AppAlertVariant;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  onDismiss?: () => void;
}

const AppAlert: React.FC<AppAlertProps> = ({
  visible,
  title,
  message,
  variant = 'info',
  primaryLabel = 'OK',
  secondaryLabel,
  onPrimary,
  onSecondary,
  onDismiss,
}) => {
  const accent =
    variant === 'error'
      ? COLORS.error
      : variant === 'success'
      ? COLORS.success
      : COLORS.primary;

  const handlePrimary = () => {
    if (onPrimary) onPrimary();
    else if (onDismiss) onDismiss();
  };
  const handleSecondary = () => {
    if (onSecondary) onSecondary();
    else if (onDismiss) onDismiss();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss || handlePrimary}>
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
              backgroundColor: accent,
              marginBottom: scale(16),
            }}
          />
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: scale(18),
              color: COLORS.secondary,
              textAlign: 'center',
              marginBottom: message ? scale(10) : 0,
            }}>
            {title}
          </Text>
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
          ) : (
            <View style={{height: scale(16)}} />
          )}

          <View style={{flexDirection: 'row', gap: scale(10)}}>
            {secondaryLabel ? (
              <Pressable
                onPress={handleSecondary}
                android_ripple={{color: COLORS.divider}}
                style={({pressed}) => ({
                  flex: 1,
                  paddingVertical: scale(14),
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: scale(27),
                  borderWidth: 1.5,
                  borderColor: COLORS.secondary,
                  backgroundColor: pressed
                    ? COLORS.backgroundLight
                    : COLORS.backgroundWhite,
                })}>
                <Text
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: scale(15),
                    color: COLORS.secondary,
                  }}>
                  {secondaryLabel}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={handlePrimary}
              android_ripple={{color: COLORS.yellowBorder}}
              style={({pressed}) => ({
                flex: 1,
                paddingVertical: scale(14),
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: scale(27),
                backgroundColor: pressed ? COLORS.yellowBorder : COLORS.primary,
              })}>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(15),
                  color: COLORS.secondary,
                }}>
                {primaryLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default AppAlert;
