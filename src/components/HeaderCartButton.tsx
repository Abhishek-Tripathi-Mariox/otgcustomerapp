import React from 'react';
import {TouchableOpacity, StyleProp, ViewStyle} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {scale} from '../utils/scale';
import {useAppSelector, selectCartCount} from '../store';
import {ShoppingBagIcon} from './icons';

interface Props {
  size?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

/**
 * Header cart button used across all screens.
 * Renders the ShoppingBagIcon with a count badge baked into the icon's
 * built-in circle, and navigates to the Cart screen on tap by default.
 */
export default function HeaderCartButton({size = 30, style, onPress}: Props) {
  const navigation = useNavigation<any>();
  const count = useAppSelector(selectCartCount);

  return (
    <TouchableOpacity
      onPress={onPress ?? (() => navigation.navigate('Cart'))}
      style={[{marginRight: scale(12)}, style]}
      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
      <ShoppingBagIcon size={size} count={count} />
    </TouchableOpacity>
  );
}
