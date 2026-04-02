import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import recordRoutes from './recordRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(apiLimiter);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/records', recordRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;

