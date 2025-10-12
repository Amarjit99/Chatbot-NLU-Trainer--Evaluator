import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace.js';
import { Model } from '../models/Model.js';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nlu_chatbot';

async function seed() {
  await mongoose.connect(MONGO_URI, {
    dbName: 'mern_chatbot'
  });
  
  console.log('✅ Connected to database:', mongoose.connection.db.databaseName);
  
  // Clear existing data
  console.log('🧹 Clearing existing workspaces and models...');
  await Workspace.deleteMany({});
  await Model.deleteMany({});
  console.log('✅ Cleared existing data');
  
  // Create admin user if doesn't exist
  const adminExists = await User.findOne({ email: 'admin@chatbot.com' });
  if (!adminExists) {
    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      email: 'admin@chatbot.com',
      passwordHash: adminPassword,
      role: 'admin'
    });
    console.log('Created admin user: admin@chatbot.com / admin123');
  }

  // Create three workspaces with proper status
  console.log('🏢 Creating workspaces...');
  const workspaces = await Workspace.insertMany([
    { name: 'HR Bot', owner: 'admin', status: 'active', datasetsCount: 5, createdAt: new Date('2024-01-01') },
    { name: 'Travel Bot', owner: 'user1', status: 'active', datasetsCount: 3, createdAt: new Date('2024-01-05') },
    { name: 'Support Bot', owner: 'user2', status: 'active', datasetsCount: 2, createdAt: new Date('2024-01-10') }
  ]);
  console.log('✅ Created workspaces:', workspaces.length);

  // Add models to each workspace
  console.log('🤖 Creating models...');
  const models = await Model.create([
    { name: 'HR Intent Classification', workspace: workspaces[0]._id, status: 'trained', createdAt: new Date('2024-01-02') },
    { name: 'HR Entity Recognition', workspace: workspaces[0]._id, status: 'trained', createdAt: new Date('2024-01-03') },
    { name: 'HR Sentiment Analysis', workspace: workspaces[0]._id, status: 'untrained', createdAt: new Date('2024-01-04') },
    { name: 'Travel Booking Assistant', workspace: workspaces[1]._id, status: 'trained', createdAt: new Date('2024-01-06') },
    { name: 'Travel Recommendation', workspace: workspaces[1]._id, status: 'untrained', createdAt: new Date('2024-01-07') },
    { name: 'Support Ticket Classifier', workspace: workspaces[2]._id, status: 'trained', createdAt: new Date('2024-01-11') }
  ]);
  console.log('✅ Created models:', models.length);

  console.log('✅ Successfully seeded:');
  console.log('   - 3 workspaces (all active)');
  console.log('   - 6 models (4 trained, 2 untrained)');
  console.log('   - 1 admin user');
  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
