import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {scale, SCREEN_WIDTH} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {CloseIcon} from '../components/icons';
import offerService, {Offer} from '../services/offerService';
import {useAppSelector, selectCartItems} from '../store';
import {formatCurrency} from '../utils/currency';

interface PromoBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Called with the validated offer + discount when applied successfully. */
  onApply?: (payload: {
    code: string;
    title: string;
    discountAmount: number;
    freeDelivery: boolean;
  }) => void;
}

const describeOffer = (offer: Offer): string => {
  switch (offer.discountType) {
    case 'percentage': {
      const cap = offer.maxDiscount
        ? ` (up to ${formatCurrency(offer.maxDiscount)})`
        : '';
      return `${offer.discountValue}% off${cap}`;
    }
    case 'flat':
      return `${formatCurrency(offer.discountValue)} off`;
    case 'free_delivery':
      return 'Free delivery';
    case 'bogo':
      return `Buy ${offer.buyX} get ${offer.getY} free`;
    default:
      return '';
  }
};

const conditionText = (offer: Offer): string => {
  const parts: string[] = [];
  if (offer.minOrderAmount) {
    parts.push(`On orders above ${formatCurrency(offer.minOrderAmount)}`);
  }
  if (offer.endsAt) {
    parts.push(
      `Valid until ${new Date(offer.endsAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      })}`,
    );
  }
  return parts.join(' · ') || 'Limited time offer';
};

const PromoBottomSheet: React.FC<PromoBottomSheetProps> = ({
  visible,
  onClose,
  onApply,
}) => {
  const cartItems = useAppSelector(selectCartItems);
  const [promoCode, setPromoCode] = useState('');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [validating, setValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setErrorMsg(null);
    setLoadingList(true);
    offerService
      .list()
      .then(res => {
        if (!cancelled) setOffers(res.data.data || []);
      })
      .catch(() => {
        if (!cancelled) setOffers([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const handleApply = async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    if (cartItems.length === 0) {
      setErrorMsg('Add items to your cart before applying a coupon.');
      return;
    }
    setErrorMsg(null);
    setValidating(true);
    try {
      const res = await offerService.validate(
        trimmed,
        cartItems.map(i => ({materialId: i.id, quantity: i.quantity})),
      );
      const r = res.data.data;
      if (!r.valid) {
        setErrorMsg(r.reason || 'This coupon could not be applied.');
        return;
      }
      onApply?.({
        code: r.offer?.code || trimmed,
        title: r.offer?.title || 'Offer applied',
        discountAmount: r.discountAmount || 0,
        freeDelivery: !!r.freeDelivery,
      });
      setPromoCode('');
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message || 'Could not validate this coupon.',
      );
    } finally {
      setValidating(false);
    }
  };

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
              maxHeight: SCREEN_WIDTH * 1.6,
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

            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}>
              {/* Title */}
              <Text
                style={{
                  marginTop: scale(24),
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(18),
                  color: COLORS.textPrimary,
                }}>
                Select / Enter Promo Code
              </Text>

              {/* Promo code input */}
              <View
                style={{
                  marginTop: scale(16),
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: scale(10),
                }}>
                <View
                  style={{
                    flex: 1,
                    height: scale(48),
                    borderRadius: scale(10),
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    justifyContent: 'center',
                    paddingHorizontal: scale(14),
                  }}>
                  <TextInput
                    style={{
                      fontFamily: FONTS.regular,
                      fontSize: scale(14),
                      color: COLORS.textPrimary,
                      padding: 0,
                    }}
                    placeholder="Enter Promo Code"
                    placeholderTextColor={COLORS.textPlaceholder}
                    value={promoCode}
                    onChangeText={setPromoCode}
                    autoCapitalize="characters"
                    editable={!validating}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => handleApply(promoCode)}
                  disabled={validating || !promoCode}
                  style={{
                    height: scale(48),
                    paddingHorizontal: scale(24),
                    borderRadius: scale(10),
                    backgroundColor: COLORS.secondary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: validating || !promoCode ? 0.5 : 1,
                  }}>
                  {validating ? (
                    <ActivityIndicator color={COLORS.textWhite} size="small" />
                  ) : (
                    <Text
                      style={{
                        fontFamily: FONTS.semiBold,
                        fontSize: scale(14),
                        color: COLORS.textWhite,
                      }}>
                      Apply
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {errorMsg && (
                <Text
                  style={{
                    marginTop: scale(10),
                    fontFamily: FONTS.regular,
                    fontSize: scale(12),
                    color: COLORS.error,
                  }}>
                  {errorMsg}
                </Text>
              )}

              {/* Available Offers */}
              <Text
                style={{
                  marginTop: scale(24),
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(16),
                  color: COLORS.textPrimary,
                }}>
                Available Offers
              </Text>

              {loadingList ? (
                <View style={{paddingVertical: scale(24)}}>
                  <ActivityIndicator color={COLORS.primary} />
                </View>
              ) : offers.length === 0 ? (
                <Text
                  style={{
                    marginTop: scale(16),
                    fontFamily: FONTS.regular,
                    fontSize: scale(12),
                    color: COLORS.textSecondary,
                  }}>
                  No active offers right now. Check back soon.
                </Text>
              ) : (
                offers.map(offer => (
                  <View
                    key={offer._id}
                    style={{
                      marginTop: scale(16),
                      paddingBottom: scale(16),
                      borderBottomWidth: 1,
                      borderBottomColor: COLORS.divider,
                    }}>
                    <Text
                      style={{
                        fontFamily: FONTS.semiBold,
                        fontSize: scale(13),
                        color: COLORS.textPrimary,
                        lineHeight: scale(20),
                      }}>
                      {offer.title}
                    </Text>
                    <Text
                      style={{
                        marginTop: scale(2),
                        fontFamily: FONTS.medium,
                        fontSize: scale(12),
                        color: COLORS.discountGreen,
                      }}>
                      {describeOffer(offer)}
                    </Text>
                    <Text
                      style={{
                        marginTop: scale(4),
                        fontFamily: FONTS.regular,
                        fontSize: scale(11),
                        color: COLORS.textSecondary,
                      }}>
                      {conditionText(offer)}
                    </Text>
                    <View
                      style={{
                        marginTop: scale(8),
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                      <View
                        style={{
                          borderWidth: 1,
                          borderColor: COLORS.warning,
                          borderStyle: 'dashed',
                          borderRadius: scale(4),
                          paddingHorizontal: scale(10),
                          paddingVertical: scale(4),
                          backgroundColor: COLORS.yellowLight,
                        }}>
                        <Text
                          style={{
                            fontFamily: FONTS.semiBold,
                            fontSize: scale(12),
                            color: COLORS.warning,
                          }}>
                          {offer.code}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleApply(offer.code)}
                        disabled={validating}>
                        <Text
                          style={{
                            fontFamily: FONTS.medium,
                            fontSize: scale(14),
                            color: validating
                              ? COLORS.textSecondary
                              : COLORS.textPrimary,
                          }}>
                          Apply
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default PromoBottomSheet;
