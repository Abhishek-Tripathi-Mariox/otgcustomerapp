import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  FlatList,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import SideDrawer from './SideDrawer';
import Svg, {
  Path,
  Line,
  Rect,
  G,
  ClipPath,
  Defs,
  Mask,
} from 'react-native-svg';
import SearchBottomSheet from './SearchBottomSheet';
import {scale, SCREEN_WIDTH} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {SearchIcon, PlusIcon, MinusIcon} from '../components/icons';
import {HeaderCartButton, HeaderProfileButton} from '../components';
import {formatCurrency} from '../utils/currency';
import catalogService, {Category, Brand, Material, Banner} from '../services/catalogService';
import {
  useAppSelector,
  useAppDispatch,
  setCurrentLocation,
  addCartItem,
  incrementCartItem,
  decrementCartItem,
  cartItemFromMaterial,
  selectCartItems,
  selectCartTotalQuantity,
  updateUser,
  syncUserAddressToSavedAddresses,
} from '../store';
import authService from '../services/authService';
import orderService, {Order} from '../services/orderService';
import {fetchCurrentLocation} from '../services/locationService';
import BecomeSellerSheet from '../components/BecomeSellerSheet';
import sellerRequestService from '../services/sellerRequestService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SELLER_REQUEST_LOCAL_KEY = 'sellerRequestStatus';

const homeBanner = require('../assets/images/home-banner.png');
const bulkBanner = require('../assets/images/bulk-banner.png');

// Local category tile icons used as a fallback when a category has no
// remote image, so the categories row above the search bar always renders
// with a recognisable icon instead of an empty grey circle.
const CATEGORY_FALLBACK_ICONS = [
  require('../assets/images/cat-rcc.png'),
  require('../assets/images/cat-finishing.png'),
  require('../assets/images/cat-mep.png'),
  require('../assets/images/cat-home-interiors.png'),
  require('../assets/images/cat-site-supplies.png'),
  require('../assets/images/cat-safety.png'),
  require('../assets/images/cat-green-building.png'),
  require('../assets/images/cat-accessories.png'),
];
const categoryFallbackIcon = (index: number) =>
  CATEGORY_FALLBACK_ICONS[index % CATEGORY_FALLBACK_ICONS.length];
const featureDelivery = require('../assets/images/feature-delivery.png');
const featureQuality = require('../assets/images/feature-quality.png');
const featureTracking = require('../assets/images/feature-tracking.png');
const featureSupport = require('../assets/images/feature-support.png');

const FEATURES = [
  {title: 'Assured 2-Hour\nSite Delivery', image: featureDelivery},
  {title: 'Verified Quality\nMaterials', image: featureQuality},
  {title: 'Smart Tracking', image: featureTracking},
  {title: 'Instant Support', image: featureSupport},
];

// Categories the business asked to drop from the home screen during M2 sign-off.
// Matched case-insensitively against the category name.
const HIDDEN_HOME_CATEGORIES = [
  'bulk construction',
  'tools & consumables',
  'tools and consumables',
];

// --- Icon Components (matching Figma assets) ---

// Group 11688.svg - Menu icon (3 yellow lines, different widths)
const MenuIcon = () => (
  <Svg width={scale(26)} height={scale(23)} viewBox="0 0 26 23" fill="none">
    <Line
      x1={11.5}
      y1={1.5}
      x2={1.5}
      y2={1.5}
      stroke={COLORS.yellowIcon}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1={16.5}
      y1={21.5}
      x2={1.5}
      y2={21.5}
      stroke={COLORS.yellowIcon}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1={24.5}
      y1={11.5}
      x2={1.5}
      y2={11.5}
      stroke={COLORS.yellowIcon}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Path 1.svg - Location pin icon (yellow)
const LocationIcon = () => (
  <Svg width={scale(11)} height={scale(13)} viewBox="0 0 11 13" fill="none">
    <Path
      d="M8.88352 1.52252C7.90065 0.540719 6.59426 0 5.20501 0C3.81573 0 2.50935 0.540719 1.52649 1.52255C0.543723 2.5043 0.0016029 3.80994 0 5.20008C0.000998619 6.21202 0.28207 7.16143 0.859244 8.1026C1.35906 8.91757 2.00838 9.62866 2.69581 10.3815C3.36985 11.1196 4.06679 11.8829 4.6234 12.7635C4.71646 12.9107 4.8785 13 5.05266 13H5.35735C5.5315 13 5.69354 12.9107 5.7866 12.7635C6.34321 11.8829 7.04016 11.1196 7.71421 10.3815C8.40164 9.62866 9.05094 8.91757 9.55076 8.10258C10.128 7.1614 10.409 6.21197 10.41 5.19896C10.4084 3.80991 9.86629 2.50428 8.88352 1.52252ZM6.96422 9.69665C6.3649 10.353 5.74823 11.0283 5.20501 11.805C4.66179 11.0283 4.04511 10.353 3.44578 9.69665C2.14277 8.26968 1.01741 7.03726 1.01563 5.20015C1.01827 2.8928 2.89763 1.01562 5.20501 1.01562C7.51238 1.01562 9.39173 2.8928 9.39439 5.19906C9.39261 7.03726 8.26723 8.26965 6.96422 9.69665Z"
      fill={COLORS.yellowIcon}
    />
  </Svg>
);

// Group 1261153923-1.svg - Smaller search icon for cart button
const CartSearchIcon = () => (
  <Svg width={scale(17)} height={scale(17)} viewBox="0 0 17 17" fill="none">
    <Path
      d="M7.66671 14.333C11.3486 14.333 14.3334 11.3483 14.3334 7.66648C14.3334 3.98468 11.3486 1 7.66671 1C3.98479 1 1 3.98468 1 7.66648C1 11.3483 3.98479 14.333 7.66671 14.333Z"
      stroke={COLORS.textDark}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 16L12.375 12.3751"
      stroke={COLORS.textDark}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Path 23173.svg - Chevron down (grey)
const ChevronDown = () => (
  <Svg width={scale(12)} height={scale(7)} viewBox="0 0 12 7" fill="none">
    <Path
      d="M0.75 0.75L5.75 5.75L10.75 0.75"
      stroke={COLORS.grayBg}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Path 23454.svg - Track arrow
const TrackArrow = () => (
  <Svg width={scale(5)} height={scale(7)} viewBox="0 0 5 7" fill="none">
    <Path
      d="M0.5 0.5L4.5 3.5L0.500001 6.5"
      stroke={COLORS.textPrimary}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Cart icon for Add to Cart button
const CartIcon = () => (
  <Svg width={scale(15)} height={scale(14)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z"
      stroke={COLORS.textPrimary}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M3 6H21" stroke={COLORS.textPrimary} strokeWidth={2} />
    <Path
      d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10"
      stroke={COLORS.textPrimary}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// --- Bottom Nav Bar Icons (from Figma assets) ---

// 3643728_balloon_chat_conversation_speak_word_icon 1.svg - Orders icon
const OrdersIcon = () => (
  <Svg width={scale(25)} height={scale(25)} viewBox="0 0 25 25" fill="none">
    <G clipPath="url(#clip_orders)">
      <Mask
        id="mask_orders"
        maskUnits="userSpaceOnUse"
        x={-1}
        y={0}
        width={25}
        height={25}>
        <Path d="M-0.010498 0.500002H23.9895V24.5H-0.010498V0.500002Z" fill={COLORS.backgroundWhite} />
      </Mask>
      <G mask="url(#mask_orders)">
        <Path
          d="M16.302 1.4375H7.677C5.08814 1.4375 2.9895 3.53614 2.9895 6.125V18.875C2.9895 21.4639 5.08814 23.5625 7.677 23.5625H16.302C18.8909 23.5625 20.9895 21.4639 20.9895 18.875V6.125C20.9895 3.53614 18.8909 1.4375 16.302 1.4375Z"
          stroke={COLORS.textPrimary}
          strokeWidth={2}
          strokeMiterlimit={10}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M16.1145 5.09375C16.1145 6.38816 15.0652 7.4375 13.7708 7.4375H10.2083C8.91385 7.4375 7.8645 6.38816 7.8645 5.09375"
          stroke={COLORS.textPrimary}
          strokeWidth={2}
          strokeMiterlimit={10}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M13.5833 13.5781H16.7708"
          stroke={COLORS.textPrimary}
          strokeWidth={2}
          strokeMiterlimit={10}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M13.5833 18.4062H16.7708"
          stroke={COLORS.textPrimary}
          strokeWidth={2}
          strokeMiterlimit={10}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M7.20825 12.4063L8.08013 13.2942C8.45546 13.6728 9.06403 13.6728 9.43941 13.2942L11.2395 11.4688"
          stroke={COLORS.textPrimary}
          strokeWidth={2}
          strokeMiterlimit={10}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M7.20825 17.2344L8.08013 18.1223C8.45546 18.5009 9.06403 18.5009 9.43941 18.1223L11.2395 16.2969"
          stroke={COLORS.textPrimary}
          strokeWidth={2}
          strokeMiterlimit={10}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </G>
    <Defs>
      <ClipPath id="clip_orders">
        <Rect width={25} height={25} fill={COLORS.backgroundWhite} />
      </ClipPath>
    </Defs>
  </Svg>
);

// line_1_x2C_5.svg - Cart nav icon (cart with + button)
const NavCartIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <G clipPath="url(#clip_cart)">
      <Path
        d="M13.875 15.75H8.313C8.139 15.75 7.989 15.6315 7.9485 15.462L5.4885 5.0235C5.2065 3.8325 4.1565 3 2.9325 3H1.125C0.504 3 0 3.504 0 4.125C0 4.746 0.504 5.25 1.125 5.25H2.9325C3.108 5.25 3.258 5.3685 3.2985 5.538L5.7585 15.9765C6.0375 17.1675 7.089 18 8.313 18H13.875C14.4975 18 15 17.496 15 16.875C15 16.254 14.4975 15.75 13.875 15.75Z"
        fill={COLORS.textPrimary}
      />
      <Path
        d="M23.2065 6.04946C22.6125 5.86946 21.984 6.19946 21.7995 6.79346L19.125 15.4845C19.0755 15.642 18.9315 15.75 18.7665 15.75H17.625C17.004 15.75 16.5 16.254 16.5 16.875C16.5 17.496 17.004 18 17.625 18H18.7665C19.926 18 20.934 17.2545 21.276 16.1475L23.9505 7.45646C24.1335 6.86246 23.8005 6.23246 23.2065 6.04946Z"
        fill={COLORS.textPrimary}
      />
      <Path
        d="M9.75 19.5C8.5095 19.5 7.5 20.5095 7.5 21.75C7.5 22.9905 8.5095 24 9.75 24C10.9905 24 12 22.9905 12 21.75C12 20.5095 10.9905 19.5 9.75 19.5Z"
        fill={COLORS.textPrimary}
      />
      <Path
        d="M17.25 19.5C16.0095 19.5 15 20.5095 15 21.75C15 22.9905 16.0095 24 17.25 24C18.4905 24 19.5 22.9905 19.5 21.75C19.5 20.5095 18.4905 19.5 17.25 19.5Z"
        fill={COLORS.textPrimary}
      />
      <Path
        d="M10.125 5.625H12.375V7.875C12.375 8.496 12.879 9 13.5 9C14.121 9 14.625 8.496 14.625 7.875V5.625H16.875C17.496 5.625 18 5.121 18 4.5C18 3.879 17.496 3.375 16.875 3.375H14.625V1.125C14.625 0.504 14.121 0 13.5 0C12.879 0 12.375 0.504 12.375 1.125V3.375H10.125C9.504 3.375 9 3.879 9 4.5C9 5.121 9.504 5.625 10.125 5.625Z"
        fill={COLORS.textPrimary}
      />
    </G>
    <Defs>
      <ClipPath id="clip_cart">
        <Rect width={24} height={24} fill={COLORS.backgroundWhite} />
      </ClipPath>
    </Defs>
  </Svg>
);

// shop.svg - Center shop button icon (white stroke)
const ShopIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3.01 11.22V15.71C3.01 20.2 4.81 22 9.3 22H14.69C19.18 22 20.98 20.2 20.98 15.71V11.22"
      stroke={COLORS.textWhite}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 12C13.83 12 15.18 10.51 15 8.68L14.34 2H9.67L9 8.68C8.82 10.51 10.17 12 12 12Z"
      stroke={COLORS.textWhite}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.31 12C20.33 12 21.81 10.36 21.61 8.35L21.33 5.6C20.97 3 19.97 2 17.35 2H14.3L15 9.01C15.17 10.66 16.66 12 18.31 12Z"
      stroke={COLORS.textWhite}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.64 12C7.29 12 8.78 10.66 8.94 9.01L9.16 6.8L9.64 2H6.59C3.97 2 2.97 3 2.61 5.6L2.34 8.35C2.14 10.36 3.62 12 5.64 12Z"
      stroke={COLORS.textWhite}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 17C10.33 17 9.5 17.83 9.5 19.5V22H14.5V19.5C14.5 17.83 13.67 17 12 17Z"
      stroke={COLORS.textWhite}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Layer_2.svg - Quotes icon
const QuotesIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5.76 4.90503C3 4.90503 0.75 7.17753 0.75 9.96753C0.75 11.865 1.7775 13.5675 3.405 14.4375C3.3225 15.3225 2.955 17.205 1.4475 17.6175C1.0875 17.715 0.855 18.06 0.9 18.4275C0.945 18.795 1.245 19.08 1.62 19.0875H1.7325C2.4675 19.0875 6.5025 18.9225 9.1125 15.42C10.8075 13.1475 11.31 10.68 10.5375 8.50503C9.8925 6.35253 7.9725 4.90503 5.76 4.90503ZM7.905 14.5275C6.81 15.9975 5.3775 16.7625 4.1625 17.16C4.935 15.735 4.935 14.07 4.935 13.965C4.935 13.665 4.7475 13.3875 4.4625 13.275C3.12 12.735 2.25 11.43 2.25 9.96753C2.25 8.00253 3.825 6.40503 5.76 6.40503C7.305 6.40503 8.6475 7.42503 9.1125 8.97003C9.9375 11.2875 8.715 13.44 7.9125 14.52L7.905 14.5275Z"
      fill={COLORS.textPrimary}
    />
    <Path
      d="M22.9049 8.51248C22.2599 6.35998 20.3399 4.91248 18.1274 4.91248C15.3674 4.91248 13.1174 7.18498 13.1174 9.97498C13.1174 11.8725 14.1449 13.575 15.7724 14.445C15.6899 15.33 15.3224 17.2125 13.8149 17.625C13.4549 17.7225 13.2224 18.0675 13.2674 18.435C13.3124 18.8025 13.6124 19.0875 13.9874 19.095H14.0999C14.8349 19.095 18.8699 18.93 21.4799 15.4275C23.1749 13.155 23.6774 10.6875 22.9049 8.51248ZM20.2724 14.5275C19.1774 15.9975 17.7449 16.7625 16.5299 17.16C17.3024 15.735 17.3024 14.07 17.3024 13.965C17.3024 13.665 17.1149 13.3875 16.8299 13.275C15.4874 12.735 14.6174 11.43 14.6174 9.96748C14.6174 8.00248 16.1924 6.40498 18.1274 6.40498C19.6724 6.40498 21.0149 7.42498 21.4799 8.96998C22.3049 11.2875 21.0824 13.44 20.2799 14.52L20.2724 14.5275Z"
      fill={COLORS.textPrimary}
    />
  </Svg>
);

// Layer_1.svg - Profile nav icon (circle with face)
const NavProfileIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 23.25C9.77497 23.25 7.59989 22.5902 5.74984 21.354C3.89979 20.1179 2.45785 18.3609 1.60636 16.3052C0.754875 14.2495 0.532087 11.9875 0.966171 9.80524C1.40025 7.62295 2.47171 5.61839 4.04505 4.04505C5.61839 2.47171 7.62295 1.40025 9.80524 0.966171C11.9875 0.532087 14.2495 0.754875 16.3052 1.60636C18.3609 2.45785 20.1179 3.89979 21.354 5.74984C22.5902 7.59989 23.25 9.77497 23.25 12C23.2466 14.9827 22.0603 17.8422 19.9512 19.9512C17.8422 22.0603 14.9827 23.2466 12 23.25ZM12 2.25001C10.0716 2.25001 8.18657 2.82183 6.5832 3.89318C4.97982 4.96452 3.73013 6.48726 2.99218 8.26884C2.25423 10.0504 2.06114 12.0108 2.43735 13.9021C2.81355 15.7935 3.74215 17.5307 5.10571 18.8943C6.46928 20.2579 8.20656 21.1865 10.0979 21.5627C11.9892 21.9389 13.9496 21.7458 15.7312 21.0078C17.5127 20.2699 19.0355 19.0202 20.1068 17.4168C21.1782 15.8134 21.75 13.9284 21.75 12C21.747 9.41506 20.7188 6.93684 18.891 5.109C17.0632 3.28117 14.585 2.25298 12 2.25001Z"
      fill={COLORS.textPrimary}
    />
    <Path
      d="M12 12.75C11.3325 12.75 10.68 12.5521 10.125 12.1812C9.56994 11.8104 9.13735 11.2833 8.88191 10.6666C8.62646 10.0499 8.55963 9.37126 8.68985 8.71657C8.82008 8.06189 9.14151 7.46052 9.61352 6.98852C10.0855 6.51651 10.6869 6.19508 11.3416 6.06485C11.9963 5.93463 12.6749 6.00146 13.2916 6.25691C13.9083 6.51235 14.4354 6.94494 14.8062 7.49995C15.1771 8.05497 15.375 8.70749 15.375 9.375C15.374 10.2698 15.0181 11.1277 14.3854 11.7604C13.7527 12.3931 12.8948 12.749 12 12.75ZM12 7.5C11.6292 7.5 11.2666 7.60997 10.9583 7.816C10.65 8.02202 10.4096 8.31486 10.2677 8.65747C10.1258 9.00008 10.0887 9.37708 10.161 9.7408C10.2334 10.1045 10.412 10.4386 10.6742 10.7008C10.9364 10.9631 11.2705 11.1416 11.6342 11.214C11.9979 11.2863 12.3749 11.2492 12.7175 11.1073C13.0601 10.9654 13.353 10.725 13.559 10.4167C13.765 10.1084 13.875 9.74584 13.875 9.375C13.875 8.87772 13.6775 8.40081 13.3258 8.04918C12.9742 7.69755 12.4973 7.5 12 7.5Z"
      fill={COLORS.textPrimary}
    />
    <Path
      d="M16.5001 17.25C16.3012 17.2499 16.1104 17.1709 15.9698 17.0302C14.9156 15.9801 13.4881 15.3904 12.0001 15.3904C10.512 15.3904 9.08457 15.9801 8.03031 17.0302C7.88886 17.1669 7.69941 17.2425 7.50276 17.2407C7.30611 17.239 7.118 17.1602 6.97895 17.0211C6.83989 16.882 6.76101 16.6939 6.75931 16.4973C6.7576 16.3006 6.83319 16.1112 6.96981 15.9697C8.30536 14.6384 10.1143 13.8907 12.0001 13.8907C13.8859 13.8907 15.6948 14.6384 17.0303 15.9697C17.1352 16.0746 17.2066 16.2082 17.2355 16.3537C17.2644 16.4992 17.2496 16.65 17.1928 16.787C17.1361 16.924 17.04 17.0411 16.9167 17.1235C16.7933 17.206 16.6484 17.25 16.5001 17.25Z"
      fill={COLORS.textPrimary}
    />
  </Svg>
);

// vuesax/bold/home-2.svg - Home icon (yellow filled house)
const HomeIcon = () => (
  <Svg width={scale(26)} height={scale(25)} viewBox="0 0 26 25" fill="none">
    <Path
      d="M22.5651 6.02286L15.3642 0.984787C13.4015 -0.390369 10.3887 -0.31536 8.50096 1.14731L2.23775 6.03536C0.987612 7.01047 0 9.01069 0 10.5859V19.2118C0 22.3997 2.58779 25 5.77565 25H19.2522C22.44 25 25.0278 22.4122 25.0278 19.2243V10.7484C25.0278 9.0607 23.9402 6.98547 22.5651 6.02286ZM13.4515 19.9994C13.4515 20.512 13.0265 20.937 12.5139 20.937C12.0014 20.937 11.5763 20.512 11.5763 19.9994V16.249C11.5763 15.7365 12.0014 15.3114 12.5139 15.3114C13.0265 15.3114 13.4515 15.7365 13.4515 16.249V19.9994Z"
      fill={COLORS.yellowIcon}
    />
  </Svg>
);

const HomeScreen: React.FC<{navigation?: any}> = ({navigation}) => {
  const [orderId, setOrderId] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  // Admin-editable bulk-quote banner text (falls back to defaults below).
  const [bulkBannerText, setBulkBannerText] = useState({
    title: 'Save Up to ₹15000 on Bulk Orders',
    subtitle: 'Buy More, Save More on Your Projects',
    buttonText: 'Get Bulk Quote',
  });
  const [loadingData, setLoadingData] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [trackingOrderId, setTrackingOrderId] = useState(false);
  const [sellerSheetVisible, setSellerSheetVisible] = useState(false);
  const [sellerRequestStatus, setSellerRequestStatus] = useState<
    'none' | 'pending' | 'approved' | 'rejected'
  >('none');
  const bannerScrollRef = useRef<ScrollView>(null);

  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.app.user);
  const cartCount = useAppSelector(selectCartTotalQuantity);
  const cartItems = useAppSelector(selectCartItems);
  const savedAddresses = useAppSelector(s => s.app.savedAddresses);
  const selectedAddressId = useAppSelector(s => s.app.selectedAddressId);
  const currentLocation = useAppSelector(s => s.app.currentLocation);
  const selectedAddress = savedAddresses.find(a => a.id === selectedAddressId) || null;

  const greetingName = user?.name?.trim()
    ? user.name.trim().split(' ')[0]
    : 'there';

  const locationLabel = selectedAddress
    ? `${selectedAddress.label} · ${selectedAddress.street || selectedAddress.city}`
    : currentLocation?.label || 'Fetching location...';

  // Refresh user profile on mount so greeting/avatar/address stay live
  // after edits made on EditProfileScreen, and merge user.address into the
  // local saved-addresses list so the header shows it immediately.
  useEffect(() => {
    let cancelled = false;
    authService
      .getProfile()
      .then(res => {
        if (cancelled) return;
        const fresh = res.data?.data;
        if (!fresh) return;
        dispatch(
          updateUser({
            name: fresh.name,
            email: fresh.email,
            profileImage: fresh.profileImage,
            address: fresh.address,
          }),
        );
        if (fresh.address) {
          dispatch(syncUserAddressToSavedAddresses(fresh.address));
        }
      })
      .catch(() => {
        /* token invalid → handled elsewhere */
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  // Fetch the user's recent orders so the Track-Your-Order block can show
  // a quick shortcut to the last two.
  useEffect(() => {
    let cancelled = false;
    setLoadingOrders(true);
    orderService
      .list('all')
      .then(res => {
        if (!cancelled) setRecentOrders((res.data.data || []).slice(0, 2));
      })
      .catch(() => {
        if (!cancelled) setRecentOrders([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingOrders(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTrackOrder = async () => {
    const trimmed = orderId.trim();
    if (!trimmed) return;
    setTrackingOrderId(true);
    try {
      const res = await orderService.get(trimmed);
      if (res.data?.success && res.data.data?._id) {
        navigation?.navigate('OrderDetails', {orderId: res.data.data._id});
        setOrderId('');
      }
    } catch (err: any) {
      // 404 → unknown order ID
      console.log('Track order failed:', err?.response?.data?.message);
    } finally {
      setTrackingOrderId(false);
    }
  };

  useEffect(() => {
    if (selectedAddress || currentLocation) return;
    fetchCurrentLocation()
      .then(res => {
        const label =
          res.geocode?.shortLabel ||
          `${res.latitude.toFixed(3)}, ${res.longitude.toFixed(3)}`;
        dispatch(
          setCurrentLocation({
            latitude: res.latitude,
            longitude: res.longitude,
            label,
            fullAddress: res.geocode?.fullAddress,
          }),
        );
      })
      .catch(() => {
        dispatch(
          setCurrentLocation({
            latitude: 0,
            longitude: 0,
            label: 'Location unavailable',
          }),
        );
      });
  }, [selectedAddress, currentLocation, dispatch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, brandRes, matRes, bannerRes] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getBrands(),
          catalogService.getMaterials({limit: 10}),
          catalogService.getBanners(),
        ]);
        if (catRes.data.success) setCategories(catRes.data.data);
        if (brandRes.data.success) setBrands(brandRes.data.data);
        if (matRes.data.success) setMaterials(matRes.data.data);
        if (bannerRes.data.success) setBanners(bannerRes.data.data);

        // Editable home content — kept separate so a failure here (e.g. an
        // older backend without this endpoint) never breaks the main load.
        catalogService
          .getAppSettings()
          .then(settingsRes => {
            const b = settingsRes.data?.data?.bulkBanner;
            if (settingsRes.data?.success && b) {
              setBulkBannerText(prev => ({
                title: b.title || prev.title,
                subtitle: b.subtitle || prev.subtitle,
                buttonText: b.buttonText || prev.buttonText,
              }));
            }
          })
          .catch(() => {
            // ignore — fall back to default banner text
          });
      } catch {
        // silent fail — show empty state
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Load cached seller request status, then refresh from server when logged in
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let cachedStatus: string | null = null;
      try {
        cachedStatus = await AsyncStorage.getItem(SELLER_REQUEST_LOCAL_KEY);
        if (!cancelled && cachedStatus) {
          setSellerRequestStatus(cachedStatus as any);
        }
      } catch {
        // ignore
      }
      if (!user?._id) return;
      try {
        const res = await sellerRequestService.getMine();
        if (cancelled) return;
        const serverStatus = res.data?.data?.status;
        // A null server response doesn't prove the request wasn't submitted
        // (e.g., guest submission that didn't bind to this user). Only let
        // the server downgrade a cached pending/approved when it has an
        // authoritative status of its own.
        if (serverStatus) {
          setSellerRequestStatus(serverStatus as any);
          await AsyncStorage.setItem(SELLER_REQUEST_LOCAL_KEY, serverStatus);
        } else if (
          cachedStatus !== 'pending' &&
          cachedStatus !== 'approved'
        ) {
          setSellerRequestStatus('none');
          await AsyncStorage.setItem(SELLER_REQUEST_LOCAL_KEY, 'none');
        }
      } catch {
        // ignore — keep cached status
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  const handleSellerRequestSubmitted = async () => {
    setSellerRequestStatus('pending');
    try {
      await AsyncStorage.setItem(SELLER_REQUEST_LOCAL_KEY, 'pending');
    } catch {
      // ignore
    }
    setSellerSheetVisible(false);
  };

  const showBecomeSellerButton =
    sellerRequestStatus === 'none' || sellerRequestStatus === 'rejected';

  const hasDynamicBanners = banners.length > 0;
  const bannerCount = hasDynamicBanners ? banners.length : 3;

  // Auto-scroll banner
  useEffect(() => {
    if (bannerCount <= 1) return;
    const timer = setInterval(() => {
      setActiveBannerIndex(prev => {
        const next = (prev + 1) % bannerCount;
        bannerScrollRef.current?.scrollTo({
          x: next * SCREEN_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [bannerCount]);

  const onBannerScroll = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SCREEN_WIDTH);
      setActiveBannerIndex(index);
    },
    [],
  );

  const categoryCircleSize = scale(75);
  const categoryItemWidth = scale(75);
  // Shop-by-brand tile dimensions (brands only — no categories here).
  const brandTileWidth = scale(125);
  const brandTileHeight = scale(81);
  const productCardWidth = scale(186);
  const featureCardWidth = (SCREEN_WIDTH - scale(48)) / 2;
  const featureCardHeight = scale(90);
  const bannerHeight = scale(220);

  const getDiscount = (item: Material) => {
    if (item.mrp > 0 && item.finalSellingPrice > 0 && item.finalSellingPrice < item.mrp) {
      return `${Math.round(((item.mrp - item.finalSellingPrice) / item.mrp) * 100)}%OFF`;
    }
    return null;
  };

  const renderProductCard = ({item}: {item: Material}) => {
    const cartLineQty =
      cartItems.find(ci => ci.id === item._id)?.quantity || 0;
    return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation?.navigate('ProductDetail', {productId: item._id, productName: item.name, material: item})}
      style={{
        width: productCardWidth,
        marginRight: scale(10),
        borderRadius: scale(14),
        backgroundColor: COLORS.backgroundWhite,
        shadowColor: 'rgba(221, 221, 221, 0.87)',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 4,
      }}>
      {/* Product image area */}
      <View
        style={{
          margin: scale(4),
          height: scale(105),
          borderRadius: scale(12),
          backgroundColor: COLORS.grayBg,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
        <Image
          source={{uri: item.images[0]}}
          style={{height: scale(105), width: '100%'}}
          resizeMode="contain"
        />
        {/* Discount badge */}
        {getDiscount(item) && (
          <View
            style={{
              position: 'absolute',
              right: scale(5),
              top: scale(5),
              borderRadius: scale(5),
              backgroundColor: COLORS.secondary,
              paddingHorizontal: scale(10),
              paddingVertical: scale(2),
            }}>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(10),
                color: COLORS.primary,
                opacity: 0.8,
                textAlign: 'center',
                textTransform: 'capitalize',
              }}>
              {getDiscount(item)}
            </Text>
          </View>
        )}
      </View>
      {/* Product info — show only product name and price (no category) */}
      <View style={{paddingHorizontal: scale(8), paddingBottom: scale(4), paddingTop: scale(4)}}>
        <Text
          style={{
            fontFamily: FONTS.regular,
            fontSize: scale(14),
            color: COLORS.textPrimary,
            textTransform: 'capitalize',
          }}
          numberOfLines={2}>
          {item.name}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.semiBold,
            fontSize: scale(item.requestQuote ? 12 : 14),
            color: COLORS.textPrimary,
          }}>
          {item.requestQuote
            ? 'Price on request'
            : `${formatCurrency(item.finalSellingPrice)}/${item.unit}`}
        </Text>
      </View>
      {/* Add to Cart / Get a Quote */}
      {item.requestQuote ? (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation?.();
            navigation?.navigate('GetQuotation', {
              isLoggedIn: true,
              materialId: item._id,
              materialName: item.name,
              categoryId: item.category?._id,
              categoryName: item.category?.name,
            });
          }}
          style={{
            marginHorizontal: scale(7),
            marginBottom: scale(7),
            height: scale(42),
            borderRadius: scale(10),
            backgroundColor: COLORS.primary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: scale(13),
              color: COLORS.textPrimary,
              textTransform: 'capitalize',
            }}>
            Get a Quote
          </Text>
        </TouchableOpacity>
      ) : cartLineQty > 0 ? (
        <View
          style={{
            marginHorizontal: scale(7),
            marginBottom: scale(7),
            height: scale(42),
            borderRadius: scale(10),
            backgroundColor: COLORS.primary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: scale(6),
          }}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              dispatch(decrementCartItem(item._id));
            }}
            hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
            style={{
              width: scale(30),
              height: scale(30),
              borderRadius: scale(8),
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <MinusIcon color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: scale(14),
              color: COLORS.textPrimary,
              minWidth: scale(20),
              textAlign: 'center',
            }}>
            {cartLineQty}
          </Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              dispatch(incrementCartItem(item._id));
            }}
            hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
            style={{
              width: scale(30),
              height: scale(30),
              borderRadius: scale(8),
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <PlusIcon color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation?.();
            dispatch(addCartItem(cartItemFromMaterial(item)));
          }}
          style={{
            marginHorizontal: scale(7),
            marginBottom: scale(7),
            height: scale(42),
            borderRadius: scale(10),
            backgroundColor: COLORS.primary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <CartIcon />
          <Text
            style={{
              marginLeft: scale(6),
              fontFamily: FONTS.semiBold,
              fontSize: scale(13),
              color: COLORS.textPrimary,
              textTransform: 'capitalize',
            }}>
            Add to Cart
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.secondary}
        translucent
      />

      {/* Top Header Bar */}
      <View
        style={{
          backgroundColor: COLORS.textPrimary,
          paddingBottom: scale(14),
          paddingTop: scale(40),
          paddingHorizontal: scale(16),
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 3},
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 5,
        }}>
        {/* Row 1 — Menu + Greeting + (Become Seller) + Cart + Profile */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <TouchableOpacity
            onPress={() => setDrawerVisible(true)}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            style={{marginRight: scale(12)}}>
            <MenuIcon />
          </TouchableOpacity>

          <View style={{flex: 1, justifyContent: 'center'}}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(15),
                color: COLORS.textWhite,
              }}>
              Hi,{' '}
              <Text style={{color: COLORS.primary}}>{greetingName}</Text>
            </Text>
            <Text
              style={{
                marginTop: scale(1),
                fontFamily: FONTS.regular,
                fontSize: scale(10),
                color: COLORS.grayBg,
              }}>
              Welcome back
            </Text>
          </View>

          {showBecomeSellerButton && (
            <TouchableOpacity
              onPress={() => setSellerSheetVisible(true)}
              style={{
                marginRight: scale(8),
                borderRadius: scale(20),
                borderWidth: 1,
                borderColor: COLORS.primary,
                paddingHorizontal: scale(10),
                paddingVertical: scale(4),
              }}>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(11),
                  color: COLORS.primary,
                }}>
                Become a Seller
              </Text>
            </TouchableOpacity>
          )}

          <HeaderCartButton />
          <HeaderProfileButton />
        </View>

        {/* Row 2 — Deliver-to address chip */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation?.navigate('SavedAddress')}
          style={{
            marginTop: scale(12),
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: scale(10),
            borderWidth: 1,
            borderColor: 'rgba(253,226,0,0.18)',
            paddingHorizontal: scale(12),
            paddingVertical: scale(8),
          }}>
          <View
            style={{
              width: scale(28),
              height: scale(28),
              borderRadius: scale(14),
              backgroundColor: 'rgba(253,226,0,0.12)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: scale(10),
            }}>
            <LocationIcon />
          </View>

          <View style={{flex: 1}}>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(10),
                color: COLORS.grayBg,
                letterSpacing: 0.3,
              }}>
              DELIVER TO
            </Text>
            <Text
              numberOfLines={1}
              style={{
                marginTop: scale(1),
                fontFamily: FONTS.semiBold,
                fontSize: scale(13),
                color: COLORS.textWhite,
              }}>
              {locationLabel}
            </Text>
          </View>

          <View
            style={{
              marginLeft: scale(8),
              width: scale(22),
              height: scale(22),
              borderRadius: scale(11),
              backgroundColor: COLORS.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Svg width={scale(10)} height={scale(6)} viewBox="0 0 12 7" fill="none">
              <Path
                d="M0.75 0.75L5.75 5.75L10.75 0.75"
                stroke={COLORS.textPrimary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{flex: 1}}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Banner Carousel */}
        <ScrollView
          ref={bannerScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onBannerScroll}
          style={{height: bannerHeight}}>
          {hasDynamicBanners
            ? banners.map((banner, index) => (
                <TouchableOpacity
                  key={banner._id}
                  activeOpacity={0.9}
                  onPress={() => banner.link ? navigation?.navigate(banner.link) : null}
                  style={{height: bannerHeight, width: SCREEN_WIDTH}}>
                  <ImageBackground
                    source={{uri: banner.image}}
                    style={{height: bannerHeight, width: SCREEN_WIDTH}}
                    resizeMode="cover">
                    {banner.enableBulkQuote ? (
                      <View
                        style={{
                          flex: 1,
                          justifyContent: 'flex-end',
                          paddingHorizontal: scale(20),
                          paddingBottom: scale(20),
                        }}>
                        <TouchableOpacity
                          onPress={() =>
                            navigation?.navigate('GetQuotation', {
                              isLoggedIn: true,
                            })
                          }
                          style={{
                            alignSelf: 'flex-start',
                            borderRadius: scale(10),
                            backgroundColor: COLORS.primary,
                            paddingHorizontal: scale(14),
                            paddingVertical: scale(10),
                          }}>
                          <Text
                            style={{
                              fontFamily: FONTS.semiBold,
                              fontSize: scale(14),
                              color: COLORS.textPrimary,
                            }}>
                            Get Bulk Quote
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </ImageBackground>
                </TouchableOpacity>
              ))
            : [0, 1, 2].map(index => (
                <ImageBackground
                  key={index}
                  source={homeBanner}
                  style={{height: bannerHeight, width: SCREEN_WIDTH}}
                  resizeMode="cover">
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      paddingHorizontal: scale(20),
                      backgroundColor: 'rgba(0,0,0,0.35)',
                    }}>
                    <Text
                      style={{
                        fontFamily: FONTS.bold,
                        fontSize: scale(18),
                        color: COLORS.textWhite,
                      }}>
                      Buy Building Materials{'\n'}ON The GO
                    </Text>
                    <Text
                      style={{
                        marginTop: scale(4),
                        fontFamily: FONTS.regular,
                        fontSize: scale(14),
                        color: COLORS.textWhite,
                      }}>
                      Sale Upto{' '}
                      <Text
                        style={{fontFamily: FONTS.bold, fontSize: scale(18)}}>
                        20 Off
                      </Text>
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation?.navigate('GetQuotation', {isLoggedIn: true})}
                      style={{
                        marginTop: scale(10),
                        alignSelf: 'flex-start',
                        borderRadius: scale(10),
                        backgroundColor: COLORS.primary,
                        paddingHorizontal: scale(14),
                        paddingVertical: scale(10),
                      }}>
                      <Text
                        style={{
                          fontFamily: FONTS.semiBold,
                          fontSize: scale(14),
                          color: COLORS.textPrimary,
                        }}>
                        Get Bulk Quote
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ImageBackground>
              ))}
        </ScrollView>

        {/* White content area */}
        <View
          style={{
            borderTopLeftRadius: scale(25),
            borderTopRightRadius: scale(25),
            backgroundColor: COLORS.backgroundWhite,
            marginTop: scale(-25),
          }}>
          {/* Carousel dots */}
          <View style={{marginTop: scale(12), alignItems: 'center'}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: scale(6),
              }}>
              {Array.from({length: bannerCount}).map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: activeBannerIndex === index ? scale(18) : scale(6),
                    height: scale(6),
                    borderRadius: scale(3),
                    backgroundColor:
                      activeBannerIndex === index ? COLORS.yellowIcon : '#C1C8CE',
                  }}
                />
              ))}
            </View>
          </View>

          {/* Category Row — always shown above the search bar */}
          {loadingData ? (
            <ActivityIndicator
              color={COLORS.primary}
              style={{marginTop: scale(20)}}
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: scale(16),
                paddingTop: scale(20),
              }}>
              {categories
                .filter(
                  cat =>
                    !HIDDEN_HOME_CATEGORIES.includes(
                      (cat.name || '').trim().toLowerCase(),
                    ),
                )
                .map((cat, index) => (
                  <TouchableOpacity
                    key={cat._id}
                    onPress={() => navigation?.navigate('SubCategory', {categoryId: cat._id, categoryName: cat.name})}
                    style={{
                      marginRight: scale(22),
                      alignItems: 'center',
                      width: categoryItemWidth,
                    }}>
                    <View
                      style={{
                        height: categoryCircleSize,
                        width: categoryCircleSize,
                        borderRadius: categoryCircleSize / 2,
                        overflow: 'hidden',
                        backgroundColor: COLORS.grayBg,
                      }}>
                      <Image
                        source={
                          cat.image
                            ? {uri: cat.image}
                            : categoryFallbackIcon(index)
                        }
                        style={{height: '100%', width: '100%'}}
                        resizeMode="cover"
                      />
                    </View>
                    <Text
                      style={{
                        marginTop: scale(8),
                        textAlign: 'center',
                        fontFamily: FONTS.regular,
                        fontSize: scale(14),
                        color: 'black',
                      }}
                      numberOfLines={2}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          )}

          {/* Search By Brand */}
          <TouchableOpacity
            onPress={() => setSearchVisible(true)}
            style={{
              marginHorizontal: scale(16),
              marginTop: scale(23),
              height: scale(46),
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: scale(10),
              borderWidth: 1,
              borderColor: '#e5dcdc',
              backgroundColor: COLORS.backgroundWhite,
              paddingHorizontal: scale(10),
            }}>
            <SearchIcon />
            <Text
              style={{
                marginLeft: scale(14),
                fontFamily: FONTS.regular,
                fontSize: scale(14),
                color: COLORS.textDark,
                textTransform: 'capitalize',
              }}>
              Search
            </Text>
          </TouchableOpacity>

          {/* Track Your Order */}
          <View
            style={{
              marginHorizontal: scale(16),
              marginTop: scale(23),
              borderRadius: scale(10),
              backgroundColor: COLORS.grayBg,
              padding: scale(16),
              shadowColor: 'rgba(221, 221, 221, 0.87)',
              shadowOffset: {width: 0, height: 0},
              shadowOpacity: 1,
              shadowRadius: 12,
              elevation: 4,
            }}>
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(14),
                color: '#1d262d',
              }}>
              Track Your Order
            </Text>
            {/* Order input */}
            <View
              style={{
                marginTop: scale(8),
                height: scale(39),
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: scale(10),
                backgroundColor: COLORS.backgroundWhite,
                paddingHorizontal: scale(11),
              }}>
              <TextInput
                style={{
                  flex: 1,
                  fontFamily: FONTS.regular,
                  fontSize: scale(12),
                  color: '#1d262d',
                  padding: 0,
                }}
                placeholder="Enter Order ID"
                placeholderTextColor="rgba(29, 38, 45, 0.3)"
                value={orderId}
                onChangeText={setOrderId}
              />
              <TouchableOpacity
                onPress={handleTrackOrder}
                disabled={!orderId.trim() || trackingOrderId}
                style={{
                  height: scale(32),
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: scale(10),
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: scale(10),
                  gap: scale(7),
                  opacity: !orderId.trim() || trackingOrderId ? 0.5 : 1,
                }}>
                <Text
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: scale(12),
                    color: '#1d262d',
                  }}>
                  {trackingOrderId ? 'Tracking…' : 'Track'}
                </Text>
                <TrackArrow />
              </TouchableOpacity>
            </View>

            {/* Recent orders OR empty-state CTA */}
            {loadingOrders ? (
              <View style={{marginTop: scale(12), alignItems: 'center'}}>
                <ActivityIndicator color={COLORS.secondary} size="small" />
              </View>
            ) : recentOrders.length > 0 ? (
              <View style={{marginTop: scale(10)}}>
                <Text
                  style={{
                    fontFamily: FONTS.medium,
                    fontSize: scale(11),
                    color: '#1d262d',
                    opacity: 0.7,
                    marginBottom: scale(6),
                  }}>
                  Recent orders
                </Text>
                {recentOrders.map(order => {
                  const matName =
                    typeof order.material === 'string'
                      ? 'Order item'
                      : order.material?.name || 'Order item';
                  return (
                    <TouchableOpacity
                      key={order._id}
                      activeOpacity={0.7}
                      onPress={() =>
                        navigation?.navigate('OrderDetails', {
                          orderId: order._id,
                        })
                      }
                      style={{
                        marginTop: scale(6),
                        backgroundColor: COLORS.backgroundWhite,
                        borderRadius: scale(8),
                        paddingHorizontal: scale(10),
                        paddingVertical: scale(8),
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                      <View style={{flex: 1, paddingRight: scale(8)}}>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontFamily: FONTS.semiBold,
                            fontSize: scale(12),
                            color: '#1d262d',
                          }}>
                          #{order.bookingId}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={{
                            marginTop: scale(2),
                            fontFamily: FONTS.regular,
                            fontSize: scale(10),
                            color: '#1d262d',
                            opacity: 0.6,
                          }}>
                          {matName} · {order.status.replace('_', ' ')}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: scale(4),
                        }}>
                        <Text
                          style={{
                            fontFamily: FONTS.medium,
                            fontSize: scale(11),
                            color: COLORS.secondary,
                          }}>
                          Track
                        </Text>
                        <TrackArrow />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation?.navigate('Category')}
                style={{
                  marginTop: scale(10),
                  backgroundColor: COLORS.backgroundWhite,
                  borderRadius: scale(8),
                  paddingHorizontal: scale(12),
                  paddingVertical: scale(10),
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <View style={{flex: 1, paddingRight: scale(8)}}>
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: scale(12),
                      color: '#1d262d',
                    }}>
                    No orders yet
                  </Text>
                  <Text
                    style={{
                      marginTop: scale(2),
                      fontFamily: FONTS.regular,
                      fontSize: scale(10),
                      color: '#1d262d',
                      opacity: 0.6,
                    }}>
                    Browse materials and place your first order.
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: scale(4),
                  }}>
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: scale(11),
                      color: COLORS.secondary,
                    }}>
                    Browse
                  </Text>
                  <TrackArrow />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Shop By Brands — brands only, no categories in this section */}
          {brands.length > 0 && (
            <View style={{marginTop: scale(23)}}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: scale(16),
                }}>
                <Text
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: scale(14),
                    color: '#1d262d',
                  }}>
                  Shop By Brands
                </Text>
                <TouchableOpacity onPress={() => navigation?.navigate('AllBrands')}>
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: scale(12),
                      color: COLORS.textDark,
                      textTransform: 'capitalize',
                    }}>
                    View All
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: scale(16),
                  paddingTop: scale(12),
                }}>
                {brands.slice(0, 5).map(brand => (
                  <TouchableOpacity
                    key={brand._id}
                    onPress={() =>
                      navigation?.navigate('SubCategory', {
                        brand: brand.name,
                        categoryName: brand.name,
                      })
                    }
                    style={{
                      marginRight: scale(13),
                      width: brandTileWidth,
                      alignItems: 'center',
                    }}>
                    <View
                      style={{
                        height: brandTileHeight,
                        width: brandTileWidth,
                        overflow: 'hidden',
                        borderRadius: scale(16),
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        backgroundColor: COLORS.backgroundWhite,
                        alignItems: 'center',
                        justifyContent: 'center',
                        // Inner padding so wide logos (BOSCH, HILTI, ...) don't
                        // touch/clip the tile edges.
                        paddingHorizontal: scale(16),
                        paddingVertical: scale(14),
                        shadowColor: 'rgba(221, 221, 221, 0.87)',
                        shadowOffset: {width: 0, height: 0},
                        shadowOpacity: 1,
                        shadowRadius: 12,
                        elevation: 3,
                      }}>
                      <Image
                        source={{uri: brand.image}}
                        style={{height: '100%', width: '100%'}}
                        resizeMode="contain"
                      />
                    </View>
                    <Text
                      style={{
                        marginTop: scale(7),
                        textAlign: 'center',
                        fontFamily: FONTS.regular,
                        fontSize: scale(12),
                        color: 'black',
                      }}
                      numberOfLines={1}>
                      {brand.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Bulk Orders Banner */}
          <TouchableOpacity
            onPress={() => navigation?.navigate('GetQuotation', {isLoggedIn: true})}
            style={{
              marginHorizontal: scale(16),
              marginTop: scale(23),
              height: scale(100),
              overflow: 'hidden',
              borderRadius: scale(10),
            }}>
            <ImageBackground
              source={bulkBanner}
              style={{height: '100%', width: '100%'}}
              resizeMode="cover"
              imageStyle={{borderRadius: scale(10)}}>
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  backgroundColor: 'rgba(64,64,64,0.6)',
                  borderRadius: scale(10),
                  paddingLeft: scale(14),
                  paddingTop: scale(14),
                }}>
                <Text
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: scale(12),
                    color: COLORS.textWhite,
                  }}>
                  {bulkBannerText.title}
                  {'\n'}
                  {bulkBannerText.subtitle}
                </Text>
                <TouchableOpacity
                  style={{
                    marginTop: scale(8),
                    alignSelf: 'flex-start',
                    borderRadius: scale(10),
                    backgroundColor: COLORS.primary,
                    paddingHorizontal: scale(10),
                    paddingVertical: scale(6),
                  }}>
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: scale(14),
                      color: COLORS.textPrimary,
                    }}>
                    {bulkBannerText.buttonText}
                  </Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          </TouchableOpacity>

          {/* Features Grid */}
          <View
            style={{
              marginHorizontal: scale(16),
              marginTop: scale(23),
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}>
            {FEATURES.map((feature, index) => (
              <View
                key={index}
                style={{
                  marginBottom: scale(14),
                  height: featureCardHeight,
                  width: featureCardWidth,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: scale(16),
                  borderWidth: 1.5,
                  borderColor: COLORS.textPrimary,
                  backgroundColor: COLORS.backgroundWhite,
                  paddingHorizontal: scale(12),
                  paddingVertical: scale(10),
                  shadowColor: COLORS.textPrimary,
                  shadowOffset: {width: 2, height: 6},
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 4,
                }}>
                <Text
                  style={{
                    flex: 1,
                    fontFamily: FONTS.semiBold,
                    fontSize: scale(14),
                    color: COLORS.textPrimary,
                    lineHeight: scale(20),
                  }}>
                  {feature.title}
                </Text>
                <Image
                  source={feature.image}
                  style={{height: scale(65), width: scale(65)}}
                  resizeMode="cover"
                />
              </View>
            ))}
          </View>

          {/* Best Selling Materials */}
          <View style={{marginTop: scale(10)}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: scale(16),
              }}>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(14),
                  color: '#1d262d',
                }}>
                Best Selling Materials
              </Text>
              <TouchableOpacity onPress={() => navigation?.navigate('Category')}>
                <Text
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: scale(12),
                    color: COLORS.textDark,
                    textTransform: 'capitalize',
                  }}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            {loadingData ? (
              <ActivityIndicator
                color={COLORS.primary}
                style={{marginTop: scale(20), marginBottom: scale(10)}}
              />
            ) : (
              <FlatList
                horizontal
                data={materials}
                renderItem={renderProductCard}
                keyExtractor={item => item._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: scale(16),
                  paddingVertical: scale(9),
                }}
                style={{marginTop: scale(10)}}
              />
            )}
          </View>

          {/* Bottom spacing for nav bar */}
          <View style={{height: scale(120)}} />
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
              <View>
                <NavCartIcon />
                {cartCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: scale(-6),
                      right: scale(-10),
                      minWidth: scale(16),
                      height: scale(16),
                      borderRadius: scale(8),
                      backgroundColor: COLORS.secondary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: scale(3),
                    }}>
                    <Text
                      style={{
                        fontFamily: FONTS.semiBold,
                        fontSize: scale(10),
                        color: COLORS.primary,
                      }}>
                      {cartCount > 99 ? '99+' : cartCount}
                    </Text>
                  </View>
                )}
              </View>
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
              onPress={() => navigation?.navigate('EditProfile')}
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

      {/* Search Bottom Sheet - kept mounted so the slide animation plays on
          open/close; it controls its own visibility via the `visible` prop. */}
      <SearchBottomSheet
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        navigation={navigation}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        navigation={navigation}
      />

      <BecomeSellerSheet
        visible={sellerSheetVisible}
        onClose={() => setSellerSheetVisible(false)}
        onSubmitted={handleSellerRequestSubmitted}
        defaultName={user?.name || ''}
        defaultMobile={user?.mobile || ''}
        defaultEmail={user?.email || ''}
      />
    </View>
  );
};

export default HomeScreen;
