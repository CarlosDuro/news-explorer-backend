import express from 'express';
import mongoose from 'mongoose';
import { PORT, MONGODB_URI } from './config/index.js';

const app = express();
app.use(express.json());

app.get('/healthz', (_, res) => res.json({ ok: true }));

async function start() {
  await mongoose.connect(MONGODB_URI);
  app.listen(PORT, () => console.log(`API on :${PORT}`));
}
start();
