import React, {useEffect, useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, ScrollView} from 'react-native';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {ScreenHeader, PrimaryButton} from '../components';
import {showAppAlert} from '../components/AlertProvider';
import authService from '../services/authService';

export interface BuyerDetails {
  accountType: 'individual' | 'company';
  name: string;
  mobile: string;
  email?: string;
  deliveryAddress: string;
  landmark?: string;
  city: string;
  pincode: string;
  siteContactNumber?: string;
  designation?: string;
  employeeId?: string;
  companyName?: string;
  gstin?: string;
  pan?: string;
  billingAddress?: string;
  registeredOfficeAddress?: string;
  companyType?:
    | 'Contractor'
    | 'Builder'
    | 'Developer'
    | 'Consultant'
    | 'Government'
    | 'Individual';
  projectName?: string;
  siteAddress?: string;
  siteContactPerson?: string;
}

const COMPANY_TYPES: NonNullable<BuyerDetails['companyType']>[] = [
  'Contractor',
  'Builder',
  'Developer',
  'Consultant',
  'Government',
  'Individual',
];

const EMPTY: BuyerDetails = {
  accountType: 'individual',
  name: '',
  mobile: '',
  email: '',
  deliveryAddress: '',
  landmark: '',
  city: '',
  pincode: '',
  siteContactNumber: '',
  designation: '',
  employeeId: '',
  companyName: '',
  gstin: '',
  pan: '',
  billingAddress: '',
  registeredOfficeAddress: '',
  companyType: undefined,
  projectName: '',
  siteAddress: '',
  siteContactPerson: '',
};

const Field: React.FC<{
  label: string;
  required?: boolean;
  value?: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
  maxLength?: number;
}> = ({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
}) => (
  <View style={{marginBottom: scale(14)}}>
    <Text
      style={{
        fontFamily: FONTS.medium,
        fontSize: scale(13),
        color: COLORS.textSecondary,
        marginBottom: scale(6),
      }}>
      {label}
      {required ? <Text style={{color: COLORS.secondary}}> *</Text> : null}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder || `Enter ${label.toLowerCase()}`}
      placeholderTextColor={COLORS.textLight}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      maxLength={maxLength}
      style={{
        height: scale(48),
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: scale(10),
        paddingHorizontal: scale(14),
        fontFamily: FONTS.regular,
        fontSize: scale(14),
        color: COLORS.textPrimary,
        backgroundColor: COLORS.backgroundWhite,
      }}
    />
  </View>
);

const CheckoutDetailsScreen: React.FC<{navigation?: any; route?: any}> = ({
  navigation,
  route,
}) => {
  const buyNowItem = route?.params?.buyNowItem;
  const [form, setForm] = useState<BuyerDetails>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await authService.getProfile();
        const profile = res.data?.data?.checkoutProfile;
        if (profile) {
          setForm(prev => ({...prev, ...profile}));
        }
      } catch {
        // No saved profile yet — form just starts empty. Not fatal.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (key: keyof BuyerDetails) => (value: string) =>
    setForm(prev => ({...prev, [key]: value}));

  const handleContinue = () => {
    const missing: string[] = [];
    if (!form.name.trim()) missing.push('Name');
    if (!form.mobile.trim()) missing.push('Mobile Number');
    if (!form.city.trim()) missing.push('City');
    if (!form.pincode.trim()) missing.push('PIN Code');

    if (form.accountType === 'individual') {
      if (!form.deliveryAddress.trim()) missing.push('Delivery Address');
    } else {
      if (!form.companyName?.trim()) missing.push('Company Name');
      if (!form.billingAddress?.trim()) missing.push('Billing Address');
      if (!form.registeredOfficeAddress?.trim())
        missing.push('Registered Office Address');
      if (!form.companyType) missing.push('Company Type');
      if (!form.siteAddress?.trim()) missing.push('Site Address');
      if (!form.siteContactPerson?.trim()) missing.push('Site Contact Person');
    }

    if (missing.length > 0) {
      showAppAlert({
        title: 'Missing details',
        message: `Please fill in: ${missing.join(', ')}`,
      });
      return;
    }

    const buyerDetails: BuyerDetails = {
      ...form,
      deliveryAddress:
        form.accountType === 'company' && !form.deliveryAddress.trim()
          ? form.siteAddress || ''
          : form.deliveryAddress,
    };

    navigation?.navigate('PaymentMethod', {buyNowItem, buyerDetails});
  };

  if (loading) return null;

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
      <ScreenHeader
        title="Checkout Details"
        onBack={() => navigation?.goBack()}
      />
      <ScrollView
        style={{flex: 1}}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{padding: scale(16), paddingBottom: scale(100)}}
        keyboardShouldPersistTaps="handled">
        <Text
          style={{
            fontFamily: FONTS.regular,
            fontSize: scale(12),
            color: COLORS.textSecondary,
            marginBottom: scale(16),
          }}>
          Please confirm who this order is for, so we can generate the
          correct delivery and invoice details.
        </Text>

        {/* Individual / Company toggle */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: COLORS.divider,
            borderRadius: scale(10),
            padding: scale(4),
            marginBottom: scale(20),
          }}>
          {(['individual', 'company'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setForm(prev => ({...prev, accountType: tab}))}
              style={{
                flex: 1,
                paddingVertical: scale(10),
                borderRadius: scale(8),
                backgroundColor:
                  form.accountType === tab ? COLORS.primary : 'transparent',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: scale(13),
                  color:
                    form.accountType === tab
                      ? COLORS.secondary
                      : COLORS.textSecondary,
                }}>
                {tab === 'individual' ? 'Individual' : 'Company'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {form.accountType === 'individual' ? (
          <>
            <Field label="Name" required value={form.name} onChangeText={set('name')} />
            <Field
              label="Phone Number"
              required
              value={form.mobile}
              onChangeText={set('mobile')}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <Field
              label="Email ID"
              value={form.email}
              onChangeText={set('email')}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="Delivery Address"
              required
              value={form.deliveryAddress}
              onChangeText={set('deliveryAddress')}
            />
            <Field label="Landmark" value={form.landmark} onChangeText={set('landmark')} />
            <Field label="City" required value={form.city} onChangeText={set('city')} />
            <Field
              label="PIN Code"
              required
              value={form.pincode}
              onChangeText={set('pincode')}
              keyboardType="numeric"
              maxLength={6}
            />
            <Field
              label="Site Contact Number"
              value={form.siteContactNumber}
              onChangeText={set('siteContactNumber')}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </>
        ) : (
          <>
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(13),
                color: COLORS.secondary,
                marginBottom: scale(10),
              }}>
              Your Details
            </Text>
            <Field label="Full Name" required value={form.name} onChangeText={set('name')} />
            <Field
              label="Designation"
              value={form.designation}
              onChangeText={set('designation')}
            />
            <Field
              label="Mobile Number"
              required
              value={form.mobile}
              onChangeText={set('mobile')}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <Field
              label="Email ID"
              value={form.email}
              onChangeText={set('email')}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="Employee ID (Optional)"
              value={form.employeeId}
              onChangeText={set('employeeId')}
            />

            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(13),
                color: COLORS.secondary,
                marginTop: scale(6),
                marginBottom: scale(10),
              }}>
              Company Details
            </Text>
            <Field
              label="Company Name"
              required
              value={form.companyName}
              onChangeText={set('companyName')}
            />
            <Field
              label="GSTIN"
              value={form.gstin}
              onChangeText={set('gstin')}
              autoCapitalize="characters"
              maxLength={15}
            />
            <Field
              label="PAN (Optional)"
              value={form.pan}
              onChangeText={set('pan')}
              autoCapitalize="characters"
              maxLength={10}
            />
            <Field
              label="Billing Address"
              required
              value={form.billingAddress}
              onChangeText={set('billingAddress')}
            />
            <Field
              label="Registered Office Address"
              required
              value={form.registeredOfficeAddress}
              onChangeText={set('registeredOfficeAddress')}
            />

            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: scale(13),
                color: COLORS.textSecondary,
                marginBottom: scale(8),
              }}>
              Company Type <Text style={{color: COLORS.secondary}}>*</Text>
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: scale(8),
                marginBottom: scale(14),
              }}>
              {COMPANY_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setForm(prev => ({...prev, companyType: type}))}
                  style={{
                    paddingHorizontal: scale(14),
                    paddingVertical: scale(8),
                    borderRadius: scale(20),
                    borderWidth: 1,
                    borderColor:
                      form.companyType === type ? COLORS.primary : COLORS.border,
                    backgroundColor:
                      form.companyType === type ? COLORS.primary : COLORS.backgroundWhite,
                  }}>
                  <Text
                    style={{
                      fontFamily: FONTS.medium,
                      fontSize: scale(12),
                      color:
                        form.companyType === type
                          ? COLORS.secondary
                          : COLORS.textSecondary,
                    }}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(13),
                color: COLORS.secondary,
                marginBottom: scale(10),
              }}>
              Project / Site Details
            </Text>
            <Field
              label="Project Name"
              value={form.projectName}
              onChangeText={set('projectName')}
            />
            <Field
              label="Site Address"
              required
              value={form.siteAddress}
              onChangeText={set('siteAddress')}
            />
            <Field label="Landmark" value={form.landmark} onChangeText={set('landmark')} />
            <Field label="City" required value={form.city} onChangeText={set('city')} />
            <Field
              label="PIN Code"
              required
              value={form.pincode}
              onChangeText={set('pincode')}
              keyboardType="numeric"
              maxLength={6}
            />
            <Field
              label="Site Contact Person"
              required
              value={form.siteContactPerson}
              onChangeText={set('siteContactPerson')}
            />
          </>
        )}
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: scale(16),
          paddingBottom: scale(24),
          paddingTop: scale(12),
          backgroundColor: COLORS.background,
        }}>
        <PrimaryButton title="Continue" onPress={handleContinue} />
      </View>
    </View>
  );
};

export default CheckoutDetailsScreen;
