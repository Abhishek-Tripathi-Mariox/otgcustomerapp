import React, {useState} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import PromoBottomSheet from './PromoBottomSheet';
import CouponSuccessModal from './CouponSuccessModal';
import Svg, {Path, Circle} from 'react-native-svg';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {
  ScreenHeader,
  PrimaryButton,
  HeaderCartButton,
  HeaderProfileButton,
  SearchIcon,
  FilterIcon,
  EditIcon,
  DeleteIcon,
  PlusIcon,
  MinusIcon,
  InfoIcon,
} from '../components';
import {
  useAppSelector,
  useAppDispatch,
  selectCartItems,
  selectAppliedOffer,
  incrementCartItem,
  decrementCartItem,
  removeCartItem,
  applyOffer,
  clearAppliedOffer,
} from '../store';
import {formatCurrency} from '../utils/currency';

const productCement = require('../assets/images/product-cement.png');

// --- Screen-specific icon ---

const DeliveryIcon = () => (
  <Svg width={scale(22)} height={scale(22)} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={COLORS.secondary} strokeWidth={1.5} />
    <Path d="M8 12L11 15L16 9" stroke={COLORS.secondary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CartScreen: React.FC<{navigation?: any}> = ({navigation}) => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const appliedOffer = useAppSelector(selectAppliedOffer);

  // Delivery address comes from the user's saved/selected address (not hardcoded).
  const savedAddresses = useAppSelector(s => s.app.savedAddresses);
  const selectedAddressId = useAppSelector(s => s.app.selectedAddressId);
  const selectedAddress =
    savedAddresses.find(a => a.id === selectedAddressId) ||
    savedAddresses.find(a => a.isPrimary) ||
    savedAddresses[0] ||
    null;
  const addressLine = selectedAddress
    ? [
        selectedAddress.houseNo,
        selectedAddress.street,
        selectedAddress.city,
        selectedAddress.state,
        selectedAddress.pincode,
      ]
        .filter(Boolean)
        .join(', ') +
      (selectedAddress.phone ? `. ${selectedAddress.phone}` : '')
    : '';
  const [promoVisible, setPromoVisible] = useState(false);
  const [couponSuccessVisible, setCouponSuccessVisible] = useState(false);
  const [appliedCode, setAppliedCode] = useState('');

  const updateQuantity = (id: string, delta: number) => {
    if (delta > 0) {
      dispatch(incrementCartItem(id));
      return;
    }
    // At the minimum quantity, pressing minus removes the item from the cart
    // (decrement alone floors at 1, which left users unable to remove it).
    const current = cartItems.find(i => i.id === id);
    if (current && current.quantity <= 1) {
      dispatch(removeCartItem(id));
    } else {
      dispatch(decrementCartItem(id));
    }
  };

  const removeItem = (id: string) => {
    dispatch(removeCartItem(id));
  };

  // Per item we have:
  //   mrp   = catalog MRP (inclusive of GST)
  //   price = final selling price (inclusive of GST) — what the customer actually pays
  //   gst   = GST percentage applicable on this material
  //
  // For each item, we derive the basic (pre-tax) amounts:
  //   basicMrp = mrp / (1 + gst/100)
  //   basicSp  = price / (1 + gst/100)
  // and the GST portions:
  //   gstOnMrp = mrp - basicMrp
  //   gstOnSp  = price - basicSp
  // All multiplied by quantity and summed across items.
  const summary = cartItems.reduce(
    (acc, i) => {
      const q = i.quantity || 0;
      const gstRate = i.gst || 0;
      const divisor = 1 + gstRate / 100;
      const mrpInclQty = (i.mrp ?? i.price) * q;
      const spInclQty = i.price * q;
      const basicMrpQty = mrpInclQty / divisor;
      const basicSpQty = spInclQty / divisor;
      acc.basicMrp += basicMrpQty;
      acc.gstOnMrp += mrpInclQty - basicMrpQty;
      acc.mrpIncl += mrpInclQty;
      acc.basicSp += basicSpQty;
      acc.gstOnSp += spInclQty - basicSpQty;
      acc.spIncl += spInclQty;
      // Use the highest gst rate seen for the label — almost always uniform.
      if (gstRate > acc.gstRate) acc.gstRate = gstRate;
      return acc;
    },
    {
      basicMrp: 0,
      gstOnMrp: 0,
      mrpIncl: 0,
      basicSp: 0,
      gstOnSp: 0,
      spIncl: 0,
      gstRate: 0,
    },
  );

  const catalogSavings = summary.mrpIncl - summary.spIncl;
  const couponDiscount = appliedOffer?.discountAmount || 0;
  const grandTotal = Math.max(0, summary.spIncl - couponDiscount);

  const fmt = formatCurrency;

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
      <ScreenHeader
        title="My Cart"
        onBack={() => navigation?.goBack()}
        rightContent={
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <HeaderCartButton />
            <HeaderProfileButton />
          </View>
        }
      />

      <ScrollView
        style={{flex: 1}}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Search By Brand */}
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
              placeholder="Search By Brand"
              placeholderTextColor={COLORS.textPlaceholder}
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
              backgroundColor: COLORS.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <FilterIcon />
          </TouchableOpacity>
        </View>

        {/* Delivery Address */}
        <View
          style={{
            marginHorizontal: scale(16),
            marginTop: scale(16),
            borderRadius: scale(12),
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: COLORS.backgroundWhite,
            padding: scale(14),
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: scale(8)}}>
              <DeliveryIcon />
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(14),
                  color: COLORS.secondary,
                }}>
                Delivery at ({selectedAddress?.label || 'Home'})
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation?.navigate('SavedAddress')}
              style={{flexDirection: 'row', alignItems: 'center', gap: scale(4)}}>
              <EditIcon />
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(13),
                  color: COLORS.secondary,
                }}>
                Change
              </Text>
            </TouchableOpacity>
          </View>
          <Text
            style={{
              marginTop: scale(6),
              fontFamily: FONTS.regular,
              fontSize: scale(12),
              color: COLORS.textLight,
              lineHeight: scale(18),
            }}>
            {addressLine || 'No delivery address selected — tap Change to add one.'}
          </Text>

          {/* Estimated delivery time */}
          <View
            style={{
              marginTop: scale(8),
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
                fontSize: scale(12),
                color: COLORS.secondary,
              }}>
              Delivery within{' '}
              <Text style={{fontFamily: FONTS.semiBold}}>2 hr</Text>
            </Text>
          </View>
        </View>

        {/* Empty state */}
        {cartItems.length === 0 && (
          <View
            style={{
              marginHorizontal: scale(16),
              marginTop: scale(32),
              padding: scale(24),
              borderRadius: scale(12),
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.backgroundWhite,
              alignItems: 'center',
            }}>
            <Image
              source={productCement}
              style={{width: scale(80), height: scale(80), opacity: 0.4}}
              resizeMode="contain"
            />
            <Text
              style={{
                marginTop: scale(12),
                fontFamily: FONTS.semiBold,
                fontSize: scale(15),
                color: COLORS.secondary,
              }}>
              Your cart is empty
            </Text>
            <Text
              style={{
                marginTop: scale(4),
                fontFamily: FONTS.regular,
                fontSize: scale(12),
                color: COLORS.textLight,
                textAlign: 'center',
              }}>
              Add materials from the catalog to get started.
            </Text>
            <TouchableOpacity
              onPress={() => navigation?.goBack()}
              style={{
                marginTop: scale(16),
                paddingHorizontal: scale(20),
                paddingVertical: scale(10),
                borderRadius: scale(20),
                backgroundColor: COLORS.primary,
              }}>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(13),
                  color: COLORS.secondary,
                }}>
                Browse Materials
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cart Items */}
        {cartItems.map(item => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            onPress={() =>
              navigation?.navigate('ProductDetail', {
                productId: item.id,
                productName: item.name,
              })
            }
            style={{
              marginHorizontal: scale(16),
              marginTop: scale(16),
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.backgroundWhite,
              borderRadius: scale(12),
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: scale(12),
            }}>
            {/* Product Image */}
            <View
              style={{
                width: scale(90),
                height: scale(100),
                borderRadius: scale(10),
                backgroundColor: COLORS.backgroundLight,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
              <Image
                source={item.image || productCement}
                style={{width: scale(80), height: scale(90)}}
                resizeMode="contain"
              />
            </View>

            {/* Product Details */}
            <View style={{flex: 1, marginLeft: scale(12)}}>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: scale(14),
                  color: COLORS.secondary,
                }}
                numberOfLines={1}>
                {item.name}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(12),
                  color: COLORS.textSecondary,
                  marginTop: scale(2),
                }}>
                Brand: {item.brand}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: scale(13),
                  color: COLORS.secondary,
                  marginTop: scale(2),
                }}>
                Size :{item.size}
              </Text>

              {/* Quantity + Price row */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: scale(8),
                }}>
                {/* Quantity controls */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, -1)}
                    style={{
                      width: scale(30),
                      height: scale(30),
                      borderRadius: scale(6),
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <MinusIcon />
                  </TouchableOpacity>
                  <View
                    style={{
                      marginHorizontal: scale(4),
                      width: scale(32),
                      height: scale(30),
                      borderRadius: scale(6),
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text
                      style={{
                        fontFamily: FONTS.medium,
                        fontSize: scale(14),
                        color: COLORS.secondary,
                      }}>
                      {item.quantity}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, 1)}
                    style={{
                      width: scale(30),
                      height: scale(30),
                      borderRadius: scale(6),
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <PlusIcon />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                    style={{
                      marginLeft: scale(8),
                      width: scale(30),
                      height: scale(30),
                      borderRadius: scale(6),
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <DeleteIcon />
                  </TouchableOpacity>
                </View>

                {/* Price */}
                <Text
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: scale(16),
                    color: COLORS.secondary,
                  }}>
                  {formatCurrency(item.price)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Offers Section (only when cart has items) */}
        {cartItems.length > 0 && (
        <View style={{marginTop: scale(24), paddingHorizontal: scale(16)}}>
          <Text
            style={{
              fontFamily: FONTS.medium,
              fontSize: scale(14),
              color: COLORS.secondary,
              marginBottom: scale(10),
            }}>
            Offers
          </Text>
          <TouchableOpacity
            onPress={() => setPromoVisible(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: scale(12),
              borderWidth: 1.5,
              borderColor: COLORS.primary,
              backgroundColor: COLORS.backgroundWhite,
              paddingHorizontal: scale(16),
              paddingVertical: scale(14),
            }}>
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: scale(14),
                color: COLORS.secondary,
              }}>
              Select a promo code
            </Text>
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: scale(13),
                color: COLORS.warning,
              }}>
              View Offers/Apply
            </Text>
          </TouchableOpacity>
        </View>
        )}

        {/* Price Summary (only shown when cart has items) */}
        {cartItems.length > 0 && (
        <View
          style={{
            marginHorizontal: scale(16),
            marginTop: scale(20),
            paddingBottom: scale(20),
          }}>
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: scale(15),
              color: COLORS.secondary,
              marginBottom: scale(8),
            }}>
            Price Summary
          </Text>

          {/* MRP */}
          <PriceRow label="MRP" value={fmt(summary.mrpIncl)} />

          {/* Discount (MRP → selling price) */}
          {catalogSavings > 0.01 && (
            <PriceRow
              label="Discount"
              value={`− ${fmt(catalogSavings)}`}
              valueColor={COLORS.success}
            />
          )}

          {/* Coupon discount — only when a coupon is applied */}
          {appliedOffer && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: scale(6),
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: scale(8),
                }}>
                <Text
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: scale(13),
                    color: COLORS.textLight,
                  }}>
                  Coupon Discount ({appliedOffer.code})
                </Text>
                <TouchableOpacity onPress={() => dispatch(clearAppliedOffer())}>
                  <Text
                    style={{
                      fontFamily: FONTS.medium,
                      fontSize: scale(11),
                      color: COLORS.textPrimary,
                    }}>
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(13),
                  color: COLORS.success,
                }}>
                − {fmt(couponDiscount)}
              </Text>
            </View>
          )}

          {/* Grand Total */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: scale(14),
              marginTop: scale(10),
              borderTopWidth: 1,
              borderTopColor: COLORS.divider,
            }}>
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(16),
                color: COLORS.secondary,
              }}>
              Grand Total
            </Text>
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(16),
                color: COLORS.secondary,
              }}>
              {fmt(grandTotal)}
            </Text>
          </View>
        </View>
        )}

        {/* Confirm & Checkout Button (only when cart has items) */}
        {cartItems.length > 0 && (
        <View
          style={{
            paddingHorizontal: scale(16),
            paddingBottom: scale(30),
          }}>
          <PrimaryButton
            title="Confirm & Checkout"
            onPress={() => navigation?.navigate('PaymentMethod')}
          />
        </View>
        )}
      </ScrollView>

      {/* Promo Code Bottom Sheet */}
      <PromoBottomSheet
        visible={promoVisible}
        onClose={() => setPromoVisible(false)}
        onApply={(payload) => {
          dispatch(applyOffer(payload));
          setAppliedCode(payload.code);
          setPromoVisible(false);
          setTimeout(() => setCouponSuccessVisible(true), 300);
        }}
      />

      {/* Coupon Success Modal */}
      <CouponSuccessModal
        visible={couponSuccessVisible}
        onClose={() => setCouponSuccessVisible(false)}
        savedAmount={fmt(couponDiscount)}
        couponCode={appliedCode}
      />
    </View>
  );
};

/** Single label/value row used inside the cart's Price Summary. */
const PriceRow: React.FC<{
  label: string;
  value: string;
  valueColor?: string;
  emphasize?: boolean;
}> = ({label, value, valueColor, emphasize}) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: scale(6),
    }}>
    <Text
      style={{
        fontFamily: emphasize ? FONTS.medium : FONTS.regular,
        fontSize: scale(13),
        color: emphasize ? COLORS.secondary : COLORS.textLight,
      }}>
      {label}
    </Text>
    <Text
      style={{
        fontFamily: emphasize ? FONTS.semiBold : FONTS.regular,
        fontSize: scale(13),
        color: valueColor || COLORS.secondary,
      }}>
      {value}
    </Text>
  </View>
);

export default CartScreen;
