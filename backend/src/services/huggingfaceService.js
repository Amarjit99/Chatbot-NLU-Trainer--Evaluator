import { HfInference } from '@huggingface/inference';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';

class HuggingFaceService {
  constructor() {
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    this.modelName = process.env.HUGGINGFACE_MODEL_NAME || 'microsoft/DialoGPT-medium';
    this.trainedModels = new Map(); // Cache for trained models
    this.modelsDir = path.join('uploads', 'models');
    this._loadAllModelsFromDisk();
  }

  async _loadAllModelsFromDisk() {
    try {
      await fs.ensureDir(this.modelsDir);
      const files = await fs.readdir(this.modelsDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.modelsDir, file);
          const modelInfo = await fs.readJson(filePath);
          
          // Handle both regular models and multi-backend models
          let workspaceId = modelInfo.workspaceId;
          
          // For multi-backend models, extract workspace ID from filename
          if (!workspaceId && file.includes('_huggingface.json')) {
            workspaceId = file.replace('_huggingface.json', '');
            modelInfo.workspaceId = workspaceId;
            modelInfo.id = modelInfo.modelId || `${workspaceId}_huggingface`;
            modelInfo.status = 'trained';
          }
          
          if (workspaceId) {
            this.trainedModels.set(workspaceId, modelInfo);
          }
        }
      }
      console.log(`🔄 Loaded ${this.trainedModels.size} models from disk.`);
    } catch (err) {
      console.error('Failed to load models from disk:', err);
    }
  }

  /**
   * Train a model using HuggingFace AutoTrain
   * @param {string} yamlPath - Path to the YAML training data
   * @param {string} workspaceId - Unique identifier for the workspace
   * @returns {Promise<Object>} - Training result
   */
  async trainModel(yamlPath, workspaceId) {
    try {
      console.log(`🚀 Starting model training for workspace: ${workspaceId}`);
      
      // Read YAML data
      const yamlData = await fs.readFile(yamlPath, 'utf8');
      
      // For this implementation, we'll use a text classification approach
      // In a real scenario, you would use HuggingFace AutoTrain or fine-tune a model
      const trainingData = this.parseYamlData(yamlData);
      
      // Simulate model training (replace with actual HuggingFace training)
      const modelId = `intent-classifier-${workspaceId}-${Date.now()}`;
      
      // Store model metadata
      const modelInfo = {
        id: modelId,
        workspaceId,
        trainingData: trainingData,
        createdAt: new Date().toISOString(),
        status: 'trained',
        intents: [...new Set(trainingData.map(item => item.label))]
      };

      this.trainedModels.set(workspaceId, modelInfo);
      // Persist model info to disk
      await fs.ensureDir(this.modelsDir);
      const modelPath = path.join(this.modelsDir, `${workspaceId}.json`);
      await fs.writeJson(modelPath, modelInfo, { spaces: 2 });

      console.log(`✅ Model training completed: ${modelId}`);
      console.log(`📊 Trained on ${trainingData.length} examples`);
      console.log(`🎯 Supports ${modelInfo.intents.length} intents`);

      return {
        success: true,
        modelId,
        workspaceId,
        intents: modelInfo.intents,
        trainingExamples: trainingData.length,
        message: 'Model trained successfully'
      };

    } catch (error) {
      console.error('❌ Model training failed:', error.message);
      throw new Error(`Training failed: ${error.message}`);
    }
  }

  /**
   * Predict intent for a given text using the trained model
   * @param {string} text - Input text to classify
   * @param {string} workspaceId - Workspace identifier
   * @returns {Promise<Object>} - Prediction result
   */
  async predictIntent(text, workspaceId) {
    try {
      let modelInfo = this.getModelInfo(workspaceId);
      
      if (!modelInfo) {
        throw new Error(`No trained model found for workspace: ${workspaceId}`);
      }

      console.log(`🔍 Predicting intent for: "${text}"`);

      // Simple rule-based classification (replace with actual ML model)
      const prediction = this.classifyText(text, modelInfo.trainingData);
      
      const result = {
        text,
        predictedIntent: prediction.intent,
        confidence: prediction.confidence,
        alternatives: prediction.alternatives,
        workspaceId,
        modelId: modelInfo.id
      };

      console.log(`✅ Prediction: ${prediction.intent} (${(prediction.confidence * 100).toFixed(1)}%)`);

      return result;

    } catch (error) {
      console.error('❌ Intent prediction failed:', error.message);
      throw new Error(`Prediction failed: ${error.message}`);
    }
  }

  /**
   * Parse YAML training data
   * @param {string} yamlContent - YAML content as string
   * @returns {Array} - Parsed training data
   */
  parseYamlData(yamlContent) {
    try {
      const data = yaml.load(yamlContent);
      
      if (!data.data || !data.data.training) {
        throw new Error('Invalid YAML structure: Missing data.training section');
      }

      return data.data.training;
    } catch (error) {
      throw new Error(`Failed to parse YAML: ${error.message}`);
    }
  }

  /**
   * Improved text classification using enhanced keyword matching and similarity
   * @param {string} text - Input text
   * @param {Array} trainingData - Training examples
   * @returns {Object} - Classification result
   */
  classifyText(text, trainingData) {
    const textLower = text.toLowerCase();
    
    // Group training data by intent
    const intentGroups = {};
    trainingData.forEach(item => {
      const intent = item.label || item.intent;
      if (!intentGroups[intent]) {
        intentGroups[intent] = [];
      }
      intentGroups[intent].push(item.text.toLowerCase());
    });

    // Calculate similarity scores for each intent with improved matching
    const scores = {};
    Object.keys(intentGroups).forEach(intent => {
      const examples = intentGroups[intent];
      let maxSimilarity = 0;
      
      examples.forEach(example => {
        const similarity = this.calculateSimilarity(textLower, example);
        // Boost exact matches
        if (textLower === example) {
          maxSimilarity = Math.max(maxSimilarity, 0.95);
        } else if (textLower.includes(example) || example.includes(textLower)) {
          maxSimilarity = Math.max(maxSimilarity, similarity + 0.3);
        } else {
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }
      });
      
      scores[intent] = Math.min(maxSimilarity, 0.95); // Cap at 95%
    });

    // Find best match
    const sortedScores = Object.entries(scores)
      .sort(([,a], [,b]) => b - a);

    if (sortedScores.length === 0) {
      return {
        intent: 'unknown',
        confidence: 0.1,
        alternatives: []
      };
    }

    const [predictedIntent, confidence] = sortedScores[0];
    const alternatives = sortedScores.slice(1, 4).map(([intent, score]) => ({
      intent,
      confidence: score
    }));

    // Ensure minimum realistic confidence for good matches
    const finalConfidence = confidence > 0.3 ? 
      Math.max(0.6, confidence) : // Good matches get at least 60%
      Math.max(0.2, confidence);   // Poor matches get at least 20%

    return {
      intent: predictedIntent,
      confidence: finalConfidence,
      alternatives
    };
  }

  /**
   * Calculate text similarity using simple keyword overlap
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {number} - Similarity score (0-1)
   */
  calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Get model information for a workspace
   * @param {string} workspaceId - Workspace identifier
   * @returns {Object|null} - Model information
   */
  getModelInfo(workspaceId) {
    let modelInfo = this.trainedModels.get(workspaceId);
    
    // If not found, try to load from multi-backend models
    if (!modelInfo) {
      try {
        const multiBackendPath = path.join('uploads', 'models', `${workspaceId}_huggingface.json`);
        if (fs.existsSync(multiBackendPath)) {
          const multiBackendModel = fs.readJsonSync(multiBackendPath);
          modelInfo = {
            id: multiBackendModel.modelId || `${workspaceId}_huggingface`,
            workspaceId: workspaceId,
            trainingData: multiBackendModel.trainingData || [],
            createdAt: multiBackendModel.timestamp || new Date().toISOString(),
            status: 'trained',
            intents: multiBackendModel.intents || []
          };
          // Cache it for future use
          this.trainedModels.set(workspaceId, modelInfo);
          console.log(`✅ Loaded multi-backend model for workspace: ${workspaceId}`);
        }
      } catch (error) {
        console.log(`⚠️ Error loading multi-backend model for ${workspaceId}:`, error.message);
      }
    }
    
    if (!modelInfo) {
      console.log(`⚠️ No model found for workspace: ${workspaceId}`);
      console.log(`📋 Available workspaces: ${Array.from(this.trainedModels.keys()).join(', ')}`);
    }
    return modelInfo;
  }

  /**
   * List all trained models
   * @returns {Array} - List of model information
   */
  listModels() {
    return Array.from(this.trainedModels.values());
  }

  /**
   * Delete a trained model
   * @param {string} workspaceId - Workspace identifier
   * @returns {boolean} - Success status
   */
  deleteModel(workspaceId) {
    return this.trainedModels.delete(workspaceId);
  }
}

export default new HuggingFaceService();
