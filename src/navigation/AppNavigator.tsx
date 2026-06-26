import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import HomeScreen from '../screens/HomeScreen';
import CategoryScreen from '../screens/CategoryScreen';
import SingleCategoryScreen from '../screens/SingleCategoryScreen';
import AllBrandsScreen from '../screens/AllBrandsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import PaymentMethodScreen from '../screens/PaymentMethodScreen';
import GetQuotationScreen from '../screens/GetQuotationScreen';
import SavedAddressScreen from '../screens/SavedAddressScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import TrackOrderScreen from '../screens/TrackOrderScreen';
import HelpScreen from '../screens/HelpScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import CmsPageScreen from '../screens/CmsPageScreen';
import MyQuotationsScreen from '../screens/MyQuotationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  OtpVerification: {mobile: string};
  Home: undefined;
  Category: undefined;
  SubCategory: {categoryName?: string; categoryId?: string; brand?: string};
  AllBrands: undefined;
  ProductDetail: {productName?: string};
  Cart: undefined;
  PaymentMethod: {
    buyNowItem?: {
      id: string;
      name: string;
      quantity: number;
      price: number;
      mrp?: number;
      gst?: number;
      unit?: string;
      image?: {uri: string};
      brand?: string;
    };
  } | undefined;
  GetQuotation: {isLoggedIn?: boolean};
  SavedAddress: undefined;
  MyOrders: undefined;
  OrderDetails: {orderId?: string};
  TrackOrder: {orderId?: string};
  Help: undefined;
  EditProfile: undefined;
  CmsPage: {slug: string; title?: string};
  MyQuotations: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{headerShown: false}}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Category" component={CategoryScreen} />
        <Stack.Screen name="SubCategory" component={SingleCategoryScreen} />
        <Stack.Screen name="AllBrands" component={AllBrandsScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} />
        <Stack.Screen name="GetQuotation" component={GetQuotationScreen} />
        <Stack.Screen name="SavedAddress" component={SavedAddressScreen} />
        <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="TrackOrder" component={TrackOrderScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="CmsPage" component={CmsPageScreen} />
        <Stack.Screen name="MyQuotations" component={MyQuotationsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
