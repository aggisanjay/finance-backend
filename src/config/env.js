import dotenv from 'dotenv';
dotenv.config();

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = parseInt(process.env.PORT, 10) || 5000;
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance_dashboard';
export const JWT_SECRET = process.env.JWT_SECRET || 'default_dev_secret_change_me';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;
export const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100;

