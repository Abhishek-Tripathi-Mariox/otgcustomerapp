import React, {useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {ScreenHeader, PrimaryButton} from '../components';
import {
  RadioEmpty,
  RadioFilled,
  EditIcon,
  PlusIcon,
} from '../components/icons';
import {
  useAppSelector,
  useAppDispatch,
  selectCartItems,
  selectAppliedOffer,
  clearCart,
} from '../store';
import orderService from '../services/orderService';
import {showAppAlert} from '../components/AlertProvider';
import {formatCurrency} from '../utils/currency';

// Assets
const paytmLogo = require('../assets/images/paytm.png');
const phonepeLogo = require('../assets/images/phonepe.png');
const googlePayLogo = require('../assets/images/google-pay.png');
const amazonPayLogo = require('../assets/images/amazon-pay.png');
const freechargeLogo = require('../assets/images/freecharge.png');

// --- Screen-specific Icons ---

// COD icon — money/notes illustration
const CodIcon = () => (
  <Svg width={scale(44)} height={scale(44)} viewBox="0 0 44 44" fill="none">
    <Path
      d="M6 14H32C33.1 14 34 14.9 34 16V32C34 33.1 33.1 34 32 34H6C4.9 34 4 33.1 4 32V16C4 14.9 4.9 14 6 14Z"
      fill="#4CAF50"
      opacity={0.8}
    />
    <Path
      d="M10 10H36C37.1 10 38 10.9 38 12V28C38 29.1 37.1 30 36 30H10C8.9 30 8 29.1 8 28V12C8 10.9 8.9 10 10 10Z"
      fill="#66BB6A"
    />
    <Path d="M19 15C16.24 15 14 17.24 14 20C14 22.76 16.24 25 19 25C21.76 25 24 22.76 24 20C24 17.24 21.76 15 19 15Z" fill="#FFF9C4" />
    <Path d="M18.2 18.5H19.8V21.5H18.2V18.5Z" fill="#4CAF50" />
    <Path d="M17 19.2H21V20.8H17V19.2Z" fill="#4CAF50" />
    <Circle cx={32} cy={16} r={6} fill="#FFC107" />
    <Circle cx={34} cy={18} r={6} fill="#FFD54F" />
    <Path d="M33 15.5V20.5M31 17H35" stroke="#F57F17" strokeWidth={0.8} />
  </Svg>
);

// Credit card icon
const CardIcon = () => (
  <Svg width={scale(44)} height={scale(44)} viewBox="0 0 44 44" fill="none">
    <Path
      d="M6 12H38C39.1 12 40 12.9 40 14V34C40 35.1 39.1 36 38 36H6C4.9 36 4 35.1 4 34V14C4 12.9 4.9 12 6 12Z"
      fill="#FFC107"
    />
    <Path d="M4 18H40V24H4V18Z" fill="#F57F17" opacity={0.4} />
    <Path d="M8 28H18V30H8V28Z" fill="#FFF9C4" />
    <Path d="M22 28H28V30H22V28Z" fill="#FFF9C4" />
  </Svg>
);

// Wallet options data
const WALLET_OPTIONS = [
  {id: 'paytm', name: 'Paytm Wallet & UPI', logo: paytmLogo},
  {id: 'phonepe', name: 'PhonePe', logo: phonepeLogo},
  {id: 'gpay', name: 'Google Pay', logo: googlePayLogo},
  {id: 'amazon', name: 'Amazon Pay', logo: amazonPayLogo},
  {id: 'freecharge', name: 'Freecharge', logo: freechargeLogo},
];

// Saved cards come from a card vault we don't have a backend for yet, so we
// no longer show fabricated cards. Real saved cards would be loaded here.
const SAVED_CARDS: {
  id: string;
  type: string;
  holder: string;
  expiry: string;
}[] = [];

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  paytm: 'Paytm Wallet & UPI',
  phonepe: 'PhonePe',
  gpay: 'Google Pay',
  amazon: 'Amazon Pay',
  freecharge: 'Freecharge',
};

const PaymentMethodScreen: React.FC<{navigation?: any; route?: any}> = ({
  navigation,
  route,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const appliedOffer = useAppSelector(selectAppliedOffer);

  // Deliver to the user's selected/saved address (sent as `site` to the order).
  const savedAddresses = useAppSelector(s => s.app.savedAddresses);
  const selectedAddressId = useAppSelector(s => s.app.selectedAddressId);
  const deliveryAddress =
    savedAddresses.find(a => a.id === selectedAddressId) ||
    savedAddresses.find(a => a.isPrimary) ||
    savedAddresses[0] ||
    null;
  const deliverySite = deliveryAddress
    ? [
        deliveryAddress.houseNo,
        deliveryAddress.street,
        deliveryAddress.city,
        deliveryAddress.state,
        deliveryAddress.pincode,
      ]
        .filter(Boolean)
        .join(', ')
    : undefined;

  // Buy It Now bypasses the cart — when this is set, use the single item
  // for totals and checkout instead of cart contents, and don't clear cart
  // on success.
  const buyNowItem = route?.params?.buyNowItem as
    | {
        id: string;
        name: string;
        quantity: number;
        price: number;
        mrp?: number;
        gst?: number;
        unit?: string;
        image?: {uri: string};
        brand?: string;
      }
    | undefined;
  const isBuyNow = !!buyNowItem;
  const orderItems = isBuyNow ? [buyNowItem!] : cartItems;

  // i.price is the final selling price, already inclusive of GST — matching
  // the cart's grand total. Do NOT add GST again on top of it.
  const subTotal = orderItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0,
  );
  // Coupon only applies to cart checkouts, not Buy-It-Now
  const couponDiscount =
    !isBuyNow && appliedOffer ? appliedOffer.discountAmount : 0;
  const billTotal = Math.max(0, subTotal - couponDiscount);

  const handlePlaceOrder = async () => {
    if (orderItems.length === 0) {
      showAppAlert({
        title: 'Nothing to order',
        message: isBuyNow
          ? 'This item is unavailable. Please try another product.'
          : 'Add items before placing an order.',
      });
      return;
    }
    if (!selectedMethod) {
      showAppAlert({
        title: 'Choose a payment method',
        message: 'Please select how you want to pay.',
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await orderService.checkout({
        items: orderItems.map(i => ({
          materialId: i.id,
          quantity: i.quantity,
        })),
        paymentMethod:
          PAYMENT_LABELS[selectedMethod] ||
          (selectedMethod.startsWith('card-')
            ? 'Card'
            : selectedMethod),
        site: deliverySite,
        pincode: deliveryAddress?.pincode || undefined,
        couponCode: !isBuyNow && appliedOffer ? appliedOffer.code : undefined,
      });

      if (res.data.success) {
        if (!isBuyNow) {
          dispatch(clearCart());
        }
        showAppAlert({
          title: 'Order placed!',
          message: res.data.message,
          buttons: [
            {
              text: 'View Orders',
              style: 'primary',
              onPress: () =>
                navigation?.reset({
                  index: 0,
                  routes: [{name: 'Home'}, {name: 'MyOrders'}],
                }),
            },
          ],
        });
      }
    } catch (err: any) {
      showAppAlert({
        title: 'Order failed',
        message:
          err?.response?.data?.message ||
          'We could not place your order. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
      {/* Header */}
      <ScreenHeader
        title="Select Payment Method"
        onBack={() => navigation?.goBack()}
      />

      <ScrollView
        style={{flex: 1}}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{paddingBottom: scale(100)}}>
        {/* Bill Total */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: scale(16),
            paddingVertical: scale(16),
          }}>
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: scale(18),
              color: COLORS.textPrimary,
            }}>
            Bill Total
          </Text>
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: scale(20),
              color: COLORS.textPrimary,
            }}>
            {formatCurrency(billTotal)}
          </Text>
        </View>

        {/* Pay on Delivery */}
        <View style={{paddingHorizontal: scale(16)}}>
          <Text
            style={{
              fontFamily: FONTS.medium,
              fontSize: scale(14),
              color: COLORS.textLight,
              marginBottom: scale(10),
            }}>
            Pay on Delivery
          </Text>

          <TouchableOpacity
            onPress={() => setSelectedMethod('cod')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.backgroundWhite,
              borderRadius: scale(12),
              borderWidth: 1,
              borderColor: selectedMethod === 'cod' ? COLORS.primary : COLORS.border,
              padding: scale(14),
            }}>
            <CodIcon />
            <View style={{flex: 1, marginLeft: scale(12)}}>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: scale(14),
                  color: COLORS.textPrimary,
                }}>
                Cash on Delivery (COD)
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(11),
                  color: COLORS.textSecondary,
                  marginTop: scale(2),
                  lineHeight: scale(16),
                }}>
                Online payment recommended to reduce contact{'\n'}between you and
                delivery partner
              </Text>
            </View>
            {selectedMethod === 'cod' ? <RadioFilled /> : <RadioEmpty />}
          </TouchableOpacity>
        </View>

        {/* Wallet Section */}
        <View style={{paddingHorizontal: scale(16), marginTop: scale(24)}}>
          <Text
            style={{
              fontFamily: FONTS.medium,
              fontSize: scale(14),
              color: COLORS.textLight,
              marginBottom: scale(10),
            }}>
            Wallet
          </Text>

          {WALLET_OPTIONS.map(wallet => (
            <TouchableOpacity
              key={wallet.id}
              onPress={() => setSelectedMethod(wallet.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.backgroundWhite,
                borderRadius: scale(12),
                borderWidth: 1,
                borderColor:
                  selectedMethod === wallet.id ? COLORS.primary : COLORS.border,
                padding: scale(14),
                marginBottom: scale(10),
              }}>
              <Image
                source={wallet.logo}
                style={{
                  width: scale(44),
                  height: scale(28),
                }}
                resizeMode="contain"
              />
              <Text
                style={{
                  flex: 1,
                  marginLeft: scale(12),
                  fontFamily: FONTS.medium,
                  fontSize: scale(14),
                  color: COLORS.textPrimary,
                }}>
                {wallet.name}
              </Text>
              {selectedMethod === wallet.id ? <RadioFilled /> : <RadioEmpty />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Credit / Debit Cards Section */}
        <View style={{paddingHorizontal: scale(16), marginTop: scale(14)}}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: scale(12),
            }}>
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: scale(14),
                color: COLORS.textLight,
              }}>
              Credit / Debit Cards
            </Text>
            <TouchableOpacity
              style={{flexDirection: 'row', alignItems: 'center', gap: scale(4)}}>
              <PlusIcon color={COLORS.warning} />
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: scale(13),
                  color: COLORS.warning,
                }}>
                Add Card
              </Text>
            </TouchableOpacity>
          </View>

          {SAVED_CARDS.length === 0 ? (
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(12),
                color: COLORS.textSecondary,
                paddingVertical: scale(8),
              }}>
              No saved cards yet.
            </Text>
          ) : null}

          {SAVED_CARDS.map(card => (
            <TouchableOpacity
              key={card.id}
              onPress={() => setSelectedMethod(`card-${card.id}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.backgroundWhite,
                borderRadius: scale(12),
                borderWidth: 1,
                borderColor:
                  selectedMethod === `card-${card.id}` ? COLORS.primary : COLORS.border,
                padding: scale(14),
                marginBottom: scale(10),
              }}>
              <CardIcon />
              <View style={{flex: 1, marginLeft: scale(12)}}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      fontFamily: FONTS.medium,
                      fontSize: scale(13),
                      color: COLORS.textPrimary,
                    }}>
                    {card.type}
                  </Text>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: scale(4),
                    }}>
                    <EditIcon size={14} color={COLORS.warning} />
                    <Text
                      style={{
                        fontFamily: FONTS.medium,
                        fontSize: scale(12),
                        color: COLORS.warning,
                      }}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: scale(11),
                    color: COLORS.textSecondary,
                    marginTop: scale(2),
                  }}>
                  {card.holder}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: scale(11),
                    color: COLORS.textSecondary,
                  }}>
                  {card.expiry}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: scale(16),
          paddingBottom: scale(24),
          paddingTop: scale(12),
          backgroundColor: COLORS.background,
        }}>
        <PrimaryButton
          title={submitting ? 'Placing order…' : 'Place Order'}
          onPress={handlePlaceOrder}
          disabled={submitting}
        />
      </View>
    </View>
  );
};

export default PaymentMethodScreen;
