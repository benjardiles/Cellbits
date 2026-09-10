import { asyncHandler } from '../../core/http.js';
import { servicesService } from './services.service.js';

export const servicesController = {
  list: asyncHandler(async (req, res) => {
    const result = await servicesService.list(req.query);
    res.json(result);
  }),

  dashboard: asyncHandler(async (_req, res) => {
    res.json(await servicesService.getDashboard());
  }),

  getById: asyncHandler(async (req, res) => {
    const result = await servicesService.getDetail(req.params.id);
    res.json(result);
  }),

  create: asyncHandler(async (req, res) => {
    const service = await servicesService.create(req.body, req.user?.id);
    res.status(201).json({ service });
  }),

  update: asyncHandler(async (req, res) => {
    const service = await servicesService.update(req.params.id, req.body);
    res.json({ service });
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const service = await servicesService.updateStatus(req.params.id, req.body.status, req.user?.id);
    res.json({ service });
  }),

  remove: asyncHandler(async (req, res) => {
    const result = await servicesService.remove(req.params.id);
    res.json(result);
  }),
};
