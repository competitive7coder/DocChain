import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const currentToken = localStorage.getItem('token'); 
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const clinicAPI = {
  createClinic: async (clinicData) => {
    const response = await api.post('/clinics', clinicData);
    return response.data;
  },
  deleteClinic: async (clinicId) => {
    const response = await api.delete(`/clinics/${clinicId}`);
    return response.data;
  },
  getMyClinics: async () => {
    const response = await api.get('/clinics/my-clinics');
    return response.data;
  },
  getClinicByToken: async (qrToken) => {
    const response = await axios.get(`${API_BASE_URL}/api/clinics/qr/${qrToken}`);
    return response.data;
  },
};

export const visitAPI = {
  checkIn: async (clinicId) => {
    const response = await api.post('/visits/check-in', { clinicId });
    return response.data;
  },
  getWaitingRoom: async (clinicId) => {
    const response = await api.get(`/visits/waiting-room/${clinicId}`);
    return response.data;
  },
  startVisit: async (visitId) => {
    const response = await api.post(`/visits/start/${visitId}`);
    return response.data;
  },
  getVisit: async (visitId) => {
    const response = await api.get(`/visits/${visitId}`);
    return response.data;
  },
};

export const prescriptionAPI = {
  issuePrescription: async (prescriptionData) => {
    const response = await api.post('/prescriptions/issue', prescriptionData);
    return response.data;
  },
  getPatientPrescriptions: async () => {
    const response = await api.get('/prescriptions/my-prescriptions');
    return response.data;
  },
  getPrescriptionByHash: async (hashId) => {
    const response = await axios.get(`${API_BASE_URL}/api/prescriptions/hash/${hashId}`);
    return response.data;
  },
  redeemPrescription: async (hashId) => {
    const response = await api.post(`/prescriptions/redeem/${hashId}`);
    return response.data;
  },
};


export default api;

