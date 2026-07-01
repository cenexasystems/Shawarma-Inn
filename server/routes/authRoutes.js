import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { loginRateLimiter } from '../middlewares/rateLimiter.js';
import { authRequired } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/signup', authController.signup);
router.post('/login', loginRateLimiter, authController.login);
router.get('/me', authRequired, authController.getMe);

export default router;
