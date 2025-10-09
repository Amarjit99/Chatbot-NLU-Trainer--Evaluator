import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken, adminAuth } from '../middleware/adminAuth.js';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { Model } from '../models/Model.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// GET /api/admin/workspaces - Admin endpoint to get all workspaces
router.get('/workspaces', async (req, res) => {
  try {
    console.log('Fetching workspaces from database...');
    console.log('Database name:', mongoose.connection.db.databaseName);
    console.log('Connection state:', mongoose.connection.readyState);
    
    // Fetch all workspaces from DB
    const workspaces = await Workspace.find({});
    console.log('Found workspaces:', workspaces.length);
    console.log('Workspaces data:', workspaces);
    
    // For each workspace, count models
    const workspaceData = await Promise.all(workspaces.map(async (ws) => {
      const modelsCount = await Model.countDocuments({ workspace: ws._id });
      console.log(`Workspace ${ws.name}: ${modelsCount} models, status: ${ws.status}`);
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
    
    console.log('Returning workspace data:', workspaceData);
    res.json({
      message: 'Workspaces retrieved successfully',
      workspaces: workspaceData
    });
  } catch (err) {
    console.error('Get workspaces error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// GET /api/admin/users - List all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-passwordHash').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/users - Create user (admin only)
router.post('/users', adminAuth, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash, role: role || 'user' });
    res.status(201).json({ message: 'User created', user: { id: user._id, username, email, role: user.role } });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/users/:id - Update user (admin only)
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, username, email, password } = req.body;
    const update = {};
    if (role) update.role = role;
    if (username) update.username = username;
    if (email) update.email = email;
    if (password) update.passwordHash = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(id, update, { new: true, select: '-passwordHash' });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/users/:id - Delete user (admin only)
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;