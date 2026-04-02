import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as dashboardService from '../services/dashboardService.js';

export const getOverview = catchAsync(async (_req, res) => {
  const summary = await dashboardService.getOverviewSummary();

  ApiResponse.success(res, {
    message: 'Dashboard overview fetched successfully',
    data: { summary },
  });
});

export const getCategoryBreakdown = catchAsync(async (_req, res) => {
  const categories = await dashboardService.getCategoryBreakdown();

  ApiResponse.success(res, {
    message: 'Category breakdown fetched successfully',
    data: { categories },
  });
});

export const getMonthlyTrends = catchAsync(async (req, res) => {
  const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
  const data = await dashboardService.getMonthlyTrends(year);

  ApiResponse.success(res, {
    message: 'Monthly trends fetched successfully',
    data,
  });
});

export const getWeeklyTrends = catchAsync(async (req, res) => {
  const weeks = req.query.weeks ? parseInt(req.query.weeks, 10) : 12;
  const data = await dashboardService.getWeeklyTrends(weeks);

  ApiResponse.success(res, {
    message: 'Weekly trends fetched successfully',
    data,
  });
});

export const getRecentActivity = catchAsync(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const records = await dashboardService.getRecentActivity(limit);

  ApiResponse.success(res, {
    message: 'Recent activity fetched successfully',
    data: { records },
  });
});

export const getTopCategories = catchAsync(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5;
  const type = req.query.type || 'expense';
  const categories = await dashboardService.getTopCategories(limit, type);

  ApiResponse.success(res, {
    message: 'Top categories fetched successfully',
    data: { categories },
  });
});

