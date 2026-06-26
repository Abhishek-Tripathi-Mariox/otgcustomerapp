import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, {Path, Circle} from 'react-native-svg';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {CheckCircleIcon} from '../components/icons';
import {ScreenHeader, Card} from '../components';
import {showAppAlert} from '../components/AlertProvider';
import orderService, {Order} from '../services/orderService';
import {API_BASE_URL} from '../services/api';
import catalogService, {Review, RatingStats} from '../services/catalogService';
import {formatCurrency} from '../utils/currency';

// --- Star rating icons (colors.starFilled #FFD700) ---

const StarFilledIcon = ({size = 22}: {size?: number}) => (
  <Svg width={scale(size)} height={scale(size)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      fill={COLORS.starFilled}
    />
  </Svg>
);

const StarEmptyIcon = ({size = 22}: {size?: number}) => (
  <Svg width={scale(size)} height={scale(size)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      stroke={COLORS.starEmpty}
      strokeWidth={1.5}
      fill="none"
    />
  </Svg>
);

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

// --- Screen-specific Icons ---


const InvoiceIcon = () => (
  <Svg width={scale(18)} height={scale(18)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
      stroke={COLORS.textSecondary}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 2V8H20"
      stroke={COLORS.textSecondary}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const formatDate = (iso?: string): string => {
  if (!iso) return '—';
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

const fmt = formatCurrency;

const statusBannerText = (status: Order['status'], bookingId: string): string => {
  switch (status) {
    case 'pending':
      return `Your order (${bookingId}) has been placed and is awaiting confirmation.`;
    case 'confirmed':
      return `Your order (${bookingId}) is confirmed and being prepared for dispatch.`;
    case 'in_transit':
      return `Your order (${bookingId}) is on its way to your address.`;
    case 'delivered':
      return `Your order (${bookingId}) has been delivered successfully.`;
    case 'cancelled':
      return `Your order (${bookingId}) was cancelled.`;
    default:
      return `Order ${bookingId}.`;
  }
};

const OrderDetailsScreen: React.FC<{navigation?: any; route?: any}> = ({
  navigation,
  route,
}) => {
  const orderId: string | undefined = route?.params?.orderId;

  const handleGetInvoice = async () => {
    const id = orderId || order?._id || order?.bookingId;
    if (!id) {
      showAppAlert('Invoice', 'Order details are still loading. Please retry.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        showAppAlert('Invoice', 'Please log in again to view the invoice.');
        return;
      }
      const url = `${API_BASE_URL}/mobile/orders/${id}/invoice?token=${encodeURIComponent(
        token,
      )}`;
      const ok = await Linking.canOpenURL(url);
      if (ok) {
        await Linking.openURL(url);
      } else {
        showAppAlert('Invoice', 'Could not open the invoice.');
      }
    } catch {
      showAppAlert('Invoice', 'Could not open the invoice. Please try again.');
    }
  };

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rating & reviews (issue #9)
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!orderId) {
      setLoading(false);
      setError('Order not specified.');
      return;
    }
    (async () => {
      try {
        const res = await orderService.get(orderId);
        if (!cancelled) setOrder(res.data.data);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load order.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const materialName =
    order && typeof order.material !== 'string'
      ? order.material?.name || 'Item'
      : 'Item';

  const materialId: string | undefined = !order
    ? undefined
    : typeof order.material === 'string'
    ? order.material
    : order.material?._id;

  const openProduct = () => {
    if (!materialId) return;
    navigation?.navigate('ProductDetail', {
      productId: materialId,
      productName: materialName,
    });
  };

  // Load existing reviews/rating stats for the ordered material.
  const loadReviews = useCallback(async (id: string) => {
    try {
      const res = await catalogService.getReviews(id);
      if (res.data?.success) {
        setReviews(res.data.data || []);
        setRatingStats(res.data.stats || null);
      }
    } catch {
      // leave empty — section just shows the rate prompt
    }
  }, []);

  useEffect(() => {
    if (materialId) loadReviews(materialId);
  }, [materialId, loadReviews]);

  // Only delivered orders may be rated/reviewed.
  const canReview = order?.status === 'delivered' && !!materialId;

  const handleSubmitReview = async () => {
    if (!materialId) return;
    if (selectedRating < 1) {
      showAppAlert({
        title: 'Select a rating',
        message: 'Please tap a star to rate this product.',
      });
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await catalogService.submitReview(materialId, {
        rating: selectedRating,
        comment: reviewText.trim() || undefined,
      });
      if (res.data?.stats) setRatingStats(res.data.stats);
      setSelectedRating(0);
      setReviewText('');
      await loadReviews(materialId);
      showAppAlert({
        title: 'Thank you!',
        message: 'Your rating and review have been submitted.',
      });
    } catch (err: any) {
      showAppAlert({
        title: 'Could not submit',
        message:
          err?.response?.data?.message ||
          'Failed to submit your review. Please try again.',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const subtotal = order ? order.price * order.quantity : 0;
  // GST/discount are returned per-booking by the API (fall back to 0 if absent).
  const gst = order?.gstAmount ?? 0;
  const discount = order?.discountAmount ?? 0;
  const grandTotal = order ? order.totalAmount : 0;

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
      <ScreenHeader
        title="Order Details"
        onBack={() => navigation?.goBack()}
      />

      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error || !order ? (
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
            {error || 'Order not found.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{flex: 1}}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          {/* Order Status Banner */}
          <View
            style={{
              marginHorizontal: scale(16),
              marginTop: scale(16),
              backgroundColor: '#F0FAF0',
              borderRadius: scale(12),
              borderWidth: 1,
              borderColor: '#C8E6C9',
              padding: scale(16),
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: scale(10),
            }}>
            <CheckCircleIcon />
            <Text
              style={{
                flex: 1,
                fontFamily: FONTS.regular,
                fontSize: scale(12),
                color: COLORS.textLight,
                lineHeight: scale(18),
              }}>
              {statusBannerText(order.status, order.bookingId)}
            </Text>
          </View>

          {/* Order Information */}
          <Card>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(16),
                  color: COLORS.textPrimary,
                }}>
                Order Information
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation?.navigate('TrackOrder', {orderId: order._id})
                }
                style={{
                  paddingHorizontal: scale(16),
                  paddingVertical: scale(6),
                  borderRadius: scale(6),
                  borderWidth: 1.5,
                  borderColor: COLORS.primary,
                }}>
                <Text
                  style={{
                    fontFamily: FONTS.medium,
                    fontSize: scale(12),
                    color: COLORS.textPrimary,
                  }}>
                  Track
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(12),
                color: COLORS.textLight,
                marginTop: scale(10),
              }}>
              Order ID: #{order.bookingId}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(12),
                color: COLORS.textLight,
                marginTop: scale(4),
              }}>
              Order Date: {formatDate(order.createdAt)}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(12),
                color: COLORS.textLight,
                marginTop: scale(4),
              }}>
              Payment Method: {order.paymentMethod || 'Not specified'}
            </Text>
            {order.site ? (
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(12),
                  color: COLORS.textLight,
                  marginTop: scale(4),
                }}>
                Delivery Site: {order.site}
              </Text>
            ) : null}
          </Card>

          {/* Invoice Details */}
          <Card>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(16),
                  color: COLORS.textPrimary,
                }}>
                Invoice Details
              </Text>
              <TouchableOpacity
                onPress={handleGetInvoice}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: scale(4),
                }}>
                <InvoiceIcon />
                <Text
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: scale(12),
                    color: COLORS.textSecondary,
                  }}>
                  Get Invoice
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={materialId ? 0.7 : 1}
              onPress={materialId ? openProduct : undefined}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: scale(14),
              }}>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: scale(13),
                  color: COLORS.textPrimary,
                  flex: 1,
                }}>
                {materialName}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(13),
                  color: COLORS.textSecondary,
                  marginHorizontal: scale(16),
                }}>
                × {order.quantity} {order.unit}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(13),
                  color: COLORS.textPrimary,
                }}>
                {fmt(subtotal)}
              </Text>
            </TouchableOpacity>

            <View
              style={{
                height: 1,
                backgroundColor: COLORS.divider,
                marginTop: scale(16),
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: scale(12),
              }}>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(13),
                  color: COLORS.textPrimary,
                }}>
                Subtotal
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(13),
                  color: COLORS.textPrimary,
                }}>
                {fmt(subtotal)}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: scale(8),
              }}>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(13),
                  color: COLORS.textPrimary,
                }}>
                GST
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(13),
                  color: COLORS.textPrimary,
                }}>
                {fmt(gst)}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: scale(8),
              }}>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(13),
                  color: COLORS.textPrimary,
                }}>
                Discount (-)
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(13),
                  color: COLORS.textPrimary,
                }}>
                {fmt(discount)}
              </Text>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: COLORS.divider,
                marginTop: scale(12),
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: scale(12),
              }}>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(15),
                  color: COLORS.textPrimary,
                }}>
                Grand Total
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(15),
                  color: COLORS.textPrimary,
                }}>
                {fmt(grandTotal)}
              </Text>
            </View>
          </Card>

          {/* Ratings & Reviews */}
          <Card>
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(16),
                color: COLORS.textPrimary,
              }}>
              Ratings & Reviews
            </Text>

            {/* Aggregate rating summary */}
            {ratingStats && ratingStats.total > 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: scale(6),
                  marginTop: scale(10),
                }}>
                <View style={{flexDirection: 'row'}}>
                  {[1, 2, 3, 4, 5].map(star =>
                    star <= Math.round(ratingStats.average) ? (
                      <StarFilledIcon key={star} size={16} />
                    ) : (
                      <StarEmptyIcon key={star} size={16} />
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
            ) : null}

            {/* Rate-this-product form — only for delivered orders */}
            {canReview ? (
              <View style={{marginTop: scale(14)}}>
                <Text
                  style={{
                    fontFamily: FONTS.medium,
                    fontSize: scale(13),
                    color: COLORS.textPrimary,
                  }}>
                  Rate {materialName}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: scale(8),
                    marginTop: scale(10),
                  }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity
                      key={star}
                      activeOpacity={0.7}
                      onPress={() => setSelectedRating(star)}>
                      {star <= selectedRating ? (
                        <StarFilledIcon size={28} />
                      ) : (
                        <StarEmptyIcon size={28} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

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
                  placeholder="Write a review (optional)"
                  placeholderTextColor={COLORS.textPlaceholder}
                  multiline
                  value={reviewText}
                  onChangeText={setReviewText}
                />

                <TouchableOpacity
                  onPress={handleSubmitReview}
                  disabled={submittingReview}
                  style={{
                    marginTop: scale(14),
                    alignSelf: 'flex-start',
                    height: scale(44),
                    paddingHorizontal: scale(28),
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
                      Submit Review
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <Text
                style={{
                  marginTop: scale(10),
                  fontFamily: FONTS.regular,
                  fontSize: scale(12),
                  color: COLORS.textSecondary,
                }}>
                {order.status === 'delivered'
                  ? 'You can rate this product here.'
                  : 'You can rate this product once your order is delivered.'}
              </Text>
            )}

            {/* Existing reviews */}
            {reviews.length > 0 ? (
              <View style={{marginTop: scale(16)}}>
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
                  </View>
                ))}
              </View>
            ) : null}
          </Card>

          <View style={{height: scale(30)}} />
        </ScrollView>
      )}
    </View>
  );
};

export default OrderDetailsScreen;
