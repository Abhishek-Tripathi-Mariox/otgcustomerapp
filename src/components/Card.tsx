import React from 'react';
import {View, ViewStyle} from 'react-native';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const Card: React.FC<CardProps> = ({children, style}) => {
  return (
    <View
      style={[
        {
          marginHorizontal: scale(16),
          marginTop: scale(16),
          backgroundColor: COLORS.backgroundWhite,
          borderRadius: scale(12),
          borderWidth: 1,
          borderColor: COLORS.border,
          padding: scale(16),
        },
        style,
      ]}>
      {children}
    </View>
  );
};

export default Card;
