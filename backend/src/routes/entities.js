import express from 'express';
import { auth } from '../middleware/auth.js';
import entityRecognitionService from '../services/entityRecognitionService.js';

const router = express.Router();

// POST /api/entities/save-annotations
// Save entity annotations for a workspace
router.post('/save-annotations', auth, async (req, res) => {
  try {
    const { workspaceId, annotations } = req.body;
    
    if (!workspaceId || !annotations) {
      return res.status(400).json({ message: 'workspaceId and annotations are required' });
    }

    const result = await entityRecognitionService.saveEntityAnnotations(workspaceId, annotations);

    res.status(200).json({
      message: 'Entity annotations saved successfully',
      ...result
    });

  } catch (error) {
    console.error('Save entity annotations error:', error);
    res.status(500).json({ 
      message: 'Failed to save entity annotations',
      error: error.message 
    });
  }
});

// GET /api/entities/annotations/:workspaceId
// Get entity annotations for a workspace
router.get('/annotations/:workspaceId', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    let annotations = entityRecognitionService.getEntityAnnotations(workspaceId);

    // If not in memory, try loading from disk for resilience
    if (!annotations) {
      await entityRecognitionService.loadAnnotationsFromDisk(workspaceId);
      annotations = entityRecognitionService.getEntityAnnotations(workspaceId);
    }

    if (!annotations) {
      return res.status(404).json({ message: 'No entity annotations found for this workspace' });
    }

    res.json({
      message: 'Entity annotations retrieved successfully',
      annotations: annotations.annotations,
      totalSamples: annotations.totalSamples,
      totalEntities: annotations.totalEntities,
      createdAt: annotations.createdAt
    });

  } catch (error) {
    console.error('Get entity annotations error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve entity annotations',
      error: error.message 
    });
  }
});

// POST /api/entities/train
// Train entity recognition model
router.post('/train', auth, async (req, res) => {
  try {
    const { workspaceId } = req.body;
    
    if (!workspaceId) {
      return res.status(400).json({ message: 'workspaceId is required' });
    }

    const result = await entityRecognitionService.trainEntityModel(workspaceId);

    res.status(200).json({
      message: 'Entity recognition model trained successfully',
      ...result
    });

  } catch (error) {
    console.error('Entity model training error:', error);
    res.status(500).json({ 
      message: 'Failed to train entity model',
      error: error.message 
    });
  }
});

// POST /api/entities/predict
// Predict entities in text
router.post('/predict', auth, async (req, res) => {
  try {
    const { text, workspaceId } = req.body;
    
    if (!text || !workspaceId) {
      return res.status(400).json({ message: 'text and workspaceId are required' });
    }

    const result = await entityRecognitionService.predictEntities(text, workspaceId);

    res.json({
      message: 'Entity prediction completed successfully',
      ...result
    });

  } catch (error) {
    console.error('Entity prediction error:', error);
    res.status(500).json({ 
      message: 'Entity prediction failed',
      error: error.message 
    });
  }
});

// GET /api/entities/model-info/:workspaceId
// Get entity model information
router.get('/model-info/:workspaceId', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const modelInfo = entityRecognitionService.getEntityModel(workspaceId);

    if (!modelInfo) {
      return res.status(404).json({ message: 'No entity model found for this workspace' });
    }

    res.json({
      message: 'Entity model information retrieved successfully',
      model: modelInfo
    });

  } catch (error) {
    console.error('Get entity model info error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve entity model information',
      error: error.message 
    });
  }
});

// GET /api/entities/models
// List all entity models
router.get('/models', auth, async (req, res) => {
  try {
    const models = entityRecognitionService.listEntityModels();

    res.json({
      message: 'Entity models retrieved successfully',
      models,
      total: models.length
    });

  } catch (error) {
    console.error('List entity models error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve entity models',
      error: error.message 
    });
  }
});

export default router;