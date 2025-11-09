import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errors as celebrateErrors } from 'celebrate';

import { PORT, MONGODB_URI, CORS_ORIGIN, NODE_ENV } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

/* imports para montar /articles directo aquí */
import { auth } from './middlewares/auth.js';
import { validateArticle } from './middlewares/validate.js';
import {
  listArticles,
  createArticle,
  deleteArticle,
} from './controllers/articleController.js';

const app = express();
app.set('trust proxy', 1);

/* ---------- PRE-OPTIONS UNIVERSAL ---------- */
app.use((req, res, next) => {
  if (req.method !== 'OPTIONS') return next();

  const origin = req.headers.origin;
  const allowList = Array.isArray(CORS_ORIGIN) ? CORS_ORIGIN : [];
  const allowed =
    !origin || allowList.length === 0 || allowList.includes(origin);

  if (!allowed) return res.sendStatus(403);

  res.setHeader('Vary', 'Origin');
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization',
  );
  return res.sendStatus(204);
});
/* ------------------------------------------- */

/* seguridad */
app.use(helmet());

/* logs */
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

/* body */
app.use(express.json());

/* CORS normal */
const corsOpts = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (CORS_ORIGIN.length === 0 || CORS_ORIGIN.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};
app.use(cors(corsOpts));

/* rate limit */
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS' || req.path === '/healthz',
});
app.use(limiter);

/* ---------- RUTAS BÁSICAS ---------- */
app.get('/healthz', (req, res) => {
  res.json({ ok: true });
});

/* MOCK de búsqueda (el que ve tu frontend) */
app.get('/search', (req, res) => {
  const q = (req.query.q || '').toString();

  const items = [
    {
      title: 'Google lanza Gemini 2.5',
      text: 'Nueva versión enfocada en tareas complejas.',
      date: '2025-10-29',
      source: 'Demo source',
      link: 'https://example.com/gemini',
      image: 'https://picsum.photos/400',
    },
    {
      title: 'IA en móviles',
      text: 'Los fabricantes meten IA en todos los modelos.',
      date: '2025-10-28',
      source: 'Demo source',
      link: 'https://example.com/moviles-ia',
      image: 'https://picsum.photos/401',
    },
  ];

  res.json({
    query: q,
    total: items.length,
    items,
  });
});

/* ---------- RUTAS DE ARTÍCULOS DIRECTO AQUÍ ---------- */
/* así nos saltamos cualquier problema con src/routes/index.js en Render */
app.get('/articles', auth, listArticles);
app.post('/articles', auth, validateArticle, createArticle);
app.delete('/articles/:id', auth, deleteArticle);

/* ---------- RUTAS DEL PROYECTO (auth, etc.) ---------- */
app.use('/', routes);

/* errores de celebrate */
app.use(celebrateErrors());

/* manejador general */
app.use(errorHandler);

/* ---------- ARRANQUE ---------- */
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Mongo connected');
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log('🔧 CORS_ORIGIN =', CORS_ORIGIN);
    });
  })
  .catch((err) => {
    console.error('❌ Mongo connect error', err);
    process.exit(1);
  });
