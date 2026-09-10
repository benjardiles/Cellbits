import { http } from './client.js';

export const inventoryApi = {
  async list(params = {}) {
    const { data } = await http.get('/inventory', { params });
    return data;
  },

  async getById(id) {
    const { data } = await http.get(`/inventory/${id}`);
    return data.product;
  },

  async publicGet(id) {
    const { data } = await http.get(`/inventory/public/${id}`);
    return data;
  },

  async create(payload) {
    const { data } = await http.post('/inventory', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await http.put(`/inventory/${id}`, payload);
    return data.product;
  },

  async adjustQuantity(id, { type, delta, reason }) {
    const { data } = await http.patch(`/inventory/${id}/quantity`, { type, delta, reason });
    return data;
  },

  async remove(id) {
    await http.delete(`/inventory/${id}`);
  },

  async listCategories() {
    const { data } = await http.get('/inventory/categories');
    return data.categories;
  },

  async createCategory(name) {
    const { data } = await http.post('/inventory/categories', { name });
    return data.category;
  },

  async qrPayload(id) {
    const { data } = await http.get(`/inventory/${id}/qr`);
    return data;
  },

  async dashboard() {
    const { data } = await http.get('/inventory/dashboard');
    return data;
  },
};