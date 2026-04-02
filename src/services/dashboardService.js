import { FinancialRecord } from '../models/FinancialRecord.js';

export const getOverviewSummary = async () => {
  const result = await FinancialRecord.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
        totalExpenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
        totalRecords: { $sum: 1 },
        incomeCount: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, 1, 0] } },
        expenseCount: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, 1, 0] } },
        avgTransactionAmount: { $avg: '$amount' },
        maxTransaction: { $max: '$amount' },
        minTransaction: { $min: '$amount' },
      },
    },
    {
      $project: {
        _id: 0,
        totalIncome: { $round: ['$totalIncome', 2] },
        totalExpenses: { $round: ['$totalExpenses', 2] },
        netBalance: { $round: [{ $subtract: ['$totalIncome', '$totalExpenses'] }, 2] },
        totalRecords: 1,
        incomeCount: 1,
        expenseCount: 1,
        avgTransactionAmount: { $round: ['$avgTransactionAmount', 2] },
        maxTransaction: { $round: ['$maxTransaction', 2] },
        minTransaction: { $round: ['$minTransaction', 2] },
      },
    },
  ]);

  return result[0] || {
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    totalRecords: 0,
    incomeCount: 0,
    expenseCount: 0,
    avgTransactionAmount: 0,
    maxTransaction: 0,
    minTransaction: 0,
  };
};

export const getCategoryBreakdown = async () => {
  const result = await FinancialRecord.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
      },
    },
    {
      $group: {
        _id: '$_id.category',
        breakdown: {
          $push: {
            type: '$_id.type',
            total: { $round: ['$total', 2] },
            count: '$count',
            avgAmount: { $round: ['$avgAmount', 2] },
          },
        },
        grandTotal: { $sum: '$total' },
        totalCount: { $sum: '$count' },
      },
    },
    {
      $project: {
        _id: 0,
        category: '$_id',
        grandTotal: { $round: ['$grandTotal', 2] },
        totalCount: 1,
        breakdown: 1,
      },
    },
    { $sort: { grandTotal: -1 } },
  ]);

  return result;
};

export const getMonthlyTrends = async (year) => {
  const targetYear = year || new Date().getFullYear();
  const startDate = new Date(`${targetYear}-01-01`);
  const endDate = new Date(`${targetYear + 1}-01-01`);

  const result = await FinancialRecord.aggregate([
    {
      $match: {
        isDeleted: { $ne: true },
        date: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$date' }, type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.month',
        data: {
          $push: {
            type: '$_id.type',
            total: { $round: ['$total', 2] },
            count: '$count',
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const trends = monthNames.map((name, index) => {
    const monthData = result.find((r) => r._id === index + 1);
    const income = monthData?.data.find((d) => d.type === 'income');
    const expense = monthData?.data.find((d) => d.type === 'expense');

    return {
      month: index + 1,
      monthName: name,
      income: income?.total || 0,
      incomeCount: income?.count || 0,
      expenses: expense?.total || 0,
      expenseCount: expense?.count || 0,
      net: parseFloat(((income?.total || 0) - (expense?.total || 0)).toFixed(2)),
    };
  });

  return { year: targetYear, trends };
};

export const getWeeklyTrends = async (weeks = 12) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - weeks * 7);

  const result = await FinancialRecord.aggregate([
    {
      $match: {
        isDeleted: { $ne: true },
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $isoWeekYear: '$date' },
          week: { $isoWeek: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: { year: '$_id.year', week: '$_id.week' },
        data: {
          $push: {
            type: '$_id.type',
            total: { $round: ['$total', 2] },
            count: '$count',
          },
        },
      },
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } },
  ]);

  const trends = result.map((item) => {
    const income = item.data.find((d) => d.type === 'income');
    const expense = item.data.find((d) => d.type === 'expense');
    return {
      year: item._id.year,
      week: item._id.week,
      income: income?.total || 0,
      incomeCount: income?.count || 0,
      expenses: expense?.total || 0,
      expenseCount: expense?.count || 0,
      net: parseFloat(((income?.total || 0) - (expense?.total || 0)).toFixed(2)),
    };
  });

  return { weeks: trends.length, trends };
};

export const getRecentActivity = async (limit = 10) => {
  const records = await FinancialRecord.find({ isDeleted: { $ne: true } })
    .populate('createdBy', 'name email')
    .sort({ date: -1, createdAt: -1 })
    .limit(limit);

  return records;
};

export const getTopCategories = async (limit = 5, type = 'expense') => {
  const result = await FinancialRecord.aggregate([
    { $match: { isDeleted: { $ne: true }, type } },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
      },
    },
    {
      $project: {
        _id: 0,
        category: '$_id',
        total: { $round: ['$total', 2] },
        count: 1,
        avgAmount: { $round: ['$avgAmount', 2] },
      },
    },
    { $sort: { total: -1 } },
    { $limit: limit },
  ]);

  return result;
};

