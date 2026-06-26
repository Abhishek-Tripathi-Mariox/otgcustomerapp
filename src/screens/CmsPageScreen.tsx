import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {ScreenHeader} from '../components';
import HtmlRenderer from '../components/HtmlRenderer';
import cmsService, {CmsPage} from '../services/cmsService';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';

const formatUpdatedAt = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  const now = Date.now();
  const diffMs = now - d.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'just now';
  if (diffMs < hour) {
    const m = Math.floor(diffMs / minute);
    return `${m} minute${m === 1 ? '' : 's'} ago`;
  }
  if (diffMs < day) {
    const h = Math.floor(diffMs / hour);
    return `${h} hour${h === 1 ? '' : 's'} ago`;
  }
  if (diffMs < 7 * day) {
    const days = Math.floor(diffMs / day);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  const dateStr = d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${dateStr}, ${timeStr}`;
};

interface CmsPageScreenProps {
  navigation?: any;
  route?: any;
}

const CmsPageScreen: React.FC<CmsPageScreenProps> = ({navigation, route}) => {
  const slug: string = route?.params?.slug || '';
  const fallbackTitle: string = route?.params?.title || 'Information';

  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const res = await cmsService.getPage(slug);
      setPage(res.data.data);
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setError("This page hasn't been set up yet.");
      } else {
        setError('Failed to load. Please try again.');
      }
      setPage(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!slug) {
      setError('Page not found.');
      setLoading(false);
      return;
    }
    load();
  }, [slug]);

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
      <ScreenHeader
        title={page?.title || fallbackTitle}
        onBack={() => navigation?.goBack()}
      />

      {loading ? (
        <View
          style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : error ? (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: scale(24),
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: scale(14),
              color: COLORS.textSecondary,
              textAlign: 'center',
            }}>
            {error}
          </Text>
        </ScrollView>
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
          {page?.updatedAt && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'flex-start',
                backgroundColor: COLORS.backgroundWhite,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: scale(20),
                paddingHorizontal: scale(10),
                paddingVertical: scale(4),
                marginBottom: scale(12),
              }}>
              <View
                style={{
                  width: scale(6),
                  height: scale(6),
                  borderRadius: scale(3),
                  backgroundColor: COLORS.success || '#16a34a',
                  marginRight: scale(6),
                }}
              />
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(11),
                  color: COLORS.textSecondary,
                }}>
                Last updated {formatUpdatedAt(page.updatedAt)}
              </Text>
            </View>
          )}

          {page?.description ? (
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(13),
                color: COLORS.textSecondary,
                marginBottom: scale(12),
              }}>
              {page.description}
            </Text>
          ) : null}
          <HtmlRenderer html={page?.body || ''} />
        </ScrollView>
      )}
    </View>
  );
};

export default CmsPageScreen;
