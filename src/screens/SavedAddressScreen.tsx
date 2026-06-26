import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {scale} from '../utils/scale';
import {showAppAlert} from '../components/AlertProvider';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {ScreenHeader, PrimaryButton} from '../components';
import {
  SearchIcon,
  EditIcon,
  DeleteIcon,
  CloseIcon,
  PlusIcon,
  RadioEmpty,
  RadioFilled,
  LocationPinIcon,
} from '../components/icons';
import {
  useAppSelector,
  useAppDispatch,
  hydrateAddresses,
  selectAddress,
  SavedAddress,
} from '../store';
import {fetchCurrentLocation} from '../services/locationService';
import addressService, {ApiAddress} from '../services/addressService';

const LOCATION_TAGS = ['Site', 'Office', 'Home', 'Others'];

interface SavedAddressScreenProps {
  navigation?: any;
}

interface FormState {
  id: string | null;
  street: string;
  houseNo: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  label: string;
  latitude: number | null;
  longitude: number | null;
  isPrimary: boolean;
}

const emptyForm = (): FormState => ({
  id: null,
  street: '',
  houseNo: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  label: 'Home',
  latitude: null,
  longitude: null,
  isPrimary: false,
});

// The backend stores each address as a single `line` string (+ label/lat/lng/
// isDefault). The local SavedAddress shape is structured, so we keep the full
// address text in `street` and leave the other structured fields empty.
const apiToSavedAddress = (a: ApiAddress): SavedAddress => ({
  id: a._id,
  label: a.label || 'Home',
  isPrimary: !!a.isDefault,
  street: a.line,
  houseNo: undefined,
  city: '',
  state: undefined,
  pincode: undefined,
  phone: undefined,
  latitude: a.lat ?? null,
  longitude: a.lng ?? null,
});

// Compose the single address line the backend expects from the structured form.
const formToLine = (form: FormState): string =>
  [form.houseNo, form.street, form.city, form.state, form.pincode]
    .map(s => (s || '').trim())
    .filter(Boolean)
    .join(', ');

const SavedAddressScreen: React.FC<SavedAddressScreenProps> = ({navigation}) => {
  const dispatch = useAppDispatch();
  const savedAddresses = useAppSelector(s => s.app.savedAddresses);
  const selectedAddressId = useAppSelector(s => s.app.selectedAddressId);
  const userMobile = useAppSelector(s => s.app.user?.mobile);

  const [search, setSearch] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Backend is the source of truth: load the saved addresses and mirror them
  // into Redux (other screens still read s.app.savedAddresses).
  const syncFromApi = useCallback(
    (items: ApiAddress[]) => {
      const mapped = items.map(apiToSavedAddress);
      const primary = mapped.find(a => a.isPrimary);
      dispatch(
        hydrateAddresses({
          addresses: mapped,
          selectedId:
            selectedAddressId && mapped.some(a => a.id === selectedAddressId)
              ? selectedAddressId
              : primary?.id || mapped[0]?.id || null,
        }),
      );
    },
    [dispatch, selectedAddressId],
  );

  const loadAddresses = useCallback(async () => {
    try {
      const res = await addressService.list();
      if (res.data?.success) syncFromApi(res.data.data || []);
    } catch (e: any) {
      showAppAlert({
        title: 'Addresses',
        message:
          e?.response?.data?.message || 'Could not load your saved addresses.',
      });
    } finally {
      setLoading(false);
    }
    // syncFromApi depends on selectedAddressId, but we only want to load once
    // on mount — exclude it from deps deliberately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const filtered = savedAddresses.filter(a => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      a.label.toLowerCase().includes(q) ||
      a.street.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      (a.pincode || '').includes(q)
    );
  });

  const openAddSheet = () => {
    setForm({...emptyForm(), phone: userMobile ? `+91 ${userMobile}` : ''});
    setShowAddSheet(true);
  };

  const openEditSheet = (addr: SavedAddress) => {
    setForm({
      id: addr.id,
      street: addr.street,
      houseNo: addr.houseNo || '',
      city: addr.city,
      state: addr.state || '',
      pincode: addr.pincode || '',
      phone: addr.phone || '',
      label: addr.label,
      latitude: addr.latitude,
      longitude: addr.longitude,
      isPrimary: addr.isPrimary,
    });
    setShowAddSheet(true);
  };

  const handleUseCurrentLocation = async () => {
    setFetchingLocation(true);
    try {
      const res = await fetchCurrentLocation();
      setForm(prev => ({
        ...prev,
        latitude: res.latitude,
        longitude: res.longitude,
        street: res.geocode?.street || prev.street,
        city: res.geocode?.city || prev.city,
        state: res.geocode?.state || prev.state,
        pincode: res.geocode?.pincode || prev.pincode,
      }));
    } catch (e: any) {
      showAppAlert({title: 'Location', message: e?.message || 'Could not get location'});
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!form.street.trim() || !form.city.trim()) {
      showAppAlert({title: 'Missing fields', message: 'Please enter street and city.'});
      return;
    }
    if (form.latitude == null || form.longitude == null) {
      showAppAlert({
        title: 'Location required',
        message: 'Tap "Use current location" to attach lat/long to this address.',
      });
      return;
    }

    const payload = {
      label: form.label,
      line: formToLine(form),
      lat: form.latitude,
      lng: form.longitude,
      isDefault: form.isPrimary,
    };

    setSaving(true);
    try {
      const res = form.id
        ? await addressService.update(form.id, payload)
        : await addressService.create(payload);
      if (res.data?.success) syncFromApi(res.data.data || []);
      setShowAddSheet(false);
    } catch (e: any) {
      showAppAlert({
        title: 'Could not save',
        message:
          e?.response?.data?.message || 'Failed to save address. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    showAppAlert({
      title: 'Delete address',
      message: 'Are you sure?',
      buttons: [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await addressService.remove(id);
              if (res.data?.success) syncFromApi(res.data.data || []);
            } catch (e: any) {
              showAppAlert({
                title: 'Could not delete',
                message:
                  e?.response?.data?.message ||
                  'Failed to delete address. Please try again.',
              });
            }
          },
        },
      ],
    });
  };

  const handleMakePrimary = async (addr: SavedAddress) => {
    try {
      const res = await addressService.update(addr.id, {
        label: addr.label,
        line: addr.street,
        lat: addr.latitude ?? undefined,
        lng: addr.longitude ?? undefined,
        isDefault: true,
      });
      if (res.data?.success) syncFromApi(res.data.data || []);
    } catch (e: any) {
      showAppAlert({
        title: 'Could not update',
        message:
          e?.response?.data?.message || 'Failed to set primary address.',
      });
    }
  };

  const handleSelect = (id: string) => {
    dispatch(selectAddress(id));
  };

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
      <ScreenHeader
        title="Saved Address"
        onBack={() => navigation?.goBack()}
        rightContent={
          <TouchableOpacity
            onPress={openAddSheet}
            style={{flexDirection: 'row', alignItems: 'center', gap: scale(4)}}>
            <PlusIcon color={COLORS.warning} />
            <Text style={{fontFamily: FONTS.medium, fontSize: scale(13), color: COLORS.warning}}>
              Add Address
            </Text>
          </TouchableOpacity>
        }
      />

      <View style={{
        marginHorizontal: scale(16),
        marginTop: scale(16),
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: scale(10),
      }}>
        <TextInput
          style={{flex: 1, fontFamily: FONTS.regular, fontSize: scale(14), color: COLORS.textPrimary, padding: 0}}
          placeholder="Search Your Location"
          placeholderTextColor={COLORS.textPlaceholder}
          value={search}
          onChangeText={setSearch}
        />
        <SearchIcon color={COLORS.warning} />
      </View>

      <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false} bounces={false}>
        {loading ? (
          <View style={{alignItems: 'center', paddingVertical: scale(60)}}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={{alignItems: 'center', paddingVertical: scale(60)}}>
            <Text style={{fontFamily: FONTS.regular, fontSize: scale(14), color: COLORS.textSecondary}}>
              {savedAddresses.length === 0
                ? 'No saved addresses. Tap "Add Address" to get started.'
                : 'No address matches your search.'}
            </Text>
          </View>
        ) : (
          filtered.map(addr => {
            const isSelected = addr.id === selectedAddressId;
            return (
              <TouchableOpacity
                key={addr.id}
                activeOpacity={0.7}
                onPress={() => handleSelect(addr.id)}
                style={{
                  marginHorizontal: scale(16),
                  marginTop: scale(16),
                  paddingBottom: scale(16),
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.divider,
                }}>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: scale(8), flex: 1}}>
                    {isSelected ? <RadioFilled size={20} /> : <RadioEmpty size={20} />}
                    <Text style={{fontFamily: FONTS.semiBold, fontSize: scale(14), color: COLORS.textPrimary}}>
                      {addr.label}
                    </Text>
                    {addr.isPrimary ? (
                      <View style={{
                        paddingHorizontal: scale(10),
                        paddingVertical: scale(3),
                        borderRadius: scale(4),
                        backgroundColor: COLORS.primary,
                      }}>
                        <Text style={{fontFamily: FONTS.medium, fontSize: scale(10), color: COLORS.textPrimary}}>
                          Primary Address
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => handleMakePrimary(addr)}>
                        <Text style={{fontFamily: FONTS.regular, fontSize: scale(12), color: COLORS.textSecondary}}>
                          Make Primary
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => openEditSheet(addr)} style={{padding: scale(4)}}>
                    <EditIcon size={18} />
                  </TouchableOpacity>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: scale(8), paddingLeft: scale(28)}}>
                  <View style={{flex: 1}}>
                    <Text style={{fontFamily: FONTS.regular, fontSize: scale(12), color: COLORS.textLight, lineHeight: scale(18)}}>
                      {[addr.houseNo, addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                    </Text>
                    {addr.phone ? (
                      <Text style={{fontFamily: FONTS.regular, fontSize: scale(12), color: COLORS.textLight, marginTop: scale(2)}}>
                        {addr.phone}
                      </Text>
                    ) : null}
                    {addr.latitude != null && addr.longitude != null ? (
                      <Text style={{fontFamily: FONTS.regular, fontSize: scale(10), color: COLORS.textSecondary, marginTop: scale(2)}}>
                        {addr.latitude.toFixed(5)}, {addr.longitude.toFixed(5)}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(addr.id)} style={{marginLeft: scale(12), padding: scale(4)}}>
                    <DeleteIcon />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={showAddSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddSheet(false)}>
        <View style={{flex: 1, backgroundColor: COLORS.backgroundOverlay, justifyContent: 'flex-end'}}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{
              backgroundColor: COLORS.backgroundWhite,
              borderTopLeftRadius: scale(24),
              borderTopRightRadius: scale(24),
              paddingHorizontal: scale(24),
              paddingBottom: scale(30),
              maxHeight: '90%',
            }}>
              <View style={{alignItems: 'center', paddingTop: scale(12)}}>
                <View style={{width: scale(40), height: scale(4), borderRadius: scale(2), backgroundColor: COLORS.dragHandle}} />
              </View>

              <TouchableOpacity
                onPress={() => setShowAddSheet(false)}
                style={{position: 'absolute', right: scale(20), top: scale(16), padding: scale(8), zIndex: 10}}>
                <CloseIcon />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <Text style={{marginTop: scale(24), fontFamily: FONTS.semiBold, fontSize: scale(18), color: COLORS.textPrimary}}>
                  {form.id ? 'Edit Address' : 'Enter Site Address'}
                </Text>

                <TouchableOpacity
                  onPress={handleUseCurrentLocation}
                  disabled={fetchingLocation}
                  style={{
                    marginTop: scale(16),
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: scale(8),
                    paddingVertical: scale(10),
                    paddingHorizontal: scale(12),
                    borderRadius: scale(10),
                    borderWidth: 1,
                    borderColor: COLORS.primary,
                    alignSelf: 'flex-start',
                  }}>
                  {fetchingLocation ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <LocationPinIcon size={18} />
                  )}
                  <Text style={{fontFamily: FONTS.medium, fontSize: scale(13), color: COLORS.textPrimary}}>
                    {fetchingLocation ? 'Fetching...' : 'Use current location'}
                  </Text>
                </TouchableOpacity>

                {form.latitude != null && form.longitude != null ? (
                  <Text style={{marginTop: scale(6), fontFamily: FONTS.regular, fontSize: scale(11), color: COLORS.textSecondary}}>
                    Pinned: {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
                  </Text>
                ) : null}

                <View style={{marginTop: scale(16), borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: scale(12)}}>
                  <TextInput
                    style={{fontFamily: FONTS.regular, fontSize: scale(14), color: COLORS.textPrimary, padding: 0}}
                    placeholder="Street / Society / Area*"
                    placeholderTextColor={COLORS.textPlaceholder}
                    value={form.street}
                    onChangeText={v => setForm(p => ({...p, street: v}))}
                  />
                </View>

                <View style={{marginTop: scale(16), borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: scale(12)}}>
                  <TextInput
                    style={{fontFamily: FONTS.regular, fontSize: scale(14), color: COLORS.textPrimary, padding: 0}}
                    placeholder="House / Office No. / Floor"
                    placeholderTextColor={COLORS.textPlaceholder}
                    value={form.houseNo}
                    onChangeText={v => setForm(p => ({...p, houseNo: v}))}
                  />
                </View>

                <View style={{flexDirection: 'row', gap: scale(12), marginTop: scale(16)}}>
                  <View style={{flex: 1, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: scale(12)}}>
                    <TextInput
                      style={{fontFamily: FONTS.regular, fontSize: scale(14), color: COLORS.textPrimary, padding: 0}}
                      placeholder="City*"
                      placeholderTextColor={COLORS.textPlaceholder}
                      value={form.city}
                      onChangeText={v => setForm(p => ({...p, city: v}))}
                    />
                  </View>
                  <View style={{flex: 1, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: scale(12)}}>
                    <TextInput
                      style={{fontFamily: FONTS.regular, fontSize: scale(14), color: COLORS.textPrimary, padding: 0}}
                      placeholder="State"
                      placeholderTextColor={COLORS.textPlaceholder}
                      value={form.state}
                      onChangeText={v => setForm(p => ({...p, state: v}))}
                    />
                  </View>
                </View>

                <View style={{flexDirection: 'row', gap: scale(12), marginTop: scale(16)}}>
                  <View style={{flex: 1, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: scale(12)}}>
                    <TextInput
                      style={{fontFamily: FONTS.regular, fontSize: scale(14), color: COLORS.textPrimary, padding: 0}}
                      placeholder="Pincode"
                      placeholderTextColor={COLORS.textPlaceholder}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={form.pincode}
                      onChangeText={v => setForm(p => ({...p, pincode: v}))}
                    />
                  </View>
                  <View style={{flex: 1, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: scale(12)}}>
                    <TextInput
                      style={{fontFamily: FONTS.regular, fontSize: scale(14), color: COLORS.textPrimary, padding: 0}}
                      placeholder="Phone"
                      placeholderTextColor={COLORS.textPlaceholder}
                      keyboardType="phone-pad"
                      value={form.phone}
                      onChangeText={v => setForm(p => ({...p, phone: v}))}
                    />
                  </View>
                </View>

                <Text style={{marginTop: scale(20), fontFamily: FONTS.medium, fontSize: scale(14), color: COLORS.textPrimary}}>
                  Tag this location*
                </Text>
                <View style={{flexDirection: 'row', gap: scale(10), marginTop: scale(10), flexWrap: 'wrap'}}>
                  {LOCATION_TAGS.map(tag => (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => setForm(p => ({...p, label: tag}))}
                      style={{
                        paddingHorizontal: scale(16),
                        paddingVertical: scale(8),
                        borderRadius: scale(20),
                        borderWidth: 1,
                        borderColor: form.label === tag ? COLORS.secondary : COLORS.border,
                        backgroundColor: form.label === tag ? COLORS.backgroundLight : COLORS.backgroundWhite,
                      }}>
                      <Text style={{
                        fontFamily: FONTS.regular,
                        fontSize: scale(12),
                        color: form.label === tag ? COLORS.textPrimary : COLORS.textSecondary,
                      }}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => setForm(p => ({...p, isPrimary: !p.isPrimary}))}
                  style={{flexDirection: 'row', alignItems: 'center', gap: scale(10), marginTop: scale(20)}}>
                  {form.isPrimary ? <RadioFilled size={20} /> : <RadioEmpty size={20} />}
                  <Text style={{fontFamily: FONTS.regular, fontSize: scale(13), color: COLORS.textPrimary}}>
                    Set as primary address
                  </Text>
                </TouchableOpacity>

                <PrimaryButton
                  title={
                    saving
                      ? 'Saving...'
                      : form.id
                      ? 'Update Address'
                      : 'Save & Continue'
                  }
                  onPress={saving ? undefined : handleSave}
                  style={{marginTop: scale(20)}}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

export default SavedAddressScreen;
