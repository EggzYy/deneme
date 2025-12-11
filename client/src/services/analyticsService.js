import api from './authService';

export const analyticsService = {
  // Health Score
  getHealthScore: () => api.get('/analytics/health-score'),
  getHealthScoreHistory: (dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    return api.get(`/analytics/health-score/history?${params.toString()}`);
  },
  getHealthScoreBreakdown: () => api.get('/analytics/health-score/breakdown'),
  
  // Health Insights
  getHealthInsights: () => api.get('/analytics/insights'),
  getPersonalizedRecommendations: () => api.get('/analytics/recommendations'),
  getAIInsights: () => api.get('/analytics/ai-insights'),
  
  // Trends Analysis
  getTrends: (type, dateRange = {}) => {
    const params = new URLSearchParams({ type });
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    return api.get(`/analytics/trends?${params.toString()}`);
  },
  getVitalSignsTrends: (dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    return api.get(`/analytics/trends/vitals?${params.toString()}`);
  },
  getActivityTrends: (dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    return api.get(`/analytics/trends/activity?${params.toString()}`);
  },
  
  // Activity Summary
  getActivitySummary: (dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    return api.get(`/analytics/activity/summary?${params.toString()}`);
  },
  getDailySummary: (date) => api.get(`/analytics/daily-summary?date=${date}`),
  getWeeklySummary: (weekStart) => {
    return api.get(`/analytics/weekly-summary?weekStart=${weekStart}`);
  },
  getMonthlySummary: (month, year) => {
    return api.get(`/analytics/monthly-summary?month=${month}&year=${year}`);
  },
  
  // Medication Analytics
  getMedicationAdherence: () => api.get('/analytics/medication/adherence'),
  getMedicationInsights: () => api.get('/analytics/medication/insights'),
  getMedicationEffectiveness: () => api.get('/analytics/medication/effectiveness'),
  
  // Consultation Analytics
  getConsultationHistory: () => api.get('/analytics/consultations/history'),
  getConsultationStats: () => api.get('/analytics/consultations/stats'),
  
  // Goals and Progress
  getGoals: () => api.get('/analytics/goals'),
  createGoal: (data) => api.post('/analytics/goals', data),
  updateGoal: (id, data) => api.put(`/analytics/goals/${id}`, data),
  deleteGoal: (id) => api.delete(`/analytics/goals/${id}`),
  getGoalProgress: (id) => api.get(`/analytics/goals/${id}/progress`),
  getAllGoalsProgress: () => api.get('/analytics/goals/progress'),
  
  // Achievements and Milestones
  getAchievements: () => api.get('/analytics/achievements'),
  getMilestones: () => api.get('/analytics/milestones'),
  
  // Comparative Analysis
  compareWithPrevious: (type, period) => {
    return api.get(`/analytics/compare?type=${type}&period=${period}`);
  },
  getProgressReport: (dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    return api.get(`/analytics/progress-report?${params.toString()}`);
  },
  
  // Correlations
  getCorrelations: () => api.get('/analytics/correlations'),
  getHealthFactorsCorrelation: (factors) => {
    return api.post('/analytics/correlations/analyze', { factors });
  },
  
  // Risk Assessment
  getRiskAssessment: () => api.get('/analytics/risk-assessment'),
  getHealthRisks: () => api.get('/analytics/health-risks'),
  
  // Predictive Analytics
  getPredictions: (type) => api.get(`/analytics/predictions?type=${type}`),
  getHealthForecasts: () => api.get('/analytics/forecasts'),
  
  // Data Export
  exportAnalytics: (format = 'pdf') => {
    return api.get(`/analytics/export?format=${format}`, {
      responseType: 'blob'
    });
  },
  exportReport: (reportType, format = 'pdf') => {
    return api.get(`/analytics/reports/${reportType}/export?format=${format}`, {
      responseType: 'blob'
    });
  },
  
  // Dashboard Data
  getDashboardData: () => api.get('/analytics/dashboard'),
  getQuickStats: () => api.get('/analytics/quick-stats'),
  
  // Notifications Analytics
  getNotificationsAnalytics: () => api.get('/analytics/notifications'),
  
  // Overall Health Summary
  getOverallHealthSummary: () => api.get('/analytics/overall-summary'),
  getHealthReport: (period = 'monthly') => {
    return api.get(`/analytics/health-report?period=${period}`);
  }
};

export default analyticsService;
