import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Linking,
  ActivityIndicator,
} from 'react-native';
import Svg, {Path, Circle, Line, Rect} from 'react-native-svg';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {ScreenHeader, PrimaryButton} from '../components';
import helpService, {HelpSettings} from '../services/helpService';
import catalogService, {Faq} from '../services/catalogService';
import {useAppSelector} from '../store';
import {showAppAlert} from '../components/AlertProvider';

const LocationPinIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke={COLORS.textLight} strokeWidth={1.5} />
    <Circle cx={12} cy={9} r={2.5} stroke={COLORS.textLight} strokeWidth={1.5} />
  </Svg>
);

const PhoneSmallIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Rect x={6} y={3} width={12} height={18} rx={2} stroke={COLORS.textLight} strokeWidth={1.5} />
    <Line x1={10} y1={17} x2={14} y2={17} stroke={COLORS.textLight} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const EmailSmallIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Path d="M4 6H20V18H4V6Z" stroke={COLORS.textLight} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 6L12 13L20 6" stroke={COLORS.textLight} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PersonIcon = () => (
  <Svg width={scale(20)} height={scale(20)} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke={COLORS.textSecondary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={12} cy={7} r={4} stroke={COLORS.textSecondary} strokeWidth={1.5} />
  </Svg>
);

const MobileIcon = () => (
  <Svg width={scale(20)} height={scale(20)} viewBox="0 0 24 24" fill="none">
    <Rect x={7} y={3} width={10} height={18} rx={2} stroke={COLORS.textSecondary} strokeWidth={1.5} />
    <Line x1={10} y1={17} x2={14} y2={17} stroke={COLORS.textSecondary} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const WhatsAppSmallIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3C7.03 3 3 7.03 3 12C3 13.64 3.44 15.18 4.21 16.51L3 21L7.62 19.82C8.9 20.52 10.4 20.92 12 20.92C16.97 20.92 21 16.89 21 11.92C21 6.95 16.97 3 12 3Z"
      stroke={COLORS.textLight}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 9C9 9 9.5 8.5 10 8.5C10.5 8.5 10.8 9.3 11 9.8C11.2 10.3 10.6 10.9 10.6 11.3C10.6 11.7 12.3 13.4 12.7 13.4C13.1 13.4 13.7 12.8 14.2 13C14.7 13.2 15.5 13.5 15.5 14C15.5 14.5 15 15 15 15"
      stroke={COLORS.textLight}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Green checkmark for Thank You modal
const ThankYouCheckIcon = () => (
  <Svg width={scale(70)} height={scale(70)} viewBox="0 0 70 70" fill="none">
    <Circle cx={35} cy={35} r={32} stroke={COLORS.success} strokeWidth={3} fill="none" />
    <Path d="M20 35L30 45L50 25" stroke={COLORS.success} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

const HelpScreen: React.FC<{navigation?: any}> = ({navigation}) => {
  const user = useAppSelector(s => s.app.user);

  const [name, setName] = useState(user?.name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [message, setMessage] = useState('');
  const [showThankYou, setShowThankYou] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [settings, setSettings] = useState<HelpSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Keep name/mobile in sync with the user profile until they edit
  const [nameTouched, setNameTouched] = useState(false);
  const [mobileTouched, setMobileTouched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    helpService
      .getSettings()
      .then(res => {
        if (cancelled) return;
        if (res.data?.success) setSettings(res.data.data);
      })
      .catch(() => {
        // silent — fall back to empty state, contact card simply hides
      })
      .finally(() => {
        if (!cancelled) setSettingsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    catalogService
      .getFaqs()
      .then(res => {
        if (cancelled) return;
        if (res.data?.success) setFaqs(res.data.data || []);
      })
      .catch(() => {
        // silent — FAQ section simply hides if it can't load
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (nameTouched) return;
    setName(user?.name || '');
  }, [user?.name, nameTouched]);

  useEffect(() => {
    if (mobileTouched) return;
    setMobile(user?.mobile || '');
  }, [user?.mobile, mobileTouched]);

  const normalizeMobile = (m: string) =>
    m.replace(/^\+91/, '').replace(/\s+/g, '').trim();

  const handleSend = async () => {
    if (!name.trim()) {
      showAppAlert({title: 'Missing info', message: 'Please enter your name.'});
      return;
    }
    const cleanMobile = normalizeMobile(mobile);
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      showAppAlert({
        title: 'Invalid mobile',
        message: 'Please enter a valid 10-digit mobile number.',
      });
      return;
    }
    if (!message.trim()) {
      showAppAlert({title: 'Missing info', message: 'Please describe your issue.'});
      return;
    }
    try {
      setSubmitting(true);
      const res = await helpService.submitTicket({
        name: name.trim(),
        mobile: cleanMobile,
        email: user?.email || undefined,
        message: message.trim(),
      });
      setSubmittedCode(res.data?.data?.ticketCode || null);
      setShowThankYou(true);
      setMessage('');
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        'Could not send your message. Please try again.';
      showAppAlert({title: 'Submission failed', message: msg});
    } finally {
      setSubmitting(false);
    }
  };

  // Build a list of contact cards from settings — empty fields are skipped
  const contactCards: Array<{
    key: string;
    icon: React.ReactNode;
    label: string;
    onPress?: () => void;
  }> = [];
  if (settings?.address) {
    contactCards.push({
      key: 'address',
      icon: <LocationPinIcon />,
      label: settings.address,
    });
  }
  if (settings?.mobile) {
    contactCards.push({
      key: 'phone',
      icon: <PhoneSmallIcon />,
      label: `+91 ${settings.mobile}`,
      onPress: () => Linking.openURL(`tel:+91${settings.mobile}`),
    });
  }
  if (settings?.email) {
    contactCards.push({
      key: 'email',
      icon: <EmailSmallIcon />,
      label: settings.email,
      onPress: () => Linking.openURL(`mailto:${settings.email}`),
    });
  }
  if (settings?.whatsappNumber) {
    const wa = settings.whatsappNumber.replace(/\D/g, '');
    contactCards.push({
      key: 'whatsapp',
      icon: <WhatsAppSmallIcon />,
      label: `WhatsApp: ${settings.whatsappNumber}`,
      onPress: () => Linking.openURL(`https://wa.me/${wa}`),
    });
  }

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
      <ScreenHeader title="Help" onBack={() => navigation?.goBack()} />

      <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{paddingBottom: scale(30)}}>
        {/* Get in touch! */}
        <Text style={{
          marginTop: scale(24),
          fontFamily: FONTS.semiBold,
          fontSize: scale(20),
          color: COLORS.textPrimary,
          textAlign: 'center',
        }}>
          Get in touch!
        </Text>
        <Text style={{
          marginTop: scale(6),
          fontFamily: FONTS.regular,
          fontSize: scale(13),
          color: COLORS.textSecondary,
          textAlign: 'center',
        }}>
          Contact us for a quote, help to join the team
        </Text>

        {/* Contact cards — only renders entries the admin has configured */}
        {settingsLoading ? (
          <View style={{paddingVertical: scale(20), alignItems: 'center'}}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : contactCards.length > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              marginHorizontal: scale(16),
              marginTop: scale(20),
              gap: scale(10),
              flexWrap: 'wrap',
            }}>
            {contactCards.map(card => {
              const content = (
                <View
                  style={{
                    backgroundColor: COLORS.backgroundWhite,
                    borderRadius: scale(12),
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    paddingVertical: scale(16),
                    paddingHorizontal: scale(8),
                    alignItems: 'center',
                    flex: 1,
                    minWidth: scale(90),
                  }}>
                  {card.icon}
                  <Text
                    style={{
                      fontFamily: FONTS.regular,
                      fontSize: scale(10),
                      color: COLORS.textLight,
                      marginTop: scale(8),
                      textAlign: 'center',
                    }}
                    numberOfLines={card.key === 'address' ? 3 : 1}>
                    {card.label}
                  </Text>
                </View>
              );
              return card.onPress ? (
                <TouchableOpacity
                  key={card.key}
                  onPress={card.onPress}
                  activeOpacity={0.7}
                  style={{flex: 1, minWidth: scale(90)}}>
                  {content}
                </TouchableOpacity>
              ) : (
                <View key={card.key} style={{flex: 1, minWidth: scale(90)}}>
                  {content}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* FAQs */}
        {faqs.length > 0 ? (
          <View style={{marginTop: scale(24)}}>
            <Text style={{
              marginHorizontal: scale(16),
              fontFamily: FONTS.semiBold,
              fontSize: scale(14),
              color: COLORS.textPrimary,
            }}>
              Frequently Asked Questions
            </Text>
            {faqs.map(faq => {
              const open = expandedFaq === faq._id;
              return (
                <TouchableOpacity
                  key={faq._id}
                  activeOpacity={0.7}
                  onPress={() => setExpandedFaq(open ? null : faq._id)}
                  style={{
                    marginHorizontal: scale(16),
                    marginTop: scale(12),
                    backgroundColor: COLORS.backgroundWhite,
                    borderRadius: scale(12),
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    paddingHorizontal: scale(14),
                    paddingVertical: scale(14),
                  }}>
                  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                    <Text style={{
                      flex: 1,
                      fontFamily: FONTS.medium,
                      fontSize: scale(13),
                      color: COLORS.textPrimary,
                    }}>
                      {faq.question}
                    </Text>
                    <Text style={{
                      marginLeft: scale(10),
                      fontFamily: FONTS.semiBold,
                      fontSize: scale(16),
                      color: COLORS.textSecondary,
                    }}>
                      {open ? '−' : '+'}
                    </Text>
                  </View>
                  {open ? (
                    <Text style={{
                      marginTop: scale(8),
                      fontFamily: FONTS.regular,
                      fontSize: scale(12),
                      color: COLORS.textLight,
                      lineHeight: scale(18),
                    }}>
                      {faq.answer}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {/* Contact Form */}
        <Text style={{
          marginTop: scale(24),
          marginHorizontal: scale(16),
          fontFamily: FONTS.semiBold,
          fontSize: scale(14),
          color: COLORS.textPrimary,
        }}>
          Contact Form
        </Text>

        {/* Name */}
        <View style={{
          marginHorizontal: scale(16),
          marginTop: scale(12),
          backgroundColor: COLORS.backgroundWhite,
          borderRadius: scale(12),
          borderWidth: 1,
          borderColor: COLORS.border,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: scale(14),
          height: scale(56),
        }}>
          <PersonIcon />
          <TextInput
            style={{flex: 1, marginLeft: scale(10), fontFamily: FONTS.regular, fontSize: scale(14), color: COLORS.textPrimary, padding: 0}}
            placeholder="Name"
            placeholderTextColor={COLORS.textPlaceholder}
            value={name}
            onChangeText={v => {
              setNameTouched(true);
              setName(v);
            }}
          />
        </View>

        {/* Mobile */}
        <View style={{
          marginHorizontal: scale(16),
          marginTop: scale(12),
          backgroundColor: COLORS.backgroundWhite,
          borderRadius: scale(12),
          borderWidth: 1,
          borderColor: COLORS.border,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: scale(14),
          height: scale(56),
        }}>
          <MobileIcon />
          <TextInput
            style={{flex: 1, marginLeft: scale(10), fontFamily: FONTS.regular, fontSize: scale(14), color: COLORS.textPrimary, padding: 0}}
            placeholder="Mobile No."
            placeholderTextColor={COLORS.textPlaceholder}
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={v => {
              setMobileTouched(true);
              setMobile(v.replace(/\D/g, '').slice(0, 10));
            }}
          />
        </View>

        {/* Message */}
        <Text style={{
          marginTop: scale(16),
          marginHorizontal: scale(16),
          fontFamily: FONTS.semiBold,
          fontSize: scale(14),
          color: COLORS.textPrimary,
        }}>
          Message
        </Text>
        <View style={{
          marginHorizontal: scale(16),
          marginTop: scale(8),
          backgroundColor: COLORS.backgroundWhite,
          borderRadius: scale(12),
          borderWidth: 1,
          borderColor: COLORS.border,
          padding: scale(14),
          minHeight: scale(120),
        }}>
          <TextInput
            style={{fontFamily: FONTS.regular, fontSize: scale(13), color: COLORS.textPrimary, padding: 0, textAlignVertical: 'top'}}
            placeholder="Type.........."
            placeholderTextColor={COLORS.textPlaceholder}
            multiline
            value={message}
            onChangeText={setMessage}
          />
        </View>

        {/* Send Message Button */}
        <View style={{marginHorizontal: scale(16), marginTop: scale(24), marginBottom: scale(24)}}>
          <PrimaryButton
            title={submitting ? 'Sending...' : 'Send Message'}
            onPress={submitting ? undefined : handleSend}
          />
        </View>
      </ScrollView>

      {/* Thank You Modal */}
      <Modal
        visible={showThankYou}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThankYou(false)}>
        <View style={{flex: 1, backgroundColor: COLORS.backgroundOverlay, justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(40)}}>
          <View style={{
            width: '100%',
            backgroundColor: COLORS.backgroundWhite,
            borderRadius: scale(16),
            alignItems: 'center',
            paddingVertical: scale(30),
            paddingHorizontal: scale(24),
          }}>
            <ThankYouCheckIcon />
            <Text style={{
              marginTop: scale(16),
              fontFamily: FONTS.semiBold,
              fontSize: scale(18),
              color: COLORS.textPrimary,
              textAlign: 'center',
            }}>
              Thank You
            </Text>
            <Text style={{
              marginTop: scale(8),
              fontFamily: FONTS.regular,
              fontSize: scale(13),
              color: COLORS.textSecondary,
              textAlign: 'center',
              lineHeight: scale(20),
            }}>
              {submittedCode
                ? `Your ticket ${submittedCode} has been received.\nOur team will get back to you shortly.`
                : 'Your submission has been received.\nWe will be in touch and contact you soon!'}
            </Text>

            <View style={{width: '100%', height: 1, backgroundColor: COLORS.divider, marginTop: scale(20)}} />

            <TouchableOpacity
              onPress={() => setShowThankYou(false)}
              style={{marginTop: scale(16), paddingVertical: scale(4)}}>
              <Text style={{fontFamily: FONTS.medium, fontSize: scale(15), color: COLORS.textPrimary}}>
                Ok! Thanks
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HelpScreen;
