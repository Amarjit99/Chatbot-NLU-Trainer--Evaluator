import express from 'express';
import { auth } from '../middleware/auth.js';
import analyticsService from '../services/analyticsService.js';

const router = express.Router();

/**
 * @route GET /api/analytics/overview
 * @desc Get analytics overview for a workspace
 * @access Private
 */
router.get('/overview', auth, async (req, res) => {
  try {
    const { workspaceId, timeRange = '7d' } = req.query;
    
    if (!workspaceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Workspace ID is required' 
      });
    }

    const overview = await analyticsService.getAnalyticsOverview(workspaceId, timeRange);
    
    // Log the analytics view
    analyticsService.logActivity(
      'analytics',
      'Viewed analytics overview',
      req.user.id,
      workspaceId,
      { timeRange }
    );

    res.json({
      success: true,
      data: overview,
      message: 'Analytics overview retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting analytics overview:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve analytics overview',
      error: error.message 
    });
  }
});

/**
 * @route GET /api/analytics/system-health
 * @desc Get system health metrics
 * @access Private
 */
router.get('/system-health', auth, async (req, res) => {
  try {
    const health = await analyticsService.getSystemHealth();
    
    res.json({
      success: true,
      data: health,
      message: 'System health retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting system health:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve system health',
      error: error.message 
    });
  }
});

/**
 * @route GET /api/analytics/user-activity
 * @desc Get user activity logs
 * @access Private
 */
router.get('/user-activity', auth, async (req, res) => {
  try {
    const { timeRange = '7d', limit = 50 } = req.query;
    
    const activity = await analyticsService.getUserActivity(timeRange, parseInt(limit));
    
    res.json({
      success: true,
      data: activity,
      message: 'User activity retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting user activity:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve user activity',
      error: error.message 
    });
  }
});

/**
 * @route GET /api/analytics/model-performance
 * @desc Get model performance metrics for workspace
 * @access Private
 */
router.get('/model-performance', auth, async (req, res) => {
  try {
    const { workspaceId } = req.query;
    
    if (!workspaceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Workspace ID is required' 
      });
    }

    const performance = await analyticsService.getModelPerformance(workspaceId);
    
    res.json({
      success: true,
      data: performance,
      message: 'Model performance retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting model performance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve model performance',
      error: error.message 
    });
  }
});

/**
 * @route GET /api/analytics/training-trends
 * @desc Get training trends for workspace
 * @access Private
 */
router.get('/training-trends', auth, async (req, res) => {
  try {
    const { workspaceId, timeRange = '7d' } = req.query;
    
    if (!workspaceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Workspace ID is required' 
      });
    }

    const trends = await analyticsService.getTrainingTrends(workspaceId, timeRange);
    
    res.json({
      success: true,
      data: trends,
      message: 'Training trends retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting training trends:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve training trends',
      error: error.message 
    });
  }
});

/**
 * @route GET /api/analytics/export
 * @desc Export analytics data as CSV
 * @access Private
 */
router.get('/export', auth, async (req, res) => {
  try {
    const { workspaceId, timeRange = '7d' } = req.query;
    
    if (!workspaceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Workspace ID is required' 
      });
    }

    const csvData = await analyticsService.exportAnalytics(workspaceId, timeRange);
    
    // Log the export action
    analyticsService.logActivity(
      'export',
      'Exported analytics data',
      req.user.id,
      workspaceId,
      { timeRange, format: 'csv' }
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${workspaceId}-${timeRange}.csv`);
    res.send(csvData);

  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to export analytics',
      error: error.message 
    });
  }
});

/**
 * @route POST /api/analytics/record-training
 * @desc Record a training session (internal use)
 * @access Private
 */
router.post('/record-training', auth, async (req, res) => {
  try {
    const { workspaceId, modelInfo, duration, success = true } = req.body;
    
    if (!workspaceId || !modelInfo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Workspace ID and model info are required' 
      });
    }

    const record = analyticsService.recordTrainingSession(workspaceId, modelInfo, duration, success);
    
    res.json({
      success: true,
      data: record,
      message: 'Training session recorded successfully'
    });

  } catch (error) {
    console.error('Error recording training session:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to record training session',
      error: error.message 
    });
  }
});

/**
 * @route POST /api/analytics/record-prediction
 * @desc Record a prediction (internal use)
 * @access Private
 */
router.post('/record-prediction', auth, async (req, res) => {
  try {
    const { workspaceId, modelId, confidence, responseTime } = req.body;
    
    if (!workspaceId || !modelId || confidence === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Workspace ID, model ID, and confidence are required' 
      });
    }

    analyticsService.recordPrediction(workspaceId, modelId, confidence, responseTime);
    
    res.json({
      success: true,
      message: 'Prediction recorded successfully'
    });

  } catch (error) {
    console.error('Error recording prediction:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to record prediction',
      error: error.message 
    });
  }
});

/**
 * @route GET /api/analytics/dashboard-stats
 * @desc Get comprehensive dashboard statistics
 * @access Private
 */
router.get('/dashboard-stats', auth, async (req, res) => {
  try {
    const { workspaceId, timeRange = '7d' } = req.query;
    
    if (!workspaceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Workspace ID is required' 
      });
    }

    // Get all data in parallel for faster response
    const [overview, health, activity, performance, trends] = await Promise.all([
      analyticsService.getAnalyticsOverview(workspaceId, timeRange),
      analyticsService.getSystemHealth(),
      analyticsService.getUserActivity(timeRange, 10),
      analyticsService.getModelPerformance(workspaceId),
      analyticsService.getTrainingTrends(workspaceId, timeRange)
    ]);

    const dashboardStats = {
      overview,
      systemHealth: health,
      recentActivity: activity.activities,
      topModels: performance.models.slice(0, 5),
      trends: trends.trends,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: dashboardStats,
      message: 'Dashboard statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting dashboard statistics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve dashboard statistics',
      error: error.message 
    });
  }
});

/**
 * @route GET /api/analytics/realtime-metrics
 * @desc Get real-time system metrics (for live updates)
 * @access Private
 */
router.get('/realtime-metrics', auth, async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      cpuUsage: analyticsService.getCPUUsage(),
      memoryUsage: analyticsService.getMemoryUsage(),
      responseTime: analyticsService.getAverageResponseTime(),
      totalRequests: analyticsService.systemMetrics.totalRequests,
      totalTrainingSessions: analyticsService.systemMetrics.totalTrainingSessions,
      totalPredictions: analyticsService.systemMetrics.totalPredictions,
      uptime: Math.floor((Date.now() - analyticsService.startTime) / 1000)
    };
    
    res.json({
      success: true,
      data: metrics,
      message: 'Real-time metrics retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting real-time metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve real-time metrics',
      error: error.message 
    });
  }
});

export default router;