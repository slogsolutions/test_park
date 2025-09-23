import api from '../utils/api';

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('auth/login', { email, password });
    return response.data;
  },

  async register(name: string, email: string, password: string) {
    const response = await api.post('auth/register', { name, email, password });
    return response.data;
  },

  async googleLogin(credential: string) {
    const response = await api.post('auth/google', { credential });
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await api.post('auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, password: string) {
    const response = await api.post(`auth/reset-password/${token}`, { password });
    return response.data;
  },

  async verifyEmail(token: string) {
    const response = await api.get(`auth/verify-email/${token}`);
    return response.data;
  },

  async getMe() {
    const response = await api.get('auth/me');
    return response.data;
  },
};
