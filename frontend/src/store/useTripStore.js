import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://tripvault-fddi.onrender.com/api'),
});

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const useTripStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  trips: [],
  currentTrip: null,
  transactions: [],
  isLoading: false,
  error: null,

  // Auth
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Login failed', isLoading: false });
    }
  },

  loginWithPhone: async (phone) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.post('/auth/login-phone', { phone });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Phone login failed', isLoading: false });
    }
  },

  register: async (name, email, password, phone) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.post('/auth/register', { name, email, password, phone });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Registration failed', isLoading: false });
    }
  },

  fetchProfile: async () => {
    try {
      const { data } = await api.get('/auth/profile');
      const currentUser = get().user;
      const mergedUser = { ...currentUser, ...data };
      localStorage.setItem('user', JSON.stringify(mergedUser));
      set({ user: mergedUser });
      return mergedUser;
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  },

  updateProfile: async (profileData) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.put('/auth/profile', profileData);
      const currentUser = get().user;
      const updatedUser = { ...currentUser, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser, isLoading: false });
      return updatedUser;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, trips: [], currentTrip: null, transactions: [] });
  },

  // Trips & Balances
  fetchTrips: async () => {
    set({ isLoading: true });
    const { data } = await api.get('/trips');
    set({ trips: data, isLoading: false });
  },

  createTrip: async (tripData) => {
    const { data } = await api.post('/trips', tripData);
    set((state) => ({ trips: [...state.trips, data] }));
  },
  
  deleteTrip: async (tripId) => {
    await api.delete(`/trips/${tripId}`);
    // Instantly remove the trip from the frontend state
    set((state) => ({ 
      trips: state.trips.filter((trip) => trip._id !== tripId) 
    }));
  },

  fetchTripDetails: async (tripId) => {
    set({ isLoading: true });
    const { data: tripData } = await api.get(`/trips/${tripId}`);
    const { data: txData } = await api.get(`/transactions/${tripId}`);
    set({ currentTrip: tripData, transactions: txData, isLoading: false });
  },

  // Admin Actions
  addMember: async (tripId, memberData) => {
    await api.post(`/trips/${tripId}/members`, memberData);
    await get().fetchTripDetails(tripId); // Refresh balances
  },

  logTransaction: async (txData) => {
    await api.post('/transactions', txData);
    await get().fetchTripDetails(txData.tripId); // Refresh balances instantly
  },
}));

export default useTripStore;