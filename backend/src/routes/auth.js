import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { User } from '../models/User.js';
import { adminAuth, authenticateToken } from '../middleware/adminAuth.js';

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/avatars';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Registration attempt:', { body: req.body });
    const { username, email, password } = req.body || {};

    // Enhanced validation
    if (!username || !email || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: 'username, email and password are required' });
    }

    if (password.length < 6) {
      console.log('❌ Password too short');
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Prevent duplicate email
    console.log('🔍 Checking for existing user with email:', email);
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('❌ Email already exists');
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

    console.log('✅ User registered successfully:', { id: user._id, email: user.email });
    res.status(201).json({
      message: 'User registered',
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role || 'user' 
      },
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
    console.log('🔐 Login attempt:', { email: req.body?.email });
    const { email, password } = req.body || {};

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ message: 'email and password are required' });
    }

    console.log('🔍 Looking for user with email:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('🔑 Comparing passwords');
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    console.log('✅ User logged in successfully:', { id: user._id, email: user.email });
    res.json({
      message: 'Logged in',
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role || 'user' 
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me - Get current user information
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, { passwordHash: 0 });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'User info retrieved successfully',
      user: {
        id: user._id,
        username: user.username,
        name: user.username, // For consistency with frontend
        email: user.email,
        role: user.role || 'user',
        bio: user.bio || '',
        avatar: user.avatar || null,
        createdAt: user.createdAt || new Date(),
        lastLogin: user.lastLogin || new Date()
      }
    });
  } catch (err) {
    console.error('Get user info error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    console.log('📝 Profile update attempt for user:', req.user.id);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, bio } = req.body;
    
    if (name) {
      user.username = name;
    }
    
    if (bio !== undefined) {
      user.bio = bio;
    }

    // Handle avatar upload if provided
    if (req.file) {
      // In a real app, you'd upload to cloud storage (AWS S3, Cloudinary, etc.)
      // For now, we'll store the file path or base64
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();

    console.log('✅ Profile updated successfully for user:', user.email);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        name: user.username,
        email: user.email,
        role: user.role || 'user',
        bio: user.bio || '',
        avatar: user.avatar || null
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/change-password - Change user password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    console.log('🔑 Password change attempt for user:', req.user.id);
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newPasswordHash;
    
    await user.save();

    console.log('✅ Password changed successfully for user:', user.email);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    console.error('Password change error:', err);
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

// POST /api/auth/create-admin - Development endpoint to create admin user (remove in production)
router.post('/create-admin', async (req, res) => {
  try {
    const { email = 'admin@chatbot.com', password = 'admin123', username = 'Admin User' } = req.body;

    console.log('🛡️  Creating admin user with email:', email);

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      return res.status(409).json({ 
        message: 'Admin user already exists',
        credentials: {
          email: 'admin@chatbot.com',
          password: 'admin123',
          note: 'Use these credentials to login'
        }
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const adminUser = await User.create({
      username,
      email,
      passwordHash,
      role: 'admin'
    });

    console.log('✅ Admin user created successfully:', { email: adminUser.email, role: adminUser.role });

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role
      },
      credentials: {
        email: email,
        password: password,
        note: 'Save these credentials to login as admin'
      }
    });
  } catch (err) {
    console.error('Create admin error:', err);
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

// Test endpoint for debugging
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Auth endpoints are working!', 
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login', 
      'GET /api/auth/me',
      'GET /api/auth/users (admin)',
      'POST /api/auth/create-admin (dev)'
    ]
  });
});

// GET /api/auth/verify-admin - Check if admin user exists and verify credentials
router.get('/verify-admin', async (req, res) => {
  try {
    const adminEmail = 'admin@chatbot.com';
    const adminUser = await User.findOne({ email: adminEmail });
    
    if (adminUser) {
      res.json({
        message: 'Admin user found',
        admin: {
          id: adminUser._id,
          username: adminUser.username,
          email: adminUser.email,
          role: adminUser.role,
          createdAt: adminUser.createdAt
        },
        defaultCredentials: {
          email: 'admin@chatbot.com',
          password: 'admin123',
          note: 'Use these credentials to login as admin'
        }
      });
    } else {
      res.json({
        message: 'Admin user does not exist',
        suggestion: 'Call POST /api/auth/create-admin to create admin user',
        defaultCredentials: {
          email: 'admin@chatbot.com',
          password: 'admin123'
        }
      });
    }
  } catch (error) {
    console.error('Verify admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/reset-admin - Reset admin password (development only)
router.post('/reset-admin', async (req, res) => {
  try {
    const adminEmail = 'admin@chatbot.com';
    const newPassword = req.body.password || 'admin123';
    
    const adminUser = await User.findOne({ email: adminEmail });
    
    if (adminUser) {
      // Update password
      const passwordHash = await bcrypt.hash(newPassword, 10);
      adminUser.passwordHash = passwordHash;
      await adminUser.save();
      
      res.json({
        message: 'Admin password reset successfully',
        credentials: {
          email: adminEmail,
          password: newPassword
        }
      });
    } else {
      res.status(404).json({ message: 'Admin user not found. Create admin first.' });
    }
  } catch (error) {
    console.error('Reset admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/users - Get all users (admin only)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    console.log('📋 GET /users - Fetching all users (admin request)');
    console.log('User making request:', req.user);
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      console.log('❌ Access denied - user role:', req.user.role);
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Get all users from database
    const users = await User.find({}, 'username email role createdAt lastLogin').sort({ createdAt: -1 });
    
    console.log(`✅ Found ${users.length} users`);
    
    res.json({
      message: 'Users retrieved successfully',
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin || user.createdAt
      }))
    });

  } catch (err) {
    console.error('❌ Get users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/users/:id - Update user (admin only)
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    console.log('📝 PUT /users/:id - Updating user');
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const { username, email, role } = req.body;

    // Find and update user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (role && ['user', 'admin'].includes(role)) user.role = role;

    await user.save();

    console.log('✅ User updated:', user.email);
    
    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('❌ Update user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/auth/users/:id - Delete user (admin only)
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    console.log('🗑️ DELETE /users/:id - Deleting user');
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User deleted:', user.email);
    
    res.json({
      message: 'User deleted successfully'
    });

  } catch (err) {
    console.error('❌ Delete user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/users - Admin create user
router.post('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
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
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
