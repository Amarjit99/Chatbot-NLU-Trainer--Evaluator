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
  async trainModel(yamlPathOrData, workspaceId) {
    try {
      console.log(`🚀 Starting model training for workspace: ${workspaceId}`);

      let trainingData = [];

      // Accept either a path to a YAML file (string) or an array of training objects
      if (typeof yamlPathOrData === 'string') {
        // Read YAML data from file path
        const yamlData = await fs.readFile(yamlPathOrData, 'utf8');
        trainingData = this.parseYamlData(yamlData);
      } else if (Array.isArray(yamlPathOrData)) {
        // Already an array of training examples - preserve confidence and other fields
        trainingData = yamlPathOrData.map(item => {
          const textVal = item.text || item.utterance || item.example || '';
          const labelVal = item.label || item.intent || item.intentName || '';

          // Normalize confidence from several possible fields
          let conf = undefined;
          if (typeof item.confidence === 'number') {
            conf = item.confidence > 1 ? Math.max(0, Math.min(100, item.confidence)) / 100 : Math.max(0, Math.min(1, item.confidence));
          } else if (typeof item.confidencePercent === 'number') {
            conf = Math.max(0, Math.min(100, item.confidencePercent)) / 100;
          } else if (typeof item.userConfidence === 'number') {
            conf = Math.max(0, Math.min(1, item.userConfidence));
          }

          const normalized = {
            ...item,
            text: textVal,
            label: labelVal
          };

          if (typeof conf === 'number') normalized.confidence = conf;

          return normalized;
        });
      } else {
        throw new Error('Unsupported training data format. Provide a YAML file path or an array of training objects');
      }
      
      // Simulate model training (replace with actual HuggingFace training)
      const modelId = `intent-classifier-${workspaceId}-${Date.now()}`;
      
      // Store model metadata
      const modelInfo = {
        id: modelId,
        workspaceId,
        trainingData: trainingData,
        createdAt: new Date().toISOString(),
        status: 'trained',
        intents: [...new Set(trainingData.map(item => item.label || item.intent))]
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
      console.log(`🔍 Predicting intent for workspace: ${workspaceId}`);
      console.log(`📝 Input text: "${text?.substring(0, 100)}..."`);
      
      let modelInfo = this.getModelInfo(workspaceId);
      
      if (!modelInfo) {
        // List available workspace IDs for debugging
        const availableIds = Array.from(this.trainedModels.keys());
        console.error(`❌ No trained model found for workspace: ${workspaceId}`);
        console.error(`📋 Available workspace IDs (${availableIds.length}):`, availableIds);
        
        throw new Error(
          `No trained model found for workspace "${workspaceId}". ` +
          `Please train a model first. Available workspaces: ${availableIds.length > 0 ? availableIds.join(', ') : 'none'}`
        );
      }

      console.log(`✅ Found model: ${modelInfo.id}`);
      console.log(`📊 Model has ${modelInfo.trainingData?.length || 0} training examples`);
      console.log(`🎯 Supports ${modelInfo.intents?.length || 0} intents: ${(modelInfo.intents || []).slice(0, 5).join(', ')}...`);

      // Simple rule-based classification (replace with actual ML model)
      const prediction = this.classifyText(text, modelInfo.trainingData);

      // Build allPredictions array (top + alternatives)
      const allPredictions = [
        { intent: prediction.intent, confidence: prediction.confidence },
        ...(prediction.alternatives || [])
      ];

      // second best confidence (if available)
      const secondBestConfidence = allPredictions.length > 1 ? allPredictions[1].confidence : 0;

      // Rule-based suggestions (keywords -> intents)
      const ruleBasedSuggestions = this.ruleBasedSuggest(text);

      const result = {
        text,
        predictedIntent: prediction.intent,
        confidence: prediction.confidence,
        confidencePercent: (prediction.confidence * 100),
        alternatives: prediction.alternatives,
        allPredictions,
        secondBestConfidence,
        legacyPrediction: {
          label: 'Legacy Intent Prediction',
          intent: prediction.intent,
          confidencePercent: (prediction.confidence * 100).toFixed(1),
          alternatives: (prediction.alternatives || []).map(a => ({ intent: a.intent, confidencePercent: (a.confidence * 100).toFixed(1) }))
        },
        ruleBasedSuggestions,
        workspaceId,
        modelId: modelInfo.id
      };

      console.log(`✅ Prediction: ${prediction.intent} (${(prediction.confidence * 100).toFixed(1)}%)`);

      return result;

    } catch (error) {
      console.error('❌ Intent prediction failed:', error.message);
      throw error; // Re-throw to let the route handler send it to frontend
    }
  }

  /**
   * Simple rule-based suggestions using keyword mapping
   * @param {string} text
   * @returns {Array<string>} suggested intents
   */
  ruleBasedSuggest(text) {
    const lower = (text || '').toLowerCase();
    const suggestions = new Set();

    const rules = {
      book_hotel: ['hotel', 'reserve', 'stay', 'room', 'accommodation'],
      book_taxi: ['taxi', 'cab', 'ride', 'pickup', 'dropoff'],
      find_restaurant: ['restaurant', 'eat', 'dinner', 'lunch', 'breakfast'],
      book_flight: ['flight', 'plane', 'airline', 'ticket'],
      play_music: ['song', 'play', 'music', 'playlist']
    };

    Object.entries(rules).forEach(([intent, keywords]) => {
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          suggestions.add(intent);
          break;
        }
      }
    });

    return Array.from(suggestions);
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
      // Attach weight from item.confidence (0..1) or default to 1.0
      intentGroups[intent].push({ text: (item.text || item.utterance || '').toLowerCase(), weight: (typeof item.confidence === 'number') ? Math.max(0, Math.min(1, item.confidence)) : 1.0 });
    });

    // Calculate similarity scores for each intent with improved matching
    const scores = {};
    Object.keys(intentGroups).forEach(intent => {
      const examples = intentGroups[intent];
      let maxSimilarity = 0;
      
      examples.forEach(example => {
        const similarity = this.calculateSimilarity(textLower, example.text);
        // Apply example weight to similarity
        let weightedSimilarity = similarity * (example.weight || 1.0);

        // Boost exact matches
        if (textLower === example.text) {
          weightedSimilarity = Math.max(weightedSimilarity, 0.95 * (example.weight || 1.0));
        } else if (textLower.includes(example.text) || example.text.includes(textLower)) {
          weightedSimilarity = Math.max(weightedSimilarity, Math.min(0.95, similarity + 0.3) * (example.weight || 1.0));
        }

        maxSimilarity = Math.max(maxSimilarity, weightedSimilarity);
      });
      
      // Cap at 95%
      scores[intent] = Math.min(maxSimilarity, 0.95);
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
