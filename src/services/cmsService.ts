import api from './api';

export interface CmsPage {
  slug: string;
  title: string;
  description?: string;
  body: string;
  updatedAt: string;
}

const cmsService = {
  getPage: (slug: string) =>
    api.get<{success: boolean; data: CmsPage}>(`/cms-pages/public/${slug}`),
};

export default cmsService;
