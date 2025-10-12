import mongoose from 'mongoose';

const modelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['trained', 'untrained', 'archived'], default: 'untrained' },
  accuracy: { type: Number, default: 0 },
  backend: { type: String, default: 'huggingface' }
});

export const Model = mongoose.model('Model', modelSchema);
