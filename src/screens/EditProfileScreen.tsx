import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {showAppAlert} from '../components/AlertProvider';
let Geolocation: any = null;
try {
  Geolocation = require('react-native-geolocation-service').default;
} catch {}
import axios from 'axios';
import Svg, {Path, Circle, Line, Rect, G, ClipPath, Defs, Mask} from 'react-native-svg';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {scale, SCREEN_WIDTH} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {ScreenHeader, PrimaryButton, AppAlert} from '../components';
import type {AppAlertVariant} from '../components/AppAlert';
import {
  useAppSelector,
  useAppDispatch,
  updateUser,
  syncUserAddressToSavedAddresses,
} from '../store';
import authService from '../services/authService';

// Profile avatar placeholder
const ProfileAvatarIcon = () => (
  <Svg width={scale(90)} height={scale(90)} viewBox="0 0 90 90" fill="none">
    <Circle cx={45} cy={45} r={44} fill={COLORS.grayCircle} />
    <Circle cx={45} cy={36} r={14} fill={COLORS.textSecondary} />
    <Path d="M20 72C20 60 30 52 45 52C60 52 70 60 70 72" fill={COLORS.textSecondary} />
  </Svg>
);

// Camera icon for photo
const CameraEditIcon = () => (
  <Svg width={scale(28)} height={scale(28)} viewBox="0 0 28 28" fill="none">
    <Circle cx={14} cy={14} r={13} fill={COLORS.textPrimary} stroke={COLORS.textWhite} strokeWidth={2} />
    <Path d="M10.5 11H10C9.45 11 9 11.45 9 12V18C9 18.55 9.45 19 10 19H18C18.55 19 19 18.55 19 18V12C19 11.45 18.55 11 18 11H17.5L16.5 10H11.5L10.5 11Z" stroke={COLORS.textWhite} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={14} cy={15} r={2} stroke={COLORS.textWhite} strokeWidth={1.2} />
  </Svg>
);

// Form field icons
const PersonIcon = () => (
  <Svg width={scale(18)} height={scale(18)} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke={COLORS.textSecondary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={12} cy={7} r={4} stroke={COLORS.textSecondary} strokeWidth={1.5} />
  </Svg>
);

const FlagIcon = () => (
  <Svg width={scale(24)} height={scale(16)} viewBox="0 0 24 16" fill="none">
    <Rect width={24} height={5.33} fill="#FF9933" />
    <Rect y={5.33} width={24} height={5.33} fill="white" />
    <Rect y={10.67} width={24} height={5.33} fill="#138808" />
    <Circle cx={12} cy={8} r={2} fill="#000080" />
  </Svg>
);

const EmailIcon = () => (
  <Svg width={scale(18)} height={scale(18)} viewBox="0 0 24 24" fill="none">
    <Path d="M4 6H20V18H4V6Z" stroke={COLORS.textSecondary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 6L12 13L20 6" stroke={COLORS.textSecondary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LocationIcon = () => (
  <Svg width={scale(18)} height={scale(18)} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke={COLORS.textSecondary} strokeWidth={1.5} />
    <Circle cx={12} cy={9} r={2.5} stroke={COLORS.textSecondary} strokeWidth={1.5} />
  </Svg>
);

const CityIcon = () => (
  <Svg width={scale(18)} height={scale(18)} viewBox="0 0 24 24" fill="none">
    <Path d="M3 21H21M5 21V7L13 3V21M13 21V7L19 10V21" stroke={COLORS.textSecondary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 10H10M8 14H10" stroke={COLORS.textSecondary} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const StateIcon = () => (
  <Svg width={scale(18)} height={scale(18)} viewBox="0 0 24 24" fill="none">
    <Path d="M3 21L12 3L21 21H3Z" stroke={COLORS.textSecondary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 17V14M12 11H12.01" stroke={COLORS.textSecondary} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const PincodeIcon = () => (
  <Svg width={scale(18)} height={scale(18)} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={10} r={3} stroke={COLORS.textSecondary} strokeWidth={1.5} />
    <Path d="M12 2C7.58 2 4 5.58 4 10C4 15.54 12 22 12 22C12 22 20 15.54 20 10C20 5.58 16.42 2 12 2Z" stroke={COLORS.textSecondary} strokeWidth={1.5} />
  </Svg>
);

// Bottom nav icons (same as HomeScreen)
const OrdersIcon = () => (
  <Svg width={scale(25)} height={scale(25)} viewBox="0 0 25 25" fill="none">
    <G clipPath="url(#clip_orders_ep)">
      <Mask id="mask_orders_ep" maskUnits="userSpaceOnUse" x={-1} y={0} width={25} height={25}>
        <Path d="M-0.010498 0.500002H23.9895V24.5H-0.010498V0.500002Z" fill={COLORS.backgroundWhite} />
      </Mask>
      <G mask="url(#mask_orders_ep)">
        <Path d="M16.302 1.4375H7.677C5.08814 1.4375 2.9895 3.53614 2.9895 6.125V18.875C2.9895 21.4639 5.08814 23.5625 7.677 23.5625H16.302C18.8909 23.5625 20.9895 21.4639 20.9895 18.875V6.125C20.9895 3.53614 18.8909 1.4375 16.302 1.4375Z" stroke={COLORS.textPrimary} strokeWidth={2} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M16.1145 5.09375C16.1145 6.38816 15.0652 7.4375 13.7708 7.4375H10.2083C8.91385 7.4375 7.8645 6.38816 7.8645 5.09375" stroke={COLORS.textPrimary} strokeWidth={2} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M13.5833 13.5781H16.7708" stroke={COLORS.textPrimary} strokeWidth={2} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M13.5833 18.4062H16.7708" stroke={COLORS.textPrimary} strokeWidth={2} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M7.20825 12.4063L8.08013 13.2942C8.45546 13.6728 9.06403 13.6728 9.43941 13.2942L11.2395 11.4688" stroke={COLORS.textPrimary} strokeWidth={2} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M7.20825 17.2344L8.08013 18.1223C8.45546 18.5009 9.06403 18.5009 9.43941 18.1223L11.2395 16.2969" stroke={COLORS.textPrimary} strokeWidth={2} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      </G>
    </G>
    <Defs>
      <ClipPath id="clip_orders_ep"><Rect width={25} height={25} fill={COLORS.backgroundWhite} /></ClipPath>
    </Defs>
  </Svg>
);

const NavCartIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <G clipPath="url(#clip_cart_ep)">
      <Path d="M13.875 15.75H8.313C8.139 15.75 7.989 15.6315 7.9485 15.462L5.4885 5.0235C5.2065 3.8325 4.1565 3 2.9325 3H1.125C0.504 3 0 3.504 0 4.125C0 4.746 0.504 5.25 1.125 5.25H2.9325C3.108 5.25 3.258 5.3685 3.2985 5.538L5.7585 15.9765C6.0375 17.1675 7.089 18 8.313 18H13.875C14.4975 18 15 17.496 15 16.875C15 16.254 14.4975 15.75 13.875 15.75Z" fill={COLORS.textPrimary} />
      <Path d="M23.2065 6.04946C22.6125 5.86946 21.984 6.19946 21.7995 6.79346L19.125 15.4845C19.0755 15.642 18.9315 15.75 18.7665 15.75H17.625C17.004 15.75 16.5 16.254 16.5 16.875C16.5 17.496 17.004 18 17.625 18H18.7665C19.926 18 20.934 17.2545 21.276 16.1475L23.9505 7.45646C24.1335 6.86246 23.8005 6.23246 23.2065 6.04946Z" fill={COLORS.textPrimary} />
      <Path d="M9.75 19.5C8.5095 19.5 7.5 20.5095 7.5 21.75C7.5 22.9905 8.5095 24 9.75 24C10.9905 24 12 22.9905 12 21.75C12 20.5095 10.9905 19.5 9.75 19.5Z" fill={COLORS.textPrimary} />
      <Path d="M17.25 19.5C16.0095 19.5 15 20.5095 15 21.75C15 22.9905 16.0095 24 17.25 24C18.4905 24 19.5 22.9905 19.5 21.75C19.5 20.5095 18.4905 19.5 17.25 19.5Z" fill={COLORS.textPrimary} />
      <Path d="M10.125 5.625H12.375V7.875C12.375 8.496 12.879 9 13.5 9C14.121 9 14.625 8.496 14.625 7.875V5.625H16.875C17.496 5.625 18 5.121 18 4.5C18 3.879 17.496 3.375 16.875 3.375H14.625V1.125C14.625 0.504 14.121 0 13.5 0C12.879 0 12.375 0.504 12.375 1.125V3.375H10.125C9.504 3.375 9 3.879 9 4.5C9 5.121 9.504 5.625 10.125 5.625Z" fill={COLORS.textPrimary} />
    </G>
    <Defs>
      <ClipPath id="clip_cart_ep"><Rect width={24} height={24} fill={COLORS.backgroundWhite} /></ClipPath>
    </Defs>
  </Svg>
);

const QuotesIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Path d="M5.76 4.90503C3 4.90503 0.75 7.17753 0.75 9.96753C0.75 11.865 1.7775 13.5675 3.405 14.4375C3.3225 15.3225 2.955 17.205 1.4475 17.6175C1.0875 17.715 0.855 18.06 0.9 18.4275C0.945 18.795 1.245 19.08 1.62 19.0875H1.7325C2.4675 19.0875 6.5025 18.9225 9.1125 15.42C10.8075 13.1475 11.31 10.68 10.5375 8.50503C9.8925 6.35253 7.9725 4.90503 5.76 4.90503ZM7.905 14.5275C6.81 15.9975 5.3775 16.7625 4.1625 17.16C4.935 15.735 4.935 14.07 4.935 13.965C4.935 13.665 4.7475 13.3875 4.4625 13.275C3.12 12.735 2.25 11.43 2.25 9.96753C2.25 8.00253 3.825 6.40503 5.76 6.40503C7.305 6.40503 8.6475 7.42503 9.1125 8.97003C9.9375 11.2875 8.715 13.44 7.9125 14.52L7.905 14.5275Z" fill={COLORS.textPrimary} />
    <Path d="M22.9049 8.51248C22.2599 6.35998 20.3399 4.91248 18.1274 4.91248C15.3674 4.91248 13.1174 7.18498 13.1174 9.97498C13.1174 11.8725 14.1449 13.575 15.7724 14.445C15.6899 15.33 15.3224 17.2125 13.8149 17.625C13.4549 17.7225 13.2224 18.0675 13.2674 18.435C13.3124 18.8025 13.6124 19.0875 13.9874 19.095H14.0999C14.8349 19.095 18.8699 18.93 21.4799 15.4275C23.1749 13.155 23.6774 10.6875 22.9049 8.51248ZM20.2724 14.5275C19.1774 15.9975 17.7449 16.7625 16.5299 17.16C17.3024 15.735 17.3024 14.07 17.3024 13.965C17.3024 13.665 17.1149 13.3875 16.8299 13.275C15.4874 12.735 14.6174 11.43 14.6174 9.96748C14.6174 8.00248 16.1924 6.40498 18.1274 6.40498C19.6724 6.40498 21.0149 7.42498 21.4799 8.96998C22.3049 11.2875 21.0824 13.44 20.2799 14.52L20.2724 14.5275Z" fill={COLORS.textPrimary} />
  </Svg>
);

const NavProfileIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Path d="M12 23.25C9.77497 23.25 7.59989 22.5902 5.74984 21.354C3.89979 20.1179 2.45785 18.3609 1.60636 16.3052C0.754875 14.2495 0.532087 11.9875 0.966171 9.80524C1.40025 7.62295 2.47171 5.61839 4.04505 4.04505C5.61839 2.47171 7.62295 1.40025 9.80524 0.966171C11.9875 0.532087 14.2495 0.754875 16.3052 1.60636C18.3609 2.45785 20.1179 3.89979 21.354 5.74984C22.5902 7.59989 23.25 9.77497 23.25 12C23.2466 14.9827 22.0603 17.8422 19.9512 19.9512C17.8422 22.0603 14.9827 23.2466 12 23.25ZM12 2.25001C10.0716 2.25001 8.18657 2.82183 6.5832 3.89318C4.97982 4.96452 3.73013 6.48726 2.99218 8.26884C2.25423 10.0504 2.06114 12.0108 2.43735 13.9021C2.81355 15.7935 3.74215 17.5307 5.10571 18.8943C6.46928 20.2579 8.20656 21.1865 10.0979 21.5627C11.9892 21.9389 13.9496 21.7458 15.7312 21.0078C17.5127 20.2699 19.0355 19.0202 20.1068 17.4168C21.1782 15.8134 21.75 13.9284 21.75 12C21.747 9.41506 20.7188 6.93684 18.891 5.109C17.0632 3.28117 14.585 2.25298 12 2.25001Z" fill={COLORS.textPrimary} />
    <Path d="M12 12.75C11.3325 12.75 10.68 12.5521 10.125 12.1812C9.56994 11.8104 9.13735 11.2833 8.88191 10.6666C8.62646 10.0499 8.55963 9.37126 8.68985 8.71657C8.82008 8.06189 9.14151 7.46052 9.61352 6.98852C10.0855 6.51651 10.6869 6.19508 11.3416 6.06485C11.9963 5.93463 12.6749 6.00146 13.2916 6.25691C13.9083 6.51235 14.4354 6.94494 14.8062 7.49995C15.1771 8.05497 15.375 8.70749 15.375 9.375C15.374 10.2698 15.0181 11.1277 14.3854 11.7604C13.7527 12.3931 12.8948 12.749 12 12.75ZM12 7.5C11.6292 7.5 11.2666 7.60997 10.9583 7.816C10.65 8.02202 10.4096 8.31486 10.2677 8.65747C10.1258 9.00008 10.0887 9.37708 10.161 9.7408C10.2334 10.1045 10.412 10.4386 10.6742 10.7008C10.9364 10.9631 11.2705 11.1416 11.6342 11.214C11.9979 11.2863 12.3749 11.2492 12.7175 11.1073C13.0601 10.9654 13.353 10.725 13.559 10.4167C13.765 10.1084 13.875 9.74584 13.875 9.375C13.875 8.87772 13.6775 8.40081 13.3258 8.04918C12.9742 7.69755 12.4973 7.5 12 7.5Z" fill={COLORS.textPrimary} />
    <Path d="M16.5001 17.25C16.3012 17.2499 16.1104 17.1709 15.9698 17.0302C14.9156 15.9801 13.4881 15.3904 12.0001 15.3904C10.512 15.3904 9.08457 15.9801 8.03031 17.0302C7.88886 17.1669 7.69941 17.2425 7.50276 17.2407C7.30611 17.239 7.118 17.1602 6.97895 17.0211C6.83989 16.882 6.76101 16.6939 6.75931 16.4973C6.7576 16.3006 6.83319 16.1112 6.96981 15.9697C8.30536 14.6384 10.1143 13.8907 12.0001 13.8907C13.8859 13.8907 15.6948 14.6384 17.0303 15.9697C17.1352 16.0746 17.2066 16.2082 17.2355 16.3537C17.2644 16.4992 17.2496 16.65 17.1928 16.787C17.1361 16.924 17.04 17.0411 16.9167 17.1235C16.7933 17.206 16.6484 17.25 16.5001 17.25Z" fill={COLORS.textPrimary} />
  </Svg>
);

const HomeIcon = () => (
  <Svg width={scale(26)} height={scale(25)} viewBox="0 0 26 25" fill="none">
    <Path d="M22.5651 6.02286L15.3642 0.984787C13.4015 -0.390369 10.3887 -0.31536 8.50096 1.14731L2.23775 6.03536C0.987612 7.01047 0 9.01069 0 10.5859V19.2118C0 22.3997 2.58779 25 5.77565 25H19.2522C22.44 25 25.0278 22.4122 25.0278 19.2243V10.7484C25.0278 9.0607 23.9402 6.98547 22.5651 6.02286ZM13.4515 19.9994C13.4515 20.512 13.0265 20.937 12.5139 20.937C12.0014 20.937 11.5763 20.512 11.5763 19.9994V16.249C11.5763 15.7365 12.0014 15.3114 12.5139 15.3114C13.0265 15.3114 13.4515 15.7365 13.4515 16.249V19.9994Z" fill={COLORS.yellowIcon} />
  </Svg>
);

const EditProfileScreen: React.FC<{navigation?: any}> = ({navigation}) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.app.user);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [selectedImageAsset, setSelectedImageAsset] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    variant?: AppAlertVariant;
    onPrimary?: () => void;
  }>({visible: false, title: ''});

  const showAlert = (
    title: string,
    message?: string,
    variant: AppAlertVariant = 'info',
    onPrimary?: () => void,
  ) => setAlertState({visible: true, title, message, variant, onPrimary});

  const closeAlert = () => setAlertState(s => ({...s, visible: false}));

  // Load user data from Redux store
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setStreet(user.address?.street || '');
      setCity(user.address?.city || '');
      setStateName(user.address?.state || '');
      setPincode(user.address?.pincode || '');
      setProfileImageUri(user.profileImage || null);
      if (user.address?.location?.coordinates) {
        setLongitude(user.address.location.coordinates[0] || null);
        setLatitude(user.address.location.coordinates[1] || null);
      }
    }
  }, []);

  const handleUseMyLocation = async () => {
    setFetchingLocation(true);
    try {
      // Request permission on Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          showAlert('Permission Denied', 'Location permission is required to auto-fill address', 'error');
          setFetchingLocation(false);
          return;
        }
      }

      if (!Geolocation) {
        setFetchingLocation(false);
        showAlert('Error', 'Location service not available. Please rebuild the app.', 'error');
        return;
      }

      Geolocation.getCurrentPosition(
        async position => {
          const {latitude: lat, longitude: lon} = position.coords;
          setLatitude(lat);
          setLongitude(lon);

          // Reverse geocode using OpenStreetMap Nominatim (free, no API key)
          try {
            const res = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
              {headers: {'User-Agent': 'OTGCustomerApp/1.0'}},
            );
            const addr = res.data?.address;
            if (addr) {
              setStreet(
                [addr.road, addr.neighbourhood, addr.suburb]
                  .filter(Boolean)
                  .join(', '),
              );
              setCity(addr.city || addr.town || addr.village || addr.county || '');
              setStateName(addr.state || '');
              setPincode(addr.postcode || '');
            }
          } catch {
            // Geocoding failed but we still have lat/lon
            showAlert('Note', 'Got your location but could not fetch address. Please fill manually.', 'info');
          }
          setFetchingLocation(false);
        },
        error => {
          setFetchingLocation(false);
          showAlert('Location Error', error.message || 'Could not get your location', 'error');
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    } catch {
      setFetchingLocation(false);
      showAlert('Error', 'Something went wrong while fetching location', 'error');
    }
  };

  const imagePickerOptions = {
    mediaType: 'photo' as const,
    quality: 0.6 as const,
    maxWidth: 800,
    maxHeight: 800,
    includeBase64: true,
  };

  const handleImageResponse = (response: any) => {
    if (response.didCancel || response.errorCode) return;
    const asset = response.assets?.[0];
    if (asset?.uri) {
      console.log('=== Picked image ===');
      console.log('uri:', asset.uri);
      console.log('type:', asset.type);
      console.log('fileName:', asset.fileName);
      console.log('fileSize:', asset.fileSize);
      setProfileImageUri(asset.uri);
      setSelectedImageAsset(asset);
    }
  };

  const handlePickImage = () => {
    showAppAlert({
      title: 'Profile Photo',
      message: 'Choose an option',
      buttons: [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Camera',
          onPress: () => launchCamera(imagePickerOptions, handleImageResponse),
        },
        {
          text: 'Gallery',
          style: 'primary',
          onPress: () => launchImageLibrary(imagePickerOptions, handleImageResponse),
        },
      ],
    });
  };

  const handleSave = async () => {
    const missing: string[] = [];
    if (!name.trim()) missing.push('Full Name');
    if (!email.trim()) missing.push('Email');

    if (missing.length > 0) {
      showAlert('Required fields', `Please fill: ${missing.join(', ')}`, 'error');
      return;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) {
      showAlert('Invalid Email', 'Please enter a valid email address', 'error');
      return;
    }
    if (pincode.trim() && !/^\d{6}$/.test(pincode.trim())) {
      showAlert('Invalid Pincode', 'Pincode must be 6 digits', 'error');
      return;
    }

    setSaving(true);
    try {
      let data: FormData | Record<string, any>;

      const addressObj: Record<string, string> = {};
      if (street.trim()) addressObj.street = street.trim();
      if (city.trim()) addressObj.city = city.trim();
      if (stateName.trim()) addressObj.state = stateName.trim();
      if (pincode.trim()) addressObj.pincode = pincode.trim();
      const hasAddress = Object.keys(addressObj).length > 0;

      if (selectedImageAsset?.base64) {
        const inferredType =
          selectedImageAsset.type || 'image/jpeg';
        data = {
          name: name.trim(),
          email: email.trim(),
          ...(hasAddress ? {address: addressObj} : {}),
          profileImageBase64: selectedImageAsset.base64,
          profileImageType: inferredType,
        };
      } else {
        data = {
          name: name.trim(),
          email: email.trim(),
          ...(hasAddress ? {address: addressObj} : {}),
        };
      }

      const res = await authService.updateProfile(data);
      if (res.data.success) {
        // Update Redux store with new user data
        const updatedUser = res.data.data;
        dispatch(
          updateUser({
            name: updatedUser.name,
            email: updatedUser.email,
            profileImage: updatedUser.profileImage,
            address: updatedUser.address,
          }),
        );
        if (updatedUser.address) {
          dispatch(syncUserAddressToSavedAddresses(updatedUser.address));
        }
        showAlert('Success', 'Profile updated successfully', 'success', () => {
          closeAlert();
          navigation?.goBack();
        });
      }
    } catch (err: any) {
      console.log('=== Profile update error ===');
      console.log('message:', err?.message);
      console.log('code:', err?.code);
      console.log('status:', err?.response?.status);
      console.log('data:', JSON.stringify(err?.response?.data));
      console.log('config.url:', err?.config?.url);
      console.log('config.baseURL:', err?.config?.baseURL);
      console.log('config.method:', err?.config?.method);
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      const isNetworkError =
        err?.message === 'Network Error' ||
        err?.message === 'Network request failed' ||
        err?.code === 'ERR_NETWORK' ||
        err?.code === 'ETIMEDOUT';
      const baseMsg =
        serverMsg ||
        (isNetworkError
          ? 'Cannot reach server. Check Wi-Fi and that backend is running on the same network.'
          : err?.message) ||
        'Failed to update profile';
      const debugBits = [
        status ? `status: ${status}` : null,
        err?.code ? `code: ${err.code}` : null,
        selectedImageAsset ? 'with image' : 'no image',
      ].filter(Boolean);
      const msg = debugBits.length
        ? `${baseMsg}\n\n(${debugBits.join(' · ')})`
        : baseMsg;
      showAlert('Error', msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
      <ScreenHeader title="Edit Profile" onBack={() => navigation?.goBack()} />

      <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom: scale(120)}}>
        {/* Profile Photo */}
        <View style={{alignItems: 'center', marginTop: scale(20)}}>
          <View>
            {profileImageUri ? (
              <Image
                source={{uri: profileImageUri}}
                style={{
                  width: scale(90),
                  height: scale(90),
                  borderRadius: scale(45),
                  backgroundColor: COLORS.grayCircle,
                }}
                onError={() => {
                  console.log('Failed to load profile image:', profileImageUri);
                  setProfileImageUri(null);
                }}
              />
            ) : (
              <ProfileAvatarIcon />
            )}
            <View style={{position: 'absolute', bottom: scale(0), right: scale(0)}}>
              <TouchableOpacity onPress={handlePickImage}>
                <CameraEditIcon />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Name */}
        <View style={{
          marginHorizontal: scale(16),
          marginTop: scale(24),
          height: scale(50),
          borderRadius: scale(10),
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.backgroundWhite,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: scale(12),
        }}>
          <PersonIcon />
          <TextInput
            style={{flex: 1, marginLeft: scale(8), fontFamily: FONTS.regular, fontSize: scale(13), color: COLORS.textPrimary, padding: 0}}
            placeholder="Full Name"
            placeholderTextColor={COLORS.textPlaceholder}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Phone (non-editable) */}
        <View style={{
          marginHorizontal: scale(16),
          marginTop: scale(12),
          height: scale(50),
          borderRadius: scale(10),
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: '#f5f5f5',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: scale(12),
        }}>
          <FlagIcon />
          <Text style={{fontFamily: FONTS.regular, fontSize: scale(13), color: COLORS.textPrimary, marginLeft: scale(4)}}>
            +91
          </Text>
          <Text style={{flex: 1, marginLeft: scale(8), fontFamily: FONTS.regular, fontSize: scale(13), color: COLORS.textSecondary}}>
            {user?.mobile || ''}
          </Text>
        </View>

        {/* Email */}
        <View style={{
          marginHorizontal: scale(16),
          marginTop: scale(12),
          height: scale(50),
          borderRadius: scale(10),
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.backgroundWhite,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: scale(12),
        }}>
          <EmailIcon />
          <TextInput
            style={{flex: 1, marginLeft: scale(8), fontFamily: FONTS.regular, fontSize: scale(13), color: COLORS.textPrimary, padding: 0}}
            placeholder="Email Address"
            placeholderTextColor={COLORS.textPlaceholder}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Use My Location button */}
        <TouchableOpacity
          onPress={handleUseMyLocation}
          disabled={fetchingLocation}
          style={{
            marginHorizontal: scale(16),
            marginTop: scale(16),
            height: scale(44),
            borderRadius: scale(10),
            borderWidth: 1.5,
            borderColor: COLORS.primary,
            backgroundColor: COLORS.backgroundWhite,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {fetchingLocation ? (
            <ActivityIndicator color={COLORS.primary} size="small" />
          ) : (
            <>
              <LocationIcon />
              <Text style={{
                marginLeft: scale(8),
                fontFamily: FONTS.semiBold,
                fontSize: scale(13),
                color: COLORS.primary,
              }}>
                Use My Location
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Address */}
        <View style={{
          marginHorizontal: scale(16),
          marginTop: scale(12),
          height: scale(50),
          borderRadius: scale(10),
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.backgroundWhite,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: scale(12),
        }}>
          <LocationIcon />
          <TextInput
            style={{flex: 1, marginLeft: scale(8), fontFamily: FONTS.regular, fontSize: scale(13), color: COLORS.textPrimary, padding: 0}}
            placeholder="Street Address"
            placeholderTextColor={COLORS.textPlaceholder}
            value={street}
            onChangeText={setStreet}
          />
        </View>

        {/* City */}
        <View style={{
          marginHorizontal: scale(16),
          marginTop: scale(12),
          height: scale(50),
          borderRadius: scale(10),
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.backgroundWhite,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: scale(12),
        }}>
          <CityIcon />
          <TextInput
            style={{flex: 1, marginLeft: scale(8), fontFamily: FONTS.regular, fontSize: scale(13), color: COLORS.textPrimary, padding: 0}}
            placeholder="Enter City"
            placeholderTextColor={COLORS.textPlaceholder}
            value={city}
            onChangeText={setCity}
          />
        </View>

        {/* State */}
        <View style={{
          marginHorizontal: scale(16),
          marginTop: scale(12),
          height: scale(50),
          borderRadius: scale(10),
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.backgroundWhite,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: scale(12),
        }}>
          <StateIcon />
          <TextInput
            style={{flex: 1, marginLeft: scale(8), fontFamily: FONTS.regular, fontSize: scale(13), color: COLORS.textPrimary, padding: 0}}
            placeholder="Enter State"
            placeholderTextColor={COLORS.textPlaceholder}
            value={stateName}
            onChangeText={setStateName}
          />
        </View>

        {/* Pincode */}
        <View style={{
          marginHorizontal: scale(16),
          marginTop: scale(12),
          height: scale(50),
          borderRadius: scale(10),
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.backgroundWhite,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: scale(12),
        }}>
          <PincodeIcon />
          <TextInput
            style={{flex: 1, marginLeft: scale(8), fontFamily: FONTS.regular, fontSize: scale(13), color: COLORS.textPrimary, padding: 0}}
            placeholder="Enter Pincode"
            placeholderTextColor={COLORS.textPlaceholder}
            keyboardType="number-pad"
            value={pincode}
            onChangeText={setPincode}
          />
        </View>

        {/* Save Button */}
        <View style={{marginHorizontal: scale(16), marginTop: scale(24)}}>
          <PrimaryButton
            title={saving ? 'Saving...' : 'Save & Change'}
            onPress={handleSave}
            disabled={saving}
          />
          {saving && (
            <ActivityIndicator
              color={COLORS.primary}
              style={{marginTop: scale(10)}}
            />
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}>
        {/* Center Home button - positioned above the nav bar */}
        <View
          style={{
            alignItems: 'center',
            zIndex: 10,
          }}>
          <View
            style={{
              backgroundColor: COLORS.backgroundWhite,
              borderRadius: scale(36),
              width: scale(72),
              height: scale(72),
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: scale(-36),
            }}>
            <TouchableOpacity
              onPress={() => navigation?.navigate('Home')}
              style={{
                backgroundColor: COLORS.secondary,
                borderRadius: scale(30),
                width: scale(60),
                height: scale(60),
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <HomeIcon />
            </TouchableOpacity>
          </View>
        </View>

        {/* Nav bar with wave cutout shape using SVG */}
        <View style={{position: 'relative'}}>
          {/* SVG wave shape background */}
          <Svg
            width={SCREEN_WIDTH}
            height={scale(85)}
            viewBox={`0 0 ${SCREEN_WIDTH} ${scale(85)}`}
            style={{position: 'absolute', top: 0, left: 0}}>
            <Path
              d={`M0,${scale(25)}
                Q0,0 ${scale(25)},0
                L${SCREEN_WIDTH / 2 - scale(42)},0
                Q${SCREEN_WIDTH / 2 - scale(20)},0 ${SCREEN_WIDTH / 2 - scale(20)},${scale(10)}
                Q${SCREEN_WIDTH / 2 - scale(10)},${scale(36)} ${SCREEN_WIDTH / 2},${scale(36)}
                Q${SCREEN_WIDTH / 2 + scale(10)},${scale(36)} ${SCREEN_WIDTH / 2 + scale(20)},${scale(10)}
                Q${SCREEN_WIDTH / 2 + scale(20)},0 ${SCREEN_WIDTH / 2 + scale(42)},0
                L${SCREEN_WIDTH - scale(25)},0
                Q${SCREEN_WIDTH},0 ${SCREEN_WIDTH},${scale(25)}
                L${SCREEN_WIDTH},${scale(85)}
                L0,${scale(85)} Z`}
              fill={COLORS.primary}
            />
          </Svg>

          {/* Nav items */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              paddingBottom: scale(16),
              paddingTop: scale(14),
              paddingHorizontal: scale(10),
              height: scale(85),
            }}>
            <TouchableOpacity
              onPress={() => navigation?.navigate('MyOrders')}
              style={{alignItems: 'center', flex: 1}}>
              <OrdersIcon />
              <Text
                style={{
                  marginTop: scale(4),
                  fontFamily: FONTS.regular,
                  fontSize: scale(11),
                  color: COLORS.textPrimary,
                }}>
                Orders
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation?.navigate('Cart')}
              style={{alignItems: 'center', flex: 1}}>
              <NavCartIcon />
              <Text
                style={{
                  marginTop: scale(4),
                  fontFamily: FONTS.regular,
                  fontSize: scale(11),
                  color: COLORS.textPrimary,
                }}>
                Cart
              </Text>
            </TouchableOpacity>

            {/* Center spacer for home button */}
            <View
              style={{
                flex: 1,
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(11),
                  color: COLORS.textPrimary,
                }}>
                Home
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation?.navigate('GetQuotation', {isLoggedIn: true})}
              style={{alignItems: 'center', flex: 1}}>
              <QuotesIcon />
              <Text
                style={{
                  marginTop: scale(4),
                  fontFamily: FONTS.regular,
                  fontSize: scale(11),
                  color: COLORS.textPrimary,
                }}>
                Quotes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{alignItems: 'center', flex: 1}}>
              <NavProfileIcon />
              <Text
                style={{
                  marginTop: scale(4),
                  fontFamily: FONTS.regular,
                  fontSize: scale(11),
                  color: COLORS.textPrimary,
                }}>
                Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <AppAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        variant={alertState.variant}
        onPrimary={alertState.onPrimary || closeAlert}
        onDismiss={closeAlert}
      />
    </View>
  );
};

export default EditProfileScreen;
