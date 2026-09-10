import { asyncHandler } from '../../core/http.js';
import { movementsService } from './movements.service.js';

export const movementsController = {
  list: asyncHandler(async (req, res) => {
    const result = await movementsService.list(req.query);
    res.json(result);
  }),
};
