import {useAppSelector} from '../store';

/**
 * The pincode the customer is currently shopping for.
 *
 * Prefers the site they explicitly selected, then their primary site, then
 * any saved site. Returns `undefined` when none is known — callers must
 * treat that as "no delivery area chosen" and fall back to plain catalogue
 * behaviour rather than guessing a region.
 *
 * Used to ask the catalogue for a supplier summary ("from ₹X · N suppliers")
 * per listing, which only makes sense relative to a delivery area.
 */
export const useDeliveryPincode = (): string | undefined => {
  const addresses = useAppSelector(state => state.app.savedAddresses);
  const selectedId = useAppSelector(state => state.app.selectedAddressId);

  const selected = selectedId
    ? addresses.find(a => a.id === selectedId)
    : undefined;
  const chosen =
    selected || addresses.find(a => a.isPrimary) || addresses[0];

  const pin = chosen?.pincode?.trim();
  return pin && /^\d{6}$/.test(pin) ? pin : undefined;
};

export default useDeliveryPincode;
