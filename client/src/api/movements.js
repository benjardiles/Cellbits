import { http } from './client.js';

export const movementsApi = {
  async list(params = {}) {
    const { data } = await http.get('/movements', { params });
    return data;
  },
};
