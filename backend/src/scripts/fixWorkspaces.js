import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace.js';
import { Model } from '../models/Model.js';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function fixWorkspaces() {
  try {
    // Connect using exact same method as main server
    await mongoose.connect(MONGO_URI, {
      dbName: 'mern_chatbot'
    });
    
    console.log('✅ Connected to:', mongoose.connection.db.databaseName);
    
    // Don't clear - just add if not exists
    const existingWorkspaces = await Workspace.find({});
    console.log('Existing workspaces:', existingWorkspaces.length);
    
    if (existingWorkspaces.length === 0) {
      // Create workspaces directly
      const workspace1 = new Workspace({
        name: 'HR Bot',
        owner: 'admin',
        status: 'active',
        datasetsCount: 5,
        createdAt: new Date('2024-01-01')
      });
      await workspace1.save();
      
      const workspace2 = new Workspace({
        name: 'Travel Bot',
        owner: 'user1', 
        status: 'active',
        datasetsCount: 3,
        createdAt: new Date('2024-01-05')
      });
      await workspace2.save();
      
      const workspace3 = new Workspace({
        name: 'Support Bot',
        owner: 'user2',
        status: 'active', 
        datasetsCount: 2,
        createdAt: new Date('2024-01-10')
      });
      await workspace3.save();
      
      console.log('✅ Created 3 workspaces');
      
      // Create models
      const models = [
        new Model({ name: 'HR Intent Classification', workspace: workspace1._id, status: 'trained', createdAt: new Date('2024-01-02') }),
        new Model({ name: 'HR Entity Recognition', workspace: workspace1._id, status: 'trained', createdAt: new Date('2024-01-03') }),
        new Model({ name: 'HR Sentiment Analysis', workspace: workspace1._id, status: 'untrained', createdAt: new Date('2024-01-04') }),
        new Model({ name: 'Travel Booking Assistant', workspace: workspace2._id, status: 'trained', createdAt: new Date('2024-01-06') }),
        new Model({ name: 'Travel Recommendation', workspace: workspace2._id, status: 'untrained', createdAt: new Date('2024-01-07') }),
        new Model({ name: 'Support Ticket Classifier', workspace: workspace3._id, status: 'trained', createdAt: new Date('2024-01-11') })
      ];
      
      for (let model of models) {
        await model.save();
      }
      
      console.log('✅ Created 6 models');
    }
    
    // Verify data
    const finalWorkspaces = await Workspace.find({});
    const finalModels = await Model.find({});
    
    console.log('\n📊 FINAL COUNTS:');
    console.log('Workspaces:', finalWorkspaces.length);
    console.log('Models:', finalModels.length);
    
    finalWorkspaces.forEach(ws => {
      console.log(`  - ${ws.name} (${ws.status})`);
    });
    
    // Keep connection open - don't disconnect
    console.log('\n✅ Data ready - keeping connection open for server');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWorkspaces();