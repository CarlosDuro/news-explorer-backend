import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errors as celebrateErrors } from 'celebrate';

import { PORT, MONGODB_URI, CORS_ORIGIN, NODE_ENV } from './config/index.js';
import authRoutes from './routes/auth.js';
import articlesRoutes from './routes/articles.js';
import searchRoutes from './routes/search.js';
import { auth } from './middlewares/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();
app.set('trust proxy', 1);

// seguridad básica
app.use(helmet());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

// CORS según tu env de Render
const corsOpts = {
  origin(origin, cb) {
    // permitir localhost / sin origin
    if (!origin) return cb(null, true);
    const list = Array.isArray(CORS_ORIGIN) ? CORS_ORIGIN : [];
    if (list.length === 0 || list.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
};
app.use(cors(corsOpts));

// limitar (pero no OPTIONS ni /healthz)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    skip: (req) => req.method === 'OPTIONS' || req.path === '/healthz',
  })
);

// health
app.get('/healthz', (req, res) => res.json({ ok: true }));

// públicas
app.use('/auth', authRoutes);
app.use('/search', searchRoutes);

// privadas
app.use('/articles', auth, articlesRoutes);

// celebrate
app.use(celebrateErrors());

// 404 explícito (esto es lo que te está contestando ahora mismo)
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// errores
app.use(errorHandler);

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Mongo connected');
  } catch (err) {
    console.error('❌ Mongo connection failed', err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 API on :${PORT}`);
    console.log('🔧 CORS_ORIGIN =', CORS_ORIGIN);
  });
}

start();
