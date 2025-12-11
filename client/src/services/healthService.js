import api from './authService';

export const healthService = {
  // Health Profile Management
  createHealthProfile: (data) => api.post('/health/profile', data),
  getHealthProfile: () => api.get('/health/profile'),
  updateHealthProfile: (data) => api.put('/health/profile', data),
  
  // Health Data Management
  addHealthData: (data) => api.post('/health/data', data),
  getHealthData: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.dataType) params.append('dataType', filters.dataType);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    
    return api.get(`/health/data?${params.toString()}`);
  },
  getHealthDataById: (id) => api.get(`/health/data/${id}`),
  updateHealthData: (id, data) => api.put(`/health/data/${id}`, data),
  deleteHealthData: (id) => api.delete(`/health/data/${id}`),
  
  // Health Trends and Analytics
  getHealthTrends: (type, dateRange = {}) => {
    const params = new URLSearchParams({ type });
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    return api.get(`/health/trends?${params.toString()}`);
  },
  
  // Health Insights
  getHealthInsights: () => api.get('/health/insights'),
  getHealthScore: () => api.get('/health/score'),
  
  // Data Export
  exportHealthData: (format = 'pdf') => {
    return api.get(`/health/export?format=${format}`, {
      responseType: 'blob'
    });
  },
  
  // Vital Signs
  addVitalSigns: (data) => api.post('/health/vitals', data),
  getVitalSigns: (dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    return api.get(`/health/vitals?${params.toString()}`);
  },
  
  // Activity Data
  addActivity: (data) => api.post('/health/activity', data),
  getActivity: (dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    return api.get(`/health/activity?${params.toString()}`);
  },
  
  // Sleep Data
  addSleep: (data) => api.post('/health/sleep', data),
  getSleep: (dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    return api.get(`/health/sleep?${params.toString()}`);
  },
  
  // Mental Health
  addMentalHealth: (data) => api.post('/health/mental-health', data),
  getMentalHealth: (dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    return api.get(`/health/mental-health?${params.toString()}`);
  }
};

export default healthService;
