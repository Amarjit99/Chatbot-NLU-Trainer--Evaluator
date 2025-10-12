import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { Model } from '../models/Model.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Amrit99:Amrit%40123@chatbot-nlu-cluster.6wtqrl4.mongodb.net/?retryWrites=true&w=majority&appName=chatbot-nlu-cluster';

async function checkUsers() {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: 'mern_chatbot'
    });
    console.log('✅ Connected to MongoDB Atlas');
    console.log('Database:', mongoose.connection.db.databaseName);
    
    // Check all users
    const users = await User.find({});
    console.log('\n📋 ALL USERS IN DATABASE:');
    console.log('Total Users:', users.length);
    
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User Details:`);
        console.log('   ID:', user._id);
        console.log('   Username:', user.username);
        console.log('   Email:', user.email);
        console.log('   Role:', user.role);
        console.log('   Last Login:', user.lastLogin);
        console.log('   Created:', user.createdAt);
        console.log('   Updated:', user.updatedAt);
      });
    } else {
      console.log('❌ No users found in database!');
    }
    
    // Check workspaces
    const workspaces = await Workspace.find({});
    console.log('\n🏢 ALL WORKSPACES:');
    console.log('Total Workspaces:', workspaces.length);
    
    // Check models
    const models = await Model.find({});
    console.log('\n🤖 ALL MODELS:');
    console.log('Total Models:', models.length);
    
    // Check database collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📂 DATABASE COLLECTIONS:');
    collections.forEach(collection => {
      console.log('   -', collection.name);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Database check complete');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
}

checkUsers();