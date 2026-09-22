import api from './api';

export interface MaterialVendorOption {
  vendorId: string;
  vendorName: string;
  price: number | null;
  minOrderQty: number;
  maxOrderQty: number | null;
  distanceKm: number | null;
  deliveryEstimate: string | null;
}

const vendorSearchService = {
  // Region/pincode vendor comparison (F28-34) — every approved vendor
  // stocking this material for the given pincode, nearest-first.
  compareVendorsForMaterial: (materialId: string, pincode: string) =>
    api.get<{success: boolean; data: MaterialVendorOption[]}>(
      `/mobile/catalog/materials/${materialId}/vendors`,
      {params: {pincode}},
    ),
};

export default vendorSearchService;
