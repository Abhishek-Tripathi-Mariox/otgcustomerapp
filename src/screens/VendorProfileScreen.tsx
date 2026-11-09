import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {ScreenHeader} from '../components';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {formatCurrency} from '../utils/currency';
import {showAppAlert} from '../components/AlertProvider';
import {useAppDispatch, addCartItem, cartItemFromMaterial} from '../store';
import vendorSearchService, {
  VendorStorefront,
} from '../services/vendorSearchService';

interface Props {
  navigation?: any;
  route?: {params?: {vendorId: string; vendorCode?: string}};
}

/**
 * A single supplier's catalogue.
 *
 * The comparison screen answers "who sells THIS material near me?"; this is
 * the inverse — "what else does this supplier sell?" — so a customer can
 * order several items from one vendor instead of rediscovering them product
 * by product. Prices shown are that vendor's own OTG→Customer rate, which is
 * exactly what checkout will charge for a line bound to them.
 */
const VendorProfileScreen: React.FC<Props> = ({navigation, route}) => {
  const vendorId = route?.params?.vendorId;
  const dispatch = useAppDispatch();

  const [data, setData] = useState<VendorStorefront | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!vendorId) {
      setLoading(false);
      setError('Supplier not specified.');
      return;
    }
    try {
      const res = await vendorSearchService.getVendorStorefront(vendorId);
      setData(res.data.data);
      setError(null);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || 'Could not load this supplier.',
      );
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = (material: any) => {
    if (!data) return;
    dispatch(
      addCartItem(
        cartItemFromMaterial(material, material.minOrderQty || 1, {
          vendorId: data.vendor._id,
          vendorCode: data.vendor.code,
          // The storefront already returns this vendor's own rate as
          // finalSellingPrice, so the cart line is priced correctly.
          price: material.finalSellingPrice,
        }),
      ),
    );
    showAppAlert({
      title: 'Added to cart',
      message: `${material.name} from ${data.vendor.code}.`,
    });
  };

  const vendorLabel =
    data?.vendor.code || route?.params?.vendorCode || 'Supplier';

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
      <ScreenHeader title={vendorLabel} onBack={() => navigation?.goBack()} />

      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error || !data ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: scale(32),
          }}>
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: scale(15),
              color: COLORS.error,
              textAlign: 'center',
            }}>
            {error || 'Supplier not available.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{padding: scale(16)}}
          showsVerticalScrollIndicator={false}>
          {/* Supplier header */}
          <View
            style={{
              backgroundColor: COLORS.textWhite,
              borderRadius: scale(12),
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: scale(16),
              marginBottom: scale(16),
            }}>
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(16),
                color: COLORS.textPrimary,
              }}>
              {data.vendor.code}
            </Text>
            {(data.vendor.city || data.vendor.pincode) && (
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(12),
                  color: COLORS.textSecondary,
                  marginTop: scale(4),
                }}>
                {[data.vendor.city, data.vendor.pincode]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            )}
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(12),
                color: COLORS.textSecondary,
                marginTop: scale(4),
              }}>
              {data.total} {data.total === 1 ? 'material' : 'materials'}{' '}
              available
            </Text>
          </View>

          {data.materials.length === 0 ? (
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(13),
                color: COLORS.textSecondary,
                textAlign: 'center',
                marginTop: scale(40),
              }}>
              This supplier has no materials listed right now.
            </Text>
          ) : (
            data.materials.map((m: any) => (
              <TouchableOpacity
                key={m._id}
                activeOpacity={0.8}
                onPress={() =>
                  navigation?.navigate('ProductDetail', {
                    productId: m._id,
                    productName: m.name,
                    material: m,
                    // Carry the supplier through, so the product page and the
                    // cart stay bound to the vendor the customer came from.
                    selectedVendorId: data.vendor._id,
                    selectedVendorCode: data.vendor.code,
                    selectedVendorPrice: m.finalSellingPrice,
                  })
                }
                style={{
                  flexDirection: 'row',
                  gap: scale(12),
                  backgroundColor: COLORS.textWhite,
                  borderRadius: scale(12),
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  padding: scale(12),
                  marginBottom: scale(10),
                  alignItems: 'center',
                }}>
                <View
                  style={{
                    width: scale(56),
                    height: scale(56),
                    borderRadius: scale(8),
                    backgroundColor: COLORS.background,
                    overflow: 'hidden',
                  }}>
                  {m.images?.[0] ? (
                    <Image
                      source={{uri: m.images[0]}}
                      style={{width: '100%', height: '100%'}}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>

                <View style={{flex: 1}}>
                  <Text
                    numberOfLines={2}
                    style={{
                      fontFamily: FONTS.medium,
                      fontSize: scale(13),
                      color: COLORS.textPrimary,
                    }}>
                    {m.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: scale(14),
                      color: COLORS.textPrimary,
                      marginTop: scale(4),
                    }}>
                    {formatCurrency(m.finalSellingPrice)}
                    <Text
                      style={{
                        fontFamily: FONTS.regular,
                        fontSize: scale(11),
                        color: COLORS.textSecondary,
                      }}>
                      {m.unit ? `/${m.unit}` : ''}
                    </Text>
                  </Text>
                  {m.minOrderQty > 1 && (
                    <Text
                      style={{
                        fontFamily: FONTS.regular,
                        fontSize: scale(11),
                        color: COLORS.textSecondary,
                        marginTop: scale(2),
                      }}>
                      Min order {m.minOrderQty} {m.unit || ''}
                    </Text>
                  )}
                </View>

                {!m.requestQuote && (
                  <TouchableOpacity
                    onPress={() => handleAdd(m)}
                    style={{
                      paddingHorizontal: scale(12),
                      paddingVertical: scale(8),
                      borderRadius: scale(8),
                      backgroundColor: COLORS.primary,
                    }}>
                    <Text
                      style={{
                        fontFamily: FONTS.semiBold,
                        fontSize: scale(12),
                        color: COLORS.secondary,
                      }}>
                      Add
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default VendorProfileScreen;
