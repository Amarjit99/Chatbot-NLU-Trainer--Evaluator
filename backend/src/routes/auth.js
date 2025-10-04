import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { adminAuth, authenticateToken } from '../middleware/adminAuth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required' });
    }

    // Prevent duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      passwordHash
    });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      message: 'User registered',
      user: { id: user._id, username: user.username, email: user.email },
      token
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      message: 'Logged in',
      user: { id: user._id, username: user.username, email: user.email },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/users - Admin endpoint to get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({}, { passwordHash: 0 }); // Exclude password hash
    
    res.json({
      message: 'Users retrieved successfully',
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        createdAt: user.createdAt || new Date(),
        lastLogin: user.lastLogin || new Date()
      }))
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/system-stats - Admin endpoint for system statistics
router.get('/system-stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    
    res.json({
      message: 'System stats retrieved successfully',
      stats: {
        totalUsers,
        activeWorkspaces: 3, // Mock data - implement with actual workspace model
        totalModels: 6,
        totalDatasets: 10,
        systemUptime: '15 days, 4 hours',
        apiRequests: 12547,
        storageUsed: '2.3 GB',
        activeTrainingSessions: 3,
        serverLoad: parseFloat((Math.random() * 100).toFixed(1))
      }
    });
  } catch (err) {
    console.error('Get system stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
