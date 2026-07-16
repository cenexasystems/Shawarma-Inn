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
router.get('/events', async (req, res) => {
  const token = req.query.token;
  let userId = 1; // Default for bypass
  
  try {
    if (process.env.ADMIN_AUTH_BYPASS !== 'true') {
      if (!token) return res.status(401).end();
      
      // First try local JWT
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = getUserById(decoded.sub);
        if (!user || user.role !== 'admin') {
          return res.status(403).end();
        }
        userId = user.id;
      } catch (err) {
        // If local JWT fails, check supabase
        const authMode = (process.env.VITE_AUTH_MODE || '').trim();
        if (authMode === 'supabase') {
          const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
          const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();
          if (supabaseUrl && supabaseAnonKey) {
            const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
              headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${token}`
              }
            });
            if (!response.ok) throw new Error('Invalid Supabase token');
            const user = await response.json();
            userId = user.id;
          } else {
            return res.status(401).end();
          }
        } else {
          return res.status(401).end();
        }
      }
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now().toString() + Math.random().toString();
    sseClients.set(clientId, { res, role: 'admin', userId });

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

// Bulk operations
router.patch('/menu-items/bulk/price', menuController.bulkUpdatePrice);
router.patch('/menu-items/bulk/availability', menuController.bulkUpdateAvailability);
router.patch('/menu-items/bulk/category', menuController.bulkUpdateCategory);
router.patch('/menu-items/bulk/delete', menuController.bulkDelete);

// Categories
router.get('/categories', menuController.getCategories);
router.post('/categories', menuController.createCategory);
router.put('/categories/:id', menuController.updateCategory);
router.delete('/categories/:id', menuController.deleteCategory);

// Users / Admins / Customers
router.get('/customers', adminController.getCustomers);
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);

// Image Upload
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'public', 'images', 'menu'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\\s+/g, '-')}`);
  }
});
const upload = multer({ storage });

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  const imageUrl = `/images/menu/${req.file.filename}`;
  res.json({ imageUrl });
});

export default router;
