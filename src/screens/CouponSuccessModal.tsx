import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';

// Green checkmark in circle
const CheckmarkIcon = () => (
  <Svg width={scale(80)} height={scale(80)} viewBox="0 0 80 80" fill="none">
    <Circle cx={40} cy={40} r={38} stroke={COLORS.success} strokeWidth={3} fill="none" />
    <Path
      d="M22 40L34 52L58 28"
      stroke={COLORS.success}
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

interface CouponSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  savedAmount?: string;
  couponCode?: string;
}

const CouponSuccessModal: React.FC<CouponSuccessModalProps> = ({
  visible,
  onClose,
  savedAmount = '100/-',
  couponCode = 'CITINEW',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.backgroundOverlay,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: scale(40),
        }}>
        <View
          style={{
            width: '100%',
            backgroundColor: COLORS.backgroundWhite,
            borderRadius: scale(16),
            alignItems: 'center',
            paddingVertical: scale(30),
            paddingHorizontal: scale(24),
          }}>
          {/* Checkmark */}
          <CheckmarkIcon />

          {/* Title */}
          <Text
            style={{
              marginTop: scale(16),
              fontFamily: FONTS.semiBold,
              fontSize: scale(18),
              color: COLORS.textPrimary,
              textAlign: 'center',
            }}>
            Applied Coupons
          </Text>

          {/* Description */}
          <Text
            style={{
              marginTop: scale(8),
              fontFamily: FONTS.regular,
              fontSize: scale(13),
              color: COLORS.textSecondary,
              textAlign: 'center',
              lineHeight: scale(20),
            }}>
            You saved {savedAmount} on your order with{'\n'}
            {couponCode} Code
          </Text>

          {/* Divider */}
          <View
            style={{
              width: '100%',
              height: 1,
              backgroundColor: COLORS.divider,
              marginTop: scale(20),
            }}
          />

          {/* Ok Thanks button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              marginTop: scale(16),
              paddingVertical: scale(4),
            }}>
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: scale(15),
                color: COLORS.textPrimary,
              }}>
              Ok! Thanks
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CouponSuccessModal;
