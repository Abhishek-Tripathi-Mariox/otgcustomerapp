import api from './api';

export interface Offer {
  _id: string;
  code: string;
  title: string;
  description?: string;
  scope: 'all' | 'category' | 'subCategory' | 'material' | 'user';
  discountType: 'percentage' | 'flat' | 'free_delivery' | 'bogo';
  discountValue: number;
  maxDiscount?: number | null;
  buyX?: number | null;
  getY?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  minOrderAmount?: number | null;
  autoApply?: boolean;
  status: 'active' | 'inactive';
}

export interface ValidateOfferResult {
  valid: boolean;
  reason?: string;
  discountAmount: number;
  freeDelivery?: boolean;
  eligibleSubtotal?: number;
  offer?: {
    _id: string;
    code: string;
    title: string;
    description?: string;
    discountType: Offer['discountType'];
    discountValue: number;
  };
}

const offerService = {
  list: () => api.get<{success: boolean; data: Offer[]}>('/mobile/offers'),
  validate: (
    code: string,
    items: {materialId: string; quantity: number}[],
  ) =>
    api.post<{success: boolean; data: ValidateOfferResult}>(
      '/mobile/offers/validate',
      {code, items},
    ),
};

export default offerService;
