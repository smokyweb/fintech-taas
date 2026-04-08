import { create } from 'zustand';
import client from '../api/client';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('tf_token'),
  isLoading: true,

  login: async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('tf_token', token);
    set({ token, user, isLoading: false });
    return user;
  },

  register: async (name, email, password, referralCode) => {
    const res = await client.post('/auth/register', { name, email, password, referralCode });
    const { token, user } = res.data;
    localStorage.setItem('tf_token', token);
    set({ token, user, isLoading: false });
    return user;
  },

  logout: () => {
    localStorage.removeItem('tf_token');
    set({ token: null, user: null, isLoading: false });
  },

  loadUser: async () => {
    const token = localStorage.getItem('tf_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const res = await client.get('/auth/me');
      set({ user: res.data.user, isLoading: false });
    } catch {
      localStorage.removeItem('tf_token');
      set({ token: null, user: null, isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
}));

export default useAuthStore;
