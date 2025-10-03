import express from 'express';
import { auth } from '../middleware/auth.js';
import { activeLearningService } from '../services/activeLearningService.js';
import huggingfaceService from '../services/huggingfaceService.js';
import multiBackendTrainingService from '../services/multiBackendTrainingService.js';

const router = express.Router();

// POST /api/active-learning/analyze
// Analyze predictions for uncertainty and select samples for review
router.post('/analyze', auth, async (req, res) => {
  try {
    const { workspaceId, testData, settings } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID is required' });
    }

    if (!testData || !Array.isArray(testData)) {
      return res.status(400).json({ message: 'Test data array is required' });
    }

    console.log(`🔍 Starting uncertainty analysis for workspace: ${workspaceId}`);

    // Get model predictions for test data
    const predictions = [];
    
    try {
      for (const sample of testData) {
        const prediction = await huggingfaceService.predictIntent(sample.text, workspaceId);
        predictions.push({
          text: sample.text,
          actualIntent: sample.intent || sample.label,
          predictedIntent: prediction.predictedIntent,
          confidence: prediction.confidence,
          allPredictions: prediction.allPredictions || [],
          secondBestConfidence: prediction.secondBestConfidence || 0
        });
      }
    } catch (modelError) {
      console.error('Model prediction error:', modelError);
      return res.status(500).json({
        message: 'Failed to get model predictions',
        error: modelError.message
      });
    }

    // Analyze uncertainty
    const analysisResult = await activeLearningService.analyzeUncertainty(
      workspaceId,
      predictions,
      settings
    );

    res.json({
      message: 'Uncertainty analysis completed successfully',
      result: analysisResult
    });

  } catch (error) {
    console.error('Uncertainty analysis error:', error);
    res.status(500).json({
      message: 'Failed to analyze uncertainty',
      error: error.message
    });
  }
});

// GET /api/active-learning/uncertain-samples/:workspaceId
// Get uncertain samples for review
router.get('/uncertain-samples/:workspaceId', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const filters = {
      status: req.query.status,
      minUncertainty: req.query.minUncertainty ? parseFloat(req.query.minUncertainty) : undefined,
      maxConfidence: req.query.maxConfidence ? parseFloat(req.query.maxConfidence) : undefined
    };

    // Try to load from memory first, then from disk
    let result = activeLearningService.getUncertainSamples(workspaceId, filters);
    
    if (result.samples.length === 0) {
      await activeLearningService.loadUncertainSamples(workspaceId);
      result = activeLearningService.getUncertainSamples(workspaceId, filters);
    }

    res.json({
      message: 'Uncertain samples retrieved successfully',
      workspaceId,
      ...result
    });

  } catch (error) {
    console.error('Get uncertain samples error:', error);
    res.status(500).json({
      message: 'Failed to retrieve uncertain samples',
      error: error.message
    });
  }
});

// POST /api/active-learning/feedback
// Submit feedback for uncertain samples
router.post('/feedback', auth, async (req, res) => {
  try {
    const { workspaceId, feedback } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID is required' });
    }

    if (!feedback || !Array.isArray(feedback)) {
      return res.status(400).json({ message: 'Feedback array is required' });
    }

    // Validate feedback entries
    const validatedFeedback = feedback.map((item, index) => {
      if (!item.sampleId || !item.correctedIntent || !item.text) {
        throw new Error(`Feedback item ${index}: Missing required fields (sampleId, correctedIntent, text)`);
      }
      return {
        sampleId: item.sampleId,
        text: item.text,
        correctedIntent: item.correctedIntent,
        originalPrediction: item.originalPrediction,
        originalConfidence: item.originalConfidence,
        feedbackType: item.feedbackType || 'correction',
        notes: item.notes || ''
      };
    });

    console.log(`📝 Processing ${validatedFeedback.length} feedback items for workspace: ${workspaceId}`);

    const result = await activeLearningService.submitFeedback(workspaceId, validatedFeedback);

    res.json({
      message: 'Feedback submitted successfully',
      workspaceId,
      ...result
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

// GET /api/active-learning/feedback-history/:workspaceId
// Get feedback history for workspace
router.get('/feedback-history/:workspaceId', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Load feedback history from disk if not in memory
    await activeLearningService.loadFeedbackHistory(workspaceId);

    const feedbackHistory = activeLearningService.feedbackHistory.get(workspaceId) || [];

    res.json({
      message: 'Feedback history retrieved successfully',
      workspaceId,
      feedback: feedbackHistory,
      totalFeedback: feedbackHistory.length,
      statistics: {
        totalCorrections: feedbackHistory.length,
        intentCorrections: feedbackHistory.reduce((acc, f) => {
          acc[f.correctedIntent] = (acc[f.correctedIntent] || 0) + 1;
          return acc;
        }, {}),
        recentFeedback: feedbackHistory.slice(-5)
      }
    });

  } catch (error) {
    console.error('Get feedback history error:', error);
    res.status(500).json({
      message: 'Failed to retrieve feedback history',
      error: error.message
    });
  }
});

// POST /api/active-learning/retrain
// Generate retraining data and trigger model retraining
router.post('/retrain', auth, async (req, res) => {
  try {
    const { workspaceId, includeOriginalData = true } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID is required' });
    }

    console.log(`🔄 Starting active learning retraining for workspace: ${workspaceId}`);

    // Load feedback history
    await activeLearningService.loadFeedbackHistory(workspaceId);

    // Generate retraining data from feedback
    const retrainingData = activeLearningService.generateRetrainingData(workspaceId);

    if (retrainingData.length === 0) {
      return res.status(400).json({
        message: 'No feedback data available for retraining',
        suggestion: 'Please review and provide feedback for uncertain samples first'
      });
    }

    // Get original training data if requested
    let combinedData = retrainingData;
    if (includeOriginalData) {
      try {
        const originalModel = huggingfaceService.getModelInfo(workspaceId);
        if (originalModel && originalModel.trainingData) {
          combinedData = [...originalModel.trainingData, ...retrainingData];
        }
      } catch (error) {
        console.warn('Could not retrieve original training data:', error.message);
      }
    }

    // Retrain the model with combined data
    const retrainingResult = await huggingfaceService.trainModel(combinedData, workspaceId);

    res.json({
      message: 'Active learning retraining completed successfully',
      workspaceId,
      retrainingData: {
        feedbackSamples: retrainingData.length,
        totalTrainingData: combinedData.length,
        includeOriginalData
      },
      modelResult: {
        modelId: retrainingResult.modelId,
        intents: retrainingResult.intents,
        trainingExamples: retrainingResult.trainingExamples
      },
      recommendations: [
        'Model has been retrained with feedback corrections',
        'Consider running uncertainty analysis again to validate improvements',
        'Monitor model performance on new predictions'
      ]
    });

  } catch (error) {
    console.error('Active learning retraining error:', error);
    res.status(500).json({
      message: 'Failed to retrain model with active learning data',
      error: error.message
    });
  }
});

// GET /api/active-learning/statistics/:workspaceId
// Get active learning statistics for workspace
router.get('/statistics/:workspaceId', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Load data from disk
    await activeLearningService.loadUncertainSamples(workspaceId);
    await activeLearningService.loadFeedbackHistory(workspaceId);

    const uncertainSamples = activeLearningService.uncertainSamples.get(workspaceId) || [];
    const feedbackHistory = activeLearningService.feedbackHistory.get(workspaceId) || [];
    const settings = activeLearningService.confidenceThresholds.get(workspaceId) || {};

    const statistics = {
      uncertainSamples: {
        total: uncertainSamples.length,
        pending: uncertainSamples.filter(s => s.status === 'pending_review').length,
        reviewed: uncertainSamples.filter(s => s.status === 'reviewed').length,
        averageConfidence: uncertainSamples.length > 0 ? 
          (uncertainSamples.reduce((sum, s) => sum + s.confidence, 0) / uncertainSamples.length).toFixed(3) : 0,
        averageUncertainty: uncertainSamples.length > 0 ?
          (uncertainSamples.reduce((sum, s) => sum + s.uncertaintyScore, 0) / uncertainSamples.length).toFixed(3) : 0
      },
      feedback: {
        total: feedbackHistory.length,
        recentFeedback: feedbackHistory.slice(-10),
        intentDistribution: feedbackHistory.reduce((acc, f) => {
          acc[f.correctedIntent] = (acc[f.correctedIntent] || 0) + 1;
          return acc;
        }, {}),
        feedbackRate: uncertainSamples.length > 0 ? 
          ((feedbackHistory.length / uncertainSamples.length) * 100).toFixed(1) : 0
      },
      settings: settings,
      lastAnalysis: uncertainSamples.length > 0 ? uncertainSamples[0].timestamp : null,
      improvementPotential: this.calculateImprovementPotential(uncertainSamples, feedbackHistory)
    };

    res.json({
      message: 'Active learning statistics retrieved successfully',
      workspaceId,
      statistics
    });

  } catch (error) {
    console.error('Get active learning statistics error:', error);
    res.status(500).json({
      message: 'Failed to retrieve active learning statistics',
      error: error.message
    });
  }
});

// Helper function to calculate improvement potential
function calculateImprovementPotential(uncertainSamples, feedbackHistory) {
  if (uncertainSamples.length === 0) return 'No data available';
  
  const reviewedPercentage = (feedbackHistory.length / uncertainSamples.length) * 100;
  
  if (reviewedPercentage < 20) return 'High - Many samples need review';
  if (reviewedPercentage < 50) return 'Medium - Some samples reviewed';
  if (reviewedPercentage < 80) return 'Good - Most samples reviewed';
  return 'Excellent - All samples reviewed';
}

// POST /api/active-learning/batch-predict
// Get predictions for a batch of texts with uncertainty scores
router.post('/batch-predict', auth, async (req, res) => {
  try {
    const { workspaceId, texts, includeUncertainty = true } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID is required' });
    }

    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({ message: 'Texts array is required' });
    }

    console.log(`🔮 Batch prediction with uncertainty for ${texts.length} texts`);

    const predictions = [];
    
    for (const text of texts) {
      try {
        const prediction = await huggingfaceService.predictIntent(text, workspaceId);
        
        let uncertaintyInfo = null;
        if (includeUncertainty) {
          const entropy = activeLearningService.calculateEntropy(prediction);
          const marginUncertainty = activeLearningService.calculateMarginUncertainty(prediction);
          
          uncertaintyInfo = {
            entropy,
            marginUncertainty,
            isUncertain: prediction.confidence < 0.7 || entropy > 0.5,
            uncertaintyReason: activeLearningService.getUncertaintyReason(
              prediction.confidence, 
              entropy, 
              activeLearningService.hasLowConfidenceGap(prediction, 0.2)
            )
          };
        }

        predictions.push({
          text,
          prediction: {
            intent: prediction.predictedIntent,
            confidence: prediction.confidence,
            allPredictions: prediction.allPredictions
          },
          uncertainty: uncertaintyInfo
        });

      } catch (predError) {
        predictions.push({
          text,
          error: predError.message,
          prediction: null,
          uncertainty: null
        });
      }
    }

    const uncertainCount = predictions.filter(p => p.uncertainty?.isUncertain).length;

    res.json({
      message: 'Batch prediction completed successfully',
      workspaceId,
      predictions,
      summary: {
        total: predictions.length,
        successful: predictions.filter(p => !p.error).length,
        errors: predictions.filter(p => p.error).length,
        uncertain: uncertainCount,
        uncertaintyRate: ((uncertainCount / predictions.length) * 100).toFixed(1)
      }
    });

  } catch (error) {
    console.error('Batch prediction error:', error);
    res.status(500).json({
      message: 'Failed to perform batch prediction',
      error: error.message
    });
  }
});

export default router;