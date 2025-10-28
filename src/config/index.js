import 'dotenv/config';

export const PORT = process.env.PORT || 8080;
export const MONGODB_URI = process.env.MONGODB_URI || '';
export const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
export const CORS_ORIGIN = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
export const NODE_ENV = process.env.NODE_ENV || 'development';
