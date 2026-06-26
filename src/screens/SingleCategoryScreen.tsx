import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import Svg, {
  Path,
  G,
  ClipPath,
  Defs,
  Mask,
  Rect,
} from 'react-native-svg';
import {scale, SCREEN_WIDTH} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {
  BackArrowIcon,
  SearchIcon,
  FilterIcon,
} from '../components/icons';
import {HeaderCartButton, HeaderProfileButton} from '../components';
import catalogService, {SubCategory, Material} from '../services/catalogService';
import {useAppDispatch, addCartItem, cartItemFromMaterial} from '../store';
import {formatCurrency} from '../utils/currency';

const bulkBanner = require('../assets/images/bulk-banner.png');

// --- Screen-specific small cart icon for product cards ---

const CartIcon = () => (
  <Svg width={scale(16)} height={scale(16)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z"
      stroke={COLORS.secondary}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z"
      stroke={COLORS.secondary}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M1 1H5L7.68 14.39C7.77 14.8504 8.02 15.264 8.38 15.5583C8.74 15.8526 9.19 16.0084 9.66 16H19.4C19.8693 16.0084 20.3206 15.8526 20.68 15.5583C21.0406 15.264 21.29 14.8504 21.38 14.39L23 6H6"
      stroke={COLORS.secondary}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// --- Bottom nav icons (screen-specific) ---

const OrdersIcon = () => (
  <Svg width={scale(25)} height={scale(25)} viewBox="0 0 25 25" fill="none">
    <G clipPath="url(#clip_orders_sc)">
      <Mask id="mask_orders_sc" maskUnits="userSpaceOnUse" x={-1} y={0} width={25} height={25}>
        <Path d="M-0.010498 0.500002H23.9895V24.5H-0.010498V0.500002Z" fill={COLORS.backgroundWhite} />
      </Mask>
      <G mask="url(#mask_orders_sc)">
        <Path d="M16.302 1.4375H7.677C5.08814 1.4375 2.9895 3.53614 2.9895 6.125V18.875C2.9895 21.4639 5.08814 23.5625 7.677 23.5625H16.302C18.8909 23.5625 20.9895 21.4639 20.9895 18.875V6.125C20.9895 3.53614 18.8909 1.4375 16.302 1.4375Z" stroke={COLORS.secondary} strokeWidth={2} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M16.1145 5.09375C16.1145 6.38816 15.0652 7.4375 13.7708 7.4375H10.2083C8.91385 7.4375 7.8645 6.38816 7.8645 5.09375" stroke={COLORS.secondary} strokeWidth={2} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M13.5833 13.5781H16.7708" stroke={COLORS.secondary} strokeWidth={2} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M13.5833 18.4062H16.7708" stroke={COLORS.secondary} strokeWidth={2} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M7.20825 12.4063L8.08013 13.2942C8.45546 13.6728 9.06403 13.6728 9.43941 13.2942L11.2395 11.4688" stroke={COLORS.secondary} strokeWidth={2} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M7.20825 17.2344L8.08013 18.1223C8.45546 18.5009 9.06403 18.5009 9.43941 18.1223L11.2395 16.2969" stroke={COLORS.secondary} strokeWidth={2} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      </G>
    </G>
    <Defs>
      <ClipPath id="clip_orders_sc"><Rect width={25} height={25} fill={COLORS.backgroundWhite} /></ClipPath>
    </Defs>
  </Svg>
);

const NavCartIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <G clipPath="url(#clip_cart_sc)">
      <Path d="M13.875 15.75H8.313C8.139 15.75 7.989 15.6315 7.9485 15.462L5.4885 5.0235C5.2065 3.8325 4.1565 3 2.9325 3H1.125C0.504 3 0 3.504 0 4.125C0 4.746 0.504 5.25 1.125 5.25H2.9325C3.108 5.25 3.258 5.3685 3.2985 5.538L5.7585 15.9765C6.0375 17.1675 7.089 18 8.313 18H13.875C14.4975 18 15 17.496 15 16.875C15 16.254 14.4975 15.75 13.875 15.75Z" fill={COLORS.secondary} />
      <Path d="M23.2065 6.04946C22.6125 5.86946 21.984 6.19946 21.7995 6.79346L19.125 15.4845C19.0755 15.642 18.9315 15.75 18.7665 15.75H17.625C17.004 15.75 16.5 16.254 16.5 16.875C16.5 17.496 17.004 18 17.625 18H18.7665C19.926 18 20.934 17.2545 21.276 16.1475L23.9505 7.45646C24.1335 6.86246 23.8005 6.23246 23.2065 6.04946Z" fill={COLORS.secondary} />
      <Path d="M9.75 19.5C8.5095 19.5 7.5 20.5095 7.5 21.75C7.5 22.9905 8.5095 24 9.75 24C10.9905 24 12 22.9905 12 21.75C12 20.5095 10.9905 19.5 9.75 19.5Z" fill={COLORS.secondary} />
      <Path d="M17.25 19.5C16.0095 19.5 15 20.5095 15 21.75C15 22.9905 16.0095 24 17.25 24C18.4905 24 19.5 22.9905 19.5 21.75C19.5 20.5095 18.4905 19.5 17.25 19.5Z" fill={COLORS.secondary} />
      <Path d="M10.125 5.625H12.375V7.875C12.375 8.496 12.879 9 13.5 9C14.121 9 14.625 8.496 14.625 7.875V5.625H16.875C17.496 5.625 18 5.121 18 4.5C18 3.879 17.496 3.375 16.875 3.375H14.625V1.125C14.625 0.504 14.121 0 13.5 0C12.879 0 12.375 0.504 12.375 1.125V3.375H10.125C9.504 3.375 9 3.879 9 4.5C9 5.121 9.504 5.625 10.125 5.625Z" fill={COLORS.secondary} />
    </G>
    <Defs>
      <ClipPath id="clip_cart_sc"><Rect width={24} height={24} fill={COLORS.backgroundWhite} /></ClipPath>
    </Defs>
  </Svg>
);

const QuotesIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Path d="M5.76 4.90503C3 4.90503 0.75 7.17753 0.75 9.96753C0.75 11.865 1.7775 13.5675 3.405 14.4375C3.3225 15.3225 2.955 17.205 1.4475 17.6175C1.0875 17.715 0.855 18.06 0.9 18.4275C0.945 18.795 1.245 19.08 1.62 19.0875H1.7325C2.4675 19.0875 6.5025 18.9225 9.1125 15.42C10.8075 13.1475 11.31 10.68 10.5375 8.50503C9.8925 6.35253 7.9725 4.90503 5.76 4.90503ZM7.905 14.5275C6.81 15.9975 5.3775 16.7625 4.1625 17.16C4.935 15.735 4.935 14.07 4.935 13.965C4.935 13.665 4.7475 13.3875 4.4625 13.275C3.12 12.735 2.25 11.43 2.25 9.96753C2.25 8.00253 3.825 6.40503 5.76 6.40503C7.305 6.40503 8.6475 7.42503 9.1125 8.97003C9.9375 11.2875 8.715 13.44 7.9125 14.52L7.905 14.5275Z" fill={COLORS.secondary} />
    <Path d="M22.9049 8.51248C22.2599 6.35998 20.3399 4.91248 18.1274 4.91248C15.3674 4.91248 13.1174 7.18498 13.1174 9.97498C13.1174 11.8725 14.1449 13.575 15.7724 14.445C15.6899 15.33 15.3224 17.2125 13.8149 17.625C13.4549 17.7225 13.2224 18.0675 13.2674 18.435C13.3124 18.8025 13.6124 19.0875 13.9874 19.095H14.0999C14.8349 19.095 18.8699 18.93 21.4799 15.4275C23.1749 13.155 23.6774 10.6875 22.9049 8.51248ZM20.2724 14.5275C19.1774 15.9975 17.7449 16.7625 16.5299 17.16C17.3024 15.735 17.3024 14.07 17.3024 13.965C17.3024 13.665 17.1149 13.3875 16.8299 13.275C15.4874 12.735 14.6174 11.43 14.6174 9.96748C14.6174 8.00248 16.1924 6.40498 18.1274 6.40498C19.6724 6.40498 21.0149 7.42498 21.4799 8.96998C22.3049 11.2875 21.0824 13.44 20.2799 14.52L20.2724 14.5275Z" fill={COLORS.secondary} />
  </Svg>
);

const NavProfileIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Path d="M12 23.25C9.77497 23.25 7.59989 22.5902 5.74984 21.354C3.89979 20.1179 2.45785 18.3609 1.60636 16.3052C0.754875 14.2495 0.532087 11.9875 0.966171 9.80524C1.40025 7.62295 2.47171 5.61839 4.04505 4.04505C5.61839 2.47171 7.62295 1.40025 9.80524 0.966171C11.9875 0.532087 14.2495 0.754875 16.3052 1.60636C18.3609 2.45785 20.1179 3.89979 21.354 5.74984C22.5902 7.59989 23.25 9.77497 23.25 12C23.2466 14.9827 22.0603 17.8422 19.9512 19.9512C17.8422 22.0603 14.9827 23.2466 12 23.25ZM12 2.25001C10.0716 2.25001 8.18657 2.82183 6.5832 3.89318C4.97982 4.96452 3.73013 6.48726 2.99218 8.26884C2.25423 10.0504 2.06114 12.0108 2.43735 13.9021C2.81355 15.7935 3.74215 17.5307 5.10571 18.8943C6.46928 20.2579 8.20656 21.1865 10.0979 21.5627C11.9892 21.9389 13.9496 21.7458 15.7312 21.0078C17.5127 20.2699 19.0355 19.0202 20.1068 17.4168C21.1782 15.8134 21.75 13.9284 21.75 12C21.747 9.41506 20.7188 6.93684 18.891 5.109C17.0632 3.28117 14.585 2.25298 12 2.25001Z" fill={COLORS.secondary} />
    <Path d="M12 12.75C11.3325 12.75 10.68 12.5521 10.125 12.1812C9.56994 11.8104 9.13735 11.2833 8.88191 10.6666C8.62646 10.0499 8.55963 9.37126 8.68985 8.71657C8.82008 8.06189 9.14151 7.46052 9.61352 6.98852C10.0855 6.51651 10.6869 6.19508 11.3416 6.06485C11.9963 5.93463 12.6749 6.00146 13.2916 6.25691C13.9083 6.51235 14.4354 6.94494 14.8062 7.49995C15.1771 8.05497 15.375 8.70749 15.375 9.375C15.374 10.2698 15.0181 11.1277 14.3854 11.7604C13.7527 12.3931 12.8948 12.749 12 12.75ZM12 7.5C11.6292 7.5 11.2666 7.60997 10.9583 7.816C10.65 8.02202 10.4096 8.31486 10.2677 8.65747C10.1258 9.00008 10.0887 9.37708 10.161 9.7408C10.2334 10.1045 10.412 10.4386 10.6742 10.7008C10.9364 10.9631 11.2705 11.1416 11.6342 11.214C11.9979 11.2863 12.3749 11.2492 12.7175 11.1073C13.0601 10.9654 13.353 10.725 13.559 10.4167C13.765 10.1084 13.875 9.74584 13.875 9.375C13.875 8.87772 13.6775 8.40081 13.3258 8.04918C12.9742 7.69755 12.4973 7.5 12 7.5Z" fill={COLORS.secondary} />
    <Path d="M16.5001 17.25C16.3012 17.2499 16.1104 17.1709 15.9698 17.0302C14.9156 15.9801 13.4881 15.3904 12.0001 15.3904C10.512 15.3904 9.08457 15.9801 8.03031 17.0302C7.88886 17.1669 7.69941 17.2425 7.50276 17.2407C7.30611 17.239 7.118 17.1602 6.97895 17.0211C6.83989 16.882 6.76101 16.6939 6.75931 16.4973C6.7576 16.3006 6.83319 16.1112 6.96981 15.9697C8.30536 14.6384 10.1143 13.8907 12.0001 13.8907C13.8859 13.8907 15.6948 14.6384 17.0303 15.9697C17.1352 16.0746 17.2066 16.2082 17.2355 16.3537C17.2644 16.4992 17.2496 16.65 17.1928 16.787C17.1361 16.924 17.04 17.0411 16.9167 17.1235C16.7933 17.206 16.6484 17.25 16.5001 17.25Z" fill={COLORS.secondary} />
  </Svg>
);

const HomeIcon = () => (
  <Svg width={scale(26)} height={scale(25)} viewBox="0 0 26 25" fill="none">
    <Path d="M22.5651 6.02286L15.3642 0.984787C13.4015 -0.390369 10.3887 -0.31536 8.50096 1.14731L2.23775 6.03536C0.987612 7.01047 0 9.01069 0 10.5859V19.2118C0 22.3997 2.58779 25 5.77565 25H19.2522C22.44 25 25.0278 22.4122 25.0278 19.2243V10.7484C25.0278 9.0607 23.9402 6.98547 22.5651 6.02286ZM13.4515 19.9994C13.4515 20.512 13.0265 20.937 12.5139 20.937C12.0014 20.937 11.5763 20.512 11.5763 19.9994V16.249C11.5763 15.7365 12.0014 15.3114 12.5139 15.3114C13.0265 15.3114 13.4515 15.7365 13.4515 16.249V19.9994Z" fill={COLORS.yellowIcon} />
  </Svg>
);

const CARD_WIDTH = (SCREEN_WIDTH - scale(48)) / 2;

const SingleCategoryScreen: React.FC<{navigation?: any; route?: any}> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const categoryId = route?.params?.categoryId || '';
  // Brand mode: this screen is reused from "Shop By Brands" to list a brand's
  // products. `brand` is the brand name string filtered server-side.
  const brandName = route?.params?.brand || '';
  const isBrandMode = !!brandName && !categoryId;
  const categoryName =
    route?.params?.categoryName || route?.params?.brand || 'Category';

  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedSubCat, setSelectedSubCat] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  // Initial load: materials (+ subcategories only in category mode).
  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseParams = isBrandMode
          ? {brand: brandName, limit: 50}
          : {category: categoryId, limit: 50};
        const requests: Promise<any>[] = [
          catalogService.getMaterials(baseParams),
        ];
        if (!isBrandMode) {
          requests.push(catalogService.getSubCategories(categoryId));
        }
        const [matRes, subCatRes] = await Promise.all(requests);
        if (matRes.data.success) setMaterials(matRes.data.data);
        if (subCatRes?.data?.success) setSubCategories(subCatRes.data.data);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    };
    if (categoryId || brandName) fetchData();
    else setLoading(false);
  }, [categoryId, brandName, isBrandMode]);

  // Fetch materials when subcategory filter changes (category mode only).
  useEffect(() => {
    if (!categoryId) return;
    const fetchFiltered = async () => {
      try {
        const res = await catalogService.getMaterials({
          category: categoryId,
          subCategory: selectedSubCat || undefined,
          search: searchText.trim() || undefined,
          limit: 50,
        });
        if (res.data.success) setMaterials(res.data.data);
      } catch {
        // silent fail
      }
    };
    fetchFiltered();
  }, [selectedSubCat]);

  // Search with debounce (works in both category and brand mode).
  useEffect(() => {
    if (!categoryId && !brandName) return;
    const timer = setTimeout(async () => {
      try {
        const res = await catalogService.getMaterials({
          category: categoryId || undefined,
          brand: brandName || undefined,
          subCategory: selectedSubCat || undefined,
          search: searchText.trim() || undefined,
          limit: 50,
        });
        if (res.data.success) setMaterials(res.data.data);
      } catch {
        // silent fail
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const renderProductCard = (item: Material) => {
    const discount = item.mrp > item.sellingPrice
      ? Math.round(((item.mrp - item.sellingPrice) / item.mrp) * 100)
      : 0;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation?.navigate('ProductDetail', {productId: item._id, productName: item.name, material: item})}
        key={item._id}
        style={{
          width: CARD_WIDTH,
          borderRadius: scale(12),
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.backgroundWhite,
          overflow: 'hidden',
          marginBottom: scale(16),
        }}>
        {/* Product image */}
        <View
          style={{
            height: scale(120),
            backgroundColor: COLORS.backgroundLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Image
            source={item.images?.[0] ? {uri: item.images[0]} : require('../assets/images/product-cement.png')}
            style={{height: scale(105), width: scale(102)}}
            resizeMode="contain"
          />
          {discount > 0 && (
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
                }}>
                {discount}%OFF
              </Text>
            </View>
          )}
        </View>
        {/* Product info */}
        <View style={{paddingHorizontal: scale(8), paddingBottom: scale(4)}}>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: scale(14),
              color: COLORS.secondary,
              textTransform: 'capitalize',
            }}
            numberOfLines={2}>
            {item.name}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: scale(item.requestQuote ? 12 : 14),
              color: COLORS.secondary,
            }}>
            {item.requestQuote
              ? 'Price on request'
              : `${formatCurrency(item.sellingPrice)}/${item.unit}`}
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
                color: COLORS.secondary,
                textTransform: 'capitalize',
              }}>
              Get a Quote
            </Text>
          </TouchableOpacity>
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
                color: COLORS.secondary,
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} translucent />

      {/* Header */}
      <View
        style={{
          backgroundColor: COLORS.secondary,
          paddingBottom: scale(12),
          paddingTop: scale(40),
          paddingHorizontal: scale(16),
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 3},
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 5,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          {/* Left: Back + Title */}
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity
              onPress={() => navigation?.goBack()}
              style={{marginRight: scale(12)}}>
              <BackArrowIcon />
            </TouchableOpacity>
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: scale(20),
                color: COLORS.textWhite,
              }}>
              {categoryName}
            </Text>
          </View>

          {/* Right: Cart + Profile */}
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <HeaderCartButton />
            <HeaderProfileButton />
          </View>
        </View>
      </View>

      <ScrollView
        style={{flex: 1}}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Search By Brand bar */}
        <View
          style={{
            marginHorizontal: scale(16),
            marginTop: scale(16),
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <View
            style={{
              flex: 1,
              height: scale(46),
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: scale(10),
              borderWidth: 1,
              borderColor: COLORS.borderDark,
              backgroundColor: COLORS.backgroundWhite,
              paddingHorizontal: scale(10),
            }}>
            <SearchIcon />
            <TextInput
              style={{
                flex: 1,
                marginLeft: scale(10),
                fontFamily: FONTS.regular,
                fontSize: scale(14),
                color: COLORS.textDark,
                padding: 0,
              }}
              placeholder="Search"
              placeholderTextColor={COLORS.textPlaceholder}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <TouchableOpacity
            style={{
              marginLeft: scale(10),
              width: scale(46),
              height: scale(46),
              borderRadius: scale(10),
              borderWidth: 1,
              borderColor: COLORS.borderDark,
              backgroundColor: COLORS.backgroundWhite,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <FilterIcon />
          </TouchableOpacity>
        </View>

        {/* Sub-category horizontal filter */}
        {subCategories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: scale(16),
              paddingVertical: scale(14),
              gap: scale(14),
            }}>
            {/* "All" option */}
            <TouchableOpacity
              onPress={() => setSelectedSubCat(null)}
              style={{alignItems: 'center', width: scale(65)}}>
              <View
                style={{
                  width: scale(52),
                  height: scale(52),
                  borderRadius: scale(26),
                  borderWidth: 2,
                  borderColor: selectedSubCat === null ? COLORS.primary : COLORS.border,
                  backgroundColor: selectedSubCat === null ? COLORS.primary : COLORS.backgroundWhite,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                <Text
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: scale(12),
                    color: selectedSubCat === null ? COLORS.secondary : COLORS.textSecondary,
                  }}>
                  All
                </Text>
              </View>
              <Text
                style={{
                  marginTop: scale(4),
                  fontFamily: selectedSubCat === null ? FONTS.semiBold : FONTS.regular,
                  fontSize: scale(10),
                  color: selectedSubCat === null ? COLORS.textPrimary : COLORS.textSecondary,
                  textAlign: 'center',
                }}
                numberOfLines={2}>
                All
              </Text>
            </TouchableOpacity>

            {subCategories.map(sub => {
              const isActive = selectedSubCat === sub._id;
              return (
                <TouchableOpacity
                  key={sub._id}
                  onPress={() => setSelectedSubCat(isActive ? null : sub._id)}
                  style={{alignItems: 'center', width: scale(65)}}>
                  <View
                    style={{
                      width: scale(52),
                      height: scale(52),
                      borderRadius: scale(26),
                      borderWidth: 2,
                      borderColor: isActive ? COLORS.primary : COLORS.border,
                      backgroundColor: COLORS.backgroundWhite,
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                    <Image
                      source={sub.image ? {uri: sub.image} : require('../assets/images/shop-cement.png')}
                      style={{width: scale(48), height: scale(48), borderRadius: scale(24)}}
                      resizeMode="cover"
                    />
                  </View>
                  <Text
                    style={{
                      marginTop: scale(4),
                      fontFamily: isActive ? FONTS.semiBold : FONTS.regular,
                      fontSize: scale(10),
                      color: isActive ? COLORS.textPrimary : COLORS.textSecondary,
                      textAlign: 'center',
                    }}
                    numberOfLines={2}>
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Bulk Orders Banner */}
        <TouchableOpacity
          onPress={() => navigation?.navigate('GetQuotation', {isLoggedIn: true})}
          style={{
            marginHorizontal: scale(16),
            marginTop: subCategories.length > 0 ? 0 : scale(16),
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
                Save Up to {'\u20B9'}15000 on Bulk Orders{'\n'}Buy More, Save More
                on Your Projects
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
                    color: COLORS.secondary,
                  }}>
                  Get Bulk Quote
                </Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* Product Grid */}
        <View
          style={{
            paddingHorizontal: scale(16),
            marginTop: scale(20),
          }}>
          {/* Section header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: scale(12),
            }}>
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(16),
                color: COLORS.secondary,
              }}>
              {categoryName}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(13),
                color: COLORS.textSecondary,
              }}>
              {materials.length} items
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator
              color={COLORS.primary}
              size="large"
              style={{marginTop: scale(40), marginBottom: scale(40)}}
            />
          ) : materials.length === 0 ? (
            <View style={{alignItems: 'center', paddingVertical: scale(40)}}>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(14),
                  color: COLORS.textSecondary,
                }}>
                No materials found
              </Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}>
              {materials.map(product => renderProductCard(product))}
            </View>
          )}
        </View>

        {/* Bottom spacing for nav bar */}
        <View style={{height: scale(120)}} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}>
        {/* Center Home button */}
        <View style={{alignItems: 'center', zIndex: 10}}>
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

        <View style={{position: 'relative'}}>
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
              <Text style={{marginTop: scale(4), fontFamily: FONTS.regular, fontSize: scale(11), color: COLORS.secondary}}>Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation?.navigate('Cart')} style={{alignItems: 'center', flex: 1}}>
              <NavCartIcon />
              <Text style={{marginTop: scale(4), fontFamily: FONTS.regular, fontSize: scale(11), color: COLORS.secondary}}>Cart</Text>
            </TouchableOpacity>
            <View style={{flex: 1, alignItems: 'center'}}>
              <Text style={{fontFamily: FONTS.semiBold, fontSize: scale(11), color: COLORS.secondary}}>Home</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation?.navigate('GetQuotation', {isLoggedIn: true})}
              style={{alignItems: 'center', flex: 1}}>
              <QuotesIcon />
              <Text style={{marginTop: scale(4), fontFamily: FONTS.regular, fontSize: scale(11), color: COLORS.secondary}}>Quotes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation?.navigate('EditProfile')}
              style={{alignItems: 'center', flex: 1}}>
              <NavProfileIcon />
              <Text style={{marginTop: scale(4), fontFamily: FONTS.regular, fontSize: scale(11), color: COLORS.secondary}}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default SingleCategoryScreen;
