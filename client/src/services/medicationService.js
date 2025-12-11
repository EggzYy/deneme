import api from './authService';

export const medicationService = {
  // Medication Database Search
  searchMedications: (query, limit = 20) => {
    return api.get(`/medications/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },
  getMedicationById: (id) => api.get(`/medications/${id}`),
  getMedicationDetails: (id) => api.get(`/medications/${id}/details`),
  
  // User Medications Management
  getMyMedications: (status = 'active') => {
    return api.get(`/medications/my-medications?status=${status}`);
  },
  addMedication: (data) => api.post('/medications/my-medications', data),
  updateMedication: (id, data) => api.put(`/medications/my-medications/${id}`, data),
  deleteMedication: (id) => api.delete(`/medications/my-medications/${id}`),
  discontinueMedication: (id, reason) => {
    return api.put(`/medications/my-medications/${id}/discontinue`, { reason });
  },
  pauseMedication: (id, reason) => {
    return api.put(`/medications/my-medications/${id}/pause`, { reason });
  },
  resumeMedication: (id) => api.put(`/medications/my-medications/${id}/resume`),
  
  // Medication Intake Tracking
  recordIntake: (id, data) => {
    return api.post(`/medications/my-medications/${id}/intake`, data);
  },
  getMedicationIntakeHistory: (id, dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    return api.get(`/medications/my-medications/${id}/intake?${params.toString()}`);
  },
  recordMissedDose: (id, reason) => {
    return api.post(`/medications/my-medications/${id}/missed`, { reason });
  },
  
  // Adherence Tracking
  getAdherence: (id) => api.get(`/medications/my-medications/${id}/adherence`),
  getOverallAdherence: () => api.get('/medications/adherence/overall'),
  getAdherenceReport: (dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    return api.get(`/medications/adherence/report?${params.toString()}`);
  },
  
  // Drug Interactions
  checkInteractions: (medicationIds) => {
    return api.post('/medications/check-interactions', { medicationIds });
  },
  getInteractionWarnings: () => api.get('/medications/interactions/warnings'),
  
  // Medication Reminders
  setReminders: (id, reminders) => {
    return api.put(`/medications/my-medications/${id}/reminders`, { reminders });
  },
  getReminders: (id) => api.get(`/medications/my-medications/${id}/reminders`),
  getUpcomingReminders: () => api.get('/medications/reminders/upcoming'),
  snoozeReminder: (reminderId, minutes) => {
    return api.post(`/medications/reminders/${reminderId}/snooze`, { minutes });
  },
  dismissReminder: (reminderId) => {
    return api.post(`/medications/reminders/${reminderId}/dismiss`);
  },
  
  // Side Effects
  reportSideEffect: (id, data) => {
    return api.post(`/medications/my-medications/${id}/side-effects`, data);
  },
  getSideEffects: (id) => api.get(`/medications/my-medications/${id}/side-effects`),
  updateSideEffect: (id, sideEffectId, data) => {
    return api.put(`/medications/my-medications/${id}/side-effects/${sideEffectId}`, data);
  },
  
  // Effectiveness Rating
  rateMedicationEffectiveness: (id, rating, notes) => {
    return api.post(`/medications/my-medications/${id}/effectiveness`, { rating, notes });
  },
  getEffectivenessHistory: (id) => {
    return api.get(`/medications/my-medications/${id}/effectiveness`);
  },
  
  // Refills
  requestRefill: (id, pharmacyId) => {
    return api.post(`/medications/my-medications/${id}/refill`, { pharmacyId });
  },
  getRefillHistory: (id) => api.get(`/medications/my-medications/${id}/refills`),
  
  // AI Insights
  getMedicationInsights: (id) => api.get(`/medications/my-medications/${id}/insights`),
  getAllMedicationInsights: () => api.get('/medications/insights'),
  
  // Pharmacy Integration
  searchPharmacies: (location) => {
    return api.get(`/medications/pharmacies/search?location=${encodeURIComponent(location)}`);
  },
  getPharmacyById: (id) => api.get(`/medications/pharmacies/${id}`),
  setPreferredPharmacy: (id) => api.put(`/medications/pharmacies/${id}/prefer`),
  
  // Cost Tracking
  updateMedicationCost: (id, costData) => {
    return api.put(`/medications/my-medications/${id}/cost`, costData);
  },
  getMonthlyCosts: () => api.get('/medications/costs/monthly'),
  getCostAnalysis: (dateRange = {}) => {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    return api.get(`/medications/costs/analysis?${params.toString()}`);
  }
};

export default medicationService;
