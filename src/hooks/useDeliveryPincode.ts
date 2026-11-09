import {useAppSelector} from '../store';

/**
 * The pincode the customer is currently shopping for.
 *
 * Resolution order, most explicit first:
 *   1. the site they selected
 *   2. their primary site
 *   3. any saved site
 *   4. the last pincode they searched on the vendor comparison screen
 *   5. the pincode on their profile address
 *   6. the pincode from the details they last checked out with
 *
 * Steps 4 and 5 matter more than they look: supplier-aware listings ("from
 * ₹X · 2 suppliers", one row per vendor) are only requested when a pincode
 * is known, so a customer who has not saved a site used to get plain
 * catalogue rows with no suppliers at all — the feature looked broken when
 * it was simply never asked for.
 *
 * Still returns `undefined` when nothing is known; callers must fall back to
 * plain catalogue behaviour rather than guessing a region.
 */
export const useDeliveryPincode = (): string | undefined => {
  const addresses = useAppSelector(state => state.app.savedAddresses);
  const selectedId = useAppSelector(state => state.app.selectedAddressId);
  const lastSearched = useAppSelector(state => state.app.lastDeliveryPincode);
  const profilePincode = useAppSelector(
    state => state.app.user?.address?.pincode,
  );
  const checkoutPincode = useAppSelector(
    state => state.app.user?.checkoutProfile?.pincode,
  );

  const selected = selectedId
    ? addresses.find(a => a.id === selectedId)
    : undefined;
  const chosen = selected || addresses.find(a => a.isPrimary) || addresses[0];

  const candidates = [
    chosen?.pincode,
    lastSearched,
    profilePincode,
    checkoutPincode,
  ];
  for (const candidate of candidates) {
    const pin = candidate?.trim();
    if (pin && /^\d{6}$/.test(pin)) return pin;
  }
  return undefined;
};

export default useDeliveryPincode;
