import {configureStore, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserData {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  profileImage?: string;
  address?: any;
  status: string;
  isVerified: boolean;
  isNewUser: boolean;
}

export interface SavedAddress {
  id: string;
  label: string; // Home / Office / Site / Others
  isPrimary: boolean;
  street: string;
  houseNo?: string;
  city: string;
  state?: string;
  pincode?: string;
  phone?: string;
  latitude: number | null;
  longitude: number | null;
}

export interface CurrentLocation {
  latitude: number;
  longitude: number;
  label: string; // human readable short label
  fullAddress?: string;
}

export interface CartItem {
  id: string;
  name: string;
  brand?: string;
  size?: string;
  unit?: string;
  quantity: number;
  price: number;
  mrp?: number;
  gst?: number;
  image?: any;
  category?: string;
  subCategory?: string;
}

/**
 * Build a CartItem from a Material returned by catalogService.
 * Kept here (and not in catalogService) to avoid a circular import — store
 * already owns the CartItem shape.
 */
export const cartItemFromMaterial = (
  material: any,
  quantity = 1,
): CartItem => ({
  id: material._id,
  name: material.name,
  brand: material.brand,
  size: material.diameter,
  unit: material.unit,
  price: material.finalSellingPrice ?? material.sellingPrice ?? 0,
  mrp: material.mrp,
  gst: material.gst,
  quantity: Math.max(material.minOrderQty || 1, quantity),
  image: material.images?.[0] ? {uri: material.images[0]} : undefined,
  category: material.category?.name,
  subCategory: material.subCategory?.name,
});

interface AppState {
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  user: UserData | null;
  savedAddresses: SavedAddress[];
  selectedAddressId: string | null;
  currentLocation: CurrentLocation | null;
}

export interface AppliedOffer {
  code: string;
  title: string;
  discountAmount: number;
  freeDelivery: boolean;
}

interface CartState {
  items: CartItem[];
  appliedOffer: AppliedOffer | null;
}

const initialState: AppState = {
  isLoading: true,
  isAuthenticated: false,
  token: null,
  user: null,
  savedAddresses: [],
  selectedAddressId: null,
  currentLocation: null,
};

const SAVED_ADDRESSES_KEY = 'savedAddresses';
const SELECTED_ADDRESS_KEY = 'selectedAddressId';
const SELLER_REQUEST_LOCAL_KEY = 'sellerRequestStatus';
const CART_ITEMS_KEY = 'cartItems';

const persistCart = (items: CartItem[]) => {
  AsyncStorage.setItem(CART_ITEMS_KEY, JSON.stringify(items)).catch(() => {});
};

const persistAddresses = (addresses: SavedAddress[]) => {
  AsyncStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(addresses)).catch(() => {});
};

const persistSelection = (id: string | null) => {
  if (id) {
    AsyncStorage.setItem(SELECTED_ADDRESS_KEY, id).catch(() => {});
  } else {
    AsyncStorage.removeItem(SELECTED_ADDRESS_KEY).catch(() => {});
  }
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    loginSuccess: (
      state,
      action: PayloadAction<{token: string; user: UserData}>,
    ) => {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    updateUser: (state, action: PayloadAction<Partial<UserData>>) => {
      if (state.user) {
        state.user = {...state.user, ...action.payload};
      }
    },
    logoutSuccess: state => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.savedAddresses = [];
      state.selectedAddressId = null;
      persistAddresses([]);
      persistSelection(null);
      AsyncStorage.removeItem(SELLER_REQUEST_LOCAL_KEY).catch(() => {});
    },
    hydrateAddresses: (
      state,
      action: PayloadAction<{addresses: SavedAddress[]; selectedId: string | null}>,
    ) => {
      state.savedAddresses = action.payload.addresses;
      state.selectedAddressId = action.payload.selectedId;
    },
    addAddress: (state, action: PayloadAction<SavedAddress>) => {
      const isFirst = state.savedAddresses.length === 0;
      const incoming = {...action.payload, isPrimary: isFirst || action.payload.isPrimary};
      if (incoming.isPrimary) {
        state.savedAddresses.forEach(a => (a.isPrimary = false));
      }
      state.savedAddresses.push(incoming);
      if (isFirst) state.selectedAddressId = incoming.id;
      persistAddresses(state.savedAddresses);
      persistSelection(state.selectedAddressId);
    },
    updateAddress: (state, action: PayloadAction<SavedAddress>) => {
      const idx = state.savedAddresses.findIndex(a => a.id === action.payload.id);
      if (idx >= 0) {
        if (action.payload.isPrimary) {
          state.savedAddresses.forEach(a => (a.isPrimary = false));
        }
        state.savedAddresses[idx] = action.payload;
        persistAddresses(state.savedAddresses);
      }
    },
    deleteAddress: (state, action: PayloadAction<string>) => {
      state.savedAddresses = state.savedAddresses.filter(a => a.id !== action.payload);
      if (state.selectedAddressId === action.payload) {
        state.selectedAddressId = state.savedAddresses[0]?.id || null;
      }
      persistAddresses(state.savedAddresses);
      persistSelection(state.selectedAddressId);
    },
    selectAddress: (state, action: PayloadAction<string>) => {
      state.selectedAddressId = action.payload;
      persistSelection(state.selectedAddressId);
    },
    setPrimaryAddress: (state, action: PayloadAction<string>) => {
      state.savedAddresses.forEach(a => {
        a.isPrimary = a.id === action.payload;
      });
      persistAddresses(state.savedAddresses);
    },
    setCurrentLocation: (state, action: PayloadAction<CurrentLocation | null>) => {
      state.currentLocation = action.payload;
    },
    /**
     * Merge `user.address` (the single address stored on the User document)
     * into the local savedAddresses list. Creates an entry if one matching the
     * server address doesn't already exist, and selects it if nothing else is
     * selected. Keeps the two stores in sync after every profile fetch.
     */
    syncUserAddressToSavedAddresses: (
      state,
      action: PayloadAction<{
        street?: string;
        city?: string;
        state?: string;
        pincode?: string;
        location?: {coordinates?: [number, number]};
      } | undefined>,
    ) => {
      const addr = action.payload;
      if (!addr) return;

      const street = (addr.street || '').trim();
      const city = (addr.city || '').trim();
      const pincode = (addr.pincode || '').trim();
      if (!street && !city && !pincode) return;

      const coords = addr.location?.coordinates;
      const longitude = Array.isArray(coords) ? coords[0] ?? null : null;
      const latitude = Array.isArray(coords) ? coords[1] ?? null : null;

      const isSameAddress = (a: SavedAddress) =>
        (a.street || '').trim() === street &&
        (a.city || '').trim() === city &&
        (a.pincode || '').trim() === pincode;

      const existing = state.savedAddresses.find(isSameAddress);

      if (existing) {
        // Refresh coords if backend now has them
        if (latitude !== null) existing.latitude = latitude;
        if (longitude !== null) existing.longitude = longitude;
        if (!state.selectedAddressId) {
          state.selectedAddressId = existing.id;
          persistSelection(existing.id);
        }
        persistAddresses(state.savedAddresses);
        return;
      }

      const newAddress: SavedAddress = {
        id: `profile-${Date.now()}`,
        label: 'Home',
        isPrimary: state.savedAddresses.length === 0,
        street,
        city,
        state: addr.state || '',
        pincode,
        latitude,
        longitude,
      };
      state.savedAddresses.push(newAddress);
      if (!state.selectedAddressId) {
        state.selectedAddressId = newAddress.id;
        persistSelection(newAddress.id);
      }
      persistAddresses(state.savedAddresses);
    },
  },
});

export const {
  setLoading,
  setAuthenticated,
  loginSuccess,
  updateUser,
  logoutSuccess,
  hydrateAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  selectAddress,
  setPrimaryAddress,
  setCurrentLocation,
  syncUserAddressToSavedAddresses,
} = appSlice.actions;

const initialCartState: CartState = {
  items: [],
  appliedOffer: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: initialCartState,
  reducers: {
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
    },
    addCartItem: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      persistCart(state.items);
    },
    updateCartItemQuantity: (
      state,
      action: PayloadAction<{id: string; quantity: number}>,
    ) => {
      const item = state.items.find(i => i.id === action.payload.id);
      if (item) {
        item.quantity = Math.max(1, action.payload.quantity);
      }
      persistCart(state.items);
    },
    incrementCartItem: (state, action: PayloadAction<string>) => {
      const item = state.items.find(i => i.id === action.payload);
      if (item) item.quantity += 1;
      persistCart(state.items);
    },
    decrementCartItem: (state, action: PayloadAction<string>) => {
      const item = state.items.find(i => i.id === action.payload);
      if (item) item.quantity = Math.max(1, item.quantity - 1);
      persistCart(state.items);
    },
    removeCartItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(i => i.id !== action.payload);
      persistCart(state.items);
    },
    clearCart: state => {
      state.items = [];
      state.appliedOffer = null;
      persistCart(state.items);
    },
    applyOffer: (state, action: PayloadAction<AppliedOffer>) => {
      state.appliedOffer = action.payload;
    },
    clearAppliedOffer: state => {
      state.appliedOffer = null;
    },
  },
});

export const {
  setCartItems,
  addCartItem,
  updateCartItemQuantity,
  incrementCartItem,
  decrementCartItem,
  removeCartItem,
  clearCart,
  applyOffer,
  clearAppliedOffer,
} = cartSlice.actions;

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
    cart: cartSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartCount = (state: RootState) => state.cart.items.length;
export const selectCartTotalQuantity = (state: RootState) =>
  state.cart.items.reduce((sum, i) => sum + i.quantity, 0);
export const selectAppliedOffer = (state: RootState) =>
  state.cart.appliedOffer;

export const loadPersistedAddresses = async () => {
  try {
    const [raw, selectedId] = await Promise.all([
      AsyncStorage.getItem(SAVED_ADDRESSES_KEY),
      AsyncStorage.getItem(SELECTED_ADDRESS_KEY),
    ]);
    const addresses: SavedAddress[] = raw ? JSON.parse(raw) : [];
    store.dispatch(hydrateAddresses({addresses, selectedId: selectedId || null}));
  } catch {
    // ignore corrupt state
  }
};

export const loadPersistedCart = async () => {
  try {
    const raw = await AsyncStorage.getItem(CART_ITEMS_KEY);
    const items: CartItem[] = raw ? JSON.parse(raw) : [];
    if (Array.isArray(items) && items.length > 0) {
      store.dispatch(setCartItems(items));
    }
  } catch {
    // ignore corrupt state
  }
};
