import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {scale} from '../utils/scale';
import sellerRequestService from '../services/sellerRequestService';

interface BecomeSellerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  defaultName?: string;
  defaultMobile?: string;
  defaultEmail?: string;
}

const BecomeSellerSheet: React.FC<BecomeSellerSheetProps> = ({
  visible,
  onClose,
  onSubmitted,
  defaultName = '',
  defaultMobile = '',
  defaultEmail = '',
}) => {
  const [name, setName] = useState(defaultName);
  const [mobile, setMobile] = useState(defaultMobile);
  const [email, setEmail] = useState(defaultEmail);
  const [businessName, setBusinessName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [city, setCity] = useState('');
  const [state, setStateValue] = useState('');
  const [pincode, setPincode] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setBusinessName('');
    setGstNumber('');
    setPanNumber('');
    setCity('');
    setStateValue('');
    setPincode('');
    setAddress('');
    setMessage('');
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    if (!businessName.trim()) {
      setError('Business name is required');
      return;
    }
    try {
      setSubmitting(true);
      await sellerRequestService.submit({
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        business: {
          name: businessName.trim(),
          gstNumber: gstNumber.trim() || undefined,
          panNumber: panNumber.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          pincode: pincode.trim() || undefined,
        },
        message: message.trim() || undefined,
      });
      reset();
      onSubmitted();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        'Could not submit request. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'flex-end',
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: scale(20),
            borderTopRightRadius: scale(20),
            maxHeight: '92%',
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: scale(16),
              borderBottomWidth: 1,
              borderBottomColor: '#EEE',
            }}>
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(16),
                color: COLORS.textPrimary,
              }}>
              Become a Seller
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(14),
                  color: COLORS.primary,
                }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{padding: scale(16), paddingBottom: scale(28)}}
            keyboardShouldPersistTaps="handled">
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(12),
                color: COLORS.grayBg,
                marginBottom: scale(12),
              }}>
              Tell us about your business. Our team will review and reach out.
            </Text>

            <Field label="Your Name *" value={name} onChangeText={setName} />
            <Field
              label="Mobile Number *"
              value={mobile}
              onChangeText={(v) => setMobile(v.replace(/\D/g, '').slice(0, 10))}
              keyboardType="phone-pad"
            />
            <Field
              label="Email (Optional)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <Field
              label="Business Name *"
              value={businessName}
              onChangeText={setBusinessName}
            />
            <Field
              label="GST Number (Optional)"
              value={gstNumber}
              onChangeText={(v) => setGstNumber(v.toUpperCase().slice(0, 15))}
            />
            <Field
              label="PAN Number (Optional)"
              value={panNumber}
              onChangeText={(v) => setPanNumber(v.toUpperCase().slice(0, 10))}
            />
            <Field
              label="Business Address (Optional)"
              value={address}
              onChangeText={setAddress}
              multiline
            />
            <Field label="City" value={city} onChangeText={setCity} />
            <Field label="State" value={state} onChangeText={setStateValue} />
            <Field
              label="Pincode"
              value={pincode}
              onChangeText={(v) => setPincode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
            />
            <Field
              label="Message (Optional)"
              value={message}
              onChangeText={setMessage}
              multiline
            />

            {error && (
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(12),
                  color: '#D9534F',
                  marginTop: scale(8),
                }}>
                {error}
              </Text>
            )}

            <TouchableOpacity
              disabled={submitting}
              onPress={handleSubmit}
              style={{
                marginTop: scale(20),
                backgroundColor: COLORS.primary,
                borderRadius: scale(10),
                paddingVertical: scale(14),
                alignItems: 'center',
                opacity: submitting ? 0.7 : 1,
              }}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: scale(14),
                    color: '#fff',
                  }}>
                  Submit Request
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: any;
  multiline?: boolean;
}

const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
}) => (
  <View style={{marginBottom: scale(12)}}>
    <Text
      style={{
        fontFamily: FONTS.semiBold,
        fontSize: scale(12),
        color: COLORS.textPrimary,
        marginBottom: scale(4),
      }}>
      {label}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={!!multiline}
      style={{
        borderWidth: 1,
        borderColor: '#E2E2E2',
        borderRadius: scale(8),
        paddingHorizontal: scale(12),
        paddingVertical: scale(multiline ? 10 : 10),
        fontFamily: FONTS.regular,
        fontSize: scale(13),
        color: COLORS.textPrimary,
        minHeight: multiline ? scale(70) : undefined,
        textAlignVertical: multiline ? 'top' : 'center',
      }}
    />
  </View>
);

export default BecomeSellerSheet;
