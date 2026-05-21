import api from './api';

const authService = {
  login: async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('ascent_token', data.token);
    return data.user;
  },
  logout: () => {
    localStorage.removeItem('ascent_token');
    localStorage.removeItem('ascent_user');
  },
  getMe: async () => {
    return await api.get('/auth/me');
  },
  changePassword: async (currentPassword, newPassword) => {
    return await api.put('/auth/password', { currentPassword, newPassword });
  },
};

export default authService;