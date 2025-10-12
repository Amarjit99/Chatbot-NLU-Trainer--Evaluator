import { performance } from 'perf_hooks';
import os from 'os';
import fs from 'fs-extra';
import path from 'path';

class AnalyticsService {
  constructor() {
    this.startTime = Date.now();
    this.metricsCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
    this.activityLog = [];
    this.systemMetrics = {
      totalRequests: 0,
      totalTrainingSessions: 0,
      totalPredictions: 0,
      totalModels: 0,
      averageResponseTime: 0,
      responseTimeHistory: [],
      modelPerformanceHistory: []
    };
    
    // Initialize system monitoring
    this.initializeSystemMonitoring();
  }

  /**
   * Initialize system monitoring for real-time health metrics
   */
  initializeSystemMonitoring() {
    // Track response times
    setInterval(() => {
      this.updateSystemMetrics();
    }, 10000); // Update every 10 seconds

    // Clean old metrics every hour
    setInterval(() => {
      this.cleanOldMetrics();
    }, 3600000); // 1 hour
  }

  /**
   * Update system metrics like CPU, memory usage
   */
  updateSystemMetrics() {
    try {
      const cpuUsage = this.getCPUUsage();
      const memoryUsage = this.getMemoryUsage();
      const responseTime = this.getAverageResponseTime();

      this.systemMetrics.cpuUsage = cpuUsage;
      this.systemMetrics.memoryUsage = memoryUsage;
      this.systemMetrics.currentResponseTime = responseTime;
      this.systemMetrics.timestamp = new Date().toISOString();

    } catch (error) {
      console.error('Error updating system metrics:', error);
    }
  }

  /**
   * Get CPU usage percentage
   */
  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return Math.max(0, Math.min(100, usage));
  }

  /**
   * Get memory usage percentage
   */
  getMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    return Math.round((usedMem / totalMem) * 100);
  }

  /**
   * Get average response time from recent requests
   */
  getAverageResponseTime() {
    if (this.systemMetrics.responseTimeHistory.length === 0) return 0;
    
    const recent = this.systemMetrics.responseTimeHistory.slice(-10);
    const sum = recent.reduce((acc, time) => acc + time, 0);
    return Math.round(sum / recent.length);
  }

  /**
   * Record request response time
   */
  recordResponseTime(duration) {
    this.systemMetrics.responseTimeHistory.push(duration);
    if (this.systemMetrics.responseTimeHistory.length > 100) {
      this.systemMetrics.responseTimeHistory.shift();
    }
    this.systemMetrics.totalRequests++;
  }

  /**
   * Log user activity
   */
  logActivity(type, description, userId = null, workspaceId = null, metadata = {}) {
    const activity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      description,
      userId,
      workspaceId,
      timestamp: new Date().toISOString(),
      metadata
    };

    this.activityLog.unshift(activity);
    
    // Keep only last 1000 activities
    if (this.activityLog.length > 1000) {
      this.activityLog = this.activityLog.slice(0, 1000);
    }

    return activity;
  }

  /**
   * Record model training session
   */
  recordTrainingSession(workspaceId, modelInfo, duration, success = true) {
    this.systemMetrics.totalTrainingSessions++;
    
    const trainingRecord = {
      workspaceId,
      modelId: modelInfo.id || modelInfo.modelId,
      modelName: modelInfo.name || `Model_${Date.now()}`,
      duration,
      success,
      accuracy: modelInfo.accuracy || 0,
      f1Score: modelInfo.f1Score || 0,
      precision: modelInfo.precision || 0,
      recall: modelInfo.recall || 0,
      intents: modelInfo.intents ? modelInfo.intents.length : 0,
      trainingExamples: modelInfo.trainingExamples || 0,
      timestamp: new Date().toISOString(),
      backend: modelInfo.backend || 'unknown'
    };

    this.systemMetrics.modelPerformanceHistory.push(trainingRecord);
    
    this.logActivity(
      'training',
      `Model trained: ${trainingRecord.modelName} (${(trainingRecord.accuracy * 100).toFixed(1)}% accuracy)`,
      null,
      workspaceId,
      { modelId: trainingRecord.modelId, accuracy: trainingRecord.accuracy }
    );

    return trainingRecord;
  }

  /**
   * Record prediction made
   */
  recordPrediction(workspaceId, modelId, confidence, responseTime) {
    this.systemMetrics.totalPredictions++;
    
    this.logActivity(
      'prediction',
      `Prediction made with ${(confidence * 100).toFixed(1)}% confidence`,
      null,
      workspaceId,
      { modelId, confidence, responseTime }
    );
  }

  /**
   * Get analytics overview for a workspace
   */
  async getAnalyticsOverview(workspaceId, timeRange = '7d') {
    const cacheKey = `overview_${workspaceId}_${timeRange}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const startDate = this.getStartDateForRange(timeRange);
      
      // Filter activities for the workspace and time range
      const workspaceActivities = this.activityLog.filter(activity => 
        activity.workspaceId === workspaceId &&
        new Date(activity.timestamp) >= startDate
      );

      // Filter model performance for the workspace
      const workspaceModels = this.systemMetrics.modelPerformanceHistory.filter(model =>
        model.workspaceId === workspaceId &&
        new Date(model.timestamp) >= startDate
      );

      const totalModels = workspaceModels.length;
      const trainingSessions = workspaceModels.filter(m => m.success).length;
      const totalPredictions = workspaceActivities.filter(a => a.type === 'prediction').length;
      
      const avgAccuracy = workspaceModels.length > 0 
        ? workspaceModels.reduce((sum, model) => sum + model.accuracy, 0) / workspaceModels.length
        : 0;

      // Calculate growth trends (compare with previous period)
      const previousPeriodStart = new Date(startDate);
      previousPeriodStart.setTime(previousPeriodStart.getTime() - (Date.now() - startDate.getTime()));
      
      const previousModels = this.systemMetrics.modelPerformanceHistory.filter(model =>
        model.workspaceId === workspaceId &&
        new Date(model.timestamp) >= previousPeriodStart &&
        new Date(model.timestamp) < startDate
      );

      const modelGrowth = this.calculateGrowthRate(previousModels.length, totalModels);
      const trainingGrowth = this.calculateGrowthRate(
        previousModels.filter(m => m.success).length,
        trainingSessions
      );

      const overview = {
        totalModels,
        trainingSessions,
        totalPredictions,
        avgAccuracy,
        modelGrowth,
        trainingGrowth,
        predictionGrowth: Math.random() * 20 - 10, // Mock for now
        accuracyTrend: Math.random() * 10 - 5, // Mock for now
        timeRange,
        generatedAt: new Date().toISOString()
      };

      this.setCachedData(cacheKey, overview);
      return overview;

    } catch (error) {
      console.error('Error generating analytics overview:', error);
      throw error;
    }
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth() {
    const cacheKey = 'system_health';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Check backend availability
      const activeBackends = await this.checkBackendHealth();

      const health = {
        cpuUsage: this.systemMetrics.cpuUsage || 0,
        memoryUsage: this.systemMetrics.memoryUsage || 0,
        responseTime: this.systemMetrics.currentResponseTime || 0,
        activeBackends: activeBackends.length,
        totalBackends: 3, // HuggingFace, Rasa, spaCy
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        totalRequests: this.systemMetrics.totalRequests,
        status: this.getOverallHealthStatus(),
        timestamp: new Date().toISOString(),
        backends: activeBackends
      };

      this.setCachedData(cacheKey, health, 15000); // Cache for 15 seconds
      return health;

    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        responseTime: 0,
        activeBackends: 0,
        totalBackends: 3,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Check health of different backends
   */
  async checkBackendHealth() {
    const backends = [];
    
    try {
      // Mock backend health checks - in real implementation, these would be actual health checks
      const huggingfaceHealth = process.env.HUGGINGFACE_API_KEY ? 'healthy' : 'unavailable';
      const rasaHealth = 'healthy'; // Mock - would check Rasa server
      const spacyHealth = 'healthy'; // Mock - would check spaCy availability

      if (huggingfaceHealth === 'healthy') {
        backends.push({ name: 'HuggingFace', status: 'healthy', responseTime: Math.random() * 500 });
      }
      if (rasaHealth === 'healthy') {
        backends.push({ name: 'Rasa', status: 'healthy', responseTime: Math.random() * 800 });
      }
      if (spacyHealth === 'healthy') {
        backends.push({ name: 'spaCy', status: 'healthy', responseTime: Math.random() * 300 });
      }

    } catch (error) {
      console.error('Error checking backend health:', error);
    }

    return backends;
  }

  /**
   * Get overall system health status
   */
  getOverallHealthStatus() {
    const cpuOk = this.systemMetrics.cpuUsage < 80;
    const memoryOk = this.systemMetrics.memoryUsage < 85;
    const responseOk = this.systemMetrics.currentResponseTime < 1000;

    if (cpuOk && memoryOk && responseOk) return 'healthy';
    if (this.systemMetrics.cpuUsage > 90 || this.systemMetrics.memoryUsage > 95) return 'critical';
    return 'warning';
  }

  /**
   * Get user activity for time range
   */
  async getUserActivity(timeRange = '7d', limit = 50) {
    const startDate = this.getStartDateForRange(timeRange);
    
    const activities = this.activityLog
      .filter(activity => new Date(activity.timestamp) >= startDate)
      .slice(0, limit);

    return {
      activities,
      totalCount: activities.length,
      timeRange,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Get model performance data for workspace
   */
  async getModelPerformance(workspaceId) {
    const models = this.systemMetrics.modelPerformanceHistory
      .filter(model => model.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10); // Get latest 10 models

    return {
      models: models.map(model => ({
        id: model.modelId,
        name: model.modelName,
        accuracy: model.accuracy,
        f1Score: model.f1Score,
        precision: model.precision,
        recall: model.recall,
        intents: model.intents,
        trainingExamples: model.trainingExamples,
        backend: model.backend,
        timestamp: model.timestamp
      })),
      totalModels: models.length,
      workspaceId
    };
  }

  /**
   * Get training trends for workspace
   */
  async getTrainingTrends(workspaceId, timeRange = '7d') {
    const startDate = this.getStartDateForRange(timeRange);
    
    const trends = this.systemMetrics.modelPerformanceHistory
      .filter(model => 
        model.workspaceId === workspaceId &&
        new Date(model.timestamp) >= startDate
      )
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(model => ({
        date: model.timestamp.split('T')[0],
        accuracy: model.accuracy,
        f1Score: model.f1Score,
        precision: model.precision,
        recall: model.recall
      }));

    return {
      trends,
      workspaceId,
      timeRange
    };
  }

  /**
   * Export analytics data to CSV format
   */
  async exportAnalytics(workspaceId, timeRange = '7d') {
    const overview = await this.getAnalyticsOverview(workspaceId, timeRange);
    const modelPerformance = await this.getModelPerformance(workspaceId);
    const trends = await this.getTrainingTrends(workspaceId, timeRange);
    
    let csv = 'Type,Metric,Value,Timestamp\n';
    
    // Add overview metrics
    csv += `Overview,Total Models,${overview.totalModels},${overview.generatedAt}\n`;
    csv += `Overview,Training Sessions,${overview.trainingSessions},${overview.generatedAt}\n`;
    csv += `Overview,Total Predictions,${overview.totalPredictions},${overview.generatedAt}\n`;
    csv += `Overview,Average Accuracy,${(overview.avgAccuracy * 100).toFixed(2)}%,${overview.generatedAt}\n`;
    
    // Add model performance
    modelPerformance.models.forEach(model => {
      csv += `Model Performance,${model.name} Accuracy,${(model.accuracy * 100).toFixed(2)}%,${model.timestamp}\n`;
      csv += `Model Performance,${model.name} F1 Score,${(model.f1Score * 100).toFixed(2)}%,${model.timestamp}\n`;
    });
    
    return csv;
  }

  /**
   * Helper methods
   */
  getStartDateForRange(timeRange) {
    const now = new Date();
    const ranges = {
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };
    
    const milliseconds = ranges[timeRange] || ranges['7d'];
    return new Date(now.getTime() - milliseconds);
  }

  calculateGrowthRate(previous, current) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  getCachedData(key) {
    const cached = this.metricsCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data, customTimeout = null) {
    this.metricsCache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Clean cache if it gets too large
    if (this.metricsCache.size > 100) {
      const oldestKey = this.metricsCache.keys().next().value;
      this.metricsCache.delete(oldestKey);
    }
  }

  cleanOldMetrics() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Clean activity log
    this.activityLog = this.activityLog.filter(
      activity => new Date(activity.timestamp) > oneDayAgo
    );
    
    // Clean response time history
    this.systemMetrics.responseTimeHistory = this.systemMetrics.responseTimeHistory.slice(-100);
    
    console.log('Analytics: Cleaned old metrics');
  }

  /**
   * Get analytics middleware for Express
   */
  getMiddleware() {
    return (req, res, next) => {
      const startTime = performance.now();
      
      // Record request
      this.systemMetrics.totalRequests++;
      
      // Hook into response to record response time
      const originalSend = res.send;
      res.send = function(data) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Record response time
        analyticsService.recordResponseTime(duration);
        
        // Call original send
        originalSend.call(this, data);
      };
      
      next();
    };
  }
}

// Create and export singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;