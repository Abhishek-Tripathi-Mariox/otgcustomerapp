import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  InteractionManager,
} from 'react-native';
import {showAppAlert} from '../components/AlertProvider';
import Svg, {Path, Circle, Rect, Line} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {scale, SCREEN_WIDTH} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {useAppDispatch, useAppSelector} from '../store';
import {logoutSuccess} from '../store';
import authService from '../services/authService';

// Menu item icons
const HomeIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Path d="M3 9.5L12 3L21 9.5V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9.5Z" stroke={COLORS.textPrimary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 22V12H15V22" stroke={COLORS.textPrimary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const OrdersIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Path d="M4 4H8L10 8H20L18 16H8L6 4H4" stroke={COLORS.textPrimary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x={3} y={2} width={18} height={20} rx={2} stroke={COLORS.textPrimary} strokeWidth={1.5} />
    <Line x1={7} y1={7} x2={17} y2={7} stroke={COLORS.textPrimary} strokeWidth={1.5} strokeLinecap="round" />
    <Line x1={7} y1={11} x2={17} y2={11} stroke={COLORS.textPrimary} strokeWidth={1.5} strokeLinecap="round" />
    <Line x1={7} y1={15} x2={13} y2={15} stroke={COLORS.textPrimary} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const AddressIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke={COLORS.textPrimary} strokeWidth={1.5} />
    <Circle cx={12} cy={9} r={3} stroke={COLORS.textPrimary} strokeWidth={1.5} />
  </Svg>
);

const AboutIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={COLORS.textPrimary} strokeWidth={1.5} />
    <Path d="M12 16V12M12 8H12.01" stroke={COLORS.textPrimary} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const PrivacyIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke={COLORS.textPrimary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x={6} y={6} width={12} height={14} rx={1} stroke={COLORS.textPrimary} strokeWidth={1.5} />
    <Line x1={9} y1={10} x2={15} y2={10} stroke={COLORS.textPrimary} strokeWidth={1.5} strokeLinecap="round" />
    <Line x1={9} y1={14} x2={13} y2={14} stroke={COLORS.textPrimary} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const HelpIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={COLORS.textPrimary} strokeWidth={1.5} />
    <Path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke={COLORS.textPrimary} strokeWidth={1.5} strokeLinecap="round" />
    <Circle cx={12} cy={17} r={0.5} fill={COLORS.textPrimary} stroke={COLORS.textPrimary} strokeWidth={0.5} />
  </Svg>
);

const SettingsIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={3} stroke={COLORS.textPrimary} strokeWidth={1.5} />
    <Path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.988C9.5799 19.718 9.31074 19.5117 9 19.395C8.69838 19.2619 8.36381 19.2222 8.03941 19.281C7.71502 19.3398 7.41568 19.4945 7.18 19.725L7.12 19.785C6.93425 19.971 6.71368 20.1185 6.47088 20.2191C6.22808 20.3198 5.96783 20.3716 5.705 20.3716C5.44217 20.3716 5.18192 20.3198 4.93912 20.2191C4.69632 20.1185 4.47575 19.971 4.29 19.785C4.10405 19.5993 3.95653 19.3787 3.85588 19.1359C3.75523 18.8931 3.70343 18.6328 3.70343 18.37C3.70343 18.1072 3.75523 17.8469 3.85588 17.6041C3.95653 17.3613 4.10405 17.1407 4.29 16.955L4.35 16.895C4.58054 16.6593 4.73519 16.36 4.794 16.0356C4.85282 15.7112 4.81312 15.3766 4.68 15.075C4.55324 14.7792 4.34276 14.527 4.07447 14.3493C3.80618 14.1716 3.49179 14.0763 3.17 14.075H3C2.46957 14.075 1.96086 13.8643 1.58579 13.4892C1.21071 13.1141 1 12.6054 1 12.075C1 11.5446 1.21071 11.0359 1.58579 10.6608C1.96086 10.2857 2.46957 10.075 3 10.075H3.09C3.42099 10.0673 3.742 9.96012 4.012 9.76751C4.28201 9.5749 4.4883 9.30574 4.605 8.995" stroke={COLORS.textPrimary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LogoutIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke={COLORS.error} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 17L21 12L16 7M21 12H9" stroke={COLORS.error} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EditPenIcon = () => (
  <Svg width={scale(14)} height={scale(14)} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke={COLORS.textPrimary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10218 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke={COLORS.textPrimary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  route?: string;
  cmsSlug?: string;
  isLogout?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  {icon: <HomeIcon />, label: 'Home', route: 'Home'},
  {icon: <OrdersIcon />, label: 'Orders', route: 'MyOrders'},
  {icon: <OrdersIcon />, label: 'My Quotations', route: 'MyQuotations'},
  {icon: <AddressIcon />, label: 'Change address', route: 'SavedAddress'},
  {icon: <AboutIcon />, label: 'About Us', cmsSlug: 'about-us'},
  {icon: <PrivacyIcon />, label: 'Privacy Policy', cmsSlug: 'privacy-policy'},
  {icon: <PrivacyIcon />, label: 'Terms & Conditions', cmsSlug: 'terms-conditions'},
  {icon: <HelpIcon />, label: 'Help', route: 'Help'},
  {icon: <SettingsIcon />, label: 'Settings', route: 'Settings'},
  {icon: <LogoutIcon />, label: 'Logout', isLogout: true},
];

interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
  navigation?: any;
}

const SideDrawer: React.FC<SideDrawerProps> = ({visible, onClose, navigation}) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.app.user);
  const displayName = user?.name?.trim() || 'Guest';
  const displayMobile = user?.mobile ? `+91 ${user.mobile}` : '';

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Continue with local logout even if API call fails
    }
    await AsyncStorage.removeItem('userToken');
    dispatch(logoutSuccess());
    navigation?.reset({index: 0, routes: [{name: 'Login'}]});
  };

  const handleMenuPress = (item: MenuItem) => {
    if (item.isLogout) {
      showAppAlert({
        title: 'Logout',
        message: 'Are you sure you want to logout?',
        buttons: [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Logout', style: 'destructive', onPress: handleLogout},
        ],
      });
      return;
    }

    // Close the drawer first, then navigate once its dismissal has settled.
    // Dispatching navigation while this Modal is still tearing down gets
    // swallowed on Android, which made entries like "Settings" appear to do
    // nothing when tapped.
    onClose();
    InteractionManager.runAfterInteractions(() => {
      if (item.route) {
        navigation?.navigate(item.route);
      } else if (item.cmsSlug) {
        navigation?.navigate('CmsPage', {slug: item.cmsSlug, title: item.label});
      }
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={{flex: 1, flexDirection: 'row'}}>
        {/* Drawer content */}
        <View
          style={{
            width: SCREEN_WIDTH * 0.75,
            backgroundColor: COLORS.backgroundWhite,
            paddingTop: scale(50),
            paddingHorizontal: scale(20),
          }}>
          {/* Profile section */}
          <TouchableOpacity
            onPress={() => { onClose(); navigation?.navigate('EditProfile'); }}
            style={{flexDirection: 'row', alignItems: 'center', marginBottom: scale(30)}}>
            <View
              style={{
                width: scale(50),
                height: scale(50),
                borderRadius: scale(25),
                backgroundColor: COLORS.divider,
                overflow: 'hidden',
              }}>
              {user?.profileImage ? (
                <Image
                  source={{uri: user.profileImage}}
                  style={{width: scale(50), height: scale(50), borderRadius: scale(25)}}
                />
              ) : (
                <View style={{
                  width: scale(50),
                  height: scale(50),
                  borderRadius: scale(25),
                  backgroundColor: COLORS.grayCircle,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Svg width={scale(30)} height={scale(30)} viewBox="0 0 24 24" fill="none">
                    <Circle cx={12} cy={8} r={5} fill={COLORS.textSecondary} />
                    <Path d="M4 20C4 16 8 14 12 14C16 14 20 16 20 20" fill={COLORS.textSecondary} />
                  </Svg>
                </View>
              )}
            </View>
            <View style={{marginLeft: scale(12), flex: 1}}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: scale(6)}}>
                <Text
                  numberOfLines={1}
                  style={{fontFamily: FONTS.semiBold, fontSize: scale(16), color: COLORS.textPrimary, maxWidth: scale(140)}}>
                  {displayName}
                </Text>
                <EditPenIcon />
              </View>
              {displayMobile ? (
                <Text style={{fontFamily: FONTS.regular, fontSize: scale(12), color: COLORS.textSecondary}}>
                  {displayMobile}
                </Text>
              ) : null}
              {user?.email ? (
                <Text
                  numberOfLines={1}
                  style={{fontFamily: FONTS.regular, fontSize: scale(11), color: COLORS.textSecondary, maxWidth: scale(180)}}>
                  {user.email}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>

          {/* Menu items */}
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleMenuPress(item)}
              activeOpacity={0.6}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                height: scale(52),
                gap: scale(14),
                borderTopWidth: item.isLogout ? 1 : 0,
                borderTopColor: COLORS.divider,
                marginTop: item.isLogout ? scale(8) : 0,
                paddingTop: item.isLogout ? scale(8) : 0,
              }}>
              <View
                style={{
                  width: scale(28),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {item.icon}
              </View>
              <Text
                style={{
                  flex: 1,
                  fontFamily: FONTS.regular,
                  fontSize: scale(15),
                  color: item.isLogout ? COLORS.error : COLORS.textPrimary,
                }}>
                {item.label}
              </Text>
              {!item.isLogout && (
                <Svg width={scale(16)} height={scale(16)} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9 6L15 12L9 18"
                    stroke={COLORS.textSecondary}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Overlay to close */}
        <TouchableOpacity
          style={{flex: 1, backgroundColor: COLORS.backgroundOverlay}}
          activeOpacity={1}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
};

export default SideDrawer;
