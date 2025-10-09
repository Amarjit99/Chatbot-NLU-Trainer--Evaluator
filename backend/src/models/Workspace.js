import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  models: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Model' }],
  datasetsCount: { type: Number, default: 0 }
});

export const Workspace = mongoose.model('Workspace', workspaceSchema);
