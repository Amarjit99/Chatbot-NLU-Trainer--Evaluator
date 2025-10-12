import fs from 'fs-extra';
import path from 'path';

class EntityRecognitionService {
  constructor() {
    this.entityModels = new Map(); // Store trained entity models
    this.entityAnnotations = new Map(); // Store entity annotations
  }

  /**
   * Attempt to load persisted annotations from disk when not in memory
   * @param {string} workspaceId
   * @returns {Promise<boolean>} loaded
   */
  async loadAnnotationsFromDisk(workspaceId) {
    try {
      const annotationsDir = path.join('uploads', 'entity-annotations');
      const filePath = path.join(annotationsDir, `${workspaceId}_annotations.json`);
      if (!(await fs.pathExists(filePath))) return false;

      const file = await fs.readJson(filePath);
      const validatedAnnotations = this.validateEntityAnnotations(file.annotations || []);

      const record = {
        id: `entity_anno_${workspaceId}_${Date.now()}`,
        workspaceId,
        annotations: validatedAnnotations,
        createdAt: file.createdAt || new Date().toISOString(),
        totalSamples: validatedAnnotations.length,
        totalEntities: validatedAnnotations.reduce((sum, a) => sum + (a.entities || []).length, 0)
      };
      this.entityAnnotations.set(workspaceId, record);
      return true;
    } catch (e) {
      console.error('❌ Failed to load annotations from disk:', e.message);
      return false;
    }
  }

  /**
   * Save entity annotations for a workspace
   * @param {string} workspaceId - Workspace identifier
   * @param {Array} annotations - Entity annotations
   * @returns {Object} - Save result
   */
  async saveEntityAnnotations(workspaceId, annotations) {
    try {
      console.log(`💾 Saving entity annotations for workspace: ${workspaceId}`);
      
      // Validate annotations
      const validatedAnnotations = this.validateEntityAnnotations(annotations);
      
      // Store in memory (in production, save to database)
      this.entityAnnotations.set(workspaceId, {
        id: `entity_anno_${workspaceId}_${Date.now()}`,
        workspaceId,
        annotations: validatedAnnotations,
        createdAt: new Date().toISOString(),
        totalSamples: validatedAnnotations.length,
        totalEntities: validatedAnnotations.reduce((sum, anno) => sum + (anno.entities || []).length, 0)
      });

      // Save to file for persistence
      const annotationsDir = path.join('uploads', 'entity-annotations');
      await fs.ensureDir(annotationsDir);
      const filePath = path.join(annotationsDir, `${workspaceId}_annotations.json`);
      await fs.writeJson(filePath, {
        workspaceId,
        annotations: validatedAnnotations,
        createdAt: new Date().toISOString()
      }, { spaces: 2 });

      console.log(`✅ Entity annotations saved: ${validatedAnnotations.length} samples, total entities: ${validatedAnnotations.reduce((sum, anno) => sum + (anno.entities || []).length, 0)}`);

      return {
        success: true,
        id: this.entityAnnotations.get(workspaceId).id,
        totalSamples: validatedAnnotations.length,
        totalEntities: validatedAnnotations.reduce((sum, anno) => sum + (anno.entities || []).length, 0),
        entityTypes: this.extractEntityTypes(validatedAnnotations)
      };

    } catch (error) {
      console.error('❌ Error saving entity annotations:', error.message);
      throw new Error(`Failed to save entity annotations: ${error.message}`);
    }
  }

  /**
   * Get entity annotations for a workspace
   * @param {string} workspaceId - Workspace identifier
   * @returns {Object|null} - Entity annotations
   */
  getEntityAnnotations(workspaceId) {
    return this.entityAnnotations.get(workspaceId) || null;
  }

  /**
   * Validate entity annotations format
   * @param {Array} annotations - Raw annotations
   * @returns {Array} - Validated annotations
   */
  validateEntityAnnotations(annotations) {
    if (!Array.isArray(annotations)) {
      throw new Error('Annotations must be an array');
    }

    return annotations.map((annotation, index) => {
      if (!annotation.text || typeof annotation.text !== 'string') {
        throw new Error(`Annotation ${index}: Missing or invalid text field`);
      }

      if (!annotation.intent || typeof annotation.intent !== 'string') {
        throw new Error(`Annotation ${index}: Missing or invalid intent field`);
      }

      const entities = annotation.entities || [];
      if (!Array.isArray(entities)) {
        throw new Error(`Annotation ${index}: Entities must be an array`);
      }

      // Validate each entity
      const validatedEntities = entities.map((entity, entityIndex) => {
        if (!entity.text || typeof entity.text !== 'string') {
          throw new Error(`Annotation ${index}, Entity ${entityIndex}: Missing or invalid text field`);
        }
        if (!entity.label || typeof entity.label !== 'string') {
          throw new Error(`Annotation ${index}, Entity ${entityIndex}: Missing or invalid label field`);
        }
        if (typeof entity.start !== 'number' || typeof entity.end !== 'number') {
          throw new Error(`Annotation ${index}, Entity ${entityIndex}: Invalid start/end positions`);
        }
        if (entity.start >= entity.end) {
          throw new Error(`Annotation ${index}, Entity ${entityIndex}: Start position must be less than end position`);
        }

        return {
          text: entity.text.trim(),
          label: entity.label.toUpperCase().trim(),
          start: entity.start,
          end: entity.end,
          id: entity.id || `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      });

      return {
        id: annotation.id || index,
        text: annotation.text.trim(),
        intent: annotation.intent.trim(),
        entities: validatedEntities
      };
    });
  }

  /**
   * Extract unique entity types from annotations
   * @param {Array} annotations - Entity annotations
   * @returns {Array} - Unique entity types
   */
  extractEntityTypes(annotations) {
    const entityTypes = new Set();
    
    annotations.forEach(annotation => {
      if (annotation.entities) {
        annotation.entities.forEach(entity => {
          entityTypes.add(entity.label);
        });
      }
    });

    return Array.from(entityTypes).sort();
  }

  /**
   * Train entity recognition model using the annotations
   * @param {string} workspaceId - Workspace identifier
   * @returns {Object} - Training result
   */
  async trainEntityModel(workspaceId) {
    try {
      let annotationData = this.entityAnnotations.get(workspaceId);
      if (!annotationData) {
        // Attempt lazy-load from disk if memory is empty (e.g., after restart)
        const loaded = await this.loadAnnotationsFromDisk(workspaceId);
        annotationData = this.entityAnnotations.get(workspaceId);
        if (!loaded || !annotationData) {
          throw new Error('No entity annotations found for this workspace');
        }
      }

      console.log(`🚀 Training entity recognition model for workspace: ${workspaceId}`);

      const { annotations } = annotationData;
      
      // Extract training features (simple pattern-based for now)
      const entityPatterns = this.extractEntityPatterns(annotations);
      const entityStats = this.calculateEntityStatistics(annotations);

      // Create model metadata
      const modelId = `entity_model_${workspaceId}_${Date.now()}`;
      const entityModel = {
        id: modelId,
        workspaceId,
        type: 'entity_recognition',
        createdAt: new Date().toISOString(),
        trainingData: annotations,
        patterns: entityPatterns,
        statistics: entityStats,
        entityTypes: this.extractEntityTypes(annotations),
        status: 'trained'
      };

      // Store the trained model
      this.entityModels.set(workspaceId, entityModel);

      console.log(`✅ Entity model trained successfully: ${entityModel.entityTypes.length} entity types`);

      return {
        success: true,
        modelId,
        entityTypes: entityModel.entityTypes,
        totalEntities: entityStats.totalEntities,
        patterns: Object.keys(entityPatterns).length,
        trainingExamples: annotations.length
      };

    } catch (error) {
      console.error('❌ Entity model training failed:', error.message);
      throw new Error(`Entity training failed: ${error.message}`);
    }
  }

  /**
   * Extract patterns from entity annotations for simple NER
   * @param {Array} annotations - Entity annotations
   * @returns {Object} - Entity patterns
   */
  extractEntityPatterns(annotations) {
    const patterns = {};

    annotations.forEach(annotation => {
      if (annotation.entities) {
        annotation.entities.forEach(entity => {
          const label = entity.label;
          if (!patterns[label]) {
            patterns[label] = new Set();
          }
          
          // Add the entity text as a pattern
          patterns[label].add(entity.text.toLowerCase());
          
          // Add variations (simple tokenization)
          const tokens = entity.text.toLowerCase().split(/\s+/);
          if (tokens.length > 1) {
            tokens.forEach(token => {
              if (token.length > 2) { // Only meaningful tokens
                patterns[label].add(token);
              }
            });
          }
        });
      }
    });

    // Convert Sets to Arrays for serialization
    const result = {};
    Object.keys(patterns).forEach(label => {
      result[label] = Array.from(patterns[label]);
    });

    return result;
  }

  /**
   * Calculate entity statistics
   * @param {Array} annotations - Entity annotations
   * @returns {Object} - Entity statistics
   */
  calculateEntityStatistics(annotations) {
    const stats = {
      totalEntities: 0,
      entityTypeCount: {},
      averageEntitiesPerSample: 0,
      entityLengthStats: {
        min: Infinity,
        max: 0,
        average: 0
      }
    };

    let totalEntityLength = 0;
    let entityCount = 0;

    annotations.forEach(annotation => {
      if (annotation.entities) {
        stats.totalEntities += annotation.entities.length;
        
        annotation.entities.forEach(entity => {
          // Count by type
          const label = entity.label;
          stats.entityTypeCount[label] = (stats.entityTypeCount[label] || 0) + 1;
          
          // Length statistics
          const entityLength = entity.text.length;
          stats.entityLengthStats.min = Math.min(stats.entityLengthStats.min, entityLength);
          stats.entityLengthStats.max = Math.max(stats.entityLengthStats.max, entityLength);
          totalEntityLength += entityLength;
          entityCount++;
        });
      }
    });

    stats.averageEntitiesPerSample = annotations.length > 0 ? stats.totalEntities / annotations.length : 0;
    stats.entityLengthStats.average = entityCount > 0 ? totalEntityLength / entityCount : 0;
    
    if (stats.entityLengthStats.min === Infinity) {
      stats.entityLengthStats.min = 0;
    }

    return stats;
  }

  /**
   * Predict entities in text using trained model
   * @param {string} text - Input text
   * @param {string} workspaceId - Workspace identifier
   * @returns {Array} - Predicted entities
   */
  async predictEntities(text, workspaceId) {
    try {
      const entityModel = this.entityModels.get(workspaceId);
      if (!entityModel) {
        throw new Error('No entity model found for this workspace');
      }

      console.log(`🔍 Predicting entities in text: "${text.substring(0, 50)}..."`);

      const predictions = [];
      const textLower = text.toLowerCase();

      // Simple pattern matching (in production, use ML model)
      Object.keys(entityModel.patterns).forEach(entityType => {
        const patterns = entityModel.patterns[entityType];
        
        patterns.forEach(pattern => {
          const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
          let match;
          
          while ((match = regex.exec(text)) !== null) {
            predictions.push({
              text: match[0],
              label: entityType,
              start: match.index,
              end: match.index + match[0].length,
              confidence: 0.8, // Simple confidence score
              id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });
          }
        });
      });

      // Remove overlapping predictions (keep highest confidence)
      const filteredPredictions = this.removeOverlappingEntities(predictions);

      console.log(`✅ Found ${filteredPredictions.length} entities`);

      return {
        text,
        entities: filteredPredictions,
        totalEntities: filteredPredictions.length,
        entityTypes: [...new Set(filteredPredictions.map(e => e.label))]
      };

    } catch (error) {
      console.error('❌ Entity prediction failed:', error.message);
      throw new Error(`Entity prediction failed: ${error.message}`);
    }
  }

  /**
   * Remove overlapping entity predictions
   * @param {Array} entities - Entity predictions
   * @returns {Array} - Filtered entities
   */
  removeOverlappingEntities(entities) {
    if (entities.length === 0) return [];

    // Sort by start position
    const sorted = entities.sort((a, b) => a.start - b.start);
    const filtered = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = filtered[filtered.length - 1];

      // If no overlap, add to filtered list
      if (current.start >= last.end) {
        filtered.push(current);
      } else {
        // If overlap, keep the one with higher confidence
        if (current.confidence > last.confidence) {
          filtered[filtered.length - 1] = current;
        }
      }
    }

    return filtered;
  }

  /**
   * Get entity model information
   * @param {string} workspaceId - Workspace identifier
   * @returns {Object|null} - Entity model info
   */
  getEntityModel(workspaceId) {
    const model = this.entityModels.get(workspaceId);
    if (!model) return null;

    return {
      id: model.id,
      workspaceId: model.workspaceId,
      type: model.type,
      createdAt: model.createdAt,
      entityTypes: model.entityTypes,
      statistics: model.statistics,
      status: model.status
    };
  }

  /**
   * List all entity models
   * @returns {Array} - List of entity models
   */
  listEntityModels() {
    return Array.from(this.entityModels.values()).map(model => ({
      id: model.id,
      workspaceId: model.workspaceId,
      createdAt: model.createdAt,
      entityTypes: model.entityTypes,
      status: model.status
    }));
  }
}

export default new EntityRecognitionService();