import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {ScreenHeader} from '../components';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import quotationService, {Quotation} from '../services/quotationService';
import {formatCurrency} from '../utils/currency';
import {showAppAlert} from '../components/AlertProvider';

interface Props {
  navigation?: any;
}

const STATUS_STYLES: Record<
  Quotation['status'],
  {bg: string; text: string; label: string}
> = {
  new: {bg: '#DBEAFE', text: '#1D4ED8', label: 'Waiting for quote'},
  quoted: {bg: '#FFEDD5', text: '#C2410C', label: 'Quote received'},
  accepted: {bg: '#DCFCE7', text: '#15803D', label: 'Accepted'},
  rejected: {bg: '#FEE2E2', text: '#B91C1C', label: 'Rejected'},
  expired: {bg: '#F3F4F6', text: '#6B7280', label: 'Expired'},
};

const MyQuotationsScreen: React.FC<Props> = ({navigation}) => {
  const [list, setList] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await quotationService.listMine();
      setList(res.data.data || []);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        setError('Please log in to view your quotations.');
      } else {
        setError('Failed to load. Pull down to refresh.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = useCallback(
    (id: string, status: 'accepted' | 'rejected') => {
      showAppAlert({
        title: status === 'accepted' ? 'Accept this quote?' : 'Reject this quote?',
        message:
          status === 'accepted'
            ? 'Our team will reach out to confirm your order.'
            : 'You can request a new quotation anytime.',
        buttons: [
          {text: 'Cancel', style: 'cancel'},
          {
            text: status === 'accepted' ? 'Accept' : 'Reject',
            style: status === 'accepted' ? 'primary' : 'destructive',
            onPress: async () => {
              setActingId(id);
              try {
                await quotationService.setStatus(id, status);
                await load();
              } catch (e: any) {
                showAppAlert({
                  title: 'Action failed',
                  message:
                    e?.response?.data?.message ||
                    'Could not update the quotation. Please try again.',
                });
              } finally {
                setActingId(null);
              }
            },
          },
        ],
      });
    },
    [load],
  );

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
      <ScreenHeader
        title="My Quotations"
        onBack={() => navigation?.goBack()}
      />

      {loading ? (
        <View
          style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{padding: scale(16), paddingBottom: scale(40)}}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }>
          {error ? (
            <View style={{paddingVertical: scale(40), alignItems: 'center'}}>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(13),
                  color: COLORS.textSecondary,
                  textAlign: 'center',
                }}>
                {error}
              </Text>
            </View>
          ) : list.length === 0 ? (
            <View style={{paddingVertical: scale(60), alignItems: 'center'}}>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(15),
                  color: COLORS.textPrimary,
                  marginBottom: scale(6),
                }}>
                No quotations yet
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(12),
                  color: COLORS.textSecondary,
                  textAlign: 'center',
                  paddingHorizontal: scale(20),
                }}>
                Tap "Get Quotation" to request a price for bulk materials.
              </Text>
              <TouchableOpacity
                onPress={() => navigation?.navigate('GetQuotation')}
                style={{
                  marginTop: scale(20),
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: scale(20),
                  paddingVertical: scale(10),
                  borderRadius: scale(8),
                }}>
                <Text
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: scale(13),
                    color: '#fff',
                  }}>
                  Get Quotation
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            list.map((q) => {
              const s = STATUS_STYLES[q.status] || STATUS_STYLES.new;
              return (
                <View
                  key={q._id}
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
                      alignItems: 'center',
                    }}>
                    <Text
                      style={{
                        fontFamily: FONTS.semiBold,
                        fontSize: scale(13),
                        color: COLORS.textPrimary,
                      }}>
                      {q.quotationCode}
                    </Text>
                    <View
                      style={{
                        backgroundColor: s.bg,
                        paddingHorizontal: scale(8),
                        paddingVertical: scale(3),
                        borderRadius: scale(12),
                      }}>
                      <Text
                        style={{
                          fontFamily: FONTS.semiBold,
                          fontSize: scale(10),
                          color: s.text,
                        }}>
                        {s.label}
                      </Text>
                    </View>
                  </View>

                  {Array.isArray(q.items) && q.items.length > 0 ? (
                    <View style={{marginTop: scale(8)}}>
                      {q.items.map((it, idx) => (
                        <View
                          key={idx}
                          style={{
                            flexDirection: 'row',
                            paddingVertical: scale(4),
                            borderTopWidth: idx === 0 ? 0 : 1,
                            borderTopColor: COLORS.divider,
                          }}>
                          <Text
                            style={{
                              fontFamily: FONTS.regular,
                              fontSize: scale(11),
                              color: COLORS.textLight,
                              width: scale(20),
                            }}>
                            {idx + 1}.
                          </Text>
                          <View style={{flex: 1}}>
                            <Text
                              style={{
                                fontFamily: FONTS.semiBold,
                                fontSize: scale(12),
                                color: COLORS.textPrimary,
                              }}>
                              {it.materialName ||
                                it.subCategoryName ||
                                it.categoryName ||
                                'Material'}
                            </Text>
                            {(it.categoryName || it.subCategoryName) &&
                              (it.materialName || it.subCategoryName) && (
                                <Text
                                  style={{
                                    fontFamily: FONTS.regular,
                                    fontSize: scale(10),
                                    color: COLORS.textSecondary,
                                  }}>
                                  {[it.categoryName, it.subCategoryName]
                                    .filter(Boolean)
                                    .join(' › ')}
                                </Text>
                              )}
                          </View>
                          <Text
                            style={{
                              fontFamily: FONTS.regular,
                              fontSize: scale(11),
                              color: COLORS.textSecondary,
                              marginLeft: scale(8),
                            }}>
                            {it.quantity || '?'}
                            {it.unit ? ` ${it.unit}` : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    (q.category || q.quantity || q.unit) && (
                      <Text
                        style={{
                          fontFamily: FONTS.regular,
                          fontSize: scale(12),
                          color: COLORS.textSecondary,
                          marginTop: scale(6),
                        }}>
                        {q.category || 'Material'}
                        {q.quantity ? ` · ${q.quantity}${q.unit ? ` ${q.unit}` : ''}` : ''}
                      </Text>
                    )
                  )}

                  {q.materialRequirement ? (
                    <Text
                      numberOfLines={2}
                      style={{
                        fontFamily: FONTS.regular,
                        fontSize: scale(12),
                        color: COLORS.textPrimary,
                        marginTop: scale(4),
                      }}>
                      {q.materialRequirement}
                    </Text>
                  ) : null}

                  {q.status === 'quoted' && q.quotedPrice != null && (
                    <View
                      style={{
                        marginTop: scale(8),
                        backgroundColor: '#FFF7ED',
                        borderRadius: scale(8),
                        padding: scale(10),
                      }}>
                      <Text
                        style={{
                          fontFamily: FONTS.semiBold,
                          fontSize: scale(15),
                          color: '#C2410C',
                        }}>
                        {formatCurrency(Number(q.quotedPrice))}
                      </Text>
                      {q.quotedValidTill && (
                        <Text
                          style={{
                            fontFamily: FONTS.regular,
                            fontSize: scale(11),
                            color: COLORS.textSecondary,
                            marginTop: scale(2),
                          }}>
                          Valid till{' '}
                          {new Date(q.quotedValidTill).toLocaleDateString()}
                        </Text>
                      )}
                      {q.adminNotes && (
                        <Text
                          style={{
                            fontFamily: FONTS.regular,
                            fontSize: scale(11),
                            color: COLORS.textPrimary,
                            marginTop: scale(6),
                          }}>
                          {q.adminNotes}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Customer can accept or reject a received quote */}
                  {q.status === 'quoted' && (
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: scale(10),
                        marginTop: scale(10),
                      }}>
                      <TouchableOpacity
                        disabled={actingId === q._id}
                        onPress={() => act(q._id, 'rejected')}
                        style={{
                          flex: 1,
                          height: scale(40),
                          borderRadius: scale(8),
                          borderWidth: 1,
                          borderColor: '#B91C1C',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: actingId === q._id ? 0.5 : 1,
                        }}>
                        <Text
                          style={{
                            fontFamily: FONTS.semiBold,
                            fontSize: scale(13),
                            color: '#B91C1C',
                          }}>
                          Reject
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        disabled={actingId === q._id}
                        onPress={() => act(q._id, 'accepted')}
                        style={{
                          flex: 1,
                          height: scale(40),
                          borderRadius: scale(8),
                          backgroundColor: '#15803D',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: actingId === q._id ? 0.6 : 1,
                        }}>
                        {actingId === q._id ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text
                            style={{
                              fontFamily: FONTS.semiBold,
                              fontSize: scale(13),
                              color: '#fff',
                            }}>
                            Accept
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* View / download the quotation PDF uploaded by admin */}
                  {q.quotationPdf?.url && (
                    <TouchableOpacity
                      onPress={async () => {
                        const url = q.quotationPdf!.url;
                        try {
                          if (await Linking.canOpenURL(url)) {
                            await Linking.openURL(url);
                          } else {
                            showAppAlert('Quotation', 'Could not open the PDF.');
                          }
                        } catch {
                          showAppAlert(
                            'Quotation',
                            'Could not open the PDF. Please try again.',
                          );
                        }
                      }}
                      style={{
                        marginTop: scale(10),
                        height: scale(40),
                        borderRadius: scale(8),
                        borderWidth: 1,
                        borderColor: COLORS.secondary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Text
                        style={{
                          fontFamily: FONTS.semiBold,
                          fontSize: scale(13),
                          color: COLORS.textPrimary,
                        }}>
                        View / Download PDF
                      </Text>
                    </TouchableOpacity>
                  )}

                  <Text
                    style={{
                      fontFamily: FONTS.regular,
                      fontSize: scale(10),
                      color: COLORS.textLight,
                      marginTop: scale(8),
                    }}>
                    Submitted {new Date(q.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default MyQuotationsScreen;
