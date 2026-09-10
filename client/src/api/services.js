import { http } from './client.js';

export const servicesApi = {
  async list(params = {}) {
    const { data } = await http.get('/services', { params });
    return data;
  },

  async dashboard() {
    const { data } = await http.get('/services/dashboard');
    return data;
  },

  async getById(id) {
    const { data } = await http.get(`/services/${id}`);
    return data;
  },

  async create(payload) {
    const { data } = await http.post('/services', payload);
    return data.service;
  },

  async update(id, payload) {
    const { data } = await http.put(`/services/${id}`, payload);
    return data.service;
  },

  async updateStatus(id, status) {
    const { data } = await http.patch(`/services/${id}/status`, { status });
    return data.service;
  },

  async remove(id) {
    await http.delete(`/services/${id}`);
  },
};
