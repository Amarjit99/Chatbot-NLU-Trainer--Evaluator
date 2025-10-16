import express from 'express';
import { auth } from '../middleware/auth.js';
import { Workspace } from '../models/Workspace.js';
import { Model } from '../models/Model.js';

const router = express.Router();

// GET /api/workspaces - Get user's workspaces
router.get('/', auth, async (req, res) => {
  try {
    const owner = req.user.email || req.user.id || req.user.username;
    const workspaces = await Workspace.find({ owner: owner }).sort({ createdAt: -1 });
    
    // Add model count for each workspace
    const workspaceData = await Promise.all(workspaces.map(async (ws) => {
      const modelsCount = await Model.countDocuments({ workspace: ws._id });
      return {
        id: ws._id,
        name: ws.name,
        owner: ws.owner,
        createdAt: ws.createdAt,
        modelsCount,
        datasetsCount: ws.datasetsCount || 0,
        status: ws.status
      };
    }));
    
    res.json({
      message: 'Workspaces retrieved successfully',
      workspaces: workspaceData
    });
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/workspaces - Create new workspace
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Debug: Log user info
    console.log('🔍 Workspace creation request:');
    console.log('   User object:', req.user);
    console.log('   User email:', req.user?.email);
    console.log('   User id:', req.user?.id);
    console.log('   Workspace name:', name);
    
    if (!name) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }
    
    // Ensure we have a valid owner
    const owner = req.user.email || req.user.id || req.user.username;
    if (!owner) {
      console.log('❌ No valid owner found in req.user:', req.user);
      return res.status(400).json({ message: 'User authentication error: no valid identifier found' });
    }
    
    console.log('   Using owner:', owner);

    // Check if workspace with same name exists for this user
    const existingWorkspace = await Workspace.findOne({ 
      name: name, 
      owner: owner 
    });
    
    if (existingWorkspace) {
      return res.status(409).json({ message: 'Workspace with this name already exists' });
    }

    console.log('📝 Creating workspace with data:', {
      name,
      description: description || '',
      owner,
      status: 'active',
      datasetsCount: 0
    });

    const workspace = await Workspace.create({
      name,
      description: description || '',
      owner: owner,
      status: 'active',
      datasetsCount: 0
    });
    
    console.log('✅ Workspace created successfully:', workspace._id);

    res.status(201).json({
      message: 'Workspace created successfully',
      workspace: {
        id: workspace._id,
        name: workspace.name,
        owner: workspace.owner,
        createdAt: workspace.createdAt,
        modelsCount: 0,
        datasetsCount: 0,
        status: workspace.status
      }
    });
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/workspaces/:id - Update workspace
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const workspace = await Workspace.findOne({ _id: id, owner: req.user.email });
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (status) workspace.status = status;

    await workspace.save();

    const modelsCount = await Model.countDocuments({ workspace: workspace._id });

    res.json({
      message: 'Workspace updated successfully',
      workspace: {
        id: workspace._id,
        name: workspace.name,
        owner: workspace.owner,
        createdAt: workspace.createdAt,
        modelsCount,
        datasetsCount: workspace.datasetsCount || 0,
        status: workspace.status
      }
    });
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/workspaces/:id - Delete workspace
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findOne({ _id: id, owner: req.user.email });
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Delete all models associated with this workspace
    await Model.deleteMany({ workspace: id });
    
    // Delete the workspace
    await Workspace.findByIdAndDelete(id);

    res.json({
      message: 'Workspace and associated models deleted successfully'
    });
  } catch (error) {
    console.error('Delete workspace error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/workspaces/:id - Get specific workspace details
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findOne({ _id: id, owner: req.user.email });
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const models = await Model.find({ workspace: id }).sort({ createdAt: -1 });
    const modelsCount = models.length;

    res.json({
      message: 'Workspace details retrieved successfully',
      workspace: {
        id: workspace._id,
        name: workspace.name,
        owner: workspace.owner,
        description: workspace.description,
        createdAt: workspace.createdAt,
        modelsCount,
        datasetsCount: workspace.datasetsCount || 0,
        status: workspace.status,
        models: models.map(model => ({
          id: model._id,
          name: model.name,
          status: model.status,
          createdAt: model.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get workspace details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;