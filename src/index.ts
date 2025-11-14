import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import router from './routes/router.js';

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

// Health check
app.get('/', (_req, res) => {
  res.json({
    status: 'OK',
    message: '✅ Helpdesk API is running',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3000
  });
});

// API Routes
app.use('/api', router);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   🎫 HELPDESK API                      ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`✅ Server running on ${HOST}:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔗 Health: http://${HOST}:${PORT}/`);
  console.log('');
}).on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});