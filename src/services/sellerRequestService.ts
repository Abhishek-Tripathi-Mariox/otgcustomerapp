import api from './api';

export interface SellerRequestPayload {
  name: string;
  mobile: string;
  email?: string;
  business: {
    name: string;
    gstNumber?: string;
    panNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  message?: string;
}

export interface SellerRequest {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  business: SellerRequestPayload['business'];
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

const sellerRequestService = {
  submit: (payload: SellerRequestPayload) =>
    api.post<{success: boolean; message: string; data: SellerRequest}>(
      '/seller-requests',
      payload,
    ),

  getMine: () =>
    api.get<{success: boolean; data: SellerRequest | null}>(
      '/seller-requests/me',
    ),
};

export default sellerRequestService;
