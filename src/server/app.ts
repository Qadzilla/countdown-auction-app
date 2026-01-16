import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import healthRouter from './routes/health.js';
import itemsRouter from './routes/items.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/health', healthRouter);
app.use('/api/items', itemsRouter);

// Serve static client files from public/ at project root
// Works for both dev (src/server) and prod (dist/server)
const publicPath = path.join(__dirname, '..', '..', 'public');
app.use(express.static(publicPath));

// Fallback: serve index.html for root
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

export default app;
