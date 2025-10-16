import express from 'express';
import fs from 'fs-extra';
import path from 'path';

const router = express.Router();

// GET /api/public/recent-uploads
// Returns a map of workspaceId -> { lastAnnotation, lastTraining }
router.get('/recent-uploads', async (req, res) => {
  try {
    const annotationsDir = path.join('uploads', 'entity-annotations');
    const trainingDir = path.join('uploads', 'training-results');

    const result = {};

    // Annotations
    try {
      await fs.ensureDir(annotationsDir);
      const files = await fs.readdir(annotationsDir);
      for (const file of files) {
        if (!file.endsWith('_annotations.json')) continue;
        const workspaceId = file.replace('_annotations.json', '');
        const filePath = path.join(annotationsDir, file);
        const stat = await fs.stat(filePath);
        const data = await fs.readJson(filePath).catch(() => ({}));
        result[workspaceId] = result[workspaceId] || {};
        result[workspaceId].lastAnnotation = {
          createdAt: data.createdAt || stat.mtime.toISOString(),
          annotations: Array.isArray(data.annotations) ? data.annotations : [],
          totalSamples: Array.isArray(data.annotations) ? data.annotations.length : null,
          totalEntities: Array.isArray(data.annotations) ? data.annotations.reduce((s, a) => s + (a.entities || []).length, 0) : null,
          path: filePath
        };
      }
    } catch (e) {
      console.warn('Public recent-uploads: annotations read failed', e.message);
    }

    // Training results
    try {
      await fs.ensureDir(trainingDir);
      const files = await fs.readdir(trainingDir);
      for (const file of files) {
        if (!file.endsWith('_multi_backend_training.json')) continue;
        const workspaceId = file.replace('_multi_backend_training.json', '');
        const filePath = path.join(trainingDir, file);
        const stat = await fs.stat(filePath);
        const data = await fs.readJson(filePath).catch(() => ({}));
        result[workspaceId] = result[workspaceId] || {};
        result[workspaceId].lastTraining = {
          createdAt: data.endTime || stat.mtime.toISOString(),
          status: data.status || null,
          successfulBackends: data.results ? Object.keys(data.results) : null,
          summary: data,
          path: filePath
        };
      }
    } catch (e) {
      console.warn('Public recent-uploads: training read failed', e.message);
    }

    res.json({ success: true, workspaces: result });
  } catch (err) {
    console.error('Public recent-uploads error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

export default router;
