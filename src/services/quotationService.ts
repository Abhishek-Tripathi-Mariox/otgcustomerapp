import api from './api';

export interface QuotationItem {
  categoryId?: string;
  categoryName?: string;
  subCategoryId?: string;
  subCategoryName?: string;
  materialId?: string;
  materialName?: string;
  quantity?: string;
  unit?: string;
  note?: string;
}

// A PDF the customer attaches to the request (e.g. a BOQ / requirement list).
export interface QuotationPdfFile {
  uri: string;
  name: string;
  type?: string;
}

export interface QuotationPayload {
  customerType?: 'contractor' | 'individual';
  name: string;
  mobile: string;
  email?: string;
  company?: string;
  address?: string;
  landmark?: string;
  items?: QuotationItem[];
  // Legacy single-item fields (kept for fallback)
  category?: string;
  quantity?: string;
  unit?: string;
  materialRequirement?: string;
  // Optional uploaded PDF document
  pdf?: QuotationPdfFile | null;
}

export interface Quotation {
  _id: string;
  quotationCode: string;
  customerType: 'contractor' | 'individual';
  name: string;
  mobile: string;
  email?: string;
  company?: string;
  address?: string;
  landmark?: string;
  items?: QuotationItem[];
  // Legacy
  category?: string;
  quantity?: string;
  unit?: string;
  materialRequirement?: string;
  quotationPdf?: {url: string; name?: string; uploadedAt?: string} | null;
  status: 'new' | 'quoted' | 'accepted' | 'rejected' | 'expired';
  quotedPrice?: number;
  quotedCurrency?: string;
  quotedValidTill?: string;
  adminNotes?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const quotationService = {
  submit: (payload: QuotationPayload) => {
    const {pdf, ...rest} = payload;

    // No PDF: send as plain JSON (existing behaviour).
    if (!pdf?.uri) {
      return api.post<{success: boolean; message: string; data: Quotation}>(
        '/quotations',
        rest,
      );
    }

    // PDF attached: send everything as multipart/form-data so the backend's
    // "pdf" upload field receives the document.
    const form = new FormData();
    if (rest.customerType) form.append('customerType', rest.customerType);
    form.append('name', rest.name);
    form.append('mobile', rest.mobile);
    if (rest.email) form.append('email', rest.email);
    if (rest.company) form.append('company', rest.company);
    if (rest.address) form.append('address', rest.address);
    if (rest.landmark) form.append('landmark', rest.landmark);
    if (rest.materialRequirement)
      form.append('materialRequirement', rest.materialRequirement);
    // Complex fields go as JSON strings; the backend parses them back.
    if (rest.items && rest.items.length > 0) {
      form.append('items', JSON.stringify(rest.items));
    }
    form.append('pdf', {
      uri: pdf.uri,
      name: pdf.name || 'requirement.pdf',
      type: pdf.type || 'application/pdf',
    } as any);

    return api.post<{success: boolean; message: string; data: Quotation}>(
      '/quotations',
      form,
      {headers: {'Content-Type': 'multipart/form-data'}},
    );
  },

  listMine: () =>
    api.get<{success: boolean; data: Quotation[]}>('/quotations/me'),

  getMine: (id: string) =>
    api.get<{success: boolean; data: Quotation}>(`/quotations/me/${id}`),

  // Customer accepts or rejects a quote the admin sent back.
  setStatus: (id: string, status: 'accepted' | 'rejected') =>
    api.patch<{success: boolean; message: string; data: Quotation}>(
      `/quotations/me/${id}/status`,
      {status},
    ),
};

export default quotationService;
