import { Router } from 'express';
import * as menuController from '../controllers/menuController.js';

const router = Router();

router.get('/', menuController.getPublicMenuItems);

export default router;
