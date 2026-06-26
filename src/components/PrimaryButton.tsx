import React from 'react';
import {Text, TouchableOpacity, ViewStyle} from 'react-native';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';

interface PrimaryButtonProps {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
  outlined?: boolean;
  disabled?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  style,
  outlined = false,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          height: scale(54),
          borderRadius: scale(27),
          backgroundColor: outlined ? COLORS.backgroundWhite : COLORS.primary,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          ...(outlined
            ? {borderWidth: 1.5, borderColor: COLORS.secondary}
            : {}),
        },
        style,
      ]}>
      <Text
        style={{
          fontFamily: FONTS.semiBold,
          fontSize: scale(16),
          color: COLORS.secondary,
        }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default PrimaryButton;
