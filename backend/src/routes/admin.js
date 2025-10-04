import express from 'express';
import { authenticateToken, adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// GET /api/admin/workspaces - Admin endpoint to get all workspaces
router.get('/workspaces', adminAuth, async (req, res) => {
  try {
    // Mock workspace data for now - in real app, use workspace model
    const mockWorkspaces = [
      { 
        id: 1, 
        name: 'HR Bot', 
        owner: 'admin', 
        createdAt: new Date('2024-01-01'), 
        modelsCount: 3, 
        datasetsCount: 5, 
        status: 'active' 
      },
      { 
        id: 2, 
        name: 'Travel Bot', 
        owner: 'user1', 
        createdAt: new Date('2024-01-05'), 
        modelsCount: 2, 
        datasetsCount: 3, 
        status: 'active' 
      },
      { 
        id: 3, 
        name: 'Support Bot', 
        owner: 'user2', 
        createdAt: new Date('2024-01-10'), 
        modelsCount: 1, 
        datasetsCount: 2, 
        status: 'inactive' 
      }
    ];

    res.json({
      message: 'Workspaces retrieved successfully',
      workspaces: mockWorkspaces
    });
  } catch (err) {
    console.error('Get workspaces error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/users/:id - Update user (admin only)
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, username, email } = req.body;

    // In real app, update user in database
    res.json({
      message: 'User updated successfully',
      user: { id, role, username, email }
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/users/:id - Delete user (admin only)
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // In real app, delete user from database
    res.json({
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;