import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {ScreenHeader} from '../components';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {showAppAlert} from '../components/AlertProvider';
import vendorSearchService, {
  MaterialVendorOption,
  VendorSort,
} from '../services/vendorSearchService';
import {useAppDispatch, setDeliveryPincode} from '../store';
import useDeliveryPincode from '../hooks/useDeliveryPincode';
import addressService from '../services/addressService';
import authService from '../services/authService';

interface Props {
  navigation?: any;
  route?: {
    params?: {
      materialId: string;
      materialName?: string;
      /** Supplier the customer tapped in search, shown here as their pick. */
      preferredVendorId?: string;
      preferredVendorCode?: string;
    };
  };
}

const formatCurrency = (n: number | null) =>
  n == null ? '—' : `₹${Math.round(n).toLocaleString('en-IN')}`;

const SORT_OPTIONS: Array<{key: VendorSort; label: string}> = [
  {key: 'recommended', label: 'Recommended'},
  {key: 'price_asc', label: 'Price: low to high'},
  {key: 'price_desc', label: 'Price: high to low'},
  {key: 'delivery', label: 'Fastest delivery'},
  {key: 'distance', label: 'Nearest'},
];

const VendorComparisonScreen: React.FC<Props> = ({navigation, route}) => {
  const materialId = route?.params?.materialId;
  const materialName = route?.params?.materialName || 'this material';
  const preferredVendorId = route?.params?.preferredVendorId;
  const dispatch = useAppDispatch();
  // Already known locally (selected site, last search, profile, checkout), so
  // a customer arriving from search sees results immediately instead of an
  // empty form while a network prefill is still in flight.
  const knownPincode = useDeliveryPincode();

  const [pincode, setPincode] = useState(knownPincode || '');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<MaterialVendorOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Sort + "fast delivery only" are applied server-side so the ordering
  // matches the backend's own tie-breaking rules.
  const [sort, setSort] = useState<VendorSort>('recommended');
  const [fastOnly, setFastOnly] = useState(false);

  // The locally known pincode can arrive a tick late (the store rehydrates
  // from disk), so adopt it when it does — but never over something the
  // customer has typed in the meantime.
  useEffect(() => {
    if (knownPincode) setPincode(prev => prev || knownPincode);
  }, [knownPincode]);

  // Server-side prefill: the default saved site, else the checkout profile.
  // Only needed when nothing is known locally, so a returning customer never
  // has to type their pincode again — still editable, since F28 lets them
  // search a different region too.
  useEffect(() => {
    if (knownPincode) return;
    let cancelled = false;
    const adopt = (pin?: string | null) => {
      if (!cancelled && pin) setPincode(prev => prev || pin);
    };
    (async () => {
      try {
        const addrRes = await addressService.list();
        const primary = addrRes.data?.data?.find(a => a.isDefault);
        if (primary?.pincode) {
          adopt(primary.pincode);
          return;
        }
      } catch {
        // fall through to checkout profile
      }
      try {
        const profileRes = await authService.getProfile();
        adopt(profileRes.data?.data?.checkoutProfile?.pincode);
      } catch {
        // no prefill available — customer types it in manually
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = useCallback(async () => {
    if (!materialId) return;
    const pin = pincode.trim();
    if (!/^\d{6}$/.test(pin)) {
      showAppAlert({
        title: 'Invalid pincode',
        message: 'Please enter a valid 6-digit pincode.',
      });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await vendorSearchService.compareVendorsForMaterial(
        materialId,
        pin,
        {sort, maxDeliveryHours: fastOnly ? 2 : undefined},
      );
      setResults(res.data.data || []);
      setSearched(true);
      // Remember it: listings and search elsewhere need a delivery area to
      // show suppliers at all, and this is often the only place a customer
      // ever types one.
      dispatch(setDeliveryPincode(pin));
    } catch (e: any) {
      setError(
        e?.response?.data?.message || 'Could not load vendors. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [materialId, pincode, sort, fastOnly, dispatch]);

  // Auto-search once a pincode is available from prefill.
  useEffect(() => {
    if (pincode && !searched) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincode]);

  // Re-query when the customer changes the ordering or the fast-delivery
  // filter — but only once they've already run a search, so changing a chip
  // before entering a pincode doesn't fire a pointless request.
  useEffect(() => {
    if (searched) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, fastOnly]);

  // Reaching this screen from search must never be a dead end: if nobody
  // stocks the material for this pincode there is still a catalogue page to
  // read, ask a quote on, or come back to after changing the pincode.
  const openProductDetail = () => {
    if (!materialId) return;
    navigation?.navigate('ProductDetail', {
      productId: materialId,
      productName: route?.params?.materialName,
    });
  };

  const handleSelect = (vendor: MaterialVendorOption) => {
    if (!materialId) return;
    // Navigating back to an already-in-stack screen merges these params
    // into it and pops back to that instance (see ProductDetailScreen's
    // selectedVendor state, which watches for exactly these two params).
    navigation?.navigate('ProductDetail', {
      productId: materialId,
      // Arriving from search there is no ProductDetail in the stack yet, so
      // the name here is what the header shows while the fetch is in flight.
      productName: route?.params?.materialName,
      selectedVendorId: vendor.vendorId,
      selectedVendorCode: vendor.vendorCode,
      // Carry the vendor's own price back so the product page and the cart
      // show the amount the backend will actually charge for this vendor,
      // instead of the master catalog price.
      selectedVendorPrice: vendor.price,
      selectedVendorDelivery: vendor.deliveryEstimate,
    });
  };

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
      <ScreenHeader
        title="Compare Vendors"
        onBack={() => navigation?.goBack()}
      />
      <View style={{padding: scale(16)}}>
        <Text
          style={{
            fontFamily: FONTS.regular,
            fontSize: scale(12),
            color: COLORS.textSecondary,
            marginBottom: scale(12),
          }}>
          Vendors selling {materialName} near your delivery pincode.
        </Text>
        <View style={{flexDirection: 'row', gap: scale(8)}}>
          <TextInput
            value={pincode}
            onChangeText={setPincode}
            placeholder="Enter pincode"
            placeholderTextColor={COLORS.textLight}
            keyboardType="numeric"
            maxLength={6}
            style={{
              flex: 1,
              height: scale(44),
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: scale(10),
              paddingHorizontal: scale(14),
              fontFamily: FONTS.regular,
              fontSize: scale(14),
              color: COLORS.textPrimary,
              backgroundColor: COLORS.backgroundWhite,
            }}
          />
          <TouchableOpacity
            onPress={search}
            disabled={loading}
            style={{
              paddingHorizontal: scale(20),
              borderRadius: scale(10),
              backgroundColor: COLORS.primary,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: loading ? 0.6 : 1,
            }}>
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(13),
                color: COLORS.secondary,
              }}>
              Search
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sort + filter (items: sort by price, sort/filter by delivery
            time). Applied server-side so ties break the same way the
            backend's recommended ordering does. */}
        {searched && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{gap: scale(8), paddingTop: scale(12)}}>
            {SORT_OPTIONS.map(opt => {
              const active = sort === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setSort(opt.key)}
                  style={{
                    paddingHorizontal: scale(12),
                    paddingVertical: scale(7),
                    borderRadius: scale(16),
                    borderWidth: 1,
                    borderColor: active ? COLORS.primary : COLORS.border,
                    backgroundColor: active ? COLORS.primary : 'transparent',
                  }}>
                  <Text
                    style={{
                      fontFamily: active ? FONTS.semiBold : FONTS.regular,
                      fontSize: scale(12),
                      color: active ? COLORS.secondary : COLORS.textSecondary,
                    }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              onPress={() => setFastOnly(v => !v)}
              style={{
                paddingHorizontal: scale(12),
                paddingVertical: scale(7),
                borderRadius: scale(16),
                borderWidth: 1,
                borderColor: fastOnly ? '#15803D' : COLORS.border,
                backgroundColor: fastOnly ? '#DCFCE7' : 'transparent',
              }}>
              <Text
                style={{
                  fontFamily: fastOnly ? FONTS.semiBold : FONTS.regular,
                  fontSize: scale(12),
                  color: fastOnly ? '#15803D' : COLORS.textSecondary,
                }}>
                Within 2 hrs
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: scale(16), paddingTop: 0}}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{paddingVertical: scale(60), alignItems: 'center'}}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : error ? (
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: scale(13),
              color: COLORS.textSecondary,
              textAlign: 'center',
              paddingVertical: scale(40),
            }}>
            {error}
          </Text>
        ) : searched && results.length === 0 ? (
          <View style={{paddingVertical: scale(40), alignItems: 'center'}}>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(13),
                color: COLORS.textSecondary,
                textAlign: 'center',
              }}>
              No vendors currently stock this material for that pincode.
            </Text>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(12),
                color: COLORS.textLight,
                textAlign: 'center',
                marginTop: scale(6),
              }}>
              Try a nearby pincode, or open the product page to request a
              quotation.
            </Text>
            <TouchableOpacity
              onPress={openProductDetail}
              style={{
                marginTop: scale(16),
                paddingHorizontal: scale(18),
                paddingVertical: scale(10),
                borderRadius: scale(10),
                borderWidth: 1,
                borderColor: COLORS.primary,
              }}>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(12),
                  color: COLORS.primary,
                }}>
                View product details
              </Text>
            </TouchableOpacity>
          </View>
        ) : !searched ? (
          // Nothing known yet: say what the pincode buys them, so the empty
          // screen reads as a prompt rather than as a broken search.
          <View style={{paddingVertical: scale(40), alignItems: 'center'}}>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(13),
                color: COLORS.textSecondary,
                textAlign: 'center',
              }}>
              Enter your delivery pincode above to see every supplier selling{' '}
              {materialName}, with their price and delivery time.
            </Text>
            <TouchableOpacity
              onPress={openProductDetail}
              style={{marginTop: scale(14)}}>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: scale(12),
                  color: COLORS.primary,
                  textDecorationLine: 'underline',
                }}>
                View product details
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          results.map(v => (
            <TouchableOpacity
              key={v.vendorId}
              onPress={() => handleSelect(v)}
              activeOpacity={0.7}
              style={{
                backgroundColor: COLORS.backgroundWhite,
                borderRadius: scale(10),
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: scale(14),
                marginBottom: scale(10),
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}>
                <View style={{flex: 1, paddingRight: scale(10)}}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: scale(6),
                    }}>
                    <Text
                      style={{
                        fontFamily: FONTS.semiBold,
                        fontSize: scale(14),
                        color: COLORS.textPrimary,
                      }}>
                      {v.vendorCode || 'Supplier'}
                    </Text>
                    {preferredVendorId === v.vendorId && (
                      <View
                        style={{
                          backgroundColor: '#FEF3C7',
                          paddingHorizontal: scale(6),
                          paddingVertical: scale(2),
                          borderRadius: scale(10),
                        }}>
                        <Text
                          style={{
                            fontFamily: FONTS.medium,
                            fontSize: scale(9),
                            color: '#92400E',
                          }}>
                          From your search
                        </Text>
                      </View>
                    )}
                  </View>
                  {v.distanceKm != null && (
                    <Text
                      style={{
                        fontFamily: FONTS.regular,
                        fontSize: scale(11),
                        color: COLORS.textSecondary,
                        marginTop: scale(2),
                      }}>
                      {v.distanceKm} km away
                    </Text>
                  )}
                  {v.deliveryEstimate && (
                    <View
                      style={{
                        marginTop: scale(6),
                        alignSelf: 'flex-start',
                        backgroundColor: '#DCFCE7',
                        paddingHorizontal: scale(8),
                        paddingVertical: scale(3),
                        borderRadius: scale(12),
                      }}>
                      <Text
                        style={{
                          fontFamily: FONTS.medium,
                          fontSize: scale(10),
                          color: '#15803D',
                        }}>
                        {v.deliveryEstimate}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: scale(15),
                    color: COLORS.primary,
                  }}>
                  {formatCurrency(v.price)}
                </Text>
              </View>

              {/* Pivot from "who sells this?" to "what else do they sell?" */}
              <TouchableOpacity
                onPress={() =>
                  navigation?.navigate('VendorProfile', {
                    vendorId: v.vendorId,
                    vendorCode: v.vendorCode,
                  })
                }
                style={{marginTop: scale(8), alignSelf: 'flex-start'}}>
                <Text
                  style={{
                    fontFamily: FONTS.medium,
                    fontSize: scale(11),
                    color: COLORS.primary,
                    textDecorationLine: 'underline',
                  }}>
                  View all materials from this supplier
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default VendorComparisonScreen;
