import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Svg, {Path, Circle, Rect} from 'react-native-svg';
import {scale} from '../utils/scale';
import {COLORS} from '../constants/colors';
import {FONTS} from '../constants/fonts';
import {ChevronDownIcon, PhoneIcon} from '../components/icons';
import {
  ScreenHeader,
  PrimaryButton,
  HeaderCartButton,
  HeaderProfileButton,
} from '../components';
import quotationService, {
  QuotationItem,
  QuotationPdfFile,
} from '../services/quotationService';
import catalogService, {
  Category,
  SubCategory,
  Material,
} from '../services/catalogService';
import {showAppAlert} from '../components/AlertProvider';
import {useAppSelector} from '../store';

const bulkBanner = require('../assets/images/bulk-banner.png');

// Static fallback quantity presets for the quantity picker
const QUANTITY_OPTIONS = ['50', '100', '250', '500', '1000', '2000', '5000'];

// `@react-native-documents/picker` is a native dependency (in package.json) —
// the maintained successor to react-native-document-picker, compatible with
// React Native 0.85. Loaded lazily/guarded so the app never crashes if a build
// hasn't linked the native module yet (a rebuild is needed after install).
let DocPicker: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  DocPicker = require('@react-native-documents/picker');
} catch {
  DocPicker = null;
}

// ------- Local icons -------
const LocationIcon = () => (
  <Svg width={scale(20)} height={scale(20)} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={3} stroke={COLORS.secondary} strokeWidth={1.5} />
    <Path d="M12 2V4M12 20V22M2 12H4M20 12H22" stroke={COLORS.secondary} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const WholesaleIcon = () => (
  <Svg width={scale(40)} height={scale(40)} viewBox="0 0 40 40" fill="none">
    <Circle cx={20} cy={20} r={18} fill="#FFF3E0" />
    <Path d="M12 26L16 14H24L28 26H12Z" fill="#FF9800" />
    <Path d="M15 26V30H25V26" stroke="#E65100" strokeWidth={1.5} />
    <Circle cx={20} cy={20} r={3} fill="#FFF9C4" />
  </Svg>
);

const DeliveryTruckIcon = () => (
  <Svg width={scale(40)} height={scale(40)} viewBox="0 0 40 40" fill="none">
    <Circle cx={20} cy={20} r={18} fill="#E8F5E9" />
    <Path d="M10 16H24V26H10V16Z" fill="#66BB6A" />
    <Path d="M24 19H28L30 22V26H24V19Z" fill="#43A047" />
    <Circle cx={15} cy={27} r={2} fill={COLORS.secondary} />
    <Circle cx={27} cy={27} r={2} fill={COLORS.secondary} />
  </Svg>
);

const SupportIcon = () => (
  <Svg width={scale(40)} height={scale(40)} viewBox="0 0 40 40" fill="none">
    <Circle cx={20} cy={20} r={18} fill="#FFF3E0" />
    <Circle cx={20} cy={18} r={6} stroke="#FF9800" strokeWidth={2} fill="none" />
    <Path d="M14 18V22C14 22 14 26 20 26C26 26 26 22 26 22V18" stroke="#FF9800" strokeWidth={2} />
    <Path d="M20 26V30" stroke="#FF9800" strokeWidth={2} />
    <Path d="M16 30H24" stroke="#FF9800" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const WhatsAppHelpIcon = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={11} fill={COLORS.whatsapp} />
    <Path d="M12 6.5C9 6.5 6.5 9 6.5 12C6.5 13.1 6.8 14.1 7.3 14.9L6.5 17.5L9.2 16.7C10 17.15 10.95 17.4 12 17.4C15 17.4 17.5 14.9 17.5 11.9C17.5 9 15 6.5 12 6.5Z" fill={COLORS.backgroundWhite} />
  </Svg>
);

const GuestImage = () => (
  <Svg width={scale(80)} height={scale(80)} viewBox="0 0 80 80" fill="none">
    <Circle cx={40} cy={40} r={38} fill="#FFF3E0" />
    <Circle cx={40} cy={32} r={12} fill="#FF9800" />
    <Path d="M20 60C20 50 28 44 40 44C52 44 60 50 60 60" fill="#FF9800" />
    <Rect x={28} y={18} width={24} height={6} rx={3} fill="#FFC107" />
  </Svg>
);

const TrashIcon = () => (
  <Svg width={scale(18)} height={scale(18)} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke={COLORS.error || '#dc2626'} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PdfIcon = () => (
  <Svg width={scale(22)} height={scale(22)} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={COLORS.primary} strokeWidth={1.6} strokeLinejoin="round" />
    <Path d="M14 2v6h6" stroke={COLORS.primary} strokeWidth={1.6} strokeLinejoin="round" />
  </Svg>
);

// ------- Types -------
interface QuoteItemDraft {
  id: string;
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  hasSubCategories: boolean | null; // null = not yet known
  materialId: string;
  materialName: string;
  materials: Material[];
  materialsLoaded: boolean;
  quantity: string;
  unit: string;
  note: string;
}

const makeEmptyItem = (): QuoteItemDraft => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  categoryId: '',
  categoryName: '',
  subCategoryId: '',
  subCategoryName: '',
  hasSubCategories: null,
  materialId: '',
  materialName: '',
  materials: [],
  materialsLoaded: false,
  quantity: '',
  unit: '',
  note: '',
});

// ------- Picker config -------
type PickerKind = 'category' | 'subCategory' | 'material' | 'quantity' | 'unit';
interface PickerState {
  itemId: string;
  kind: PickerKind;
}

// ------- Screen -------
interface Props {
  navigation?: any;
  route?: any;
}

const GetQuotationScreen: React.FC<Props> = ({navigation, route}) => {
  const isLoggedIn = route?.params?.isLoggedIn ?? true;

  const user = useAppSelector(s => s.app.user);
  const savedAddresses = useAppSelector(s => s.app.savedAddresses);
  const selectedAddressId = useAppSelector(s => s.app.selectedAddressId);
  const primaryAddress =
    savedAddresses.find(a => a.id === selectedAddressId) ||
    savedAddresses.find(a => a.isPrimary) ||
    savedAddresses[0] ||
    null;
  const primaryAddressLabel = primaryAddress
    ? [
        primaryAddress.houseNo,
        primaryAddress.street,
        primaryAddress.city,
        primaryAddress.state,
        primaryAddress.pincode,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  const defaultName = isLoggedIn ? user?.name || '' : '';
  const defaultPhone = isLoggedIn && user?.mobile ? `+91 ${user.mobile}` : '';
  const defaultAddress = isLoggedIn ? primaryAddressLabel : '';

  // When launched from a specific product's "Get a Quote" button, seed the
  // notes so the team knows exactly which material the customer wants priced.
  const prefillMaterialName: string | undefined = route?.params?.materialName;
  const prefillCategoryName: string | undefined = route?.params?.categoryName;
  const defaultMaterialReq = prefillMaterialName
    ? `Requesting a quote for: ${prefillMaterialName}${
        prefillCategoryName ? ` (${prefillCategoryName})` : ''
      }`
    : '';

  // Form state
  const [activeTab, setActiveTab] = useState<'contractor' | 'individual'>(
    'contractor',
  );
  const [items, setItems] = useState<QuoteItemDraft[]>([makeEmptyItem()]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategoriesCache, setSubCategoriesCache] = useState<
    Record<string, SubCategory[]>
  >({});

  const [name, setName] = useState(defaultName);
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState(defaultPhone);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [address, setAddress] = useState(defaultAddress);
  const [addressTouched, setAddressTouched] = useState(false);
  const [landmark, setLandmark] = useState('');
  const [materialReq, setMaterialReq] = useState(defaultMaterialReq);
  const [pdfFile, setPdfFile] = useState<QuotationPdfFile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [picker, setPicker] = useState<PickerState | null>(null);

  // OTP modal (guest flow only)
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(34);
  const otpRefs = useRef<Array<TextInput | null>>([]);

  // ----- Effects -----
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showOtpModal && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(p => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, otpTimer]);

  useEffect(() => {
    let cancelled = false;
    catalogService
      .getCategories()
      .then(res => {
        if (!cancelled && res.data?.success) {
          setCategories(res.data.data || []);
        }
      })
      .catch(() => {
        // empty picker is acceptable
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn || phoneTouched) return;
    setPhone(user?.mobile ? `+91 ${user.mobile}` : '');
  }, [isLoggedIn, user?.mobile, phoneTouched]);

  useEffect(() => {
    if (!isLoggedIn || addressTouched) return;
    setAddress(primaryAddressLabel);
  }, [isLoggedIn, primaryAddressLabel, addressTouched]);

  // ----- Item helpers -----
  const updateItem = (id: string, patch: Partial<QuoteItemDraft>) =>
    setItems(prev => prev.map(it => (it.id === id ? {...it, ...patch} : it)));

  const removeItem = (id: string) =>
    setItems(prev =>
      prev.length === 1 ? prev : prev.filter(it => it.id !== id),
    );

  const addItem = () => setItems(prev => [...prev, makeEmptyItem()]);

  // Fetch subcategories for a category (once, cached)
  const ensureSubCategories = async (categoryId: string) => {
    if (subCategoriesCache[categoryId]) return subCategoriesCache[categoryId];
    try {
      const res = await catalogService.getSubCategories(categoryId);
      const list = res.data?.success ? res.data.data : [];
      setSubCategoriesCache(prev => ({...prev, [categoryId]: list}));
      return list;
    } catch {
      setSubCategoriesCache(prev => ({...prev, [categoryId]: []}));
      return [];
    }
  };

  // Fetch materials for an item's current category/subCategory; auto-fill unit when only one
  const fetchMaterialsForItem = async (item: QuoteItemDraft) => {
    if (!item.categoryId && !item.subCategoryId) return;
    try {
      const params: any = {limit: 50};
      if (item.subCategoryId) params.subCategory = item.subCategoryId;
      else if (item.categoryId) params.category = item.categoryId;
      const res = await catalogService.getMaterials(params);
      const list = res.data?.success ? res.data.data : [];
      updateItem(item.id, {
        materials: list,
        materialsLoaded: true,
        // If material previously chosen is no longer valid, clear it
        materialId: list.some(m => m._id === item.materialId)
          ? item.materialId
          : '',
        materialName: list.some(m => m._id === item.materialId)
          ? item.materialName
          : '',
      });
    } catch {
      updateItem(item.id, {materials: [], materialsLoaded: true});
    }
  };

  // When a category is chosen.
  // Sub-category is optional: we always fetch materials at the category level
  // so the user can pick a material directly. If they later choose a
  // sub-category, the material list is re-filtered.
  const onSelectCategory = async (
    itemId: string,
    cat: {_id: string; name: string},
  ) => {
    updateItem(itemId, {
      categoryId: cat._id,
      categoryName: cat.name,
      subCategoryId: '',
      subCategoryName: '',
      hasSubCategories: null,
      materialId: '',
      materialName: '',
      materials: [],
      materialsLoaded: false,
      unit: '',
    });
    setPicker(null);

    // Kick off subcategory + materials fetches in parallel
    const [subs] = await Promise.all([
      ensureSubCategories(cat._id),
      fetchMaterialsForItem({
        ...makeEmptyItem(),
        id: itemId,
        categoryId: cat._id,
        categoryName: cat.name,
      }),
    ]);
    updateItem(itemId, {hasSubCategories: subs.length > 0});
  };

  const onClearSubCategory = (itemId: string) => {
    const current = items.find(i => i.id === itemId);
    if (!current) return;
    updateItem(itemId, {
      subCategoryId: '',
      subCategoryName: '',
      materialId: '',
      materialName: '',
      materials: [],
      materialsLoaded: false,
      unit: '',
    });
    // Reload materials at the category level
    fetchMaterialsForItem({
      ...current,
      subCategoryId: '',
      subCategoryName: '',
    });
  };

  const onSelectSubCategory = async (
    itemId: string,
    sub: {_id: string; name: string},
  ) => {
    setPicker(null);
    updateItem(itemId, {
      subCategoryId: sub._id,
      subCategoryName: sub.name,
      materialId: '',
      materialName: '',
      materials: [],
      materialsLoaded: false,
      unit: '',
    });
    // Use the item from state after update — get latest via a setTimeout dance
    const current = items.find(i => i.id === itemId);
    if (current) {
      fetchMaterialsForItem({
        ...current,
        subCategoryId: sub._id,
        subCategoryName: sub.name,
      });
    }
  };

  const onSelectMaterial = (itemId: string, mat: Material) => {
    setPicker(null);
    updateItem(itemId, {
      materialId: mat._id,
      materialName: mat.name,
      // Admin-set unit on the material auto-fills here
      unit: mat.unit || '',
    });
  };

  // ----- PDF attachment -----
  const handlePickPdf = async () => {
    if (!DocPicker) {
      showAppAlert({
        title: 'PDF upload unavailable',
        message:
          'Document picking is not available in this build. Please update the app to attach a PDF.',
      });
      return;
    }
    try {
      const [picked] = await DocPicker.pick({type: [DocPicker.types.pdf]});
      const name = picked.name || 'requirement.pdf';
      let uri = picked.uri;

      // Keep a stable local copy so the multipart upload works reliably
      // (esp. Android `content://` uris). Falls back to the original uri.
      try {
        const [copy] = await DocPicker.keepLocalCopy({
          files: [{uri: picked.uri, fileName: name}],
          destination: 'cachesDirectory',
        });
        if (copy?.status === 'success' && copy.localUri) uri = copy.localUri;
      } catch {
        // ignore — use the original picked uri
      }

      setPdfFile({
        uri,
        name,
        type: picked.type || 'application/pdf',
      });
    } catch (e: any) {
      // User cancelling the picker is not an error worth surfacing.
      if (
        DocPicker.isErrorWithCode?.(e) &&
        e.code === DocPicker.errorCodes?.OPERATION_CANCELED
      ) {
        return;
      }
      showAppAlert({
        title: 'Could not attach PDF',
        message: 'Something went wrong while selecting the file. Please try again.',
      });
    }
  };

  const removePdf = () => setPdfFile(null);

  // ----- Submit -----
  const normalizeMobile = (m: string) =>
    m.replace(/^\+91/, '').replace(/\s+/g, '').trim();

  const submitQuotation = async () => {
    const cleanMobile = normalizeMobile(phone);
    if (!name.trim()) {
      showAppAlert({title: 'Missing info', message: 'Please enter your name.'});
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      showAppAlert({
        title: 'Invalid mobile',
        message: 'Please enter a valid 10-digit mobile number.',
      });
      return;
    }

    // Build payload items — drop completely empty entries
    const payloadItems: QuotationItem[] = items
      .map(it => ({
        categoryId: it.categoryId || undefined,
        categoryName: it.categoryName || undefined,
        subCategoryId: it.subCategoryId || undefined,
        subCategoryName: it.subCategoryName || undefined,
        materialId: it.materialId || undefined,
        materialName: it.materialName || undefined,
        quantity: it.quantity.trim() || undefined,
        unit: it.unit.trim() || undefined,
        note: it.note.trim() || undefined,
      }))
      .filter(
        i =>
          i.categoryName ||
          i.subCategoryName ||
          i.materialName ||
          i.quantity ||
          i.note,
      );

    if (payloadItems.length === 0) {
      showAppAlert({
        title: 'Add at least one item',
        message:
          'Please add at least one material with category and quantity to request a quote.',
      });
      return;
    }

    // Soft-validate each item has a quantity
    const missingQty = payloadItems.findIndex(i => !i.quantity);
    if (missingQty !== -1) {
      showAppAlert({
        title: 'Missing quantity',
        message: `Please enter quantity for item #${missingQty + 1}.`,
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await quotationService.submit({
        customerType: activeTab,
        name: name.trim(),
        mobile: cleanMobile,
        company: company.trim() || undefined,
        address: address.trim() || undefined,
        landmark: landmark.trim() || undefined,
        items: payloadItems,
        materialRequirement: materialReq.trim() || undefined,
        pdf: pdfFile,
      });
      const code = res.data?.data?.quotationCode;
      showAppAlert({
        title: 'Request received',
        message: code
          ? `Your quotation request ${code} has been submitted. Our team will get back to you shortly.`
          : 'Your quotation request has been submitted. Our team will get back to you shortly.',
        buttons: [{text: 'OK', onPress: () => navigation?.goBack()}],
      });
      setItems([makeEmptyItem()]);
      setMaterialReq('');
      setPdfFile(null);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        'Could not submit your request. Please try again.';
      showAppAlert({title: 'Submission failed', message: msg});
    } finally {
      setSubmitting(false);
    }
  };

  // ----- Picker data -----
  const activeItem = picker
    ? items.find(i => i.id === picker.itemId) || null
    : null;
  const pickerOptions: Array<{
    key: string;
    label: string;
    selected: boolean;
    onPress: () => void;
  }> = (() => {
    if (!picker || !activeItem) return [];
    switch (picker.kind) {
      case 'category':
        return categories.map(c => ({
          key: c._id,
          label: c.name,
          selected: c._id === activeItem.categoryId,
          onPress: () => onSelectCategory(activeItem.id, c),
        }));
      case 'subCategory': {
        const subs = subCategoriesCache[activeItem.categoryId] || [];
        return subs.map(sc => ({
          key: sc._id,
          label: sc.name,
          selected: sc._id === activeItem.subCategoryId,
          onPress: () => onSelectSubCategory(activeItem.id, sc),
        }));
      }
      case 'material':
        return activeItem.materials.map(m => ({
          key: m._id,
          label: `${m.name}${m.unit ? ` · ${m.unit}` : ''}`,
          selected: m._id === activeItem.materialId,
          onPress: () => onSelectMaterial(activeItem.id, m),
        }));
      case 'quantity':
        return QUANTITY_OPTIONS.map(v => ({
          key: v,
          label: v,
          selected: v === activeItem.quantity,
          onPress: () => {
            updateItem(activeItem.id, {quantity: v});
            setPicker(null);
          },
        }));
      case 'unit': {
        // Build unit list from materials' admin-set units; fall back to common units
        const fromMaterials = Array.from(
          new Set(
            activeItem.materials.map(m => m.unit).filter(Boolean) as string[],
          ),
        );
        const fallback = ['Bags', 'Tons', 'Kg', 'Pieces', 'Meters', 'Bundles', 'Trucks'];
        const list = fromMaterials.length > 0 ? fromMaterials : fallback;
        return list.map(u => ({
          key: u,
          label: u,
          selected: u === activeItem.unit,
          onPress: () => {
            updateItem(activeItem.id, {unit: u});
            setPicker(null);
          },
        }));
      }
      default:
        return [];
    }
  })();

  const pickerTitle = picker
    ? {
        category: 'Select Category',
        subCategory: 'Select Sub-Category',
        material: 'Select Material',
        quantity: 'Select Quantity',
        unit: 'Select Unit',
      }[picker.kind]
    : '';

  // ----- OTP handlers -----
  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otpValues];
    newOtp[index] = text;
    setOtpValues(newOtp);
    if (text && index < 5) otpRefs.current[index + 1]?.focus();
  };
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
      <ScreenHeader
        title="Get Quotation"
        onBack={() => navigation?.goBack()}
        rightContent={
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <HeaderCartButton />
            <HeaderProfileButton />
          </View>
        }
      />

      <ScrollView
        style={{flex: 1}}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Banner */}
        {isLoggedIn && (
          <View
            style={{
              height: scale(140),
              marginHorizontal: scale(16),
              marginTop: scale(16),
              borderRadius: scale(12),
              overflow: 'hidden',
            }}>
            <Image
              source={bulkBanner}
              style={{width: '100%', height: '100%'}}
              resizeMode="cover"
            />
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                padding: scale(16),
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(16),
                  color: COLORS.textWhite,
                }}>
                Order in Bulk & Get Quotation
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: scale(11),
                  color: 'rgba(255,255,255,0.8)',
                  marginTop: scale(4),
                }}>
                Add materials below and submit. Our team will respond within 30
                minutes.
              </Text>
            </View>
          </View>
        )}

        {/* Guest header */}
        {!isLoggedIn && (
          <View style={{paddingHorizontal: scale(16), paddingTop: scale(16)}}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: scale(8),
              }}>
              <View>
                <Text
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: scale(16),
                    color: COLORS.secondary,
                  }}>
                  Continue as Guest
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: scale(12),
                    color: COLORS.textSecondary,
                    marginTop: scale(2),
                  }}>
                  Browse & request quotes without signup.
                </Text>
              </View>
              <GuestImage />
            </View>
          </View>
        )}

        {/* Customer type tabs */}
        <View
          style={{
            flexDirection: 'row',
            marginHorizontal: scale(16),
            marginTop: scale(16),
            backgroundColor: COLORS.divider,
            borderRadius: scale(10),
            padding: scale(4),
          }}>
          {(['contractor', 'individual'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                paddingVertical: scale(10),
                borderRadius: scale(8),
                backgroundColor:
                  activeTab === tab ? COLORS.primary : 'transparent',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: scale(13),
                  color:
                    activeTab === tab ? COLORS.secondary : COLORS.textSecondary,
                }}>
                {tab === 'contractor' ? 'Contractor/Builder' : 'Individual'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ----- Items ----- */}
        <View style={{paddingHorizontal: scale(16), marginTop: scale(16)}}>
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: scale(14),
              color: COLORS.secondary,
              marginBottom: scale(10),
            }}>
            Materials Needed
          </Text>

          {items.map((item, idx) => (
            <ItemCard
              key={item.id}
              item={item}
              index={idx}
              onRemove={
                items.length === 1 ? undefined : () => removeItem(item.id)
              }
              onPick={(kind) => setPicker({itemId: item.id, kind})}
              onClearSubCategory={() => onClearSubCategory(item.id)}
              onChangeQuantity={v => updateItem(item.id, {quantity: v})}
              onChangeUnit={v => updateItem(item.id, {unit: v})}
              onChangeNote={v => updateItem(item.id, {note: v})}
            />
          ))}

          <TouchableOpacity
            onPress={addItem}
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: scale(12),
              paddingVertical: scale(8),
              borderRadius: scale(8),
              borderWidth: 1,
              borderColor: COLORS.primary,
              backgroundColor: COLORS.primary + '15',
              marginTop: scale(4),
              marginBottom: scale(20),
            }}>
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(13),
                color: COLORS.primary,
              }}>
              + Add Material
            </Text>
          </TouchableOpacity>
        </View>

        {/* ----- Personal Details ----- */}
        <View style={{paddingHorizontal: scale(16)}}>
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: scale(14),
              color: COLORS.secondary,
              marginBottom: scale(10),
            }}>
            Your Details
          </Text>

          {/* Name */}
          <FieldRow>
            <TextInput
              style={inputStyle}
              placeholder="Enter Your Name"
              placeholderTextColor={COLORS.textPlaceholder}
              value={name}
              onChangeText={setName}
            />
          </FieldRow>

          {/* Company (optional) */}
          <FieldRow>
            <TextInput
              style={inputStyle}
              placeholder="Company name (optional)"
              placeholderTextColor={COLORS.textPlaceholder}
              value={company}
              onChangeText={setCompany}
            />
          </FieldRow>

          {/* Phone */}
          <FieldRow
            below={
              isLoggedIn && !phoneTouched && user?.mobile
                ? 'Using your account number. Tap to edit.'
                : undefined
            }>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
              }}>
              <PhoneIcon />
              <TextInput
                style={[inputStyle, {flex: 1, marginLeft: scale(8)}]}
                placeholder="Enter Mobile Number"
                placeholderTextColor={COLORS.textPlaceholder}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={v => {
                  setPhoneTouched(true);
                  setPhone(v);
                }}
              />
              {isLoggedIn && phoneTouched && user?.mobile && (
                <TouchableOpacity
                  onPress={() => {
                    setPhoneTouched(false);
                    setPhone(`+91 ${user.mobile}`);
                  }}>
                  <Text
                    style={{
                      fontFamily: FONTS.medium,
                      fontSize: scale(11),
                      color: COLORS.primary,
                    }}>
                    Use mine
                  </Text>
                </TouchableOpacity>
              )}
              {!isLoggedIn && (
                <TouchableOpacity onPress={() => setShowOtpModal(true)}>
                  <Text
                    style={{
                      fontFamily: FONTS.medium,
                      fontSize: scale(13),
                      color: '#4CAF50',
                    }}>
                    Verify
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </FieldRow>

          {/* Address */}
          <FieldRow
            below={
              isLoggedIn && !addressTouched && primaryAddressLabel
                ? 'Using your primary address. Tap to edit.'
                : undefined
            }>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
              }}>
              <TextInput
                style={[inputStyle, {flex: 1}]}
                placeholder="Enter Your Address"
                placeholderTextColor={COLORS.textPlaceholder}
                value={address}
                onChangeText={v => {
                  setAddressTouched(true);
                  setAddress(v);
                }}
              />
              {isLoggedIn && addressTouched && primaryAddressLabel ? (
                <TouchableOpacity
                  onPress={() => {
                    setAddressTouched(false);
                    setAddress(primaryAddressLabel);
                  }}>
                  <Text
                    style={{
                      fontFamily: FONTS.medium,
                      fontSize: scale(11),
                      color: COLORS.primary,
                    }}>
                    Primary
                  </Text>
                </TouchableOpacity>
              ) : (
                <LocationIcon />
              )}
            </View>
          </FieldRow>

          {/* Landmark */}
          <FieldRow>
            <TextInput
              style={inputStyle}
              placeholder="Site / Landmark (optional)"
              placeholderTextColor={COLORS.textPlaceholder}
              value={landmark}
              onChangeText={setLandmark}
            />
          </FieldRow>

          {/* Additional notes */}
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: scale(13),
              color: COLORS.secondary,
              marginTop: scale(8),
              marginBottom: scale(8),
            }}>
            Additional Notes
          </Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: scale(10),
              backgroundColor: '#fafafa',
              padding: scale(12),
              marginBottom: scale(20),
              minHeight: scale(80),
            }}>
            <TextInput
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(13),
                color: COLORS.secondary,
                padding: 0,
                textAlignVertical: 'top',
              }}
              placeholder="Anything else? (delivery deadline, brand preferences, etc.)"
              placeholderTextColor={COLORS.textPlaceholder}
              multiline
              value={materialReq}
              onChangeText={setMaterialReq}
            />
          </View>

          {/* Attach PDF (e.g. BOQ / requirement list) */}
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: scale(13),
              color: COLORS.secondary,
              marginBottom: scale(8),
            }}>
            Attach PDF{' '}
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(11),
                color: COLORS.textSecondary,
              }}>
              (optional — BOQ / requirement list)
            </Text>
          </Text>

          {pdfFile ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: scale(10),
                backgroundColor: '#fafafa',
                paddingHorizontal: scale(12),
                paddingVertical: scale(10),
                marginBottom: scale(10),
              }}>
              <PdfIcon />
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  marginLeft: scale(10),
                  fontFamily: FONTS.regular,
                  fontSize: scale(13),
                  color: COLORS.secondary,
                }}>
                {pdfFile.name}
              </Text>
              <TouchableOpacity
                onPress={handlePickPdf}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                style={{marginRight: scale(12)}}>
                <Text
                  style={{
                    fontFamily: FONTS.medium,
                    fontSize: scale(12),
                    color: COLORS.primary,
                  }}>
                  Replace
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={removePdf}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <TrashIcon />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handlePickPdf}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: COLORS.primary,
                borderRadius: scale(10),
                paddingVertical: scale(14),
                marginBottom: scale(10),
                gap: scale(8),
              }}>
              <PdfIcon />
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(13),
                  color: COLORS.primary,
                }}>
                Upload PDF
              </Text>
            </TouchableOpacity>
          )}

          <View style={{height: scale(16)}} />

          <PrimaryButton
            title={submitting ? 'Submitting...' : 'Request Quotation'}
            onPress={submitting ? undefined : submitQuotation}
            style={{marginBottom: scale(24)}}
          />
        </View>

        {/* Footer features (kept) */}
        <View style={{paddingHorizontal: scale(16), paddingBottom: scale(24)}}>
          <View
            style={{
              height: 1,
              backgroundColor: COLORS.divider,
              marginBottom: scale(20),
            }}
          />
          <FeatureRow
            icon={<WholesaleIcon />}
            title="Lowest Wholesale Prices"
            subtitle="Save Big on Bulk Purchases"
          />
          <FeatureRow
            icon={<DeliveryTruckIcon />}
            title="Quick & Reliable Delivery"
            subtitle="Receive Bulk Orders On-Time"
          />
          <FeatureRow
            icon={<SupportIcon />}
            title="Dedicated Support"
            subtitle="We'll Assist You From Start to Finish"
          />
          <TouchableOpacity
            style={{
              height: scale(50),
              borderRadius: scale(25),
              backgroundColor: COLORS.whatsapp,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: scale(8),
            }}>
            <WhatsAppHelpIcon />
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(14),
                color: COLORS.textWhite,
              }}>
              Need Help? WhatsApp
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* OTP Modal (guest verify) */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOtpModal(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.backgroundOverlay,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: scale(30),
          }}>
          <View
            style={{
              width: '100%',
              backgroundColor: COLORS.backgroundWhite,
              borderRadius: scale(16),
              padding: scale(24),
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: scale(18),
                color: COLORS.secondary,
                marginBottom: scale(8),
              }}>
              OTP Verification
            </Text>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(12),
                color: COLORS.textSecondary,
                textAlign: 'center',
                lineHeight: scale(18),
                marginBottom: scale(20),
              }}>
              Please enter the 6-digit code sent to your mobile number.
            </Text>
            <View
              style={{flexDirection: 'row', gap: scale(10), marginBottom: scale(16)}}>
              {otpValues.map((val, i) => (
                <TextInput
                  key={i}
                  ref={r => {
                    otpRefs.current[i] = r;
                  }}
                  style={{
                    width: scale(44),
                    height: scale(50),
                    borderRadius: scale(10),
                    borderWidth: 1.5,
                    borderColor: i === 0 && !val ? COLORS.primary : COLORS.border,
                    textAlign: 'center',
                    fontFamily: FONTS.semiBold,
                    fontSize: scale(18),
                    color: COLORS.secondary,
                  }}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={val}
                  onChangeText={t => handleOtpChange(t, i)}
                />
              ))}
            </View>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(14),
                color: COLORS.secondary,
                marginBottom: scale(16),
              }}>
              {formatTime(otpTimer)}
            </Text>
            <PrimaryButton
              title="Verify"
              onPress={() => setShowOtpModal(false)}
              style={{
                width: '100%',
                height: scale(50),
                borderRadius: scale(25),
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Generic Picker Bottom Sheet */}
      <Modal
        visible={!!picker}
        transparent
        animationType="slide"
        onRequestClose={() => setPicker(null)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPicker(null)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'flex-end',
          }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              backgroundColor: COLORS.backgroundWhite,
              borderTopLeftRadius: scale(20),
              borderTopRightRadius: scale(20),
              maxHeight: '70%',
              paddingBottom: scale(20),
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: scale(16),
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
              }}>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: scale(15),
                  color: COLORS.secondary,
                }}>
                {pickerTitle}
              </Text>
              <TouchableOpacity onPress={() => setPicker(null)}>
                <Text
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: scale(13),
                    color: COLORS.primary,
                  }}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {pickerOptions.length === 0 ? (
                <Text
                  style={{
                    padding: scale(20),
                    fontFamily: FONTS.regular,
                    fontSize: scale(13),
                    color: COLORS.textSecondary,
                    textAlign: 'center',
                  }}>
                  Nothing available.
                </Text>
              ) : (
                pickerOptions.map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={opt.onPress}
                    style={{
                      paddingHorizontal: scale(16),
                      paddingVertical: scale(14),
                      borderBottomWidth: 1,
                      borderBottomColor: COLORS.divider,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                    <Text
                      style={{
                        fontFamily: opt.selected ? FONTS.semiBold : FONTS.regular,
                        fontSize: scale(14),
                        color: opt.selected ? COLORS.primary : COLORS.secondary,
                      }}>
                      {opt.label}
                    </Text>
                    {opt.selected && (
                      <Text
                        style={{
                          fontFamily: FONTS.semiBold,
                          fontSize: scale(12),
                          color: COLORS.primary,
                        }}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ----------- Sub components & styles -----------

const inputStyle = {
  fontFamily: FONTS.regular,
  fontSize: scale(14),
  color: COLORS.secondary,
  padding: 0,
  flex: 1,
};

const FieldRow: React.FC<{
  children: React.ReactNode;
  below?: string;
}> = ({children, below}) => (
  <>
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: scale(10),
        marginBottom: below ? scale(2) : scale(14),
        minHeight: scale(36),
        justifyContent: 'center',
      }}>
      {children}
    </View>
    {below ? (
      <Text
        style={{
          fontFamily: FONTS.regular,
          fontSize: scale(10),
          color: COLORS.textSecondary,
          marginBottom: scale(14),
        }}>
        {below}
      </Text>
    ) : null}
  </>
);

const FeatureRow: React.FC<{icon: React.ReactNode; title: string; subtitle: string}> = ({icon, title, subtitle}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: scale(20),
    }}>
    {icon}
    <View style={{marginLeft: scale(12)}}>
      <Text
        style={{
          fontFamily: FONTS.semiBold,
          fontSize: scale(14),
          color: COLORS.secondary,
        }}>
        {title}
      </Text>
      <Text
        style={{
          fontFamily: FONTS.regular,
          fontSize: scale(12),
          color: COLORS.textSecondary,
        }}>
        {subtitle}
      </Text>
    </View>
  </View>
);

interface ItemCardProps {
  item: QuoteItemDraft;
  index: number;
  onRemove?: () => void;
  onPick: (kind: PickerKind) => void;
  onClearSubCategory: () => void;
  onChangeQuantity: (v: string) => void;
  onChangeUnit: (v: string) => void;
  onChangeNote: (v: string) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  index,
  onRemove,
  onPick,
  onClearSubCategory,
  onChangeQuantity,
  onChangeUnit,
  onChangeNote,
}) => {
  return (
    <View
      style={{
        backgroundColor: COLORS.backgroundWhite,
        borderRadius: scale(12),
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: scale(14),
        marginBottom: scale(12),
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: scale(10),
        }}>
        <Text
          style={{
            fontFamily: FONTS.semiBold,
            fontSize: scale(13),
            color: COLORS.secondary,
          }}>
          Material #{index + 1}
        </Text>
        {onRemove && (
          <TouchableOpacity
            onPress={onRemove}
            style={{padding: scale(4)}}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <TrashIcon />
          </TouchableOpacity>
        )}
      </View>

      {/* Category */}
      <DropdownRow
        label="Category"
        value={item.categoryName}
        placeholder="Select Category"
        onPress={() => onPick('category')}
      />

      {/* Subcategory — optional. Only shown when the category has subcategories. */}
      {item.categoryId && item.hasSubCategories ? (
        <View style={{marginBottom: scale(10)}}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: scale(4),
            }}>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(11),
                color: COLORS.textSecondary,
              }}>
              Sub-Category{' '}
              <Text style={{color: COLORS.textLight}}>(optional)</Text>
            </Text>
            {item.subCategoryId ? (
              <TouchableOpacity
                onPress={onClearSubCategory}
                hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                <Text
                  style={{
                    fontFamily: FONTS.medium,
                    fontSize: scale(11),
                    color: COLORS.primary,
                  }}>
                  Clear
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => onPick('subCategory')}
            style={{
              height: scale(42),
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: scale(8),
              paddingHorizontal: scale(10),
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(13),
                color: item.subCategoryName
                  ? COLORS.secondary
                  : COLORS.textPlaceholder,
              }}
              numberOfLines={1}>
              {item.subCategoryName ||
                'Pick a sub-category to narrow the list'}
            </Text>
            <ChevronDownIcon />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Material — appears as soon as a category is chosen.
          A sub-category is optional; selecting one just filters the list. */}
      {item.categoryId ? (
        item.materialsLoaded ? (
          item.materials.length > 0 ? (
            <DropdownRow
              label={
                item.subCategoryId
                  ? `Material (in ${item.subCategoryName})`
                  : 'Material'
              }
              value={item.materialName}
              placeholder="Select Material"
              onPress={() => onPick('material')}
            />
          ) : (
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(12),
                color: COLORS.textSecondary,
                marginBottom: scale(10),
              }}>
              No materials listed yet — describe your need in the quantity /
              notes field below.
            </Text>
          )
        ) : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: scale(10),
            }}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text
              style={{
                marginLeft: scale(8),
                fontFamily: FONTS.regular,
                fontSize: scale(12),
                color: COLORS.textSecondary,
              }}>
              Loading materials...
            </Text>
          </View>
        )
      ) : null}

      {/* Quantity + Unit */}
      <View style={{flexDirection: 'row', gap: scale(8)}}>
        <View style={{flex: 1}}>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: scale(11),
              color: COLORS.textSecondary,
              marginBottom: scale(4),
            }}>
            Quantity
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: scale(8),
              paddingHorizontal: scale(10),
              height: scale(42),
            }}>
            <TextInput
              style={{
                flex: 1,
                fontFamily: FONTS.regular,
                fontSize: scale(14),
                color: COLORS.secondary,
                padding: 0,
              }}
              keyboardType="numeric"
              placeholder="e.g. 500"
              placeholderTextColor={COLORS.textPlaceholder}
              value={item.quantity}
              onChangeText={(v) => onChangeQuantity(v.replace(/[^0-9.]/g, ''))}
            />
            <TouchableOpacity
              onPress={() => onPick('quantity')}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 4}}>
              <ChevronDownIcon />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{width: scale(110)}}>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: scale(11),
              color: COLORS.textSecondary,
              marginBottom: scale(4),
            }}>
            Unit
          </Text>
          <TouchableOpacity
            onPress={() => onPick('unit')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: scale(8),
              paddingHorizontal: scale(10),
              height: scale(42),
              backgroundColor: COLORS.backgroundLight,
            }}>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: scale(13),
                color: item.unit ? COLORS.secondary : COLORS.textPlaceholder,
              }}>
              {item.unit || 'Unit'}
            </Text>
            <ChevronDownIcon />
          </TouchableOpacity>
        </View>
      </View>

      {/* Optional per-item note */}
      <View
        style={{
          marginTop: scale(10),
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: scale(8),
          padding: scale(8),
          minHeight: scale(50),
        }}>
        <TextInput
          style={{
            fontFamily: FONTS.regular,
            fontSize: scale(12),
            color: COLORS.secondary,
            padding: 0,
            textAlignVertical: 'top',
          }}
          placeholder="Notes for this material (brand, grade, etc.)"
          placeholderTextColor={COLORS.textPlaceholder}
          multiline
          value={item.note}
          onChangeText={onChangeNote}
        />
      </View>
    </View>
  );
};

const DropdownRow: React.FC<{
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
}> = ({label, value, placeholder, onPress}) => (
  <View style={{marginBottom: scale(10)}}>
    <Text
      style={{
        fontFamily: FONTS.regular,
        fontSize: scale(11),
        color: COLORS.textSecondary,
        marginBottom: scale(4),
      }}>
      {label}
    </Text>
    <TouchableOpacity
      onPress={onPress}
      style={{
        height: scale(42),
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: scale(8),
        paddingHorizontal: scale(10),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      <Text
        style={{
          fontFamily: FONTS.regular,
          fontSize: scale(13),
          color: value ? COLORS.secondary : COLORS.textPlaceholder,
        }}
        numberOfLines={1}>
        {value || placeholder}
      </Text>
      <ChevronDownIcon />
    </TouchableOpacity>
  </View>
);

export default GetQuotationScreen;
