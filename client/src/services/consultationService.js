import api from './authService';

export const consultationService = {
  // Doctor Management
  getDoctors: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.specialization) params.append('specialization', filters.specialization);
    if (filters.search) params.append('search', filters.search);
    if (filters.availability) params.append('availability', filters.availability);
    if (filters.minRating) params.append('minRating', filters.minRating);
    if (filters.maxFee) params.append('maxFee', filters.maxFee);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    
    return api.get(`/consultations/doctors?${params.toString()}`);
  },
  getDoctorById: (id) => api.get(`/consultations/doctors/${id}`),
  getDoctorAvailability: (doctorId, date) => {
    return api.get(`/consultations/doctors/${doctorId}/availability?date=${date}`);
  },
  
  // Consultation Booking
  bookConsultation: (data) => api.post('/consultations', data),
  getMyConsultations: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    return api.get(`/consultations?${params.toString()}`);
  },
  getConsultationById: (id) => api.get(`/consultations/${id}`),
  
  // Consultation Management
  updateConsultation: (id, data) => api.put(`/consultations/${id}`, data),
  cancelConsultation: (id, reason) => {
    return api.put(`/consultations/${id}/cancel`, { reason });
  },
  rescheduleConsultation: (id, data) => {
    return api.put(`/consultations/${id}/reschedule`, data);
  },
  
  // Consultation Lifecycle
  startConsultation: (id) => api.post(`/consultations/${id}/start`),
  completeConsultation: (id, data) => {
    return api.post(`/consultations/${id}/complete`, data);
  },
  
  // Consultation Rating and Feedback
  rateConsultation: (id, rating, review) => {
    return api.post(`/consultations/${id}/rate`, { rating, review });
  },
  
  // Consultation Messages
  getConsultationMessages: (id) => {
    return api.get(`/consultations/${id}/messages`);
  },
  sendConsultationMessage: (id, message) => {
    return api.post(`/consultations/${id}/messages`, { message });
  },
  
  // Consultation Notes (for doctors)
  addConsultationNotes: (id, notes) => {
    return api.post(`/consultations/${id}/notes`, { notes });
  },
  getConsultationNotes: (id) => api.get(`/consultations/${id}/notes`),
  
  // Prescriptions
  createPrescription: (consultationId, data) => {
    return api.post(`/consultations/${consultationId}/prescriptions`, data);
  },
  getPrescription: (prescriptionId) => {
    return api.get(`/consultations/prescriptions/${prescriptionId}`);
  },
  
  // Doctor Schedule Management
  updateDoctorAvailability: (availability) => {
    return api.put('/consultations/availability', { availability });
  },
  getDoctorSchedule: (doctorId, startDate, endDate) => {
    return api.get(`/consultations/doctors/${doctorId}/schedule?startDate=${startDate}&endDate=${endDate}`);
  },
  
  // Statistics (for doctors)
  getDoctorStats: () => api.get('/consultations/stats'),
  getPatientList: () => api.get('/consultations/patients'),
  getPatientHistory: (patientId) => {
    return api.get(`/consultations/patients/${patientId}/history`);
  }
};

export default consultationService;
