import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import ShareBottomSheet from './ShareBottomSheet';
import catalogService, {
  Material,
  Review,
  RatingStats,
  Faq,
} from '../services/catalogService';
import {showAppAlert} from '../components/AlertProvider';
import orderService from '../services/orderService';
import Svg, {
  Path,
  Circle,
  Line,
  Rect,
  G,
  ClipPath,
  Defs,
} from 'react-native-svg';
import {scale, SCREEN_WIDTH} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {
  ChevronDownIcon,
  MinusIcon,
  PlusIcon,
} from '../components/icons';
import {
  useAppDispatch,
  useAppSelector,
  addCartItem,
  incrementCartItem,
  decrementCartItem,
  cartItemFromMaterial,
  selectCartItems,
} from '../store';
import {formatCurrency} from '../utils/currency';

const productCement = require('../assets/images/product-cement.png');
const couponLogo = require('../assets/images/coupon-one-logo.png');

// --- Icon Components ---

const BackArrowIcon = () => (
  <Svg width={scale(24)} height={scale(23)} viewBox="0 0 24 23" fill="none">
    <Line x1={22} y1={11.5} x2={3} y2={11.5} stroke={COLORS.textPrimary} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    <Path
      d="M11.5 21.5L1.5 11.5L11.5 1.5"
      stroke={COLORS.textPrimary}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WhatsAppIcon = () => (
  <View style={{width: scale(24), height: scale(24), borderRadius: scale(12), backgroundColor: COLORS.whatsapp, alignItems: 'center', justifyContent: 'center'}}>
    <Svg width={scale(14)} height={scale(14)} viewBox="0 0 9 8" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.05 0.347656C1.9 0.0164063 1.74375 0.0101563 1.60313 0.00390635C1.4875 -0.00234365 1.35625 0.000781155 1.22188 0.000781155C1.09063 0.000781155 0.875 0.050781 0.69375 0.247656C0.5125 0.444531 0 0.925781 0 1.90078C0 2.87578 0.709375 3.81953 0.809375 3.95078C0.909375 4.08203 2.18125 6.14766 4.19375 6.94141C5.86875 7.60078 6.20937 7.46953 6.57187 7.43828C6.93437 7.40703 7.74375 6.96016 7.90938 6.49766C8.075 6.03516 8.075 5.63828 8.025 5.55703C7.975 5.47578 7.84375 5.42578 7.64375 5.32578C7.44688 5.22578 6.47187 4.74766 6.29062 4.68203C6.10937 4.61641 5.97813 4.58203 5.84375 4.78203C5.7125 4.97891 5.33125 5.42578 5.21562 5.55703C5.1 5.68828 4.98438 5.70703 4.7875 5.60703C4.59063 5.50703 3.95 5.29766 3.19375 4.62266C2.60312 4.09766 2.20625 3.44766 2.09062 3.25078C1.975 3.05391 2.07812 2.94453 2.17812 2.84766C2.26562 2.76016 2.375 2.61641 2.475 2.50078C2.575 2.38516 2.60625 2.30391 2.67188 2.16953C2.7375 2.03828 2.70625 1.92266 2.65625 1.82266C2.6125 1.71953 2.22813 0.741406 2.05 0.347656Z"
        fill={COLORS.textWhite}
      />
    </Svg>
  </View>
);

const StarFilledIcon = ({size = 14, color = '#FFD700'}: {size?: number; color?: string}) => (
  <Svg width={scale(size)} height={scale(size)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      fill={color}
    />
  </Svg>
);

const StarEmptyIcon = ({size = 14}: {size?: number}) => (
  <Svg width={scale(size)} height={scale(size)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      stroke={COLORS.grayBg}
      strokeWidth={1.5}
      fill="none"
    />
  </Svg>
);

const ChevronRightIcon = () => (
  <Svg width={scale(8)} height={scale(14)} viewBox="0 0 8 14" fill="none">
    <Path
      d="M1 1L7 7L1 13"
      stroke={COLORS.textPrimary}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CartIcon = () => (
  <Svg width={scale(16)} height={scale(16)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z"
      stroke={COLORS.textPrimary}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z"
      stroke={COLORS.textPrimary}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M1 1H5L7.68 14.39C7.77 14.8504 8.02 15.264 8.38 15.5583C8.74 15.8526 9.19 16.0084 9.66 16H19.4C19.8693 16.0084 20.3206 15.8526 20.68 15.5583C21.0406 15.264 21.29 14.8504 21.38 14.39L23 6H6"
      stroke={COLORS.textPrimary}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TruckIcon = () => (
  <Svg width={scale(20)} height={scale(20)} viewBox="0 0 24 24" fill="none">
    <Path d="M16 3H1V16H16V3Z" stroke={COLORS.textPrimary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 8H20L23 11V16H16V8Z" stroke={COLORS.textPrimary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5.5 21C6.88071 21 8 19.8807 8 18.5C8 17.1193 6.88071 16 5.5 16C4.11929 16 3 17.1193 3 18.5C3 19.8807 4.11929 21 5.5 21Z" stroke={COLORS.textPrimary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 21C19.8807 21 21 19.8807 21 18.5C21 17.1193 19.8807 16 18.5 16C17.1193 16 16 17.1193 16 18.5C16 19.8807 17.1193 21 18.5 21Z" stroke={COLORS.textPrimary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UpiIcon = () => (
  <Svg width={scale(46)} height={scale(19)} viewBox="0 0 46 19" fill="none">
    <G clipPath="url(#clip0_upi)">
      <Path d="M36.591 18.6346C41.4026 18.6346 45.3031 14.5449 45.3031 9.49997C45.3031 4.45506 41.4026 0.365356 36.591 0.365356C31.7795 0.365356 27.8789 4.45506 27.8789 9.49997C27.8789 14.5449 31.7795 18.6346 36.591 18.6346Z" fill="#FEF5F4" stroke="#EAEAEA" />
      <Path d="M40.774 9.60304C40.774 9.29611 40.7531 8.9965 40.6973 8.68958H36.6758V10.4142H38.9828C38.8852 10.9696 38.5785 11.4592 38.1324 11.7734V12.8915H39.5055C40.307 12.1169 40.774 10.9623 40.774 9.60304Z" fill="#4285F4" />
      <Path d="M36.6746 13.9729C37.8246 13.9729 38.7934 13.5783 39.5043 12.8914L38.1313 11.7733C37.7479 12.0437 37.2531 12.2044 36.6816 12.2044C35.5664 12.2044 34.6255 11.4152 34.284 10.3556H32.8691V11.5102C33.587 13.0229 35.0646 13.9729 36.6746 13.9729Z" fill="#34A853" />
      <Path d="M34.2778 10.3552C34.0966 9.79977 34.0966 9.20054 34.2778 8.64515V7.49054H32.863C32.2566 8.75477 32.2566 10.2455 32.863 11.5098L34.2778 10.3552Z" fill="#FBBC04" />
      <Path d="M36.6757 6.7963C37.2821 6.78899 37.8745 7.03015 38.3136 7.46861L39.5333 6.18976C38.7596 5.42976 37.7351 5.01322 36.6757 5.02784C35.0657 5.02784 33.5881 5.98515 32.8633 7.49053L34.2781 8.64515C34.6196 7.58553 35.5606 6.7963 36.6757 6.7963Z" fill="#EA4335" />
      <Path d="M22.9992 18.6345C27.8108 18.6345 31.7114 14.5448 31.7114 9.49985C31.7114 4.45494 27.8108 0.365234 22.9992 0.365234C18.1877 0.365234 14.2871 4.45494 14.2871 9.49985C14.2871 14.5448 18.1877 18.6345 22.9992 18.6345Z" fill="#5F259F" stroke="#EAEAEA" />
      <Path d="M26.0377 7.97308C26.0377 7.71001 25.8216 7.48347 25.5707 7.48347H24.7134L22.748 5.11578C22.5668 4.89654 22.281 4.82347 21.9952 4.89654L21.3122 5.12308C21.2077 5.15962 21.1659 5.31308 21.2425 5.38616L23.3892 7.52731H20.1343C20.0298 7.52731 19.9531 7.60039 19.9531 7.71731V8.09001C19.9531 8.35308 20.1692 8.57962 20.4201 8.57962H20.9219V10.3773C20.9219 11.7292 21.6049 12.5185 22.748 12.5185C23.1034 12.5185 23.3892 12.4819 23.7516 12.3285V13.5269C23.7516 13.8631 24.0025 14.1262 24.3231 14.1262H24.8249C24.9295 14.1262 25.041 14.0165 25.041 13.8996V8.53578H25.8634C25.968 8.53578 26.0446 8.4627 26.0446 8.34578V7.97308H26.0377ZM23.7516 11.2031C23.5356 11.3127 23.2498 11.3565 23.0337 11.3565C22.4622 11.3565 22.1765 11.0569 22.1765 10.3773V8.57962H23.7516V11.2031Z" fill="white" />
      <Path d="M9.40939 18.736C14.221 18.736 18.1215 14.6463 18.1215 9.60141C18.1215 4.5565 14.221 0.466797 9.40939 0.466797C4.59782 0.466797 0.697266 4.5565 0.697266 9.60141C0.697266 14.6463 4.59782 18.736 9.40939 18.736Z" fill="#F8FDFE" stroke="#EAEAEA" />
      <Path fillRule="evenodd" clipRule="evenodd" d="M15.9061 8.70268C15.7946 8.32999 15.4601 8.07422 15.0907 8.07422H15.0768C14.8328 8.07422 14.6028 8.18383 14.4495 8.35191C14.2961 8.17653 14.0661 8.07422 13.8222 8.07422H13.8083C13.5922 8.07422 13.3901 8.1546 13.2368 8.30076V8.23499C13.2368 8.16922 13.174 8.10345 13.1113 8.10345H12.5258C12.4492 8.10345 12.4004 8.16922 12.4004 8.23499V11.6184C12.4004 11.6988 12.4631 11.75 12.5258 11.75H13.1113C13.174 11.75 13.2228 11.6988 13.2368 11.6331V9.18499C13.2507 9.07537 13.3274 8.98768 13.4389 8.97306H13.5434C13.5922 8.97306 13.634 9.0023 13.6689 9.02422C13.7177 9.06076 13.7455 9.13383 13.7455 9.21422V11.6331C13.7455 11.7134 13.8083 11.7646 13.871 11.7646H14.4565C14.5192 11.7646 14.5819 11.7134 14.5819 11.6331V9.20691C14.5819 9.12653 14.6168 9.06076 14.6725 9.0096C14.7004 8.98037 14.7352 8.97306 14.7771 8.97306H14.8816C15.0071 8.98768 15.0837 9.08999 15.0837 9.1996V11.6038C15.0837 11.6842 15.1465 11.7354 15.2092 11.7354H15.7946C15.8713 11.7354 15.9201 11.6696 15.9201 11.6038V9.02422C15.9549 8.84883 15.934 8.76845 15.9061 8.70268Z" fill="#00BAF2" />
      <Path fillRule="evenodd" clipRule="evenodd" d="M11.968 8.11025H11.6334V7.53294C11.6334 7.46717 11.5846 7.41602 11.5219 7.41602C11.508 7.41602 11.508 7.41602 11.494 7.41602C11.1246 7.52563 11.2013 8.07371 10.5252 8.12486H10.4625C10.4486 8.12486 10.4486 8.12486 10.4346 8.12486C10.3719 8.13948 10.3301 8.19063 10.3301 8.2564V8.87025C10.3301 8.95063 10.3928 9.00179 10.4555 9.00179H10.811V11.6472C10.811 11.7276 10.8598 11.7787 10.9364 11.7787H11.508C11.5846 11.7787 11.6334 11.7129 11.6334 11.6472V9.00179H11.968C12.0446 9.00179 12.0934 8.93602 12.0934 8.87025V8.24178C12.0934 8.1614 12.0307 8.11025 11.968 8.11025Z" fill="#00BAF2" />
      <Path fillRule="evenodd" clipRule="evenodd" d="M9.86297 8.10938H9.27751C9.20085 8.10938 9.15206 8.17514 9.15206 8.24091V9.52707C9.15206 9.60745 9.08933 9.67322 9.01267 9.67322H8.76873C8.69206 9.67322 8.62933 9.60745 8.62933 9.52707V8.24091C8.62933 8.16053 8.5666 8.10938 8.50388 8.10938H7.91842C7.84176 8.10938 7.79297 8.17514 7.79297 8.24091V9.65861C7.79297 10.1921 8.14842 10.5794 8.65024 10.5794H9.01963C9.01963 10.5794 9.03357 10.5794 9.04751 10.5794C9.11024 10.594 9.15903 10.6451 9.15903 10.7255C9.15903 10.8059 9.11024 10.8571 9.04751 10.8717C9.04751 10.8717 9.04751 10.8717 9.03357 10.8717H8.1763C8.09963 10.8717 8.05085 10.9375 8.05085 11.0032V11.6317C8.05085 11.7121 8.11357 11.7632 8.1763 11.7632H9.13115C9.626 11.7632 9.98842 11.3759 9.98842 10.8425V8.23361C9.98842 8.16053 9.93964 8.10938 9.86297 8.10938Z" fill={COLORS.textPrimary} />
      <Path fillRule="evenodd" clipRule="evenodd" d="M4.23103 9.24937V9.63668C4.23103 9.71707 4.1683 9.78284 4.09163 9.78284H4.03588H3.72224V9.00822H4.09163C4.1683 9.00822 4.23103 9.07399 4.23103 9.15437V9.24937ZM4.27982 8.10938H3.00436C2.94163 8.10938 2.87891 8.17514 2.87891 8.24091V11.6244C2.87891 11.7048 2.92769 11.7559 2.99042 11.7559H3.58982C3.66648 11.7559 3.71527 11.6901 3.71527 11.6244V10.6744H4.27285C4.74679 10.6744 5.06042 10.3236 5.06042 9.83399V8.94976C5.06739 8.46014 4.73982 8.10938 4.27982 8.10938Z" fill={COLORS.textPrimary} />
      <Path fillRule="evenodd" clipRule="evenodd" d="M6.63643 10.7036V10.7986C6.63643 10.8132 6.63643 10.8132 6.63643 10.8278C6.63643 10.8425 6.63643 10.8425 6.63643 10.8571C6.6225 10.9082 6.57371 10.9521 6.51098 10.9521H6.26704C6.19037 10.9521 6.12765 10.8863 6.12765 10.8205V10.7036V10.3967V10.3017C6.12765 10.2213 6.19037 10.1701 6.26704 10.1701H6.51098C6.58765 10.1701 6.65037 10.2359 6.65037 10.3017V10.7182H6.63643V10.7036ZM6.5528 8.10938H5.74431C5.66765 8.10938 5.61886 8.16053 5.61886 8.24091V8.82553C5.61886 8.90591 5.68159 8.95707 5.75825 8.95707H6.52492C6.58765 8.97168 6.63643 9.00822 6.63643 9.08861V9.16899C6.6225 9.23476 6.58765 9.28591 6.52492 9.30053H6.14159C5.6328 9.30053 5.27734 9.65861 5.27734 10.1701V10.8936C5.27734 11.3978 5.58401 11.7486 6.0928 11.7486H7.15219C7.34037 11.7486 7.49371 11.6025 7.49371 11.3978V9.03014C7.49371 8.46745 7.21492 8.10938 6.5528 8.10938Z" fill={COLORS.textPrimary} />
    </G>
    <Defs>
      <ClipPath id="clip0_upi">
        <Rect width={46} height={19} fill={COLORS.backgroundWhite} />
      </ClipPath>
    </Defs>
  </Svg>
);

// Emoji index 0..4 maps to a 1..5 star rating.
const FEEDBACK_EMOJIS = ['😡', '😞', '😐', '😊', '😍'];

// Format an ISO date as "25 Jun 2024".
const formatReviewDate = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const PriceRow: React.FC<{label: string; value: string; emphasis?: boolean}> = ({
  label,
  value,
  emphasis,
}) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: scale(3),
    }}>
    <Text
      style={{
        fontFamily: emphasis ? FONTS.semiBold : FONTS.regular,
        fontSize: scale(13),
        color: emphasis ? COLORS.textPrimary : COLORS.textSecondary,
      }}>
      {label}
    </Text>
    <Text
      style={{
        fontFamily: emphasis ? FONTS.bold : FONTS.medium,
        fontSize: scale(13),
        color: COLORS.textPrimary,
      }}>
      {value}
    </Text>
  </View>
);

const ProductDetailScreen: React.FC<{navigation?: any; route?: any}> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const productId: string | undefined = route?.params?.productId;
  const initialMaterial: Material | undefined = route?.params?.material;

  const [material, setMaterial] = useState<Material | undefined>(initialMaterial);
  const [loadingDetail, setLoadingDetail] = useState(!initialMaterial);
  const [relatedProducts, setRelatedProducts] = useState<Material[]>([]);
  const [shareVisible, setShareVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [pinCode, setPinCode] = useState('201309');
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [hasOrderedProduct, setHasOrderedProduct] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const user = useAppSelector(s => s.app.user);
  const cartItems = useAppSelector(selectCartItems);

  // Refetch full material detail by id so we always have the latest data
  useEffect(() => {
    let cancelled = false;
    const id = productId || initialMaterial?._id;
    if (!id) return;
    (async () => {
      try {
        const res = await catalogService.getMaterialDetail(id);
        if (!cancelled && res.data?.success && res.data.data) {
          setMaterial(res.data.data);
        }
      } catch {
        // keep initial material if fetch fails
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, initialMaterial?._id]);

  // Fetch related products: prefer same subcategory, fall back to category
  useEffect(() => {
    if (!material) return;
    let cancelled = false;
    const subId = material.subCategory?._id;
    const catId = material.category?._id;
    (async () => {
      try {
        let items: Material[] = [];
        if (subId) {
          const res = await catalogService.getMaterials({
            subCategory: subId,
            limit: 10,
          });
          if (res.data?.success) items = res.data.data;
        }
        const filtered = items.filter(i => i._id !== material._id);
        if (filtered.length < 2 && catId) {
          const res = await catalogService.getMaterials({
            category: catId,
            limit: 10,
          });
          if (res.data?.success) {
            const merged = [...filtered];
            res.data.data.forEach(i => {
              if (
                i._id !== material._id &&
                !merged.some(m => m._id === i._id)
              ) {
                merged.push(i);
              }
            });
            items = merged;
          }
        } else {
          items = filtered;
        }
        if (!cancelled) setRelatedProducts(items.slice(0, 6));
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [material?._id, material?.subCategory?._id, material?.category?._id]);

  // Check whether the logged-in user has ordered this product before — only
  // then can they leave feedback/rating. Skips cancelled orders.
  useEffect(() => {
    if (!user?._id || !material?._id) {
      setHasOrderedProduct(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await orderService.list('all');
        if (cancelled || !res.data?.success) return;
        const owned = res.data.data.some(order => {
          if (order.status === 'cancelled') return false;
          const matId =
            typeof order.material === 'string'
              ? order.material
              : order.material?._id;
          return matId === material._id;
        });
        setHasOrderedProduct(owned);
      } catch {
        // ignore — feedback stays gated
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?._id, material?._id]);

  // Load real reviews + rating stats for this material.
  const loadReviews = useCallback(async (id: string) => {
    try {
      const res = await catalogService.getReviews(id);
      if (res.data?.success) {
        setReviews(res.data.data || []);
        setRatingStats(res.data.stats || null);
      }
    } catch {
      // leave empty — section just won't render
    }
  }, []);

  useEffect(() => {
    const id = material?._id || productId;
    if (id) loadReviews(id);
  }, [material?._id, productId, loadReviews]);

  // Load FAQs (global + this material's category) from the backend.
  useEffect(() => {
    let cancelled = false;
    catalogService
      .getFaqs(material?.category?._id)
      .then(res => {
        if (!cancelled && res.data?.success) setFaqs(res.data.data || []);
      })
      .catch(() => {
        /* no FAQs — section stays hidden */
      });
    return () => {
      cancelled = true;
    };
  }, [material?.category?._id]);

  const handleSubmitReview = async () => {
    const id = material?._id || productId;
    if (!id) return;
    if (selectedEmoji === null) {
      showAppAlert({
        title: 'Select a rating',
        message: 'Please tap an emoji to rate this product.',
      });
      return;
    }
    setSubmittingReview(true);
    try {
      const rating = selectedEmoji + 1; // emoji 0..4 -> 1..5 stars
      const res = await catalogService.submitReview(id, {
        rating,
        comment: feedbackText.trim() || undefined,
      });
      if (res.data?.stats) setRatingStats(res.data.stats);
      setSelectedEmoji(null);
      setFeedbackText('');
      await loadReviews(id);
      showAppAlert({
        title: 'Thank you!',
        message: 'Your feedback has been submitted.',
      });
    } catch (err: any) {
      showAppAlert({
        title: 'Could not submit',
        message:
          err?.response?.data?.message ||
          'Failed to submit your feedback. Please try again.',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = () => {
    if (!material) return;
    // Override the quantity so additive adds use exactly the user's pick
    // (cartItemFromMaterial enforces minOrderQty, which we only want for
    // a brand-new line item — the reducer adds quantities together).
    dispatch(
      addCartItem({
        ...cartItemFromMaterial(material, quantity),
        quantity,
      }),
    );
    showAppAlert({
      title: 'Added to cart',
      message: `${material.name} has been added to your cart.`,
    });
  };

  const handleBuyNow = () => {
    if (!material) return;
    const item = {
      ...cartItemFromMaterial(material, quantity),
      quantity,
    };
    navigation?.navigate('PaymentMethod', {buyNowItem: item});
  };

  // Quote-only materials (e.g. steel, sold at live rates) skip the
  // price / cart / buy-now flow and route to the quotation form instead.
  const requiresQuote = !!material?.requestQuote;

  const handleGetQuote = () => {
    navigation?.navigate('GetQuotation', {
      isLoggedIn: true,
      productName: material?.name,
      categoryId: material?.category?._id,
      categoryName: material?.category?.name,
      subCategoryId: material?.subCategory?._id,
      subCategoryName: material?.subCategory?.name,
      materialId: material?._id,
      materialName: material?.name,
    });
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const CARD_WIDTH = (SCREEN_WIDTH - scale(48)) / 2;

  // Derived display values from material data
  const productName =
    material?.name || route?.params?.productName || 'Product';
  const productImages: string[] =
    material?.images && material.images.length > 0 ? material.images : [];
  const sellingPrice = material?.finalSellingPrice ?? 0;
  const mrp = material?.mrp ?? 0;
  const hasDiscount = mrp > 0 && sellingPrice > 0 && sellingPrice < mrp;
  const savings = hasDiscount ? mrp - sellingPrice : 0;
  const discountPct = hasDiscount ? Math.round((savings / mrp) * 100) : 0;

  // Price summary breakdown (mirrors admin view)
  const gstRate = material?.gst ?? 0;
  const basicPrice = material?.basicPrice ?? 0;
  const sellingPriceExGst = material?.sellingPrice ?? 0;
  const gstOnBasic = basicPrice * (gstRate / 100);
  const gstOnSelling = sellingPriceExGst * (gstRate / 100);
  const showPriceSummary = basicPrice > 0 || sellingPriceExGst > 0 || mrp > 0;


  const getRelatedDiscount = (item: Material) => {
    if (item.mrp > 0 && item.finalSellingPrice > 0 && item.finalSellingPrice < item.mrp) {
      const pct = Math.round(((item.mrp - item.finalSellingPrice) / item.mrp) * 100);
      return `${pct}%OFF`;
    }
    return null;
  };

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundWhite} translucent />

      {/* Header */}
      <View
        style={{
          backgroundColor: COLORS.backgroundWhite,
          paddingBottom: scale(12),
          paddingTop: scale(40),
          paddingHorizontal: scale(16),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={{padding: scale(4)}}>
          <BackArrowIcon />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: FONTS.semiBold,
            fontSize: scale(16),
            color: COLORS.textPrimary,
          }}>
          Product Details
        </Text>
        <TouchableOpacity
          onPress={() => setShareVisible(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: scale(20),
            borderWidth: 1,
            borderColor: COLORS.border,
            paddingHorizontal: scale(12),
            paddingVertical: scale(6),
            gap: scale(6),
          }}>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: scale(12),
              color: COLORS.textPrimary,
            }}>
            Share
          </Text>
          <WhatsAppIcon />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{flex: 1}}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Product Image - gray bg, square */}
        <View
          style={{
            backgroundColor: COLORS.grayBg,
            width: SCREEN_WIDTH,
            aspectRatio: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {loadingDetail && productImages.length === 0 ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : productImages.length === 0 ? (
            <Image
              source={productCement}
              style={{width: '100%', height: '100%'}}
              resizeMode="cover"
            />
          ) : (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={event => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                );
                setActiveImageIndex(index);
              }}
              style={{width: SCREEN_WIDTH, height: '100%'}}>
              {productImages.map((uri, index) => (
                <Image
                  key={`${uri}-${index}`}
                  source={{uri}}
                  style={{width: SCREEN_WIDTH, height: '100%'}}
                  resizeMode="contain"
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* White content area with rounded top */}
        <View
          style={{
            borderTopLeftRadius: scale(28),
            borderTopRightRadius: scale(28),
            backgroundColor: COLORS.backgroundWhite,
            marginTop: scale(-28),
          }}>
          {/* Image dots */}
          {productImages.length > 1 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: scale(16),
                gap: scale(6),
              }}>
              {productImages.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: activeImageIndex === index ? scale(18) : scale(6),
                    height: scale(6),
                    borderRadius: scale(3),
                    backgroundColor:
                      activeImageIndex === index ? COLORS.yellowIcon : '#C1C8CE',
                  }}
                />
              ))}
            </View>
          )}

        {/* Product Info */}
        <View
          style={{
            paddingHorizontal: scale(16),
            paddingBottom: scale(16),
            paddingTop: scale(12),
          }}>
          {/* Rating summary — shown once real reviews exist */}
          {ratingStats && ratingStats.total > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: scale(6),
                marginBottom: scale(2),
              }}>
              <View style={{flexDirection: 'row'}}>
                {[1, 2, 3, 4, 5].map(star =>
                  star <= Math.round(ratingStats.average) ? (
                    <StarFilledIcon key={star} size={14} />
                  ) : (
                    <StarEmptyIcon key={star} size={14} />
                  ),
                )}
              </View>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(13),
                  color: COLORS.textPrimary,
                }}>
                {ratingStats.average.toFixed(1)}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(12),
                  color: COLORS.textSecondary,
                }}>
                ({ratingStats.total}{' '}
                {ratingStats.total === 1 ? 'review' : 'reviews'})
              </Text>
            </View>
          )}
          {/* Name */}
          <Text
            style={{
              marginTop: scale(4),
              fontFamily: FONTS.semiBold,
              fontSize: scale(18),
              color: COLORS.textPrimary,
            }}>
            {productName}
          </Text>

          {/* Brand */}
          {!!material?.brand && (
            <Text
              style={{
                marginTop: scale(2),
                fontFamily: FONTS.regular,
                fontSize: scale(12),
                color: COLORS.textSecondary,
              }}>
              Brand: {material.brand}
            </Text>
          )}

          {/* Price */}
          <View
            style={{
              marginTop: scale(8),
              flexDirection: 'row',
              alignItems: 'center',
              gap: scale(10),
              flexWrap: 'wrap',
            }}>
            <View
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: scale(20),
                paddingHorizontal: scale(16),
                paddingVertical: scale(6),
              }}>
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: scale(requiresQuote ? 16 : 22),
                  color: COLORS.textPrimary,
                }}>
                {requiresQuote
                  ? 'Price on request'
                  : `${formatCurrency(sellingPrice)}${
                      material?.unit ? `/${material.unit}` : ''
                    }`}
              </Text>
            </View>
            {!requiresQuote && hasDiscount && (
              <>
                <Text
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: scale(14),
                    color: COLORS.textSecondary,
                  }}>
                  MRP{' '}
                  <Text style={{textDecorationLine: 'line-through', color: COLORS.discountRed}}>
                    {formatCurrency(mrp)}
                  </Text>
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: scale(16),
                    color: COLORS.discountGreen,
                  }}>
                  {discountPct}% OFF
                </Text>
              </>
            )}
          </View>

          {/* Price Summary — mirrors admin breakdown */}
          {!requiresQuote && showPriceSummary && (
            <View
              style={{
                marginTop: scale(14),
                borderRadius: scale(12),
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.backgroundWhite,
                padding: scale(14),
              }}>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(14),
                  color: COLORS.textPrimary,
                  marginBottom: scale(10),
                }}>
                Price Summary
              </Text>

              <PriceRow
                label="Basic Price:"
                value={formatCurrency(basicPrice)}
              />
              <PriceRow
                label={`GST (${gstRate}%):`}
                value={`+ ${formatCurrency(gstOnBasic)}`}
              />
              <PriceRow
                label="MRP (incl. GST):"
                value={formatCurrency(mrp)}
                emphasis
              />

              <View
                style={{
                  height: 1,
                  backgroundColor: COLORS.divider,
                  marginVertical: scale(8),
                }}
              />

              <PriceRow
                label="Selling Price:"
                value={formatCurrency(sellingPriceExGst)}
              />
              <PriceRow
                label={`GST on Selling Price (${gstRate}%):`}
                value={`+ ${formatCurrency(gstOnSelling)}`}
              />
              <PriceRow
                label="Selling Price (SP):"
                value={formatCurrency(sellingPrice)}
                emphasis
              />
            </View>
          )}

          {/* Description */}
          {!!material?.description && (
            <Text
              style={{
                marginTop: scale(10),
                fontFamily: FONTS.regular,
                fontSize: scale(13),
                color: COLORS.textSecondary,
                lineHeight: scale(18),
              }}>
              {material.description}
            </Text>
          )}
        </View>

        {/* Offer card — only when there's a real saving */}
        {!requiresQuote && hasDiscount && (
          <View
            style={{
              marginHorizontal: scale(16),
              marginTop: scale(12),
              borderRadius: scale(12),
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.backgroundWhite,
              flexDirection: 'row',
              alignItems: 'center',
              padding: scale(12),
            }}>
            <Image
              source={couponLogo}
              style={{
                width: scale(50),
                height: scale(50),
                borderRadius: scale(8),
                marginRight: scale(12),
              }}
              resizeMode="cover"
            />
            <View style={{flex: 1}}>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: scale(14),
                  color: COLORS.textPrimary,
                }}>
                Save {formatCurrency(savings)} on this item
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(12),
                  color: COLORS.warning,
                }}>
                {discountPct}% off MRP
              </Text>
            </View>
            <ChevronRightIcon />
          </View>
        )}

        {/* Get a Quote — for quote-only materials, replaces cart / buy-now */}
        {requiresQuote && (
          <TouchableOpacity
            onPress={handleGetQuote}
            disabled={!material}
            style={{
              marginHorizontal: scale(16),
              marginTop: scale(16),
              height: scale(48),
              borderRadius: scale(24),
              backgroundColor: COLORS.primary,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: COLORS.secondary,
              opacity: material ? 1 : 0.5,
            }}>
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(15),
                color: COLORS.textPrimary,
                textTransform: 'uppercase',
              }}>
              Get a Quote
            </Text>
          </TouchableOpacity>
        )}

        {/* Quantity + Add to Cart */}
        {!requiresQuote && (
        <View
          style={{
            marginHorizontal: scale(16),
            marginTop: scale(16),
            flexDirection: 'row',
            alignItems: 'center',
            gap: scale(12),
          }}>
          {/* Quantity selector */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: scale(25),
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.backgroundWhite,
              paddingHorizontal: scale(6),
              paddingVertical: scale(4),
            }}>
            <TouchableOpacity
              onPress={decrementQuantity}
              style={{
                width: scale(36),
                height: scale(36),
                borderRadius: scale(18),
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <MinusIcon />
            </TouchableOpacity>
            <Text
              style={{
                marginHorizontal: scale(16),
                fontFamily: FONTS.semiBold,
                fontSize: scale(16),
                color: COLORS.textPrimary,
                minWidth: scale(20),
                textAlign: 'center',
              }}>
              {quantity}
            </Text>
            <TouchableOpacity
              onPress={incrementQuantity}
              style={{
                width: scale(36),
                height: scale(36),
                borderRadius: scale(18),
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <PlusIcon />
            </TouchableOpacity>
          </View>

          {/* Add to Cart button */}
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={!material}
            style={{
              flex: 1,
              height: scale(44),
              borderRadius: scale(22),
              borderWidth: 1.5,
              borderColor: COLORS.secondary,
              backgroundColor: COLORS.backgroundWhite,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: scale(8),
              opacity: material ? 1 : 0.5,
            }}>
            <CartIcon />
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(14),
                color: COLORS.textPrimary,
                textTransform: 'uppercase',
              }}>
              Add to Cart
            </Text>
          </TouchableOpacity>
        </View>
        )}

        {/* Buy It Now — direct checkout, bypasses cart */}
        {!requiresQuote && (
        <TouchableOpacity
          onPress={handleBuyNow}
          disabled={!material}
          style={{
            marginHorizontal: scale(16),
            marginTop: scale(12),
            height: scale(48),
            borderRadius: scale(24),
            backgroundColor: COLORS.primary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: COLORS.secondary,
            gap: scale(10),
            opacity: material ? 1 : 0.5,
          }}>
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: scale(15),
              color: COLORS.textPrimary,
              textTransform: 'uppercase',
            }}>
            Buy It Now
          </Text>
          <UpiIcon />
        </TouchableOpacity>
        )}

        {/* Delivery Info */}
        <View
          style={{
            marginHorizontal: scale(16),
            marginTop: scale(20),
            borderRadius: scale(12),
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: COLORS.backgroundWhite,
            padding: scale(16),
          }}>
          {/* On-time delivery */}
          <View style={{flexDirection: 'row', alignItems: 'center', gap: scale(8)}}>
            <TruckIcon />
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(14),
                color: COLORS.textPrimary,
              }}>
              95% Orders Delivered On-Time
            </Text>
          </View>

          {/* Estimated delivery */}
          <Text
            style={{
              marginTop: scale(8),
              fontFamily: FONTS.regular,
              fontSize: scale(12),
              color: COLORS.textSecondary,
            }}>
            Get estimated delivery date
          </Text>

          {/* Pin code input */}
          <View
            style={{
              marginTop: scale(8),
              flexDirection: 'row',
              alignItems: 'center',
              gap: scale(10),
            }}>
            <View
              style={{
                flex: 1,
                height: scale(38),
                borderRadius: scale(20),
                borderWidth: 1,
                borderColor: COLORS.border,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: scale(14),
              }}>
              <View
                style={{
                  width: scale(8),
                  height: scale(8),
                  borderRadius: scale(4),
                  backgroundColor: COLORS.secondary,
                  marginRight: scale(8),
                }}
              />
              <TextInput
                style={{
                  flex: 1,
                  fontFamily: FONTS.regular,
                  fontSize: scale(13),
                  color: COLORS.textPrimary,
                  padding: 0,
                }}
                value={pinCode}
                onChangeText={setPinCode}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            <TouchableOpacity
              style={{
                height: scale(38),
                borderRadius: scale(20),
                borderWidth: 1,
                borderColor: COLORS.warning,
                paddingHorizontal: scale(20),
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: scale(13),
                  color: COLORS.warning,
                }}>
                Check
              </Text>
            </TouchableOpacity>
          </View>

          {/* Delivery time */}
          <View
            style={{
              marginTop: scale(10),
              flexDirection: 'row',
              alignItems: 'center',
              gap: scale(6),
            }}>
            <View
              style={{
                width: scale(6),
                height: scale(6),
                borderRadius: scale(3),
                backgroundColor: COLORS.success,
              }}
            />
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: scale(13),
                color: COLORS.textPrimary,
              }}>
              Delivery within{' '}
              <Text style={{fontFamily: FONTS.semiBold}}>2 hr</Text>
            </Text>
          </View>
        </View>

        {/* You May Also Need — related products by sub-category, then category */}
        {relatedProducts.length > 0 && (
        <View style={{marginTop: scale(24)}}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: scale(16),
              marginBottom: scale(12),
            }}>
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(16),
                color: COLORS.textPrimary,
              }}>
              You May Also Need...
            </Text>
          </View>

          {/* Product cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: scale(16),
              gap: scale(12),
            }}>
            {relatedProducts.map(item => {
              const itemDiscount = getRelatedDiscount(item);
              const itemCartQty =
                cartItems.find(ci => ci.id === item._id)?.quantity || 0;
              return (
              <TouchableOpacity
                key={item._id}
                activeOpacity={0.85}
                onPress={() =>
                  navigation?.push('ProductDetail', {
                    productId: item._id,
                    productName: item.name,
                    material: item,
                  })
                }
                style={{
                  width: CARD_WIDTH,
                  borderRadius: scale(12),
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.backgroundWhite,
                  overflow: 'hidden',
                }}>
                <View
                  style={{
                    height: scale(120),
                    backgroundColor: COLORS.backgroundLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {item.images?.[0] ? (
                    <Image
                      source={{uri: item.images[0]}}
                      style={{height: scale(105), width: scale(102)}}
                      resizeMode="contain"
                    />
                  ) : (
                    <Image
                      source={productCement}
                      style={{height: scale(105), width: scale(102)}}
                      resizeMode="contain"
                    />
                  )}
                  {itemDiscount && (
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
                        }}>
                        {itemDiscount}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{paddingHorizontal: scale(8), paddingBottom: scale(4), paddingTop: scale(4)}}>
                  <Text
                    numberOfLines={2}
                    style={{
                      fontFamily: FONTS.regular,
                      fontSize: scale(14),
                      color: COLORS.textPrimary,
                    }}>
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
                      : `${formatCurrency(item.finalSellingPrice)}${
                          item.unit ? `/${item.unit}` : ''
                        }`}
                  </Text>
                </View>
                {item.requestQuote ? (
                  <TouchableOpacity
                    onPress={() =>
                      navigation?.navigate('GetQuotation', {
                        isLoggedIn: true,
                        materialId: item._id,
                        materialName: item.name,
                        categoryId: item.category?._id,
                        categoryName: item.category?.name,
                      })
                    }
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
                      }}>
                      Get a Quote
                    </Text>
                  </TouchableOpacity>
                ) : itemCartQty > 0 ? (
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
                      onPress={() => dispatch(decrementCartItem(item._id))}
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
                      {itemCartQty}
                    </Text>
                    <TouchableOpacity
                      onPress={() => dispatch(incrementCartItem(item._id))}
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
                    onPress={() =>
                      dispatch(addCartItem(cartItemFromMaterial(item, 1)))
                    }
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
                      }}>
                      Add to Cart
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        )}

        {/* Customer Reviews — real data from the reviews API */}
        {reviews.length > 0 && (
          <View style={{marginHorizontal: scale(16), marginTop: scale(24)}}>
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(16),
                color: COLORS.textPrimary,
                marginBottom: scale(12),
              }}>
              Customer Reviews
            </Text>
            {reviews.map(review => (
              <View
                key={review._id}
                style={{
                  borderRadius: scale(12),
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.backgroundWhite,
                  padding: scale(12),
                  marginBottom: scale(10),
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: scale(13),
                      color: COLORS.textPrimary,
                    }}>
                    {review.name}
                  </Text>
                  <View style={{flexDirection: 'row'}}>
                    {[1, 2, 3, 4, 5].map(star =>
                      star <= review.rating ? (
                        <StarFilledIcon key={star} size={12} />
                      ) : (
                        <StarEmptyIcon key={star} size={12} />
                      ),
                    )}
                  </View>
                </View>
                {review.comment ? (
                  <Text
                    style={{
                      marginTop: scale(4),
                      fontFamily: FONTS.regular,
                      fontSize: scale(12),
                      color: COLORS.textSecondary,
                    }}>
                    {review.comment}
                  </Text>
                ) : null}
                {formatReviewDate(review.createdAt) ? (
                  <Text
                    style={{
                      marginTop: scale(4),
                      fontFamily: FONTS.regular,
                      fontSize: scale(10),
                      color: COLORS.textPlaceholder,
                    }}>
                    {formatReviewDate(review.createdAt)}
                  </Text>
                ) : null}
                {review.reply?.text ? (
                  <View
                    style={{
                      marginTop: scale(8),
                      marginLeft: scale(12),
                      paddingLeft: scale(10),
                      borderLeftWidth: 2,
                      borderLeftColor: COLORS.primary,
                    }}>
                    <Text
                      style={{
                        fontFamily: FONTS.semiBold,
                        fontSize: scale(11),
                        color: COLORS.textPrimary,
                      }}>
                      OTG
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.regular,
                        fontSize: scale(12),
                        color: COLORS.textSecondary,
                      }}>
                      {review.reply.text}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* Send us your Feedback — only visible to customers who ordered this product */}
        {hasOrderedProduct ? (
        <View
          style={{
            marginHorizontal: scale(16),
            marginTop: scale(24),
            borderRadius: scale(16),
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: COLORS.backgroundWhite,
            padding: scale(16),
          }}>
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: scale(16),
              color: COLORS.textPrimary,
            }}>
            Send us your Feedback!
          </Text>

          {/* Emoji row */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: scale(12),
              marginTop: scale(14),
            }}>
            {FEEDBACK_EMOJIS.map((emoji, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedEmoji(index)}
                style={{
                  width: scale(40),
                  height: scale(40),
                  borderRadius: scale(20),
                  backgroundColor:
                    selectedEmoji === index ? COLORS.primary : COLORS.backgroundLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{fontSize: scale(20)}}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Feedback text input */}
          <TextInput
            style={{
              marginTop: scale(14),
              height: scale(90),
              borderRadius: scale(12),
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.background,
              padding: scale(12),
              fontFamily: FONTS.regular,
              fontSize: scale(13),
              color: COLORS.textPrimary,
              textAlignVertical: 'top',
            }}
            placeholder="Got suggestions? We'd love to hear them! (Optional)"
            placeholderTextColor={COLORS.textPlaceholder}
            multiline
            value={feedbackText}
            onChangeText={setFeedbackText}
          />

          {/* Send Feedback button */}
          <TouchableOpacity
            onPress={handleSubmitReview}
            disabled={submittingReview}
            style={{
              marginTop: scale(14),
              alignSelf: 'center',
              height: scale(44),
              paddingHorizontal: scale(30),
              borderRadius: scale(22),
              backgroundColor: COLORS.primary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: COLORS.secondary,
              opacity: submittingReview ? 0.6 : 1,
            }}>
            {submittingReview ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(14),
                  color: COLORS.textPrimary,
                }}>
                Send Feedback
              </Text>
            )}
          </TouchableOpacity>
        </View>
        ) : (
          <View
            style={{
              marginHorizontal: scale(16),
              marginTop: scale(24),
              borderRadius: scale(16),
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.backgroundWhite,
              padding: scale(16),
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: scale(13),
                color: COLORS.textSecondary,
                textAlign: 'center',
              }}>
              {user?._id
                ? 'Order this product to leave a rating or feedback.'
                : 'Log in and order this product to leave a rating or feedback.'}
            </Text>
          </View>
        )}

        {/* FAQs — real data from the FAQ API; tap to expand the answer */}
        {faqs.length > 0 && (
        <View
          style={{
            marginHorizontal: scale(16),
            marginTop: scale(24),
            marginBottom: scale(40),
          }}>
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: scale(16),
              color: COLORS.textPrimary,
              marginBottom: scale(12),
            }}>
            FAQs
          </Text>
          {faqs.map(faq => {
            const open = expandedFaq === faq._id;
            return (
              <TouchableOpacity
                key={faq._id}
                activeOpacity={0.7}
                onPress={() => setExpandedFaq(open ? null : faq._id)}
                style={{
                  borderRadius: scale(10),
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.backgroundWhite,
                  paddingHorizontal: scale(14),
                  paddingVertical: scale(12),
                  marginBottom: scale(8),
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: FONTS.medium,
                      fontSize: scale(13),
                      color: COLORS.textPrimary,
                    }}>
                    {faq.question}
                  </Text>
                  <ChevronDownIcon />
                </View>
                {open ? (
                  <Text
                    style={{
                      marginTop: scale(8),
                      fontFamily: FONTS.regular,
                      fontSize: scale(12),
                      color: COLORS.textSecondary,
                      lineHeight: scale(18),
                    }}>
                    {faq.answer}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
        )}
        </View>
      </ScrollView>

      <ShareBottomSheet
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
      />
    </View>
  );
};

export default ProductDetailScreen;
