import api from './authService';

const buildParams = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.append(key, value);
  });

  return params;
};

export const healthService = {
  // Health Profile Management
  // Note: This endpoint returns a simplified profile payload used by the Profile page.
  createHealthProfile: (data) => api.post('/health/profile', data),
  getHealthProfile: () => api.get('/health/profile'),
  updateHealthProfile: (data) => api.put('/health/profile', data),

  // Health Data Management
  addHealthData: (data) => api.post('/health/data', data),
  getHealthData: (filters = {}) => {
    const { offset, page, limit, ...rest } = filters;

    // Backend supports page-based pagination. If offset is provided, convert to page.
    const resolvedLimit = limit ? Number(limit) : undefined;
    const resolvedPage = page
      ? Number(page)
      : offset !== undefined && resolvedLimit
        ? Math.floor(Number(offset) / resolvedLimit) + 1
        : undefined;

    const params = buildParams({ ...rest, limit: resolvedLimit, page: resolvedPage });
    const query = params.toString();

    return api.get(`/health/data${query ? `?${query}` : ''}`);
  },
  getHealthDataById: (id) => api.get(`/health/data/${id}`),
  updateHealthData: (id, data) => api.put(`/health/data/${id}`, data),
  deleteHealthData: (id) => api.delete(`/health/data/${id}`),

  // Health Trends and Analytics
  getHealthTrends: ({ metric, period } = {}) => {
    const params = buildParams({ metric, period });
    const query = params.toString();
    return api.get(`/health/trends${query ? `?${query}` : ''}`);
  },

  // Health Insights
  getHealthInsights: () => api.get('/health/insights'),

  // Health score is implemented in analytics (shared calculation)
  getHealthScore: () => api.get('/analytics/health-score'),

  // Data Export
  exportHealthData: (format = 'csv', filters = {}) => {
    const params = buildParams({ format, ...filters });
    return api.get(`/health/export?${params.toString()}`, {
      responseType: 'blob'
    });
  },

  // Convenience wrappers around /health/data
  addVitalSigns: ({ recordedAt, ...vitalSigns }) => {
    return api.post('/health/data', {
      dataType: 'vital-signs',
      source: 'manual',
      recordedAt,
      vitalSigns
    });
  },
  getVitalSigns: (dateRange = {}) => {
    return healthService.getHealthData({ dataType: 'vital-signs', ...dateRange });
  },

  addActivity: ({ recordedAt, ...activity }) => {
    return api.post('/health/data', {
      dataType: 'activity',
      source: 'manual',
      recordedAt,
      activity
    });
  },
  getActivity: (dateRange = {}) => {
    return healthService.getHealthData({ dataType: 'activity', ...dateRange });
  },

  addSleep: ({ recordedAt, ...sleep }) => {
    return api.post('/health/data', {
      dataType: 'sleep',
      source: 'manual',
      recordedAt,
      sleep
    });
  },
  getSleep: (dateRange = {}) => {
    return healthService.getHealthData({ dataType: 'sleep', ...dateRange });
  },

  addMentalHealth: ({ recordedAt, ...mentalHealth }) => {
    return api.post('/health/data', {
      dataType: 'mental-health',
      source: 'manual',
      recordedAt,
      mentalHealth
    });
  },
  getMentalHealth: (dateRange = {}) => {
    return healthService.getHealthData({ dataType: 'mental-health', ...dateRange });
  }
};

export default healthService;
