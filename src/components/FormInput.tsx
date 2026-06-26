import React from 'react';
import {View, TextInput, TextInputProps} from 'react-native';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';

interface FormInputProps extends TextInputProps {
  icon?: React.ReactNode;
  height?: number;
}

const FormInput: React.FC<FormInputProps> = ({icon, height = 50, ...rest}) => {
  return (
    <View
      style={{
        height: scale(height),
        borderRadius: scale(10),
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.backgroundWhite,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(12),
      }}>
      {icon && <View style={{marginRight: scale(8)}}>{icon}</View>}
      <TextInput
        placeholderTextColor={COLORS.textPlaceholder}
        style={[
          {
            flex: 1,
            fontFamily: FONTS.regular,
            fontSize: scale(13),
            color: COLORS.textPrimary,
            padding: 0,
          },
        ]}
        {...rest}
      />
    </View>
  );
};

export default FormInput;
