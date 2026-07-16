import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authRequired } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authRequired);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

export default router;
