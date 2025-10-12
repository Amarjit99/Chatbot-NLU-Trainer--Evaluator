import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs-extra';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import trainingRoutes from './routes/training.js';
import evaluationRoutes from './routes/evaluation.js';
import modelVersioningRoutes from './routes/modelVersioning.js';
import entitiesRoutes from './routes/entities.js';
import multiBackendRoutes from './routes/multiBackend.js';
import activeLearningRoutes from './routes/activeLearning.js';
import adminRoutes from './routes/admin.js';
import analyticsRoutes from './routes/analytics.js';
import workspacesRoutes from './routes/workspaces.js';

const app = express();
const PORT = process.env.PORT || 3001;


app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', process.env.CLIENT_URL].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
  })
);

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Serve static files (avatars and uploads)
app.use('/uploads', express.static('uploads'));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/model-versioning', modelVersioningRoutes);
app.use('/api/entities', entitiesRoutes);
app.use('/api/multi-backend', multiBackendRoutes);
app.use('/api/active-learning', activeLearningRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/workspaces', workspacesRoutes);

// Health check endpoint for Docker and monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    services: {
      database: 'connected',
      server: 'running'
    }
  });
});

// Start server after DB connects
connectDB()
  .then(async () => {
    // Create uploads directories
    await fs.ensureDir('uploads');
    await fs.ensureDir('uploads/avatars');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Uploads directory ready`);
  console.log(`Multi-backend NLU support enabled`);
    });
    
    server.on('error', (err) => {
      console.error('❌ Server error:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      }
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
