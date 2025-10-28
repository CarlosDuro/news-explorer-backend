import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errors as celebrateErrors } from 'celebrate';
import { PORT, MONGODB_URI, CORS_ORIGIN, NODE_ENV } from './config/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

/* Security & utils */
app.use(helmet());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

/* CORS con whitelist múltiple */
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (CORS_ORIGIN.length === 0 || CORS_ORIGIN.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

/* Rate limit */
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

/* Health */
app.get('/healthz', (_, res) => res.json({ ok: true }));

/* Celebrate validation errors */
app.use(celebrateErrors());

/* Error handler final */
app.use(errorHandler);

async function start() {
  await mongoose.connect(MONGODB_URI);
  app.listen(PORT, () => console.log(`API on :${PORT}`));
}
start();
