import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import * as adminController from '../controllers/adminController.js';
import { loginRateLimiter } from '../middlewares/rateLimiter.js';

import { adminRequired } from '../middlewares/authMiddleware.js';
import * as menuController from '../controllers/menuController.js';

const router = Router();

router.post('/login', loginRateLimiter, authController.adminLogin);

router.use(adminRequired);

// Menu Items
router.get('/menu-items', menuController.getAdminMenuItems);
router.post('/menu-items', menuController.createMenuItem);
router.put('/menu-items/:id', menuController.updateMenuItem);
router.delete('/menu-items/:id', menuController.deleteMenuItem);
router.post('/menu-items/:id/duplicate', menuController.duplicateMenuItem);

// Categories
router.get('/categories', menuController.getCategories);
router.post('/categories', menuController.createCategory);
router.put('/categories/:id', menuController.updateCategory);
router.delete('/categories/:id', menuController.deleteCategory);

// Users / Admins
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);

export default router;
