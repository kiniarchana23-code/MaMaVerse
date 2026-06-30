/**
 * API client for MaMaVerse backend.
 * Automatically attaches Firebase ID token to all requests.
 */
import axios, { AxiosInstance } from 'axios';
import { getIdToken } from './firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Attach Firebase ID token to every request
  client.interceptors.request.use(async (config) => {
    const token = await getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Global error handling
  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(err);
    }
  );

  return client;
}

export const api = createApiClient();

// ─── Typed API Functions ────────────────────────────────────────────────────────

export const authApi = {
  verify: () => api.get('/api/auth/verify'),
  subscribe: (fcmToken: string) =>
    api.post('/api/auth/subscribe', { fcm_token: fcmToken, topics: ['general'] }),
};

export const profileApi = {
  create: (data: any) => api.post('/api/profile/', data),
  get: () => api.get('/api/profile/me'),
  update: (data: any) => api.patch('/api/profile/me', data),
  delete: () => api.delete('/api/profile/me'),
};

export const agentApi = {
  ask: (query: string, agentType = 'general') =>
    api.post('/api/agents/ask', { query, agent_type: agentType }),
  getPregnancyWeek: (week: number) => api.get(`/api/agents/pregnancy/week/${week}`),
  getBabyMonth: (month: number) => api.get(`/api/agents/newmom/month/${month}`),
  getMealPlan: () => api.get('/api/agents/nutrition/meal-plan'),
  getMindfulness: () => api.get('/api/agents/wellness/mindfulness'),
};

export const contentApi = {
  getArticles: (params?: {
    category?: string;
    pregnancy_week?: number;
    baby_age_months?: number;
    limit?: number;
  }) => api.get('/api/content/articles', { params }),
};

export const healthcareApi = {
  search: (data: {
    city?: string;
    latitude?: number;
    longitude?: number;
    specialty?: string;
    radius_km?: number;
  }) => api.post('/api/healthcare/search', data),
  getSpecialties: () => api.get('/api/healthcare/specialties'),
};

export const adminApi = {
  ingest: (data: { source_url: string; category: string; notes?: string }) =>
    api.post('/api/admin/ingest', data),
  getPending: () => api.get('/api/admin/pending'),
  reviewArticle: (id: string, action: string, notes?: string) =>
    api.post(`/api/admin/articles/${id}/review`, { action, admin_notes: notes }),
  getStats: () => api.get('/api/admin/stats'),
  getPublished: (category?: string) =>
    api.get('/api/admin/published', { params: { category } }),
};
