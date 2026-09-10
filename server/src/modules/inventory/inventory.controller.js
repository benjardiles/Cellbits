import { asyncHandler } from '../../core/http.js';
import { inventoryService } from './inventory.service.js';
import { movementsService } from '../movements/movements.service.js';

export const inventoryController = {
  list: asyncHandler(async (req, res) => {
    const result = await inventoryService.list(req.query);
    res.json(result);
  }),

  getById: asyncHandler(async (req, res) => {
    const product = await inventoryService.getById(req.params.id);
    res.json({ product });
  }),

  publicGet: asyncHandler(async (req, res) => {
    const product = await inventoryService.publicInfo(req.params.id);
    const scanUrl = inventoryService.productScanUrl(product.id);
    res.json({ product, scanUrl });
  }),

  create: asyncHandler(async (req, res) => {
    const product = await inventoryService.create(req.body);
    const scanUrl = inventoryService.productScanUrl(product.id);
    res.status(201).json({ product, scanUrl });
  }),

  update: asyncHandler(async (req, res) => {
    const product = await inventoryService.update(req.params.id, req.body);
    res.json({ product });
  }),

  adjustQuantity: asyncHandler(async (req, res) => {
    const { product, movement } = await movementsService.register(req.params.id, req.body, req.user?.id);
    res.json({ product, movement });
  }),

  remove: asyncHandler(async (req, res) => {
    const result = await inventoryService.remove(req.params.id);
    res.json(result);
  }),

  listCategories: asyncHandler(async (_req, res) => {
    const categories = await inventoryService.listCategories();
    res.json({ categories });
  }),

  createCategory: asyncHandler(async (req, res) => {
    const category = await inventoryService.createCategory(req.body.name);
    res.status(201).json({ category });
  }),

  qrPayload: asyncHandler(async (req, res) => {
    await inventoryService.getById(req.params.id);
    res.json(inventoryService.buildQrPayload(req.params.id));
  }),

  dashboard: asyncHandler(async (_req, res) => {
    res.json(await inventoryService.getDashboard());
  }),
};