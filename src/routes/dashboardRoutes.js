import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticate);

router.get('/overview', authorize('admin', 'analyst', 'viewer'), dashboardController.getOverview);
router.get('/recent', authorize('admin', 'analyst', 'viewer'), dashboardController.getRecentActivity);

router.get('/categories', authorize('admin', 'analyst'), dashboardController.getCategoryBreakdown);
router.get('/trends/monthly', authorize('admin', 'analyst'), dashboardController.getMonthlyTrends);
router.get('/trends/weekly', authorize('admin', 'analyst'), dashboardController.getWeeklyTrends);
router.get('/top-categories', authorize('admin', 'analyst'), dashboardController.getTopCategories);

export default router;

