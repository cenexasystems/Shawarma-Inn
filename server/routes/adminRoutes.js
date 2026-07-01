import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import * as adminController from '../controllers/adminController.js';
import { loginRateLimiter } from '../middlewares/rateLimiter.js';

import { adminRequired } from '../middlewares/authMiddleware.js';
import * as menuController from '../controllers/menuController.js';
import { sseClients } from '../events/sse.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { getUserById } from '../repositories/userRepository.js';

const router = Router();

router.post('/login', loginRateLimiter, authController.adminLogin);

// SSE Events Endpoint (Does not use standard auth middleware since it relies on query params)
router.get('/events', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUserById(decoded.sub);
    if (!user || user.role !== 'admin') {
      return res.status(403).end();
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now().toString() + Math.random().toString();
    sseClients.set(clientId, { res, role: 'admin', userId: user.id });

    // Send initial connection success message
    res.write('data: {"connected": true}\n\n');

    req.on('close', () => {
      sseClients.delete(clientId);
    });
  } catch (err) {
    return res.status(401).end();
  }
});

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
