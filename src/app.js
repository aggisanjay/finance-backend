import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes/index.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { NODE_ENV } from './config/env.js';

const app = express();

// ── Security & Parsing ──
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ──
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Health Check ──
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ──
app.use('/api/v1', routes);

// ── Error Handling ──
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;

