import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://tripvault-fddi.onrender.com/api'),
});

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatically handle 401 Unauthorized responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('cached_trips');
      useTripStore.setState({ 
        user: null, 
        trips: [], 
        currentTrip: null, 
        transactions: [], 
        fundRequests: [],
        isLoading: false,
        error: error.response?.data?.message || 'Session expired. Please log in again.'
      });
    }
    return Promise.reject(error);
  }
);

/**
 * Calculates exact peer-to-peer debts between all pairs of members
 * and produces personalized breakdowns for the logged-in user.
 */
export const computeBilateralDebts = (members = [], transactions = [], currentUserId = null) => {
  const memberList = members || [];
  const memberMap = {};
  memberList.forEach((m) => {
    if (!m) return;
    const u = m.user || m;
    if (!u) return;
    const uid = (u._id || u.id || u)?.toString();
    if (uid) {
      memberMap[uid] = u;
    }
  });

  // debts[debtorId][payerId] = total amount debtor owes payer
  const debts = {};
  const userIds = Object.keys(memberMap);

  userIds.forEach((u1) => {
    debts[u1] = {};
    userIds.forEach((u2) => {
      debts[u1][u2] = 0;
    });
  });

  (transactions || []).forEach((tx) => {
    if (!tx) return;
    const payerId = (tx.payer?._id || tx.payer || tx.createdBy?._id || tx.createdBy)?.toString();
    if (!payerId) return;

    // Ensure payer exists in debts matrix
    if (!debts[payerId]) {
      debts[payerId] = {};
    }

    // Get splits
    const splits = (tx.splits && tx.splits.length > 0)
      ? tx.splits
      : (tx.sharedBy || []).map((u) => ({
          user: u,
          amount: (tx.amount || 0) / (tx.sharedBy.length || 1),
        }));

    splits.forEach((split) => {
      if (!split) return;
      const debtorId = (split.user?._id || split.user)?.toString();
      const amount = Number(split.amount) || 0;
      if (!debtorId || debtorId === payerId) return;

      if (!debts[debtorId]) debts[debtorId] = {};
      debts[debtorId][payerId] = (debts[debtorId][payerId] || 0) + amount;
    });
  });

  // Calculate bilateral balance for current user
  let totalYouAreOwed = 0;
  let totalYouOwe = 0;
  const companionDebts = [];

  if (currentUserId) {
    const myId = currentUserId.toString();

    userIds.forEach((otherId) => {
      if (otherId === myId) return;
      const otherUser = memberMap[otherId] || { name: 'Companion', _id: otherId };

      const otherOwesMe = debts[otherId]?.[myId] || 0;
      const iOweOther = debts[myId]?.[otherId] || 0;
      const net = Math.round((otherOwesMe - iOweOther) * 100) / 100;

      if (net > 0) {
        totalYouAreOwed += net;
        companionDebts.push({
          user: otherUser,
          amount: net,
          status: 'owes_you', // "Rathan owes you ₹500"
          net: net,
        });
      } else if (net < 0) {
        const absVal = Math.abs(net);
        totalYouOwe += absVal;
        companionDebts.push({
          user: otherUser,
          amount: absVal,
          status: 'you_owe', // "You owe Priya ₹250"
          net: net,
        });
      } else {
        companionDebts.push({
          user: otherUser,
          amount: 0,
          status: 'settled', // "Settled up"
          net: 0,
        });
      }
    });
  }

  // Sort companion debts: you owe first (requiring action), then owes you, then settled
  companionDebts.sort((a, b) => {
    const order = { you_owe: 0, owes_you: 1, settled: 2 };
    if (order[a.status] !== order[b.status]) {
      return order[a.status] - order[b.status];
    }
    return b.amount - a.amount;
  });

  const netPosition = Math.round((totalYouAreOwed - totalYouOwe) * 100) / 100;

  return {
    totalYouAreOwed: Math.round(totalYouAreOwed * 100) / 100,
    totalYouOwe: Math.round(totalYouOwe * 100) / 100,
    netPosition,
    companionDebts,
    debts,
  };
};

const getErrorMessage = (err, fallback) => {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.message === 'Network Error' || !err.response) {
    return 'Cannot connect to backend server. Please make sure the backend is running on port 5000.';
  }
  return fallback || err.message || 'Request failed';
};

const getStoredJSON = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const useTripStore = create((set, get) => ({
  user: getStoredJSON('user', null),
  trips: getStoredJSON('cached_trips', []),
  currentTrip: null,
  transactions: [],
  fundRequests: [],
  isLoading: false,
  error: null,

  // Auth
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data, isLoading: false, error: null });
      return data;
    } catch (err) {
      const msg = getErrorMessage(err, 'Login failed');
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  loginWithPhone: async (phone) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.post('/auth/login-phone', { phone });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data, isLoading: false, error: null });
      return data;
    } catch (err) {
      const msg = getErrorMessage(err, 'Phone login failed');
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  register: async (name, email, password, phone) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.post('/auth/register', { name, email, password, phone });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data, isLoading: false, error: null });
      return data;
    } catch (err) {
      const msg = getErrorMessage(err, 'Registration failed');
      set({ error: msg, isLoading: false });
      throw new Error(msg);
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
      set({ user: updatedUser, isLoading: false, error: null });
      return updatedUser;
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to update profile');
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cached_trips');
    set({ user: null, trips: [], currentTrip: null, transactions: [], fundRequests: [], error: null });
  },

  // Trips & Balances (Stale-While-Revalidate: Instant render with cache, silent background sync)
  fetchTrips: async () => {
    // Only set loading to true if there is no cached data to show immediately
    if (get().trips.length === 0) {
      set({ isLoading: true });
    }
    try {
      const { data } = await api.get('/trips');
      localStorage.setItem('cached_trips', JSON.stringify(data));
      set({ trips: data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  createTrip: async (tripData) => {
    const { data } = await api.post('/trips', tripData);
    set((state) => {
      const updatedTrips = [...state.trips, data];
      localStorage.setItem('cached_trips', JSON.stringify(updatedTrips));
      return { trips: updatedTrips };
    });
    return data;
  },

  updateTrip: async (tripId, tripData) => {
    const { data } = await api.put(`/trips/${tripId}`, tripData);
    set((state) => {
      const updatedTrips = state.trips.map((t) => (t._id === tripId ? data : t));
      localStorage.setItem('cached_trips', JSON.stringify(updatedTrips));
      return {
        currentTrip: state.currentTrip?._id === tripId ? data : state.currentTrip,
        trips: updatedTrips,
      };
    });
    return data;
  },
  
  deleteTrip: async (tripId) => {
    await api.delete(`/trips/${tripId}`);
    set((state) => {
      const updatedTrips = state.trips.filter((trip) => trip._id !== tripId);
      localStorage.setItem('cached_trips', JSON.stringify(updatedTrips));
      return { trips: updatedTrips };
    });
  },

  fetchTripDetails: async (tripId) => {
    set({ isLoading: true });
    try {
      const [tripRes, txRes, reqRes] = await Promise.all([
        api.get(`/trips/${tripId}`),
        api.get(`/transactions/${tripId}`),
        api.get(`/requests/trip/${tripId}`).catch(() => ({ data: [] })),
      ]);
      set({ 
        currentTrip: tripRes.data, 
        transactions: txRes.data, 
        fundRequests: reqRes.data || [], 
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  joinTrip: async (tripId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post(`/trips/${tripId}/join`);
      set((state) => {
        const tripExists = state.trips.some(t => t._id === tripId);
        return {
          currentTrip: data.trip,
          trips: tripExists ? state.trips.map(t => t._id === tripId ? data.trip : t) : [...state.trips, data.trip],
          isLoading: false
        };
      });
      return data;
    } catch (error) {
      set({ isLoading: false });
      const msg = getErrorMessage(error, 'Failed to join trip');
      throw new Error(msg);
    }
  },

  getTripPreview: async (tripId) => {
    try {
      const { data } = await api.get(`/trips/${tripId}/preview`);
      return data;
    } catch (error) {
      const msg = getErrorMessage(error, 'Trip preview not available');
      throw new Error(msg);
    }
  },

  // Member Management
  addMember: async (tripId, memberData) => {
    await api.post(`/trips/${tripId}/members`, memberData);
    await get().fetchTripDetails(tripId); // Refresh balances
  },

  removeMember: async (tripId, memberUserId) => {
    await api.delete(`/trips/${tripId}/members/${memberUserId}`);
    await get().fetchTripDetails(tripId); // Refresh balances
  },

  // Transaction Actions (Available to any member)
  logTransaction: async (txData) => {
    const { data } = await api.post('/transactions', txData);
    await get().fetchTripDetails(txData.tripId); // Refresh balances instantly
    return data;
  },

  deleteTransaction: async (txId, tripId) => {
    await api.delete(`/transactions/${txId}`);
    await get().fetchTripDetails(tripId); // Refresh balances instantly
  },

  // Fund Request Actions (Companion Borrowing)
  fetchTripRequests: async (tripId) => {
    const { data } = await api.get(`/requests/trip/${tripId}`);
    set({ fundRequests: data });
    return data;
  },

  createFundRequest: async (requestData) => {
    const { data } = await api.post('/requests', requestData);
    await get().fetchTripDetails(requestData.tripId);
    return data;
  },

  respondToFundRequest: async (requestId, action, tripId) => {
    const { data } = await api.put(`/requests/${requestId}/respond`, { action });
    await get().fetchTripDetails(tripId);
    return data;
  },

  cancelFundRequest: async (requestId, tripId) => {
    const { data } = await api.delete(`/requests/${requestId}`);
    await get().fetchTripDetails(tripId);
    return data;
  },
}));

export default useTripStore;