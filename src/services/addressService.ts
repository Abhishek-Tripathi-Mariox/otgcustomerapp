import api from './api';

export interface ApiAddress {
  _id: string;
  label?: string;
  line: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}

export interface AddressPayload {
  label?: string;
  line: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}

type AddressListResponse = {success: boolean; data: ApiAddress[]};

const addressService = {
  list: () => api.get<AddressListResponse>('/mobile/auth/addresses'),

  create: (payload: AddressPayload) =>
    api.post<AddressListResponse>('/mobile/auth/addresses', payload),

  update: (addrId: string, payload: AddressPayload) =>
    api.put<AddressListResponse>(`/mobile/auth/addresses/${addrId}`, payload),

  remove: (addrId: string) =>
    api.delete<AddressListResponse>(`/mobile/auth/addresses/${addrId}`),
};

export default addressService;
