import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 32
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address']
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    lastLogin: {
      type: Date,
      default: Date.now
    },
    bio: {
      type: String,
      default: '',
      maxlength: 500
    },
    avatar: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
