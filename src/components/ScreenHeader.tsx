import React from 'react';
import {View, Text, TouchableOpacity, StatusBar} from 'react-native';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {BackArrowIcon} from './icons';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  showBack?: boolean;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  onBack,
  rightContent,
  showBack = true,
}) => {
  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.headerBg}
        translucent
      />
      <View
        style={{
          backgroundColor: COLORS.headerBg,
          paddingBottom: scale(16),
          paddingTop: scale(40),
          paddingHorizontal: scale(16),
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {showBack && (
              <TouchableOpacity
                onPress={onBack}
                style={{marginRight: scale(12)}}>
                <BackArrowIcon />
              </TouchableOpacity>
            )}
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(18),
                color: COLORS.textWhite,
              }}>
              {title}
            </Text>
          </View>
          {rightContent && <View>{rightContent}</View>}
        </View>
      </View>
    </>
  );
};

export default ScreenHeader;
