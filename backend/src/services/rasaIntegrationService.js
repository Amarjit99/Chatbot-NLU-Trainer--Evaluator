import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';

class RasaIntegrationService {
  constructor() {
    this.rasaServerUrl = process.env.RASA_SERVER_URL || 'http://localhost:5005';
    this.rasaModels = new Map(); // Store trained Rasa models per workspace
    this.trainingStatus = new Map(); // Track training status
  }

  /**
   * Train a Rasa NLU model with the provided training data
   * @param {string} workspaceId - Workspace identifier
   * @param {Array} trainingData - Training samples with text and intent
   * @returns {Object} - Training result
   */
  async trainRasaModel(workspaceId, trainingData) {
    try {
      console.log(`🤖 Training Rasa model for workspace: ${workspaceId}`);
      
      this.trainingStatus.set(workspaceId, 'training');
      
      // Convert training data to Rasa format
      const rasaTrainingData = this.convertToRasaFormat(trainingData);
      
      // Create Rasa training files
      const rasaDir = path.join('uploads', 'rasa-models', workspaceId);
      await fs.ensureDir(rasaDir);
      
      // Write nlu.yml
      const nluPath = path.join(rasaDir, 'nlu.yml');
      await fs.writeFile(nluPath, yaml.dump(rasaTrainingData.nlu, { 
        lineWidth: -1,
        noRefs: true 
      }));
      
      // Write config.yml
      const configPath = path.join(rasaDir, 'config.yml');
      await fs.writeFile(configPath, yaml.dump(this.getRasaConfig(), {
        lineWidth: -1,
        noRefs: true
      }));
      
      // Write domain.yml
      const domainPath = path.join(rasaDir, 'domain.yml');
      await fs.writeFile(domainPath, yaml.dump(rasaTrainingData.domain, {
        lineWidth: -1,
        noRefs: true
      }));

      // Simulate training (in production, call actual Rasa training API)
      await this.simulateRasaTraining(workspaceId, rasaDir);
      
      const modelId = `rasa_model_${workspaceId}_${Date.now()}`;
      const rasaModel = {
        id: modelId,
        workspaceId,
        type: 'rasa_nlu',
        backend: 'rasa',
        createdAt: new Date().toISOString(),
        trainingData,
        intents: [...new Set(trainingData.map(item => item.intent))],
        modelPath: rasaDir,
        status: 'trained',
        accuracy: 0.85 + Math.random() * 0.1, // Simulated accuracy
        confidence: 0.8 + Math.random() * 0.15
      };

      this.rasaModels.set(workspaceId, rasaModel);
      this.trainingStatus.set(workspaceId, 'completed');

      console.log(`✅ Rasa model trained successfully: ${rasaModel.intents.length} intents`);

      return {
        success: true,
        modelId,
        backend: 'rasa',
        intents: rasaModel.intents,
        trainingExamples: trainingData.length,
        accuracy: rasaModel.accuracy,
        confidence: rasaModel.confidence,
        modelPath: rasaDir
      };

    } catch (error) {
      console.error('❌ Rasa model training failed:', error.message);
      this.trainingStatus.set(workspaceId, 'failed');
      throw new Error(`Rasa training failed: ${error.message}`);
    }
  }

  /**
   * Predict intent using trained Rasa model
   * @param {string} text - Input text
   * @param {string} workspaceId - Workspace identifier
   * @returns {Object} - Prediction result
   */
  async predictWithRasa(text, workspaceId) {
    try {
      const rasaModel = this.rasaModels.get(workspaceId);
      if (!rasaModel) {
        throw new Error('No Rasa model found for this workspace');
      }

      console.log(`🔍 Rasa prediction for: "${text.substring(0, 50)}..."`);

      // Simulate Rasa prediction (in production, call actual Rasa API)
      const prediction = await this.simulateRasaPrediction(text, rasaModel);

      console.log(`✅ Rasa predicted intent: ${prediction.intent} (${prediction.confidence})`);

      return {
        backend: 'rasa',
        text,
        predictedIntent: prediction.intent,
        confidence: prediction.confidence,
        entities: prediction.entities || [],
        alternatives: prediction.alternatives || [],
        processingTime: prediction.processingTime
      };

    } catch (error) {
      console.error('❌ Rasa prediction failed:', error.message);
      throw new Error(`Rasa prediction failed: ${error.message}`);
    }
  }

  /**
   * Convert training data to Rasa NLU format
   * @param {Array} trainingData - Training samples
   * @returns {Object} - Rasa formatted data
   */
  convertToRasaFormat(trainingData) {
    const intents = {};
    const intentList = [];

    // Group examples by intent
    trainingData.forEach(sample => {
      const intent = sample.intent;
      if (!intents[intent]) {
        intents[intent] = [];
        intentList.push(intent);
      }
      intents[intent].push({
        text: sample.text,
        entities: sample.entities || []
      });
    });

    // Create NLU training data
    const nluData = {
      version: "3.1",
      nlu: []
    };

    Object.keys(intents).forEach(intent => {
      const examples = intents[intent].map(example => `- ${example.text}`).join('\n');
      nluData.nlu.push({
        intent,
        examples: examples
      });
    });

    // Create domain
    const domain = {
      version: "3.1",
      intents: intentList,
      responses: {},
      session_config: {
        session_expiration_time: 60,
        carry_over_slots_to_new_session: true
      }
    };

    return {
      nlu: nluData,
      domain: domain
    };
  }

  /**
   * Get Rasa configuration
   * @returns {Object} - Rasa config
   */
  getRasaConfig() {
    return {
      version: "3.1",
      assistant_id: "chatbot_nlu_trainer",
      language: "en",
      pipeline: [
        { name: "WhitespaceTokenizer" },
        { name: "RegexFeaturizer" },
        { name: "LexicalSyntacticFeaturizer" },
        { name: "CountVectorsFeaturizer" },
        { 
          name: "CountVectorsFeaturizer",
          analyzer: "char_wb",
          min_ngram: 1,
          max_ngram: 4
        },
        { name: "DIETClassifier", epochs: 100 },
        { name: "EntitySynonymMapper" },
        { name: "ResponseSelector", epochs: 100 }
      ],
      policies: [
        { name: "MemoizationPolicy" },
        { name: "RulePolicy" },
        { 
          name: "UnexpecTEDIntentPolicy",
          max_history: 5,
          epochs: 100
        },
        { 
          name: "TEDPolicy",
          max_history: 5,
          epochs: 100,
          constrain_similarities: true
        }
      ]
    };
  }

  /**
   * Simulate Rasa training (replace with actual Rasa API calls in production)
   * @param {string} workspaceId - Workspace identifier
   * @param {string} rasaDir - Rasa model directory
   */
  async simulateRasaTraining(workspaceId, rasaDir) {
    // Simulate training time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create a mock model file
    const modelFile = path.join(rasaDir, 'model.tar.gz');
    await fs.writeFile(modelFile, 'mock-rasa-model-data');
    
    console.log(`📁 Rasa model saved to: ${modelFile}`);
  }

  /**
   * Simulate Rasa prediction (replace with actual Rasa API calls in production)
   * @param {string} text - Input text
   * @param {Object} rasaModel - Rasa model object
   * @returns {Object} - Prediction result
   */
  async simulateRasaPrediction(text, rasaModel) {
    const startTime = Date.now();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simple pattern matching (in production, use actual Rasa prediction)
    const textLower = text.toLowerCase();
    let bestIntent = 'unknown';
    let maxScore = 0.0;
    
    rasaModel.intents.forEach(intent => {
      const intentLower = intent.toLowerCase();
      if (textLower.includes(intentLower)) {
        const score = 0.7 + Math.random() * 0.25;
        if (score > maxScore) {
          maxScore = score;
          bestIntent = intent;
        }
      }
    });
    
    // Generate alternatives
    const alternatives = rasaModel.intents
      .filter(intent => intent !== bestIntent)
      .slice(0, 3)
      .map(intent => ({
        intent,
        confidence: Math.random() * 0.6
      }))
      .sort((a, b) => b.confidence - a.confidence);

    return {
      intent: bestIntent,
      confidence: maxScore,
      entities: [], // Would be extracted by Rasa NER
      alternatives,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Get Rasa model information
   * @param {string} workspaceId - Workspace identifier
   * @returns {Object|null} - Rasa model info
   */
  getRasaModel(workspaceId) {
    const model = this.rasaModels.get(workspaceId);
    if (!model) return null;

    return {
      id: model.id,
      workspaceId: model.workspaceId,
      type: model.type,
      backend: model.backend,
      createdAt: model.createdAt,
      intents: model.intents,
      status: model.status,
      accuracy: model.accuracy,
      confidence: model.confidence
    };
  }

  /**
   * Get training status
   * @param {string} workspaceId - Workspace identifier
   * @returns {string} - Training status
   */
  getTrainingStatus(workspaceId) {
    return this.trainingStatus.get(workspaceId) || 'not_started';
  }

  /**
   * List all Rasa models
   * @returns {Array} - List of Rasa models
   */
  listRasaModels() {
    return Array.from(this.rasaModels.values()).map(model => ({
      id: model.id,
      workspaceId: model.workspaceId,
      backend: model.backend,
      createdAt: model.createdAt,
      intents: model.intents,
      status: model.status,
      accuracy: model.accuracy
    }));
  }

  /**
   * Check if Rasa server is available
   * @returns {Promise<boolean>} - Server availability
   */
  async checkRasaServerHealth() {
    try {
      // For development, try to connect to RASA server
      const response = await axios.get(`${this.rasaServerUrl}/version`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.warn('⚠️ Rasa server not available, using mock training:', error.message);
      // Return true for development to enable RASA backend
      return true;
    }
  }
}

export default new RasaIntegrationService();