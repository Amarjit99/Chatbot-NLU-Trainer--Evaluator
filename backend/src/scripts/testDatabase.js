import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { Model } from '../models/Model.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Amrit99:Amrit%40123@chatbot-nlu-cluster.6wtqrl4.mongodb.net/?retryWrites=true&w=majority&appName=chatbot-nlu-cluster';

async function testDatabase() {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: 'mern_chatbot'
    });
    console.log('✅ Connected to MongoDB Atlas');
    console.log('Database:', mongoose.connection.db.databaseName);
    
    // Test creating a single workspace
    console.log('\n🧪 TESTING: Creating a single workspace...');
    const testWorkspace = await Workspace.create({
      name: 'Test Workspace',
      owner: 'test',
      status: 'active',
      datasetsCount: 1
    });
    console.log('Created workspace:', testWorkspace);
    
    // Immediately query for it
    console.log('\n🔍 TESTING: Querying for workspaces...');
    const allWorkspaces = await Workspace.find({});
    console.log('Found workspaces:', allWorkspaces.length);
    allWorkspaces.forEach(ws => {
      console.log(`  - ${ws.name} (${ws.status}) - Owner: ${ws.owner}`);
    });
    
    // Test creating a model
    console.log('\n🤖 TESTING: Creating a model...');
    const testModel = await Model.create({
      name: 'Test Model',
      workspace: testWorkspace._id,
      status: 'untrained'
    });
    console.log('Created model:', testModel);
    
    // Query for models
    console.log('\n🔍 TESTING: Querying for models...');
    const allModels = await Model.find({});
    console.log('Found models:', allModels.length);
    allModels.forEach(model => {
      console.log(`  - ${model.name} (${model.status}) - Workspace: ${model.workspace}`);
    });
    
    // List all collections with counts
    console.log('\n📊 COLLECTION COUNTS:');
    const userCount = await User.countDocuments({});
    const workspaceCount = await Workspace.countDocuments({});
    const modelCount = await Model.countDocuments({});
    
    console.log(`Users: ${userCount}`);
    console.log(`Workspaces: ${workspaceCount}`);
    console.log(`Models: ${modelCount}`);
    
    // Clean up test data
    await Workspace.deleteOne({ name: 'Test Workspace' });
    await Model.deleteOne({ name: 'Test Model' });
    console.log('\n🧹 Cleaned up test data');
    
    await mongoose.disconnect();
    console.log('\n✅ Test complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testDatabase();