import { asyncHandler } from '../../core/http.js';
import { authService } from './auth.service.js';

export const authController = {
  login: asyncHandler(async (req, res) => {
    const { user, token } = await authService.login(req.body);
    res.setHeader('authorization', token);
    res.json({ token, user });
  }),

  me: asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user.id);
    res.json({ user });
  }),
};