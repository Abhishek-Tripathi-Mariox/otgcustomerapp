import api from './api';

export interface OrderMaterial {
  _id: string;
  name: string;
  images?: string[];
  unit?: string;
  description?: string;
}

export interface Order {
  _id: string;
  bookingId: string;
  user: string;
  vendor?: {_id: string; name?: string; mobile?: string} | null;
  material: OrderMaterial | string;
  quantity: number;
  unit: string;
  price: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'completed';
  paymentMethod?: string;
  site?: string;
  notes?: string;
  gstAmount?: number;
  discountAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutItem {
  materialId: string;
  quantity: number;
}

// Mirrors CheckoutDetailsScreen's `BuyerDetails` — kept as a separate,
// structurally-compatible type here (not imported from the screen) so
// services don't depend on screens.
export interface CheckoutBuyerDetails {
  accountType: 'individual' | 'company';
  name: string;
  mobile: string;
  email?: string;
  deliveryAddress: string;
  landmark?: string;
  city: string;
  pincode: string;
  siteContactNumber?: string;
  designation?: string;
  employeeId?: string;
  companyName?: string;
  gstin?: string;
  pan?: string;
  billingAddress?: string;
  registeredOfficeAddress?: string;
  companyType?: string;
  projectName?: string;
  siteAddress?: string;
  siteContactPerson?: string;
}

export interface OrderTrackingStep {
  key: string;
  label: string;
  done: boolean;
  at?: string | null;
}

export interface OrderTracking {
  bookingId: string;
  status: Order['status'];
  cancelled: boolean;
  steps: OrderTrackingStep[];
  driver: {name?: string; vehicleNumber?: string} | null;
  deliveryDate?: string | null;
  dropAddress?: string | null;
}

const orderService = {
  list: (status?: 'ongoing' | 'past' | 'all') =>
    api.get<{success: boolean; data: Order[]}>('/mobile/orders', {
      params: status && status !== 'all' ? {status} : undefined,
    }),

  get: (id: string) =>
    api.get<{success: boolean; data: Order}>(`/mobile/orders/${id}`),

  getTracking: (id: string) =>
    api.get<{success: boolean; data: OrderTracking}>(
      `/mobile/orders/${id}/tracking`,
    ),

  checkout: (payload: {
    items: CheckoutItem[];
    paymentMethod?: string;
    site?: string;
    pincode?: string;
    notes?: string;
    couponCode?: string;
    buyerDetails?: CheckoutBuyerDetails;
  }) =>
    api.post<{
      success: boolean;
      message: string;
      data: Order[];
      discountApplied?: number;
    }>('/mobile/orders', payload),

  cancel: (id: string, reason?: string) =>
    api.post<{success: boolean; message: string; data: Order}>(
      `/mobile/orders/${id}/cancel`,
      {reason},
    ),
};

export default orderService;
