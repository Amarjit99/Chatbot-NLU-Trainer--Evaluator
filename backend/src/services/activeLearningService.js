import fs from 'fs-extra';
import path from 'path';

/**
 * Active Learning Service for uncertainty detection and sample selection
 */
class ActiveLearningService {
  constructor() {
    this.uncertainSamples = new Map(); // workspace -> uncertain samples
    this.confidenceThresholds = new Map(); // workspace -> threshold settings
    this.feedbackHistory = new Map(); // workspace -> feedback history
  }

  /**
   * Analyze predictions for uncertainty and low confidence samples
   * @param {string} workspaceId - Workspace identifier
   * @param {Array} predictions - Model predictions with confidence scores
   * @param {Object} settings - Active learning settings
   * @returns {Object} - Uncertainty analysis results
   */
  async analyzeUncertainty(workspaceId, predictions, settings = {}) {
    try {
      const {
        confidenceThreshold = 0.7,
        uncertaintyMethod = 'entropy',
        maxSamples = 50,
        minConfidenceGap = 0.2
      } = settings;

      // Store settings for workspace
      this.confidenceThresholds.set(workspaceId, settings);

      console.log(`🔍 Analyzing uncertainty for ${predictions.length} predictions in workspace: ${workspaceId}`);

      const uncertainSamples = [];
      const analysis = {
        totalPredictions: predictions.length,
        uncertainSamples: 0,
        lowConfidenceSamples: 0,
        highConfidenceSamples: 0,
        averageConfidence: 0,
        uncertaintyDistribution: {}
      };

      let totalConfidence = 0;

      predictions.forEach((prediction, index) => {
        const confidence = prediction.confidence || 0;
        totalConfidence += confidence;

        // Calculate uncertainty score based on method
        let uncertaintyScore = 0;
        
        if (uncertaintyMethod === 'entropy') {
          uncertaintyScore = this.calculateEntropy(prediction);
        } else if (uncertaintyMethod === 'confidence') {
          uncertaintyScore = 1 - confidence;
        } else if (uncertaintyMethod === 'margin') {
          uncertaintyScore = this.calculateMarginUncertainty(prediction);
        }

        // Check if sample is uncertain
        const isUncertain = confidence < confidenceThreshold || uncertaintyScore > 0.5;
        const hasLowConfidenceGap = this.hasLowConfidenceGap(prediction, minConfidenceGap);

        if (isUncertain || hasLowConfidenceGap) {
          const uncertainSample = {
            id: `uncertain_${workspaceId}_${index}_${Date.now()}`,
            text: prediction.text,
            predictedIntent: prediction.predictedIntent || prediction.intent,
            confidence: confidence,
            uncertaintyScore: uncertaintyScore,
            reason: this.getUncertaintyReason(confidence, uncertaintyScore, hasLowConfidenceGap),
            timestamp: new Date().toISOString(),
            status: 'pending_review',
            originalPrediction: prediction
          };

          uncertainSamples.push(uncertainSample);
          analysis.uncertainSamples++;
        }

        // Update analysis stats
        if (confidence < 0.5) {
          analysis.lowConfidenceSamples++;
        } else if (confidence > 0.8) {
          analysis.highConfidenceSamples++;
        }

        // Update uncertainty distribution
        const uncertaintyBucket = Math.floor(uncertaintyScore * 10) / 10;
        analysis.uncertaintyDistribution[uncertaintyBucket] = 
          (analysis.uncertaintyDistribution[uncertaintyBucket] || 0) + 1;
      });

      analysis.averageConfidence = totalConfidence / predictions.length;

      // Sort by uncertainty score (highest first)
      uncertainSamples.sort((a, b) => b.uncertaintyScore - a.uncertaintyScore);

      // Limit to max samples
      const selectedSamples = uncertainSamples.slice(0, maxSamples);

      // Store uncertain samples for workspace
      this.uncertainSamples.set(workspaceId, selectedSamples);

      // Save to disk for persistence
      await this.saveUncertainSamples(workspaceId, selectedSamples);

      console.log(`✅ Uncertainty analysis complete: ${selectedSamples.length} uncertain samples identified`);

      return {
        success: true,
        workspaceId,
        analysis,
        uncertainSamples: selectedSamples,
        settings: settings,
        recommendations: this.generateActiveLearningRecommendations(analysis, selectedSamples)
      };

    } catch (error) {
      console.error('❌ Uncertainty analysis failed:', error.message);
      throw new Error(`Uncertainty analysis failed: ${error.message}`);
    }
  }

  /**
   * Calculate entropy-based uncertainty
   * @param {Object} prediction - Prediction with confidence scores
   * @returns {number} - Entropy score
   */
  calculateEntropy(prediction) {
    const confidence = prediction.confidence || 0;
    
    // Simulate multiple class probabilities for entropy calculation
    // In real implementation, this would use actual class probabilities
    const probabilities = [
      confidence,
      (1 - confidence) / 2,
      (1 - confidence) / 2
    ].filter(p => p > 0);

    let entropy = 0;
    probabilities.forEach(p => {
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    });

    // Normalize entropy (max entropy for 3 classes is log2(3) ≈ 1.58)
    return entropy / Math.log2(probabilities.length);
  }

  /**
   * Calculate margin-based uncertainty
   * @param {Object} prediction - Prediction with confidence scores
   * @returns {number} - Margin uncertainty score
   */
  calculateMarginUncertainty(prediction) {
    const confidence = prediction.confidence || 0;
    const secondBest = prediction.secondBestConfidence || ((1 - confidence) * 0.7);
    
    return 1 - (confidence - secondBest);
  }

  /**
   * Check if prediction has low confidence gap between top predictions
   * @param {Object} prediction - Prediction object
   * @param {number} minGap - Minimum confidence gap threshold
   * @returns {boolean} - Whether gap is too small
   */
  hasLowConfidenceGap(prediction, minGap) {
    const confidence = prediction.confidence || 0;
    const secondBest = prediction.secondBestConfidence || ((1 - confidence) * 0.7);
    
    return (confidence - secondBest) < minGap;
  }

  /**
   * Get human-readable reason for uncertainty
   * @param {number} confidence - Confidence score
   * @param {number} uncertaintyScore - Uncertainty score
   * @param {boolean} hasLowGap - Whether confidence gap is low
   * @returns {string} - Uncertainty reason
   */
  getUncertaintyReason(confidence, uncertaintyScore, hasLowGap) {
    if (confidence < 0.3) return 'Very low confidence';
    if (confidence < 0.5) return 'Low confidence';
    if (hasLowGap) return 'Ambiguous predictions';
    if (uncertaintyScore > 0.7) return 'High entropy';
    return 'Uncertain prediction';
  }

  /**
   * Submit feedback for uncertain samples
   * @param {string} workspaceId - Workspace identifier
   * @param {Array} feedback - Array of feedback objects
   * @returns {Object} - Feedback processing result
   */
  async submitFeedback(workspaceId, feedback) {
    try {
      console.log(`📝 Processing feedback for ${feedback.length} samples in workspace: ${workspaceId}`);

      const processedFeedback = [];
      const existingHistory = this.feedbackHistory.get(workspaceId) || [];

      feedback.forEach(item => {
        const feedbackEntry = {
          id: item.sampleId,
          originalText: item.text,
          originalPrediction: item.originalPrediction,
          correctedIntent: item.correctedIntent,
          // Prefer user-supplied confidence (0..1) when available, else fall back to originalConfidence or 0
          confidence: (typeof item.userConfidence === 'number') ? Math.max(0, Math.min(1, item.userConfidence)) : (item.originalConfidence || 0),
          // store the normalized userConfidence explicitly for retraining use
          userConfidence: (typeof item.userConfidence === 'number') ? Math.max(0, Math.min(1, item.userConfidence)) : undefined,
          timestamp: new Date().toISOString(),
          feedbackType: item.feedbackType || 'correction',
          annotatorNotes: item.notes || ''
        };

        processedFeedback.push(feedbackEntry);

        // Update uncertain samples status
        const uncertainSamples = this.uncertainSamples.get(workspaceId) || [];
        const sampleIndex = uncertainSamples.findIndex(s => s.id === item.sampleId);
        if (sampleIndex !== -1) {
          uncertainSamples[sampleIndex].status = 'reviewed';
          uncertainSamples[sampleIndex].correctedIntent = item.correctedIntent;
          uncertainSamples[sampleIndex].reviewedAt = new Date().toISOString();
        }
      });

      // Update feedback history
      const updatedHistory = [...existingHistory, ...processedFeedback];
      this.feedbackHistory.set(workspaceId, updatedHistory);

      // Save feedback to disk
      await this.saveFeedbackHistory(workspaceId, processedFeedback);

      // Generate retraining data
      const retrainingData = this.generateRetrainingData(workspaceId);

      console.log(`✅ Feedback processed: ${processedFeedback.length} corrections`);

      return {
        success: true,
        processedFeedback: processedFeedback.length,
        feedbackHistory: updatedHistory.length,
        retrainingData: retrainingData.length,
        recommendations: this.generateFeedbackRecommendations(processedFeedback)
      };

    } catch (error) {
      console.error('❌ Feedback processing failed:', error.message);
      throw new Error(`Feedback processing failed: ${error.message}`);
    }
  }

  /**
   * Generate retraining data from feedback
   * @param {string} workspaceId - Workspace identifier
   * @returns {Array} - Retraining data samples
   */
  generateRetrainingData(workspaceId) {
    const feedbackHistory = this.feedbackHistory.get(workspaceId) || [];
    
    return feedbackHistory.map(feedback => ({
      text: feedback.originalText,
      label: feedback.correctedIntent,
      // Use user-supplied normalized confidence (0..1) if present, else default to 1.0
      confidence: (typeof feedback.userConfidence === 'number') ? Math.max(0, Math.min(1, feedback.userConfidence)) : 1.0,
      source: 'active_learning_feedback',
      timestamp: feedback.timestamp
    }));
  }

  /**
   * Get uncertain samples for review
   * @param {string} workspaceId - Workspace identifier
   * @param {Object} filters - Filter options
   * @returns {Object} - Uncertain samples with metadata
   */
  getUncertainSamples(workspaceId, filters = {}) {
    const samples = this.uncertainSamples.get(workspaceId) || [];
    const settings = this.confidenceThresholds.get(workspaceId) || {};
    
    let filteredSamples = samples;

    // Apply filters
    if (filters.status) {
      filteredSamples = filteredSamples.filter(s => s.status === filters.status);
    }
    
    if (filters.minUncertainty) {
      filteredSamples = filteredSamples.filter(s => s.uncertaintyScore >= filters.minUncertainty);
    }

    if (filters.maxConfidence) {
      filteredSamples = filteredSamples.filter(s => s.confidence <= filters.maxConfidence);
    }

    return {
      samples: filteredSamples,
      totalSamples: samples.length,
      settings: settings,
      statistics: this.calculateSampleStatistics(samples)
    };
  }

  /**
   * Calculate statistics for uncertain samples
   * @param {Array} samples - Uncertain samples
   * @returns {Object} - Statistics
   */
  calculateSampleStatistics(samples) {
    if (samples.length === 0) return {};

    const totalSamples = samples.length;
    const reviewedSamples = samples.filter(s => s.status === 'reviewed').length;
    const pendingSamples = totalSamples - reviewedSamples;

    const avgConfidence = samples.reduce((sum, s) => sum + s.confidence, 0) / totalSamples;
    const avgUncertainty = samples.reduce((sum, s) => sum + s.uncertaintyScore, 0) / totalSamples;

    const reasonCounts = {};
    samples.forEach(s => {
      reasonCounts[s.reason] = (reasonCounts[s.reason] || 0) + 1;
    });

    return {
      totalSamples,
      reviewedSamples,
      pendingSamples,
      reviewedPercentage: (reviewedSamples / totalSamples * 100).toFixed(1),
      avgConfidence: avgConfidence.toFixed(3),
      avgUncertainty: avgUncertainty.toFixed(3),
      reasonDistribution: reasonCounts
    };
  }

  /**
   * Generate active learning recommendations
   * @param {Object} analysis - Uncertainty analysis
   * @param {Array} samples - Uncertain samples
   * @returns {Array} - Recommendations
   */
  generateActiveLearningRecommendations(analysis, samples) {
    const recommendations = [];

    if (analysis.averageConfidence < 0.6) {
      recommendations.push('Model confidence is low - consider collecting more training data');
    }

    if (samples.length > 30) {
      recommendations.push('High number of uncertain samples - prioritize reviewing high uncertainty scores');
    }

    if (analysis.lowConfidenceSamples > analysis.totalPredictions * 0.3) {
      recommendations.push('Many low confidence predictions - model may need retraining');
    }

    const topReasons = Object.entries(analysis.uncertaintyDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2);

    if (topReasons.length > 0) {
      recommendations.push(`Most common uncertainty: ${topReasons[0][0]} range`);
    }

    return recommendations;
  }

  /**
   * Generate feedback recommendations
   * @param {Array} feedback - Processed feedback
   * @returns {Array} - Recommendations
   */
  generateFeedbackRecommendations(feedback) {
    const recommendations = [];

    if (feedback.length >= 10) {
      recommendations.push('Sufficient feedback collected - consider model retraining');
    }

    const intentCounts = {};
    feedback.forEach(f => {
      intentCounts[f.correctedIntent] = (intentCounts[f.correctedIntent] || 0) + 1;
    });

    const topCorrectedIntents = Object.entries(intentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    if (topCorrectedIntents.length > 0) {
      recommendations.push(`Most corrected intent: ${topCorrectedIntents[0][0]} (${topCorrectedIntents[0][1]} corrections)`);
    }

    return recommendations;
  }

  /**
   * Save uncertain samples to disk
   * @param {string} workspaceId - Workspace identifier
   * @param {Array} samples - Uncertain samples
   */
  async saveUncertainSamples(workspaceId, samples) {
    try {
      const activeLearningDir = path.join('uploads', 'active-learning');
      await fs.ensureDir(activeLearningDir);

      const filePath = path.join(activeLearningDir, `${workspaceId}_uncertain_samples.json`);
      await fs.writeJson(filePath, {
        workspaceId,
        samples,
        createdAt: new Date().toISOString(),
        totalSamples: samples.length
      }, { spaces: 2 });

      console.log(`💾 Uncertain samples saved: ${filePath}`);
    } catch (error) {
      console.error('Failed to save uncertain samples:', error.message);
    }
  }

  /**
   * Save feedback history to disk
   * @param {string} workspaceId - Workspace identifier
   * @param {Array} feedback - Feedback entries
   */
  async saveFeedbackHistory(workspaceId, feedback) {
    try {
      const activeLearningDir = path.join('uploads', 'active-learning');
      await fs.ensureDir(activeLearningDir);

      const filePath = path.join(activeLearningDir, `${workspaceId}_feedback_history.json`);
      
      // Load existing feedback if file exists
      let existingFeedback = [];
      if (await fs.pathExists(filePath)) {
        const existingData = await fs.readJson(filePath);
        existingFeedback = existingData.feedback || [];
      }

      const updatedFeedback = [...existingFeedback, ...feedback];

      await fs.writeJson(filePath, {
        workspaceId,
        feedback: updatedFeedback,
        lastUpdated: new Date().toISOString(),
        totalFeedback: updatedFeedback.length
      }, { spaces: 2 });

      console.log(`💾 Feedback history saved: ${filePath}`);
    } catch (error) {
      console.error('Failed to save feedback history:', error.message);
    }
  }

  /**
   * Load uncertain samples from disk
   * @param {string} workspaceId - Workspace identifier
   */
  async loadUncertainSamples(workspaceId) {
    try {
      const filePath = path.join('uploads', 'active-learning', `${workspaceId}_uncertain_samples.json`);
      
      if (await fs.pathExists(filePath)) {
        const data = await fs.readJson(filePath);
        this.uncertainSamples.set(workspaceId, data.samples || []);
        console.log(`📁 Loaded uncertain samples for workspace: ${workspaceId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load uncertain samples:', error.message);
      return false;
    }
  }

  /**
   * Load feedback history from disk
   * @param {string} workspaceId - Workspace identifier
   */
  async loadFeedbackHistory(workspaceId) {
    try {
      const filePath = path.join('uploads', 'active-learning', `${workspaceId}_feedback_history.json`);
      
      if (await fs.pathExists(filePath)) {
        const data = await fs.readJson(filePath);
        this.feedbackHistory.set(workspaceId, data.feedback || []);
        console.log(`📁 Loaded feedback history for workspace: ${workspaceId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load feedback history:', error.message);
      return false;
    }
  }
}

// Create and export singleton instance
export const activeLearningService = new ActiveLearningService();
export default ActiveLearningService;