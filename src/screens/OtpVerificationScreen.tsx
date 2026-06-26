import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OtpShield from '../assets/OtpShield';
import authService from '../services/authService';
import {useAppDispatch} from '../store';
import {loginSuccess, syncUserAddressToSavedAddresses} from '../store';
import {showAppAlert} from '../components/AlertProvider';

const backArrow = require('../assets/images/back-arrow.png');

const OTP_LENGTH = 6;

const OtpVerificationScreen: React.FC<{navigation?: any; route?: any}> = ({
  navigation,
  route,
}) => {
  const mobile = route?.params?.mobile || '';
  const dispatch = useAppDispatch();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [timer, setTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = useCallback(
    (text: string, index: number) => {
      // Handle paste of full OTP
      if (text.length > 1) {
        const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
        const newOtp = [...otp];
        digits.forEach((digit, i) => {
          if (index + i < OTP_LENGTH) {
            newOtp[index + i] = digit;
          }
        });
        setOtp(newOtp);
        const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
        setFocusedIndex(nextIndex);
        inputRefs.current[nextIndex]?.focus();
        return;
      }

      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      // Move to next input on digit entry
      if (text && index < OTP_LENGTH - 1) {
        setFocusedIndex(index + 1);
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp],
  );

  const handleKeyPress = useCallback(
    (e: any, index: number) => {
      // Move to previous input on backspace when current is empty
      if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        setFocusedIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otp],
  );

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) return;

    setLoading(true);
    try {
      const response = await authService.verifyOtp(mobile, otpCode);
      if (response.data.success) {
        const {token, user} = response.data.data;
        await AsyncStorage.setItem('userToken', token);
        dispatch(loginSuccess({token, user}));
        if (user?.address) {
          dispatch(syncUserAddressToSavedAddresses(user.address));
        }
        navigation?.replace('Home');
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Verification failed. Please try again.';
      showAppAlert({title: 'Error', message});
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await authService.resendOtp(mobile);
      setTimer(45);
      setCanResend(false);
      setOtp(Array(OTP_LENGTH).fill(''));
      setFocusedIndex(0);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to resend OTP. Please try again.';
      showAppAlert({title: 'Error', message});
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar
        barStyle="light-content"
        backgroundColor="#404040"
        translucent
      />
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ScrollView
          className="flex-1"
          bounces={false}
          keyboardShouldPersistTaps="handled">
          {/* Dark header with rounded bottom */}
          <View className="h-[263px] w-full rounded-bl-[50px] rounded-br-[50px] bg-primary">
            {/* Back arrow */}
            <TouchableOpacity
              className="absolute left-[17px] top-[36px] z-10"
              onPress={() => navigation?.goBack()}>
              <Image
                source={backArrow}
                className="h-6 w-6"
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Title */}
            <Text className="absolute left-0 right-0 top-[38px] text-center font-poppins-semibold text-[16px] leading-[21px] text-white">
              OTP Verification
            </Text>

            {/* Shield icon */}
            <View className="items-center justify-center" style={{marginTop: 88}}>
              <OtpShield width={156} height={156} />
            </View>
          </View>

          {/* Description text */}
          <View className="mt-[54px] items-center px-[98px]">
            <Text className="text-center font-poppins-regular text-[12px] leading-[20px] text-[#4e4e4e]">
              Please enter 6 digits code, sent on your registered mobile number
            </Text>
          </View>

          {/* OTP Input boxes */}
          <View className="mt-[42px] flex-row justify-center px-[25px]">
            {otp.map((digit, index) => (
              <View
                key={index}
                className={`mx-[3.5px] h-[71px] w-[57px] items-center justify-center rounded-[19px] bg-white ${
                  focusedIndex === index
                    ? 'border border-[#ffe403]'
                    : 'border border-[#f2f2f2]'
                }`}
                style={{
                  shadowColor: 'rgba(240, 208, 208, 0.09)',
                  shadowOffset: {width: 0, height: 1},
                  shadowOpacity: 1,
                  shadowRadius: 39,
                  elevation: 3,
                }}>
                <TextInput
                  ref={ref => {
                    inputRefs.current[index] = ref;
                  }}
                  className="h-full w-full text-center font-poppins-regular text-[13px] tracking-[0.13px] text-primary"
                  keyboardType="number-pad"
                  maxLength={index === 0 && otp.every(d => !d) ? OTP_LENGTH : 1}
                  value={digit}
                  onChangeText={text => handleOtpChange(text, index)}
                  onKeyPress={e => handleKeyPress(e, index)}
                  onFocus={() => setFocusedIndex(index)}
                  selectTextOnFocus
                  caretHidden
                />
              </View>
            ))}
          </View>

          {/* Timer */}
          <View className="mt-[16px] items-center">
            <Text className="font-inter-regular text-[13px] leading-[20px] text-[#383838]">
              {formatTime(timer)}
            </Text>
          </View>

          {/* Verify button */}
          <TouchableOpacity
            className="mx-[36px] mt-[32px] h-[65px] items-center justify-center rounded-[19px] bg-secondary"
            onPress={handleVerify}
            activeOpacity={0.8}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#404040" />
            ) : (
              <Text className="font-poppins-semibold text-[21px] tracking-[0.735px] text-primary">
                Verify
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend Code */}
          <TouchableOpacity
            className="mt-[23px] items-center"
            onPress={handleResend}
            activeOpacity={0.7}
            disabled={!canResend}>
            <Text
              className={`font-poppins-bold text-[15px] leading-[20px] ${
                canResend ? 'text-[#e10813]' : 'text-[#e1081380]'
              }`}>
              Resend Code
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default OtpVerificationScreen;
