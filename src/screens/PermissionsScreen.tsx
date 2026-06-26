import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  PermissionsAndroid,
  Platform,
  Linking,
} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';

// --- Icons ---

const LocationIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
      fill={COLORS.primary}
    />
  </Svg>
);

const NotificationIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
      fill={COLORS.primary}
    />
  </Svg>
);

const CameraIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"
      fill={COLORS.primary}
    />
    <Path
      d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"
      fill={COLORS.primary}
    />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={12} fill={COLORS.success} />
    <Path
      d="M9.5 15.5l-3-3 1.41-1.41L9.5 12.67l5.59-5.59L16.5 8.5l-7 7z"
      fill="#fff"
    />
  </Svg>
);

interface PermissionItem {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  androidPermission: string;
}

const PERMISSION_ITEMS: PermissionItem[] = [
  {
    key: 'location',
    title: 'Location',
    description: 'To find nearby stores and estimate delivery to your address',
    icon: <LocationIcon />,
    androidPermission: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  },
  {
    key: 'notification',
    title: 'Notifications',
    description: 'To keep you updated on orders, offers and delivery status',
    icon: <NotificationIcon />,
    androidPermission: PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  },
  {
    key: 'camera',
    title: 'Camera',
    description: 'To update your profile photo',
    icon: <CameraIcon />,
    androidPermission: PermissionsAndroid.PERMISSIONS.CAMERA,
  },
];

const PermissionsScreen: React.FC<{navigation?: any}> = ({navigation}) => {
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});

  const checkAllPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      // iOS handles permissions at point of use
      navigation?.replace('Home');
      return;
    }

    const results: Record<string, boolean> = {};
    for (const item of PERMISSION_ITEMS) {
      try {
        results[item.key] = await PermissionsAndroid.check(
          item.androidPermission as any,
        );
      } catch {
        results[item.key] = false;
      }
    }
    setStatuses(results);
  }, [navigation]);

  useEffect(() => {
    checkAllPermissions();
  }, [checkAllPermissions]);

  const handleRequestPermission = async (item: PermissionItem) => {
    if (Platform.OS !== 'android') return;

    try {
      const result = await PermissionsAndroid.request(
        item.androidPermission as any,
        {
          title: `${item.title} Permission`,
          message: item.description,
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );

      if (result === 'never_ask_again') {
        Linking.openSettings();
        return;
      }

      setStatuses(prev => ({
        ...prev,
        [item.key]: result === PermissionsAndroid.RESULTS.GRANTED,
      }));
    } catch {
      // ignore
    }
  };

  const allGranted = PERMISSION_ITEMS.every(item => statuses[item.key]);

  const handleContinue = () => {
    navigation?.replace('Home');
  };

  return (
    <View style={{flex: 1, backgroundColor: COLORS.backgroundWhite}}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.backgroundWhite}
      />

      {/* Header */}
      <View
        style={{
          paddingTop: scale(60),
          paddingHorizontal: scale(24),
          paddingBottom: scale(16),
        }}>
        <Text
          style={{
            fontFamily: FONTS.semiBold,
            fontSize: scale(24),
            color: COLORS.textPrimary,
          }}>
          App Permissions
        </Text>
        <Text
          style={{
            fontFamily: FONTS.regular,
            fontSize: scale(13),
            color: COLORS.textLight,
            marginTop: scale(6),
            lineHeight: scale(20),
          }}>
          We need a few permissions to give you the best experience
        </Text>
      </View>

      {/* Permission cards */}
      <View
        style={{flex: 1, paddingHorizontal: scale(24), paddingTop: scale(20)}}>
        {PERMISSION_ITEMS.map(item => (
          <View
            key={item.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.backgroundWhite,
              borderRadius: scale(16),
              padding: scale(16),
              marginBottom: scale(12),
              shadowColor: 'rgba(159,159,159,0.15)',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 1,
              shadowRadius: 12,
              elevation: 4,
            }}>
            {/* Icon */}
            <View
              style={{
                width: scale(50),
                height: scale(50),
                borderRadius: scale(25),
                backgroundColor: COLORS.backgroundLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {item.icon}
            </View>

            {/* Text */}
            <View style={{flex: 1, marginLeft: scale(14)}}>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(15),
                  color: COLORS.textPrimary,
                }}>
                {item.title}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(11),
                  color: COLORS.textLight,
                  marginTop: scale(2),
                  lineHeight: scale(16),
                }}>
                {item.description}
              </Text>
            </View>

            {/* Action button */}
            {statuses[item.key] ? (
              <CheckIcon />
            ) : (
              <TouchableOpacity
                onPress={() => handleRequestPermission(item)}
                style={{
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: scale(14),
                  paddingVertical: scale(8),
                  borderRadius: scale(10),
                }}>
                <Text
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: scale(12),
                    color: COLORS.textPrimary,
                  }}>
                  Allow
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Continue button */}
      <View style={{paddingHorizontal: scale(36), paddingBottom: scale(40)}}>
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.8}
          style={{
            height: scale(60),
            backgroundColor: allGranted ? COLORS.primary : COLORS.grayBg,
            borderRadius: scale(19),
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: scale(18),
              color: COLORS.textPrimary,
              letterSpacing: 0.5,
            }}>
            {allGranted ? 'Continue' : 'Skip for now'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PermissionsScreen;
