import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes/index';
import authRoutes from './routes/authRoutes';
import { authenticate } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health check (public, used by hosting platform health probes)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, nodeEnv: process.env.NODE_ENV || null });
});

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Everything else under /api requires a valid session
app.use('/api', authenticate, routes);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`NODE_ENV = ${process.env.NODE_ENV || '(not set)'}`);
});
