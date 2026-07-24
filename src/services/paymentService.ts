import api from './api';
import {CheckoutItem, Order} from './orderService';

export interface RazorpayOrderPayload {
  items: CheckoutItem[];
  site?: string;
  pincode?: string;
  notes?: string;
  couponCode?: string;
  paymentMethod?: string;
}

export interface RazorpayOrderResponse {
  configured: boolean;
  razorpayOrderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
}

export interface RazorpayVerifyPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

const paymentService = {
  createRazorpayOrder: (payload: RazorpayOrderPayload) =>
    api.post<{success: boolean; data: RazorpayOrderResponse}>(
      '/mobile/payments/razorpay-order',
      payload,
    ),

  verifyRazorpayPayment: (payload: RazorpayVerifyPayload) =>
    api.post<{success: boolean; message: string; data: Order[]}>(
      '/mobile/payments/verify',
      payload,
    ),
};

export default paymentService;
