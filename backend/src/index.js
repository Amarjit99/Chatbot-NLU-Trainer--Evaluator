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
// import analyticsRoutes from './routes/analytics.js'; // Temporarily disabled
// import analyticsService from './services/analyticsService.js'; // Temporarily disabled

const app = express();
const PORT = process.env.PORT || 3001;


app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', process.env.CLIENT_URL].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

// Middlewares
app.use(express.json());
app.use(morgan('dev'));
// app.use(analyticsService.getMiddleware()); // Temporarily disabled

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/model-versioning', modelVersioningRoutes);
app.use('/api/entities', entitiesRoutes);
app.use('/api/multi-backend', multiBackendRoutes);
app.use('/api/active-learning', activeLearningRoutes);
// app.use('/api/analytics', analyticsRoutes); // Temporarily disabled

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Start server after DB connects
connectDB()
  .then(async () => {
    // Create uploads directory
    await fs.ensureDir('uploads');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📁 Uploads directory created`);
      console.log(`🤖 HuggingFace integration ready`);
      console.log(`🔧 Multi-backend NLU support enabled`);
      console.log(`   ├── Rasa integration ready`);
      console.log(`   ├── spaCy integration ready`);
      console.log(`   └── HuggingFace integration ready`);
      console.log(`� Active learning and feedback loop enabled`);
      console.log(`📊 Model evaluation and versioning enabled`);
      console.log(`🏷️  Entity recognition and annotation ready`);
      console.log(`�🌐 Server bound to port ${PORT}, listening for connections...`);
    });
    
    server.on('error', (err) => {
      console.error('❌ Server error:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      }
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
