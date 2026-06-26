import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {CloseIcon, SearchIcon} from '../components/icons';
import {formatCurrency} from '../utils/currency';
import catalogService, {Material} from '../services/catalogService';

interface SearchBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  navigation?: any;
}

const SearchBottomSheet: React.FC<SearchBottomSheetProps> = ({
  visible,
  onClose,
  navigation,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Reset state each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setQuery('');
      setResults([]);
      setSearched(false);
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [visible]);

  // Debounced search on query change.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await catalogService.getMaterials({
          search: trimmed,
          limit: 20,
        });
        if (!cancelled && res.data.success) {
          setResults(res.data.data);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSearched(true);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSelect = (item: Material) => {
    onClose();
    navigation?.navigate('ProductDetail', {
      productId: item._id,
      productName: item.name,
      material: item,
    });
  };

  const renderItem = ({item}: {item: Material}) => {
    const subLabel = [item.category?.name, item.subCategory?.name, item.brand]
      .filter(Boolean)
      .join(' · ');
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleSelect(item)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: scale(10),
          borderBottomWidth: 1,
          borderBottomColor: COLORS.grayBg,
        }}>
        <View
          style={{
            width: scale(52),
            height: scale(52),
            borderRadius: scale(10),
            overflow: 'hidden',
            backgroundColor: COLORS.grayBg,
          }}>
          {item.images?.[0] ? (
            <Image
              source={{uri: item.images[0]}}
              style={{width: '100%', height: '100%'}}
              resizeMode="cover"
            />
          ) : null}
        </View>
        <View style={{flex: 1, marginLeft: scale(12)}}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: scale(14),
              color: COLORS.textPrimary,
              textTransform: 'capitalize',
            }}>
            {item.name}
          </Text>
          {subLabel ? (
            <Text
              numberOfLines={1}
              style={{
                marginTop: scale(2),
                fontFamily: FONTS.regular,
                fontSize: scale(11),
                color: COLORS.textSecondary,
                textTransform: 'capitalize',
              }}>
              {subLabel}
            </Text>
          ) : null}
          {item.finalSellingPrice > 0 ? (
            <Text
              style={{
                marginTop: scale(2),
                fontFamily: FONTS.semiBold,
                fontSize: scale(13),
                color: COLORS.textPrimary,
              }}>
              {formatCurrency(item.finalSellingPrice)}/{item.unit}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
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
              paddingHorizontal: scale(20),
              paddingBottom: scale(20),
              height: '80%',
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

            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: scale(14),
              }}>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(18),
                  color: COLORS.textPrimary,
                }}>
                Search
              </Text>
              <TouchableOpacity onPress={onClose} style={{padding: scale(4)}}>
                <CloseIcon />
              </TouchableOpacity>
            </View>

            {/* Search input */}
            <View
              style={{
                marginTop: scale(16),
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: scale(12),
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.background,
                paddingHorizontal: scale(14),
                height: scale(48),
              }}>
              <SearchIcon />
              <TextInput
                ref={inputRef}
                style={{
                  flex: 1,
                  marginLeft: scale(10),
                  fontFamily: FONTS.regular,
                  fontSize: scale(14),
                  color: COLORS.textPrimary,
                  padding: 0,
                }}
                placeholder="Search by brand, category or product"
                placeholderTextColor={COLORS.textPlaceholder}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => setQuery('')}
                  style={{padding: scale(4)}}>
                  <CloseIcon size={16} />
                </TouchableOpacity>
              )}
            </View>

            {/* Results */}
            <View style={{flex: 1, marginTop: scale(12)}}>
              {loading ? (
                <View style={{paddingTop: scale(30), alignItems: 'center'}}>
                  <ActivityIndicator color={COLORS.secondary} size="small" />
                </View>
              ) : results.length > 0 ? (
                <FlatList
                  data={results}
                  keyExtractor={item => item._id}
                  renderItem={renderItem}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={{paddingTop: scale(30), alignItems: 'center'}}>
                  <Text
                    style={{
                      fontFamily: FONTS.regular,
                      fontSize: scale(14),
                      color: COLORS.textSecondary,
                      textAlign: 'center',
                    }}>
                    {searched
                      ? 'No products found. Try a different search.'
                      : 'Search for materials by brand, category, sub category or name.'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default SearchBottomSheet;
