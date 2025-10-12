import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace.js';
import { Model } from '../models/Model.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function quickSeed() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'mern_chatbot' });
    
    // Delete all existing
    await Workspace.deleteMany({});
    await Model.deleteMany({});
    
    // Create workspaces
    const ws1 = await Workspace.create({ name: 'HR Bot', owner: 'admin', status: 'active', datasetsCount: 5 });
    const ws2 = await Workspace.create({ name: 'Travel Bot', owner: 'user1', status: 'active', datasetsCount: 3 });
    const ws3 = await Workspace.create({ name: 'Support Bot', owner: 'user2', status: 'active', datasetsCount: 2 });
    
    // Create models
    await Model.create({ name: 'HR Intent Model', workspace: ws1._id, status: 'trained' });
    await Model.create({ name: 'HR Entity Model', workspace: ws1._id, status: 'trained' });
    await Model.create({ name: 'Travel Model', workspace: ws2._id, status: 'trained' });
    await Model.create({ name: 'Support Model', workspace: ws3._id, status: 'untrained' });
    
    console.log('✅ QUICK SEED COMPLETE: 3 workspaces, 4 models');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

quickSeed();