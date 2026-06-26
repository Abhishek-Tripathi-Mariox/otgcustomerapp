import React, {useState} from 'react';
import {
  View,
  Text,
  ImageBackground,
  Image,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import Logo from '../assets/Logo';
import authService from '../services/authService';
import {showAppAlert} from '../components/AlertProvider';

const loginBg = require('../assets/images/login-bg.png');
const backArrow = require('../assets/images/back-arrow.png');

const LoginScreen: React.FC<{navigation?: any}> = ({navigation}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const {width} = Dimensions.get('window');

  const logoSize = width * 0.25;

  const handleContinue = async () => {
    if (phoneNumber.length !== 10) {
      return;
    }

    setLoading(true);
    try {
      const response = await authService.sendOtp(phoneNumber);
      if (response.data.success) {
        navigation?.navigate('OtpVerification', {mobile: phoneNumber});
      }
    } catch (error: any) {
      // Distinguish "server rejected" from "couldn't reach server" so network /
      // wrong-base-URL problems are diagnosable instead of a generic message.
      const message = error.response
        ? error.response.data?.message || 'Failed to send OTP. Please try again.'
        : `Cannot reach the server. Check your internet connection.${
            __DEV__ ? `\n\n[${error.message || 'Network Error'}]` : ''
          }`;
      if (__DEV__) {
        console.log('[sendOtp] failed:', error.message, error.config?.baseURL);
      }
      showAppAlert({title: 'Error', message});
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding">
        {/* behavior="padding" on Android too: targetSdk 36 enforces edge-to-edge,
            which makes windowSoftInputMode="adjustResize" a no-op. Padding mode
            measures the keyboard from JS events, so it works without OS resize. */}
        <ScrollView
          className="flex-1"
          bounces={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{flexGrow: 1}}
          keyboardDismissMode="interactive">
          {/* Header background with image */}
          <View className="h-[366px] w-full bg-[#d9d9d9]">
            <ImageBackground
              source={loginBg}
              className="h-full w-full"
              resizeMode="cover"
              imageStyle={{opacity: 0.2}}>
              {/* Back arrow */}
              <TouchableOpacity
                className="absolute left-6 top-14 z-10"
                onPress={() => navigation?.goBack()}>
                <Image
                  source={backArrow}
                  className="h-6 w-6"
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </ImageBackground>
          </View>

          {/* Logo card overlapping the header */}
          <View className="items-center" style={{marginTop: -52}}>
            <View className="h-[103px] w-[106px] items-center justify-center rounded-[19px] bg-white shadow-lg shadow-[#d9d9d9]">
              <Logo width={logoSize} height={logoSize * (149 / 185)} color="#404040" />
            </View>
          </View>

          {/* Login text */}
          <View className="mt-[29px] items-center">
            <Text className="font-poppins-semibold text-[27px] leading-[33px] text-[#172328]">
              Login
            </Text>
            <Text className="mt-2 font-poppins-light text-[14px] leading-[18px] text-[#4e4e4e]">
              Welcome to OTG
            </Text>
          </View>

          {/* Phone number input — matches Figma 3:6101 */}
          <View
            className="mx-[23px] mt-[29px] h-[71px] flex-row items-center rounded-[19px] bg-white pl-[20px] pr-4"
            style={{
              shadowColor: 'rgba(159, 159, 159, 0.22)',
              shadowOffset: {width: 0, height: 1},
              shadowOpacity: 1,
              shadowRadius: 39,
              elevation: 8,
            }}>
            {/* Mobile icon in grey circle (Ellipse122 + Path1211) */}
            <View className="h-[25px] w-[25px] items-center justify-center rounded-full bg-[#E8E8E8]">
              <Svg width={8} height={11} viewBox="0 0 8 12" fill="none">
                <Path
                  d="M1.10274 1.10274V9.92467H6.61645V1.10274H1.10274ZM0.551371 0H7.16782C7.47233 0 7.71919 0.246857 7.71919 0.55137V10.476C7.71919 10.7806 7.47233 11.0274 7.16782 11.0274H0.551371C0.246857 11.0274 0 10.7806 0 10.476V0.55137C0 0.246857 0.246857 -1.19209e-07 0.551371 0ZM3.85959 8.27056C4.16411 8.27056 4.41096 8.51742 4.41096 8.82193C4.41096 9.12644 4.16411 9.3733 3.85959 9.3733C3.55508 9.3733 3.30822 9.12644 3.30822 8.82193C3.30822 8.51742 3.55508 8.27056 3.85959 8.27056Z"
                  fill="#404040"
                />
              </Svg>
            </View>
            <TextInput
              className="ml-3 flex-1 font-poppins-regular text-[16px] text-primary"
              style={{
                letterSpacing: 0.5,
                textAlign: 'left',
                padding: 0,
                minHeight: 24,
              }}
              placeholder="Enter Mobile Number"
              placeholderTextColor="#9F9F9F"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={10}
            />
          </View>

          {/* Continue button — matches Figma 3:6096 */}
          <TouchableOpacity
            className="mx-[35px] mt-[82px] h-[65px] items-center justify-center rounded-[19px]"
            style={{backgroundColor: '#FFE403'}}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#404040" />
            ) : (
              <Text
                className="font-poppins-semibold text-[20px] text-primary"
                style={{letterSpacing: 0.7, lineHeight: 28}}>
                Continue
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;
