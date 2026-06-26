import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {ScreenHeader, PrimaryButton} from '../components';
import orderService, {OrderTracking} from '../services/orderService';

const DeliveryCheckIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={COLORS.error} strokeWidth={1.5} fill="#FFF0F0" />
    <Path d="M8 12L11 15L16 9" stroke={COLORS.error} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TimelineCheckIcon = ({completed}: {completed: boolean}) => (
  <Svg width={scale(32)} height={scale(32)} viewBox="0 0 32 32" fill="none">
    <Circle cx={16} cy={16} r={14} fill={completed ? COLORS.success : COLORS.border} />
    <Path d="M10 16L14 20L22 12" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const formatStepTime = (iso?: string | null): string => {
  if (!iso) return 'Pending';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Pending';
  const time = d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const date = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${time} - ${date}`;
};

const formatDeliveryDate = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const TrackOrderScreen: React.FC<{navigation?: any; route?: any}> = ({navigation, route}) => {
  const orderId: string | undefined = route?.params?.orderId;

  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!orderId) {
      setLoading(false);
      setError('Order not specified.');
      return;
    }
    (async () => {
      try {
        const res = await orderService.getTracking(orderId);
        if (!cancelled) setTracking(res.data.data);
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message || 'Failed to load order tracking.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const bookingLabel = tracking ? `#${tracking.bookingId}` : '';
  const steps = tracking?.steps || [];

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
      <ScreenHeader
        title="Ongoing Order"
        onBack={() => navigation?.goBack()}
        rightContent={
          <TouchableOpacity
            onPress={() => navigation?.navigate('Help')}
            style={{
              paddingHorizontal: scale(16),
              paddingVertical: scale(6),
              borderRadius: scale(6),
              borderWidth: 1.5,
              borderColor: COLORS.primary,
            }}>
            <Text style={{fontFamily: FONTS.medium, fontSize: scale(12), color: COLORS.primary}}>
              Help
            </Text>
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error || !tracking ? (
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
            {error || 'Tracking information is not available.'}
          </Text>
        </View>
      ) : (
        <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false} bounces={false}>
          {/* Order Info Card */}
          <View style={{
            marginHorizontal: scale(16),
            marginTop: scale(16),
            backgroundColor: COLORS.textWhite,
            borderRadius: scale(12),
            borderWidth: 1,
            borderColor: COLORS.border,
            borderLeftWidth: 4,
            borderLeftColor: COLORS.primary,
            padding: scale(16),
          }}>
            <Text style={{fontFamily: FONTS.semiBold, fontSize: scale(14), color: COLORS.textPrimary}}>
              Order No: {bookingLabel}
            </Text>
            {formatDeliveryDate(tracking.deliveryDate) ? (
              <Text style={{fontFamily: FONTS.regular, fontSize: scale(12), color: COLORS.textLight, marginTop: scale(4)}}>
                Expected Delivery: {formatDeliveryDate(tracking.deliveryDate)}
              </Text>
            ) : null}
            {tracking.driver ? (
              <Text style={{fontFamily: FONTS.regular, fontSize: scale(12), color: COLORS.textLight, marginTop: scale(2)}}>
                Driver: {tracking.driver.name || 'Assigned'}
                {tracking.driver.vehicleNumber ? ` (${tracking.driver.vehicleNumber})` : ''}
              </Text>
            ) : null}
          </View>

          {/* Delivery Address Card */}
          {tracking.dropAddress ? (
            <View style={{
              marginHorizontal: scale(16),
              marginTop: scale(12),
              backgroundColor: COLORS.textWhite,
              borderRadius: scale(12),
              borderWidth: 1,
              borderColor: COLORS.border,
              borderLeftWidth: 4,
              borderLeftColor: COLORS.primary,
              padding: scale(16),
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: scale(10),
            }}>
              <DeliveryCheckIcon />
              <View style={{flex: 1}}>
                <Text style={{fontFamily: FONTS.semiBold, fontSize: scale(14), color: COLORS.textPrimary}}>
                  Delivery Address
                </Text>
                <Text style={{fontFamily: FONTS.regular, fontSize: scale(12), color: COLORS.textLight, marginTop: scale(4), lineHeight: scale(18)}}>
                  {tracking.dropAddress}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Track Your Orders */}
          <View style={{
            marginHorizontal: scale(16),
            marginTop: scale(20),
            backgroundColor: COLORS.textWhite,
            borderRadius: scale(12),
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: scale(20),
          }}>
            {/* Header */}
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(20)}}>
              <Text style={{fontFamily: FONTS.semiBold, fontSize: scale(15), color: COLORS.textPrimary}}>
                Track Your Orders
              </Text>
              <Text style={{fontFamily: FONTS.regular, fontSize: scale(13), color: COLORS.textSecondary}}>
                {bookingLabel}
              </Text>
            </View>

            {/* Timeline */}
            {steps.length === 0 ? (
              <Text style={{fontFamily: FONTS.regular, fontSize: scale(13), color: COLORS.textSecondary}}>
                No tracking updates yet.
              </Text>
            ) : (
              steps.map((step, index) => (
                <View key={step.key} style={{flexDirection: 'row'}}>
                  {/* Left: icon + line */}
                  <View style={{alignItems: 'center', width: scale(40)}}>
                    <TimelineCheckIcon completed={step.done} />
                    {index < steps.length - 1 && (
                      <View style={{
                        width: 2,
                        height: scale(50),
                        backgroundColor: step.done ? COLORS.success : COLORS.border,
                        borderStyle: index === steps.length - 2 ? 'dashed' : 'solid',
                      }} />
                    )}
                  </View>

                  {/* Right: text */}
                  <View style={{flex: 1, marginLeft: scale(12), paddingTop: scale(4)}}>
                    <Text style={{fontFamily: FONTS.medium, fontSize: scale(14), color: COLORS.textPrimary}}>
                      {step.label}
                    </Text>
                    <Text style={{fontFamily: FONTS.regular, fontSize: scale(12), color: COLORS.textSecondary, marginTop: scale(2)}}>
                      {formatStepTime(step.at)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={{height: scale(100)}} />
        </ScrollView>
      )}

      {/* Back Button */}
      <View style={{
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
          title="Back"
          onPress={() => navigation?.goBack()}
        />
      </View>
    </View>
  );
};

export default TrackOrderScreen;
