import {PermissionsAndroid, Platform} from 'react-native';
import axios from 'axios';

let Geolocation: any = null;
try {
  Geolocation = require('react-native-geolocation-service').default;
} catch {}

export interface ReverseGeocodeResult {
  street: string;
  houseNo?: string;
  city: string;
  state: string;
  pincode: string;
  shortLabel: string;
  fullAddress: string;
}

export interface LocationResult {
  latitude: number;
  longitude: number;
  geocode?: ReverseGeocodeResult;
}

const requestPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

// Single getCurrentPosition attempt with the given options.
const tryGetPosition = (
  options: any,
): Promise<{latitude: number; longitude: number}> =>
  new Promise((resolve, reject) => {
    if (!Geolocation) {
      reject(new Error('Location service not available. Please rebuild the app.'));
      return;
    }
    Geolocation.getCurrentPosition(
      (position: any) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error: any) => reject(new Error(error?.message || 'Could not get location')),
      options,
    );
  });

// High-accuracy GPS frequently never returns a fix (indoors, emulators, or
// devices without a recent GPS lock), leaving the UI stuck on
// "Fetching location...". Try high accuracy first, then fall back to a
// network/last-known fix so auto-detection still resolves.
const getCurrentPosition = async (): Promise<{
  latitude: number;
  longitude: number;
}> => {
  try {
    return await tryGetPosition({
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 10000,
      forceRequestLocation: true,
      showLocationDialog: true,
    });
  } catch (highAccErr: any) {
    // The native module being missing is fatal — don't retry.
    if (/not available/i.test(highAccErr?.message || '')) {
      throw highAccErr;
    }
    // Fall back to coarse/network location with a longer timeout and a
    // generous cache window so we still get *a* position.
    return tryGetPosition({
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 60000,
      forceRequestLocation: true,
      forceLocationManager: true,
      showLocationDialog: true,
    });
  }
};

export const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult | undefined> => {
  try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      {headers: {'User-Agent': 'OTGCustomerApp/1.0'}},
    );
    const addr = res.data?.address;
    if (!addr) return undefined;
    const street = [addr.road, addr.neighbourhood, addr.suburb].filter(Boolean).join(', ');
    const city = addr.city || addr.town || addr.village || addr.county || '';
    const state = addr.state || '';
    const pincode = addr.postcode || '';
    const shortLabel = [addr.suburb || addr.neighbourhood || addr.road, city]
      .filter(Boolean)
      .join(', ');
    return {
      street,
      city,
      state,
      pincode,
      shortLabel: shortLabel || res.data?.display_name?.split(',').slice(0, 2).join(',') || '',
      fullAddress: res.data?.display_name || '',
    };
  } catch {
    return undefined;
  }
};

export const fetchCurrentLocation = async (): Promise<LocationResult> => {
  const ok = await requestPermission();
  if (!ok) throw new Error('Location permission denied');
  const {latitude, longitude} = await getCurrentPosition();
  const geocode = await reverseGeocode(latitude, longitude);
  return {latitude, longitude, geocode};
};

export default {fetchCurrentLocation, reverseGeocode};
