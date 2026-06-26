import React from 'react';
import {TouchableOpacity, Image, StyleProp, ViewStyle} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {useAppSelector} from '../store';
import {ProfileIcon} from './icons';

interface Props {
  size?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

/**
 * Header profile button used across all screens.
 * Renders the user's profile image if available, otherwise the default ProfileIcon.
 * Sized to match HeaderCartButton (default 30). Taps navigate to EditProfile.
 */
export default function HeaderProfileButton({size = 30, style, onPress}: Props) {
  const navigation = useNavigation<any>();
  const profileImage = useAppSelector(s => s.app.user?.profileImage);
  const dimension = scale(size);

  return (
    <TouchableOpacity
      onPress={onPress ?? (() => navigation.navigate('EditProfile'))}
      style={style}
      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
      {profileImage ? (
        <Image
          source={{uri: profileImage}}
          style={{
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
            borderWidth: 1.5,
            borderColor: COLORS.yellowIcon,
            backgroundColor: COLORS.secondary,
          }}
        />
      ) : (
        <ProfileIcon size={size} />
      )}
    </TouchableOpacity>
  );
}
