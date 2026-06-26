import React, {useEffect} from 'react';
import {
  View,
  ImageBackground,
  StatusBar,
  Dimensions,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logo from '../assets/Logo';
import {useAppDispatch} from '../store';
import {
  setLoading,
  loginSuccess,
  loadPersistedAddresses,
  loadPersistedCart,
  syncUserAddressToSavedAddresses,
} from '../store';
import authService from '../services/authService';

const splashBg = require('../assets/images/splash-bg.png');

const requestAppPermissions = async () => {
  if (Platform.OS !== 'android') return;
  try {
    await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    ]);
  } catch {
    // ignore — permissions are non-blocking
  }
};

const SplashScreen: React.FC<{navigation?: any}> = ({navigation}) => {
  const dispatch = useAppDispatch();
  const {width} = Dimensions.get('window');

  // Scale logo proportionally based on screen width
  const logoSize = width * 0.43;

  useEffect(() => {
    const checkAuth = async () => {
      // Request permissions upfront
      await requestAppPermissions();
      // Restore locally saved addresses
      loadPersistedAddresses();
      // Restore the persisted cart so items survive app restarts
      loadPersistedCart();

      // Show splash for at least 2 seconds
      await new Promise<void>(resolve => setTimeout(resolve, 2000));

      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          const response = await authService.getProfile();
          if (response.data.success) {
            const fetchedUser = response.data.data;
            dispatch(loginSuccess({token, user: fetchedUser}));
            if (fetchedUser?.address) {
              dispatch(syncUserAddressToSavedAddresses(fetchedUser.address));
            }
            dispatch(setLoading(false));
            navigation?.replace('Home');
            return;
          }
        }
      } catch {
        await AsyncStorage.removeItem('userToken');
      }

      dispatch(setLoading(false));
      navigation?.replace('Login');
    };

    checkAuth();
  }, [dispatch, navigation]);

  return (
    <View className="flex-1 bg-primary">
      <StatusBar
        barStyle="light-content"
        backgroundColor="#404040"
        translucent
      />
      <ImageBackground
        source={splashBg}
        className="flex-1"
        resizeMode="cover"
        imageStyle={{opacity: 0.2}}>
        <View className="flex-1 items-center justify-center">
          <Logo width={logoSize} height={logoSize * (149 / 185)} />
        </View>
      </ImageBackground>
    </View>
  );
};

export default SplashScreen;
