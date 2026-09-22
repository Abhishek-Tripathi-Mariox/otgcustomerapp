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
} from '../services/vendorSearchService';
import addressService from '../services/addressService';
import authService from '../services/authService';

interface Props {
  navigation?: any;
  route?: {params?: {materialId: string; materialName?: string}};
}

const formatCurrency = (n: number | null) =>
  n == null ? '—' : `₹${Math.round(n).toLocaleString('en-IN')}`;

const VendorComparisonScreen: React.FC<Props> = ({navigation, route}) => {
  const materialId = route?.params?.materialId;
  const materialName = route?.params?.materialName || 'this material';

  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<MaterialVendorOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Prefill from the customer's default saved site / checkout profile so a
  // returning customer doesn't have to type their pincode every time —
  // still editable, since F28 lets them search a different region too.
  useEffect(() => {
    (async () => {
      try {
        const addrRes = await addressService.list();
        const primary = addrRes.data?.data?.find(a => a.isDefault);
        if (primary?.pincode) {
          setPincode(primary.pincode);
          return;
        }
      } catch {
        // fall through to checkout profile
      }
      try {
        const profileRes = await authService.getProfile();
        const pin = profileRes.data?.data?.checkoutProfile?.pincode;
        if (pin) setPincode(pin);
      } catch {
        // no prefill available — customer types it in manually
      }
    })();
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
      );
      setResults(res.data.data || []);
      setSearched(true);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || 'Could not load vendors. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [materialId, pincode]);

  // Auto-search once a pincode is available from prefill.
  useEffect(() => {
    if (pincode && !searched) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincode]);

  const handleSelect = (vendor: MaterialVendorOption) => {
    if (!materialId) return;
    // Navigating back to an already-in-stack screen merges these params
    // into it and pops back to that instance (see ProductDetailScreen's
    // selectedVendor state, which watches for exactly these two params).
    navigation?.navigate('ProductDetail', {
      productId: materialId,
      selectedVendorId: vendor.vendorId,
      selectedVendorName: vendor.vendorName,
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
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: scale(13),
              color: COLORS.textSecondary,
              textAlign: 'center',
              paddingVertical: scale(40),
            }}>
            No vendors currently stock this material for that pincode.
          </Text>
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
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: scale(14),
                      color: COLORS.textPrimary,
                    }}>
                    {v.vendorName}
                  </Text>
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
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default VendorComparisonScreen;
