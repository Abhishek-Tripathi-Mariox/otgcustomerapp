import api from './api';
import {Material} from './catalogService';

export interface MaterialVendorOption {
  vendorId: string;
  /**
   * Vendor CODE (e.g. "VND-00013") — the only vendor identity the customer
   * side is given. The supplier's trading name is deliberately not returned
   * by the API, so a buyer cannot go around OTG to the supplier directly.
   */
  vendorCode: string;
  /** OTG → Customer price for this vendor. Never the vendor's cost rate. */
  price: number | null;
  minOrderQty: number;
  maxOrderQty: number | null;
  distanceKm: number | null;
  /** True when this vendor's own business pincode is the delivery pincode. */
  samePincode?: boolean;
  deliveryEstimate: string | null;
  /** Numeric companion to deliveryEstimate, so results can be sorted. */
  deliveryEtaHours?: number | null;
}

/** Ordering the customer can ask for on the comparison screen. */
export type VendorSort =
  | 'recommended'
  | 'price_asc'
  | 'price_desc'
  | 'delivery'
  | 'distance';

export interface VendorStorefront {
  vendor: {
    _id: string;
    /** Vendor code, never the trading name. */
    code: string;
    city: string | null;
    pincode: string | null;
  };
  materials: Array<Material & {vendorPrice?: number | null}>;
  total: number;
}

const vendorSearchService = {
  // Region/pincode vendor comparison (F28-34) — every approved vendor
  // stocking this material for the given pincode.
  compareVendorsForMaterial: (
    materialId: string,
    pincode: string,
    opts?: {
      sort?: VendorSort;
      maxPrice?: number;
      maxDeliveryHours?: number;
    },
  ) =>
    api.get<{success: boolean; data: MaterialVendorOption[]}>(
      `/mobile/catalog/materials/${materialId}/vendors`,
      {
        params: {
          pincode,
          sort: opts?.sort,
          maxPrice: opts?.maxPrice,
          maxDeliveryHours: opts?.maxDeliveryHours,
        },
      },
    ),

  // One vendor's public catalogue — browse a supplier directly.
  getVendorStorefront: (vendorId: string) =>
    api.get<{success: boolean; data: VendorStorefront}>(
      `/mobile/catalog/vendors/${vendorId}`,
    ),
};

export default vendorSearchService;
