import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, {Path, Circle, Rect} from 'react-native-svg';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {CloseIcon} from '../components/icons';

// WhatsApp icon
const WhatsAppShareIcon = () => (
  <Svg width={scale(40)} height={scale(40)} viewBox="0 0 40 40" fill="none">
    <Circle cx={20} cy={20} r={20} fill="#25D366" />
    <Path
      d="M20 10C14.48 10 10 14.48 10 20C10 21.85 10.5 23.55 11.36 25.02L10.05 29.95L15.13 28.67C16.55 29.43 18.22 29.9 20 29.9C25.52 29.9 30 25.42 30 19.9C30 14.48 25.52 10 20 10ZM26.36 24.73C26.1 25.43 25.04 26.03 24.24 26.18C23.68 26.28 22.94 26.36 20.56 25.38C17.58 24.14 15.66 21.1 15.5 20.88C15.36 20.68 14.28 19.22 14.28 17.7C14.28 16.18 15.06 15.46 15.36 15.14C15.62 14.86 16.04 14.74 16.44 14.74C16.56 14.74 16.68 14.74 16.78 14.76C17.08 14.76 17.24 14.78 17.44 15.28C17.7 15.88 18.3 17.4 18.38 17.56C18.46 17.72 18.5 17.9 18.4 18.1C17.92 19.06 17.42 19.02 17.72 19.52C18.72 21.18 19.72 21.78 21.2 22.52C21.52 22.68 21.7 22.66 21.88 22.44C22.06 22.22 22.62 21.56 22.82 21.26C23.02 20.96 23.24 21 23.48 21.08C23.72 21.16 25.22 21.9 25.54 22.06C25.86 22.22 26.06 22.3 26.14 22.42C26.22 22.58 26.22 23.22 25.96 23.96L26.36 24.73Z"
      fill="white"
    />
  </Svg>
);

// Facebook icon
const FacebookShareIcon = () => (
  <Svg width={scale(40)} height={scale(40)} viewBox="0 0 40 40" fill="none">
    <Circle cx={20} cy={20} r={20} fill="#1877F2" />
    <Path
      d="M22 21H25L26 17H22V15C22 13.97 22 13 24 13H26V9.14C25.65 9.1 24.36 9 22.97 9C20.07 9 18 10.81 18 14.04V17H15V21H18V31H22V21Z"
      fill="white"
    />
  </Svg>
);

// Twitter/X icon
const TwitterShareIcon = () => (
  <Svg width={scale(40)} height={scale(40)} viewBox="0 0 40 40" fill="none">
    <Circle cx={20} cy={20} r={20} fill="#000000" />
    <Path
      d="M13 13L19.5 21.5L13 28H14.5L20.2 22.4L24.5 28H29L22.2 19.1L28.3 13H26.8L21.5 18.2L17.5 13H13ZM15 14H17L27 27H25L15 14Z"
      fill="white"
    />
  </Svg>
);

// Email icon
const EmailShareIcon = () => (
  <Svg width={scale(40)} height={scale(40)} viewBox="0 0 40 40" fill="none">
    <Circle cx={20} cy={20} r={20} fill="#666666" />
    <Path
      d="M12 14H28V26H12V14Z"
      stroke="white"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 14L20 21L28 14"
      stroke="white"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Copy icon
const CopyIcon = () => (
  <Svg width={scale(16)} height={scale(16)} viewBox="0 0 24 24" fill="none">
    <Rect x={9} y={9} width={13} height={13} rx={2} stroke="#E8A000" strokeWidth={1.5} />
    <Path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="#E8A000" strokeWidth={1.5} />
  </Svg>
);

interface ShareBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  shareUrl?: string;
}

const ShareBottomSheet: React.FC<ShareBottomSheetProps> = ({
  visible,
  onClose,
  shareUrl = 'https://youtu.be/TGxfKkBC6L2k',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.backgroundOverlay,
          justifyContent: 'flex-end',
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={{
              backgroundColor: COLORS.backgroundWhite,
              borderTopLeftRadius: scale(24),
              borderTopRightRadius: scale(24),
              paddingHorizontal: scale(24),
              paddingBottom: scale(30),
            }}>
            {/* Drag handle */}
            <View style={{alignItems: 'center', paddingTop: scale(12)}}>
              <View
                style={{
                  width: scale(40),
                  height: scale(4),
                  borderRadius: scale(2),
                  backgroundColor: COLORS.dragHandle,
                }}
              />
            </View>

            {/* Close button */}
            <TouchableOpacity
              onPress={onClose}
              style={{
                position: 'absolute',
                right: scale(20),
                top: scale(16),
                padding: scale(8),
                zIndex: 10,
              }}>
              <CloseIcon />
            </TouchableOpacity>

            {/* Title */}
            <Text
              style={{
                marginTop: scale(24),
                fontFamily: FONTS.semiBold,
                fontSize: scale(18),
                color: COLORS.textPrimary,
                textAlign: 'center',
              }}>
              Share Now
            </Text>

            {/* URL Input */}
            <View
              style={{
                marginTop: scale(20),
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: scale(10),
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.background,
                paddingHorizontal: scale(14),
                height: scale(48),
              }}>
              <TextInput
                style={{
                  flex: 1,
                  fontFamily: FONTS.regular,
                  fontSize: scale(13),
                  color: COLORS.textSecondary,
                  padding: 0,
                }}
                value={shareUrl}
                editable={false}
              />
              <TouchableOpacity
                style={{
                  paddingHorizontal: scale(14),
                  paddingVertical: scale(6),
                  borderRadius: scale(6),
                  borderWidth: 1,
                  borderColor: COLORS.warning,
                  backgroundColor: COLORS.yellowLight,
                }}>
                <Text
                  style={{
                    fontFamily: FONTS.medium,
                    fontSize: scale(12),
                    color: COLORS.warning,
                  }}>
                  Copy
                </Text>
              </TouchableOpacity>
            </View>

            {/* Share icons row */}
            <View
              style={{
                marginTop: scale(24),
                flexDirection: 'row',
                justifyContent: 'center',
                gap: scale(24),
              }}>
              <TouchableOpacity style={{alignItems: 'center'}}>
                <WhatsAppShareIcon />
                <Text
                  style={{
                    marginTop: scale(6),
                    fontFamily: FONTS.regular,
                    fontSize: scale(11),
                    color: COLORS.textLight,
                  }}>
                  WhatsApp
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={{alignItems: 'center'}}>
                <FacebookShareIcon />
                <Text
                  style={{
                    marginTop: scale(6),
                    fontFamily: FONTS.regular,
                    fontSize: scale(11),
                    color: COLORS.textLight,
                  }}>
                  Facebook
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={{alignItems: 'center'}}>
                <TwitterShareIcon />
                <Text
                  style={{
                    marginTop: scale(6),
                    fontFamily: FONTS.regular,
                    fontSize: scale(11),
                    color: COLORS.textLight,
                  }}>
                  Twitter
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={{alignItems: 'center'}}>
                <EmailShareIcon />
                <Text
                  style={{
                    marginTop: scale(6),
                    fontFamily: FONTS.regular,
                    fontSize: scale(11),
                    color: COLORS.textLight,
                  }}>
                  Email
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default ShareBottomSheet;
