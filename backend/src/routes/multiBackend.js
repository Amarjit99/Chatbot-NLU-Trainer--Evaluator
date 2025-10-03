import express from 'express';
import { auth } from '../middleware/auth.js';
import multiBackendTrainingService from '../services/multiBackendTrainingService.js';
import rasaIntegrationService from '../services/rasaIntegrationService.js';
import spacyIntegrationService from '../services/spacyIntegrationService.js';

const router = express.Router();

// POST /api/multi-backend/train
// Train models using multiple NLU backends
router.post('/train', auth, async (req, res) => {
  try {
    const { workspaceId, trainingData, selectedBackends } = req.body;
    
    if (!workspaceId || !trainingData || !Array.isArray(trainingData)) {
      return res.status(400).json({ 
        message: 'workspaceId and trainingData (array) are required' 
      });
    }

    if (!selectedBackends || selectedBackends.length === 0) {
      return res.status(400).json({ 
        message: 'At least one backend must be selected' 
      });
    }

    console.log(`🚀 Multi-backend training request: ${selectedBackends.join(', ')}`);

    const result = await multiBackendTrainingService.trainMultipleBackends(
      workspaceId, 
      trainingData, 
      selectedBackends
    );

    res.status(200).json({
      message: 'Multi-backend training completed',
      ...result
    });

  } catch (error) {
    console.error('Multi-backend training error:', error);
    res.status(500).json({ 
      message: 'Failed to train models',
      error: error.message 
    });
  }
});

// POST /api/multi-backend/predict
// Predict using multiple backends
router.post('/predict', auth, async (req, res) => {
  try {
    const { text, workspaceId, selectedBackends } = req.body;
    
    if (!text || !workspaceId) {
      return res.status(400).json({ 
        message: 'text and workspaceId are required' 
      });
    }

    const backends = selectedBackends || ['huggingface'];

    console.log(`🔍 Multi-backend prediction: ${backends.join(', ')}`);

    const result = await multiBackendTrainingService.predictMultipleBackends(
      text, 
      workspaceId, 
      backends
    );

    res.json({
      message: 'Multi-backend prediction completed',
      ...result
    });

  } catch (error) {
    console.error('Multi-backend prediction error:', error);
    res.status(500).json({ 
      message: 'Multi-backend prediction failed',
      error: error.message 
    });
  }
});

// POST /api/multi-backend/compare
// Compare performance of multiple backends
router.post('/compare', auth, async (req, res) => {
  try {
    const { workspaceId, testData, selectedBackends } = req.body;
    
    if (!workspaceId || !testData || !Array.isArray(testData)) {
      return res.status(400).json({ 
        message: 'workspaceId and testData (array) are required' 
      });
    }

    const backends = selectedBackends || ['huggingface'];

    console.log(`📊 Backend comparison request: ${backends.join(', ')}`);

    const result = await multiBackendTrainingService.compareBackends(
      workspaceId, 
      testData, 
      backends
    );

    res.json({
      message: 'Backend comparison completed',
      ...result
    });

  } catch (error) {
    console.error('Backend comparison error:', error);
    res.status(500).json({ 
      message: 'Backend comparison failed',
      error: error.message 
    });
  }
});

// GET /api/multi-backend/backends
// List supported backends and their availability
router.get('/backends', auth, async (req, res) => {
  try {
    const supportedBackends = multiBackendTrainingService.getSupportedBackends();
    const availability = await multiBackendTrainingService.checkBackendAvailability();

    res.json({
      message: 'Backend information retrieved',
      supportedBackends,
      availability,
      total: supportedBackends.length
    });

  } catch (error) {
    console.error('Get backends error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve backend information',
      error: error.message 
    });
  }
});

// GET /api/multi-backend/training-status/:workspaceId
// Get training job status
router.get('/training-status/:workspaceId', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    const trainingJob = multiBackendTrainingService.getTrainingJob(workspaceId);

    if (!trainingJob) {
      return res.status(404).json({ 
        message: 'No training job found for this workspace' 
      });
    }

    res.json({
      message: 'Training job status retrieved',
      trainingJob
    });

  } catch (error) {
    console.error('Get training status error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve training status',
      error: error.message 
    });
  }
});

// Individual backend routes for specific operations

// POST /api/multi-backend/rasa/train
// Train Rasa model specifically
router.post('/rasa/train', auth, async (req, res) => {
  try {
    const { workspaceId, trainingData } = req.body;
    
    if (!workspaceId || !trainingData) {
      return res.status(400).json({ 
        message: 'workspaceId and trainingData are required' 
      });
    }

    console.log(`🤖 Rasa-specific training request`);

    const result = await rasaIntegrationService.trainRasaModel(workspaceId, trainingData);

    res.status(200).json({
      message: 'Rasa model trained successfully',
      ...result
    });

  } catch (error) {
    console.error('Rasa training error:', error);
    res.status(500).json({ 
      message: 'Rasa training failed',
      error: error.message 
    });
  }
});

// POST /api/multi-backend/rasa/predict
// Predict using Rasa model
router.post('/rasa/predict', auth, async (req, res) => {
  try {
    const { text, workspaceId } = req.body;
    
    if (!text || !workspaceId) {
      return res.status(400).json({ 
        message: 'text and workspaceId are required' 
      });
    }

    const result = await rasaIntegrationService.predictWithRasa(text, workspaceId);

    res.json({
      message: 'Rasa prediction completed',
      ...result
    });

  } catch (error) {
    console.error('Rasa prediction error:', error);
    res.status(500).json({ 
      message: 'Rasa prediction failed',
      error: error.message 
    });
  }
});

// POST /api/multi-backend/spacy/train
// Train spaCy model specifically
router.post('/spacy/train', auth, async (req, res) => {
  try {
    const { workspaceId, trainingData } = req.body;
    
    if (!workspaceId || !trainingData) {
      return res.status(400).json({ 
        message: 'workspaceId and trainingData are required' 
      });
    }

    console.log(`🐍 spaCy-specific training request`);

    const result = await spacyIntegrationService.trainSpacyModel(workspaceId, trainingData);

    res.status(200).json({
      message: 'spaCy model trained successfully',
      ...result
    });

  } catch (error) {
    console.error('spaCy training error:', error);
    res.status(500).json({ 
      message: 'spaCy training failed',
      error: error.message 
    });
  }
});

// POST /api/multi-backend/spacy/predict
// Predict using spaCy model
router.post('/spacy/predict', auth, async (req, res) => {
  try {
    const { text, workspaceId } = req.body;
    
    if (!text || !workspaceId) {
      return res.status(400).json({ 
        message: 'text and workspaceId are required' 
      });
    }

    const result = await spacyIntegrationService.predictWithSpacy(text, workspaceId);

    res.json({
      message: 'spaCy prediction completed',
      ...result
    });

  } catch (error) {
    console.error('spaCy prediction error:', error);
    res.status(500).json({ 
      message: 'spaCy prediction failed',
      error: error.message 
    });
  }
});

// GET /api/multi-backend/rasa/models
// List Rasa models
router.get('/rasa/models', auth, async (req, res) => {
  try {
    const models = rasaIntegrationService.listRasaModels();

    res.json({
      message: 'Rasa models retrieved',
      models,
      total: models.length
    });

  } catch (error) {
    console.error('List Rasa models error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve Rasa models',
      error: error.message 
    });
  }
});

// GET /api/multi-backend/spacy/models
// List spaCy models
router.get('/spacy/models', auth, async (req, res) => {
  try {
    const models = spacyIntegrationService.listSpacyModels();

    res.json({
      message: 'spaCy models retrieved',
      models,
      total: models.length
    });

  } catch (error) {
    console.error('List spaCy models error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve spaCy models',
      error: error.message 
    });
  }
});

// GET /api/multi-backend/rasa/health
// Check Rasa server health
router.get('/rasa/health', auth, async (req, res) => {
  try {
    const isHealthy = await rasaIntegrationService.checkRasaServerHealth();

    res.json({
      message: 'Rasa health check completed',
      healthy: isHealthy,
      backend: 'rasa',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Rasa health check error:', error);
    res.status(500).json({ 
      message: 'Rasa health check failed',
      error: error.message 
    });
  }
});

// GET /api/multi-backend/spacy/health
// Check spaCy availability
router.get('/spacy/health', auth, async (req, res) => {
  try {
    const isAvailable = await spacyIntegrationService.checkSpacyAvailability();

    res.json({
      message: 'spaCy availability check completed',
      available: isAvailable,
      backend: 'spacy',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('spaCy availability check error:', error);
    res.status(500).json({ 
      message: 'spaCy availability check failed',
      error: error.message 
    });
  }
});

export default router;