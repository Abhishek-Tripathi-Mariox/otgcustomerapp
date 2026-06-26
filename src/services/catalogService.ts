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
