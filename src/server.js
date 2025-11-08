import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errors as celebrateErrors } from 'celebrate';

// importa tu config real
import { PORT, MONGODB_URI, CORS_ORIGIN, NODE_ENV } from './config/index.js';
// importa tus rutas reales (las que ya tenías para /auth, /users, /articles, etc.)
import routes from './routes/index.js';
// tu manejador de errores personalizado
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();
app.set('trust proxy', 1);

/**
 * PRE-OPTIONS universal
 * Esto responde primero a las preflight OPTIONS de navegadores
 * sin llegar a las rutas de express, y usando tu lista de orígenes.
 */
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

// seguridad básica
app.use(
  helmet({
    // si luego necesitas imágenes externas, aquí se ajusta
  }),
);

// logs
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// body
app.use(express.json());

// CORS real para peticiones que no son preflight
const corsOpts = {
  origin(origin, cb) {
    // sin Origin (curl, postman) -> ok
    if (!origin) return cb(null, true);
    // lista vacía => permitir todo
    if (CORS_ORIGIN.length === 0) return cb(null, true);
    // lista con tu frontend
    if (CORS_ORIGIN.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};
app.use(cors(corsOpts));

// rate-limit (pero no castigues OPTIONS ni /healthz)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.method === 'OPTIONS' || req.path === '/healthz',
});
app.use(limiter);

// ---------- RUTAS SIMPLES PROPIAS ANTES DEL RESTO ----------

// healthz para Render
app.get('/healthz', (req, res) => {
  res.json({ ok: true });
});

// MOCK DE /search para tu frontend
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

// ---------- AQUÍ montas tus rutas reales ----------
app.use('/', routes);

// errores de celebrate
app.use(celebrateErrors());

// tu error handler
app.use(errorHandler);

// ---------- ARRANQUE DE SERVIDOR / DB ----------
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('✅ Mongo connected');

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`✅ Server running on port ${PORT}`);
      // eslint-disable-next-line no-console
      console.log('🔧 CORS_ORIGIN =', CORS_ORIGIN);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('❌ Mongo connect error', err);
    process.exit(1);
  });
