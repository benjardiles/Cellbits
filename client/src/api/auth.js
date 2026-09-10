import { http } from './client.js';

export const authApi = {
  async login(username, password) {
    const { data } = await http.post('/auth/login', { username, password });
    return data;
  },

  async me() {
    const { data } = await http.get('/auth/me');
    return data.user;
  },
};