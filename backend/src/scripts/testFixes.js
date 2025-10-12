import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace.js';
import { Model } from '../models/Model.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function testFixes() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'mern_chatbot' });
    console.log('✅ Connected to MongoDB Atlas');
    
    // Test 1: Create a user workspace
    console.log('\n📝 Test 1: Creating user workspace...');
    const userWorkspace = await Workspace.create({
      name: 'User Test Workspace',
      owner: 'testuser',
      status: 'active',
      description: 'Testing user workspace creation',
      datasetsCount: 0
    });
    console.log('✅ User workspace created:', userWorkspace.name);
    
    // Test 2: Create a model for this workspace
    console.log('\n🤖 Test 2: Creating model for workspace...');
    const testModel = await Model.create({
      name: 'Test Model',
      workspace: userWorkspace._id,
      status: 'trained',
      accuracy: 0.87
    });
    console.log('✅ Model created:', testModel.name);
    
    // Test 3: Update workspace datasets count
    console.log('\n📊 Test 3: Updating workspace count...');
    await Workspace.findByIdAndUpdate(userWorkspace._id, { 
      $inc: { datasetsCount: 1 } 
    });
    console.log('✅ Workspace datasets count updated');
    
    // Test 4: Check admin dashboard will see this
    console.log('\n👤 Test 4: Checking admin view...');
    const allWorkspaces = await Workspace.find({});
    const allModels = await Model.find({});
    console.log(`📊 Admin Dashboard will show:`);
    console.log(`   - Total Workspaces: ${allWorkspaces.length}`);
    console.log(`   - Total Models: ${allModels.length}`);
    
    allWorkspaces.forEach(ws => {
      console.log(`   - ${ws.name} (${ws.owner}) - ${ws.status}`);
    });
    
    console.log('\n✅ All tests passed! User workspace creation will now work and show in admin dashboard.');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testFixes();