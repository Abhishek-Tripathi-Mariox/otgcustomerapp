import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import ScreenHeader from '../components/ScreenHeader';
import catalogService, {Brand} from '../services/catalogService';

// Full list of brands shown when the user taps "View All" in the home
// "Shop By Brands" section. Tapping a brand opens that brand's products.
const AllBrandsScreen: React.FC<{navigation?: any}> = ({navigation}) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await catalogService.getBrands();
        if (res.data.success) setBrands(res.data.data);
      } catch {
        // silent fail — show empty state
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  const openBrand = (brand: Brand) => {
    navigation?.navigate('SubCategory', {
      brand: brand.name,
      categoryName: brand.name,
    });
  };

  const tileWidth = scale(150);

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
      <ScreenHeader title="Shop By Brands" onBack={() => navigation?.goBack()} />

      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : brands.length === 0 ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: scale(14),
              color: COLORS.textLight,
            }}>
            No brands available
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{padding: scale(16)}}>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}>
            {brands.map(brand => (
              <TouchableOpacity
                key={brand._id}
                onPress={() => openBrand(brand)}
                activeOpacity={0.85}
                style={{width: tileWidth, marginBottom: scale(16), alignItems: 'center'}}>
                <View
                  style={{
                    height: scale(96),
                    width: tileWidth,
                    overflow: 'hidden',
                    borderRadius: scale(16),
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    backgroundColor: COLORS.backgroundWhite,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: scale(18),
                    paddingVertical: scale(16),
                  }}>
                  <Image
                    source={{uri: brand.image}}
                    style={{height: '100%', width: '100%'}}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: scale(7),
                    textAlign: 'center',
                    fontFamily: FONTS.regular,
                    fontSize: scale(12),
                    color: 'black',
                  }}>
                  {brand.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default AllBrandsScreen;
