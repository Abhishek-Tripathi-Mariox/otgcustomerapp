import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '../services/api';
import {showAppAlert} from '../components/AlertProvider';
import {scale} from '../utils/scale';
import {BackArrowIcon} from '../components/icons';
import {Card} from '../components';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import orderService, {Order} from '../services/orderService';
import {formatCurrency} from '../utils/currency';

const ONGOING_STATUSES: Order['status'][] = ['pending', 'confirmed', 'in_transit'];

const statusLabel = (s: Order['status']): string => {
  switch (s) {
    case 'pending':
      return 'Pending';
    case 'confirmed':
      return 'Confirmed';
    case 'in_transit':
      return 'In Transit';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return s;
  }
};

const statusColor = (s: Order['status']): string => {
  switch (s) {
    case 'delivered':
      return COLORS.success;
    case 'cancelled':
      return COLORS.error;
    case 'in_transit':
      return COLORS.warning;
    default:
      return COLORS.textPrimary;
  }
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${date} | ${time}`;
};

// (currency formatting handled by shared formatCurrency)

const materialName = (o: Order): string => {
  if (typeof o.material === 'string') return 'Order item';
  return o.material?.name || 'Order item';
};

const materialIdOf = (o: Order): string | undefined => {
  if (!o.material) return undefined;
  return typeof o.material === 'string' ? o.material : o.material?._id;
};

const MyOrdersScreen: React.FC<{navigation?: any}> = ({navigation}) => {
  const openInvoice = async (id?: string) => {
    if (!id) return;
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        showAppAlert('Invoice', 'Please log in again to view the invoice.');
        return;
      }
      const url = `${API_BASE_URL}/mobile/orders/${id}/invoice?token=${encodeURIComponent(
        token,
      )}`;
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      } else {
        showAppAlert('Invoice', 'Could not open the invoice.');
      }
    } catch {
      showAppAlert('Invoice', 'Could not open the invoice. Please try again.');
    }
  };

  const [activeTab, setActiveTab] = useState<'ongoing' | 'past'>('ongoing');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    try {
      if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await orderService.list('all');
      setOrders(res.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ongoing = orders.filter(o => ONGOING_STATUSES.includes(o.status));
  const past = orders.filter(o => !ONGOING_STATUSES.includes(o.status));
  const visible = activeTab === 'ongoing' ? ongoing : past;

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} translucent />

      {/* Header */}
      <View
        style={{
          backgroundColor: COLORS.secondary,
          paddingBottom: scale(0),
          paddingTop: scale(40),
          paddingHorizontal: scale(16),
        }}>
        <View style={{flexDirection: 'row', alignItems: 'center', paddingBottom: scale(12)}}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={{marginRight: scale(12)}}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={{fontFamily: FONTS.semiBold, fontSize: scale(18), color: COLORS.textWhite}}>
            My Orders
          </Text>
        </View>

        {/* Tabs */}
        <View style={{flexDirection: 'row'}}>
          <TouchableOpacity
            onPress={() => setActiveTab('ongoing')}
            style={{
              flex: 1,
              paddingVertical: scale(12),
              borderBottomWidth: 2,
              borderBottomColor: activeTab === 'ongoing' ? COLORS.primary : 'transparent',
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontFamily: activeTab === 'ongoing' ? FONTS.medium : FONTS.regular,
                fontSize: scale(14),
                color: activeTab === 'ongoing' ? COLORS.textWhite : COLORS.textSecondary,
              }}>
              Ongoing Order(s) {ongoing.length > 0 ? `(${ongoing.length})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('past')}
            style={{
              flex: 1,
              paddingVertical: scale(12),
              borderBottomWidth: 2,
              borderBottomColor: activeTab === 'past' ? COLORS.primary : 'transparent',
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontFamily: activeTab === 'past' ? FONTS.medium : FONTS.regular,
                fontSize: scale(14),
                color: activeTab === 'past' ? COLORS.textWhite : COLORS.textSecondary,
              }}>
              Past Order(s) {past.length > 0 ? `(${past.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          style={{flex: 1}}
          showsVerticalScrollIndicator={false}
          bounces
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load('refresh')}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }>
          {error && (
            <View
              style={{
                margin: scale(16),
                padding: scale(14),
                borderRadius: scale(10),
                backgroundColor: '#FDECEC',
                borderWidth: 1,
                borderColor: '#F5C2C2',
              }}>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: scale(13),
                  color: COLORS.error,
                }}>
                {error}
              </Text>
            </View>
          )}

          {!error && visible.length === 0 && (
            <View
              style={{
                marginTop: scale(48),
                alignItems: 'center',
                paddingHorizontal: scale(32),
              }}>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(15),
                  color: COLORS.secondary,
                }}>
                {activeTab === 'ongoing'
                  ? 'No ongoing orders'
                  : 'No past orders yet'}
              </Text>
              <Text
                style={{
                  marginTop: scale(6),
                  fontFamily: FONTS.regular,
                  fontSize: scale(12),
                  color: COLORS.textLight,
                  textAlign: 'center',
                }}>
                {activeTab === 'ongoing'
                  ? 'Anything you order will show up here.'
                  : 'Completed orders will appear here.'}
              </Text>
            </View>
          )}

          {visible.map(order => (
            <Card key={order._id}>
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
                    Order No.:{' '}
                    <Text style={{fontFamily: FONTS.medium}}>
                      #{order.bookingId}
                    </Text>
                  </Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: scale(14),
                      color: COLORS.textPrimary,
                    }}>
                    {formatCurrency(order.totalAmount)}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.medium,
                      fontSize: scale(12),
                      color: statusColor(order.status),
                      marginTop: scale(2),
                    }}>
                    {statusLabel(order.status)}
                  </Text>
                </View>
              </View>

              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(11),
                  color: COLORS.textLight,
                  marginTop: scale(4),
                }}>
                Order Date: {formatDate(order.createdAt)}
              </Text>
              {order.paymentMethod ? (
                <Text
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: scale(11),
                    color: COLORS.textLight,
                    marginTop: scale(2),
                  }}>
                  Payment Method: {order.paymentMethod}
                </Text>
              ) : null}
              <TouchableOpacity
                activeOpacity={materialIdOf(order) ? 0.7 : 1}
                onPress={() => {
                  const mid = materialIdOf(order);
                  if (!mid) return;
                  navigation?.navigate('ProductDetail', {
                    productId: mid,
                    productName: materialName(order),
                  });
                }}
                style={{marginTop: scale(2)}}>
                <Text
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: scale(11),
                    color: materialIdOf(order)
                      ? COLORS.warning
                      : COLORS.textLight,
                    textDecorationLine: materialIdOf(order)
                      ? 'underline'
                      : 'none',
                  }}
                  numberOfLines={1}>
                  {materialName(order)} × {order.quantity} {order.unit}
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  marginTop: scale(10),
                  gap: scale(10),
                }}>
                <TouchableOpacity
                  onPress={() =>
                    navigation?.navigate('OrderDetails', {orderId: order._id})
                  }
                  style={{
                    paddingHorizontal: scale(20),
                    paddingVertical: scale(8),
                    borderRadius: scale(6),
                    backgroundColor: COLORS.primary,
                  }}>
                  <Text
                    style={{
                      fontFamily: FONTS.medium,
                      fontSize: scale(12),
                      color: COLORS.textPrimary,
                    }}>
                    {activeTab === 'ongoing' ? 'Status' : 'Details'}
                  </Text>
                </TouchableOpacity>
                {activeTab === 'past' && (
                  <TouchableOpacity
                    onPress={() => openInvoice(order._id || order.bookingId)}
                    style={{
                      paddingHorizontal: scale(16),
                      paddingVertical: scale(8),
                      borderRadius: scale(6),
                      borderWidth: 1,
                      borderColor: COLORS.secondary,
                    }}>
                    <Text
                      style={{
                        fontFamily: FONTS.medium,
                        fontSize: scale(12),
                        color: COLORS.textPrimary,
                      }}>
                      Get Invoice
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))}

          <View style={{height: scale(30)}} />
        </ScrollView>
      )}
    </View>
  );
};

export default MyOrdersScreen;
