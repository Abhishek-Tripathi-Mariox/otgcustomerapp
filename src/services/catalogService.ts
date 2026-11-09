import api from './api';

export interface Category {
  _id: string;
  name: string;
  image: string;
}

export interface Brand {
  _id: string;
  name: string;
  image: string;
}

export interface Material {
  _id: string;
  name: string;
  images: string[];
  brand?: string;
  category: {_id: string; name: string};
  subCategory?: {_id: string; name: string} | null;
  unit: string;
  minOrderQty: number;
  basicPrice?: number;
  mrp: number;
  sellingPrice: number;
  finalSellingPrice: number;
  gst: number;
  requestQuote: boolean;
  description?: string;
  specs?: string;
  diameter?: string;
  // Present only when the list was requested with `expandVendors` — the row
  // then represents ONE VENDOR'S OFFER for this material rather than the
  // product in the abstract, and `finalSellingPrice` is that vendor's price.
  // `null` means nobody stocks it in the requested area.
  vendor?: {
    id: string;
    /** Vendor code — the API never sends the supplier's trading name. */
    code: string | null;
    distanceKm: number | null;
    samePincode: boolean;
    deliveryEstimate: string | null;
    deliveryEtaHours: number | null;
  } | null;
  // Unique per (material, vendor) — `_id` repeats across offer rows.
  offerKey?: string;
  supplierCount?: number;
  // Present only when the material list was requested with a `pincode`.
  // Summarises who can actually supply this item to that area.
  supplierSummary?: {
    count: number;
    fromPrice: number | null;
    bestEtaHours: number | null;
    bestEtaLabel: string | null;
  };
  transportation?: {
    type: 'per_km' | 'per_unit' | 'fixed' | 'free';
    charge: number;
  };
}

export interface SubCategory {
  _id: string;
  name: string;
  image: string;
  category: string;
}

export interface Banner {
  _id: string;
  title: string;
  image: string;
  link?: string;
  order: number;
  enableBulkQuote?: boolean;
}

export interface AppSettings {
  bulkBanner: {
    title: string;
    subtitle: string;
    buttonText: string;
  };
}

export interface Review {
  _id: string;
  rating: number;
  comment: string;
  name: string;
  reply?: {text: string; repliedAt: string} | null;
  createdAt: string;
}

export interface RatingStats {
  average: number;
  total: number;
  histogram: {[star: string]: number};
}

export interface Faq {
  _id: string;
  question: string;
  answer: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const catalogService = {
  getBanners: () =>
    api.get<{success: boolean; data: Banner[]}>('/mobile/catalog/banners'),

  // Admin-editable home content (e.g. bulk-quote banner text)
  getAppSettings: () =>
    api.get<{success: boolean; data: AppSettings}>('/app-settings/public/settings'),

  getCategories: () =>
    api.get<{success: boolean; data: Category[]}>('/mobile/catalog/categories'),

  getBrands: () =>
    api.get<{success: boolean; data: Brand[]}>('/mobile/catalog/brands'),

  getSubCategories: (categoryId: string) =>
    api.get<{success: boolean; data: SubCategory[]}>(
      `/mobile/catalog/categories/${categoryId}/subcategories`,
    ),

  getMaterials: (params?: {
    category?: string;
    subCategory?: string;
    brand?: string;
    search?: string;
    page?: number;
    limit?: number;
    // When supplied, each result carries a `supplierSummary` for that
    // delivery area ("from ₹X · N suppliers · ETA").
    pincode?: string;
    // With a pincode, returns one row PER VENDOR OFFER instead of one per
    // product, so every supplier of a searched item is listed separately.
    expandVendors?: 1;
  }) => api.get<PaginatedResponse<Material>>('/mobile/catalog/materials', {params}),

  getMaterialDetail: (id: string) =>
    api.get<{success: boolean; data: Material}>(
      `/mobile/catalog/materials/${id}`,
    ),

  getFaqs: (categoryId?: string) =>
    api.get<{success: boolean; data: Faq[]}>('/mobile/catalog/faqs', {
      params: categoryId ? {category: categoryId} : undefined,
    }),

  getReviews: (materialId: string) =>
    api.get<{success: boolean; data: Review[]; stats: RatingStats}>(
      `/mobile/catalog/materials/${materialId}/reviews`,
    ),

  submitReview: (
    materialId: string,
    payload: {rating: number; comment?: string},
  ) =>
    api.post<{success: boolean; data: Review; stats: RatingStats}>(
      `/mobile/catalog/materials/${materialId}/reviews`,
      payload,
    ),
};

export default catalogService;
