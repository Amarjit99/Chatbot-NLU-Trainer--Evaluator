# 🚀 Deploy to Render.com - Complete Guide

## 🎯 Overview

This guide will help you deploy the **Chatbot NLU Trainer & Evaluator** to Render.com for **FREE**. Your application will be live on the internet with:

- ✅ **Backend API** (Node.js + Express)
- ✅ **Frontend** (React + Vite)
- ✅ **Database** (MongoDB Atlas - Free tier)
- ✅ **HTTPS/SSL** (Automatic)
- ✅ **Custom Domain Support** (Optional)

**Estimated Time**: 15-20 minutes  
**Cost**: $0 (Free tier)

---

## 📋 Prerequisites

Before starting, make sure you have:

1. ✅ **GitHub Account** - Your code is already on GitHub
2. ✅ **Render.com Account** - Sign up at https://render.com (use GitHub login)
3. ✅ **MongoDB Atlas Account** - Sign up at https://www.mongodb.com/cloud/atlas
4. ✅ **HuggingFace Account** (Optional) - For AI features: https://huggingface.co

---

## 🗂️ Part 1: Setup MongoDB Atlas (5 minutes)

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Click **"Try Free"** or **"Sign Up"**
3. Use Google/GitHub login or create account
4. Choose **FREE tier (M0)** cluster

### Step 2: Create Database Cluster
1. After login, click **"Build a Database"**
2. Choose **FREE (Shared)** tier
3. Select cloud provider: **AWS** (recommended)
4. Choose region closest to you
5. Cluster Name: `chatbot-nlu-cluster` (or any name)
6. Click **"Create"**

### Step 3: Configure Database Access
1. **Create Database User**:
   - Username: `chatbot_user` (or your choice)
   - Password: Click **"Autogenerate Secure Password"** → **COPY & SAVE IT!**
   - Click **"Create User"**

2. **Setup Network Access**:
   - Click **"Network Access"** in left sidebar
   - Click **"Add IP Address"**
   - Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Click **"Confirm"**

### Step 4: Get Connection String
1. Click **"Database"** in left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string, it looks like:
   ```
   mongodb+srv://chatbot_user:<password>@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. **SAVE THIS** - You'll need it for Render!

**Example**:
```
mongodb+srv://chatbot_user:MySecurePass123@chatbot-nlu.abc12.mongodb.net/chatbot_nlu?retryWrites=true&w=majority
```

---

## 🌐 Part 2: Deploy Backend to Render (5 minutes)

### Step 1: Sign Up/Login to Render
1. Go to https://render.com
2. Click **"Get Started"** or **"Sign In"**
3. Choose **"Sign in with GitHub"** (recommended)
4. Authorize Render to access your repositories

### Step 2: Create New Web Service
1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Click **"Connect account"** if needed
4. Find your repository: **`Chatbot-NLU-Trainer--Evaluator`**
5. Click **"Connect"**

### Step 3: Configure Backend Service
Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `chatbot-nlu-backend` |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | Leave empty |
| **Runtime** | `Node` |
| **Build Command** | `cd backend && npm install` |
| **Start Command** | `cd backend && npm start` |
| **Plan** | **Free** |

### Step 4: Add Environment Variables
Click **"Advanced"** → Scroll to **"Environment Variables"** → Add these:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `3001` | Backend port |
| `MONGO_URI` | `YOUR_MONGODB_CONNECTION_STRING` | From Part 1, Step 4 |
| `JWT_SECRET` | `generate-a-random-32-char-string` | Use: https://randomkeygen.com |
| `CORS_ORIGIN` | `https://chatbot-nlu-frontend.onrender.com` | Frontend URL (update later) |
| `CLIENT_URL` | `https://chatbot-nlu-frontend.onrender.com` | Frontend URL (update later) |
| `HUGGINGFACE_API_KEY` | `hf_xxxxx` | Optional, from HuggingFace |

**To generate JWT_SECRET**:
```bash
# Use this command or visit https://randomkeygen.com
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Deploy Backend
1. Click **"Create Web Service"**
2. Wait for deployment (2-5 minutes)
3. Look for **"Your service is live 🎉"**
4. **COPY the backend URL**: `https://chatbot-nlu-backend.onrender.com`

---

## 🎨 Part 3: Deploy Frontend to Render (5 minutes)

### Step 1: Create Frontend Service
1. Click **"New +"** → **"Static Site"**
2. Select your repository: **`Chatbot-NLU-Trainer--Evaluator`**
3. Click **"Connect"**

### Step 2: Configure Frontend Service
Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `chatbot-nlu-frontend` |
| **Branch** | `main` |
| **Root Directory** | Leave empty |
| **Build Command** | `cd frontend && npm install && npm run build` |
| **Publish Directory** | `frontend/dist` |

### Step 3: Add Frontend Environment Variables
Click **"Advanced"** → Add these environment variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://chatbot-nlu-backend.onrender.com` |
| `NODE_ENV` | `production` |

### Step 4: Deploy Frontend
1. Click **"Create Static Site"**
2. Wait for deployment (2-5 minutes)
3. **COPY the frontend URL**: `https://chatbot-nlu-frontend.onrender.com`

---

## 🔄 Part 4: Update Backend CORS Settings (2 minutes)

Now that you have your frontend URL, update the backend:

### Step 1: Update Backend Environment Variables
1. Go to your **Backend service** dashboard
2. Click **"Environment"** in left sidebar
3. Update these variables with your actual frontend URL:
   - `CORS_ORIGIN` → `https://chatbot-nlu-frontend.onrender.com`
   - `CLIENT_URL` → `https://chatbot-nlu-frontend.onrender.com`
4. Click **"Save Changes"**

### Step 2: Trigger Redeploy
1. The service will automatically redeploy
2. Wait 1-2 minutes for the changes to take effect

---

## ✅ Part 5: Test Your Live Application

### Step 1: Access Your Application
Open your frontend URL in a browser:
```
https://chatbot-nlu-frontend.onrender.com
```

### Step 2: Test Core Features
1. **Sign Up**: Create a new account
2. **Login**: Login with your credentials
3. **Create Workspace**: Test workspace creation
4. **Check Backend**: Visit backend health check:
   ```
   https://chatbot-nlu-backend.onrender.com/api/health
   ```
   Should return: `{"status":"ok","message":"API is running"}`

### Step 3: Test Training (if HuggingFace configured)
1. Upload sample training data
2. Train a model
3. Test predictions

---

## 🎯 Part 6: Configure Frontend API URL

Your frontend needs to know where the backend is. Let's update the frontend code:

### Option A: Update via Environment Variable (Recommended)

1. In your local code, create/update `frontend/.env.production`:
   ```env
   VITE_API_URL=https://chatbot-nlu-backend.onrender.com
   ```

2. Update your frontend code to use this:
   ```javascript
   // frontend/src/utils/auth.js or similar
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
   ```

3. Commit and push:
   ```bash
   git add .
   git commit -m "feat: add production API URL configuration"
   git push origin main
   ```

4. Render will auto-deploy the changes!

### Option B: Update Render Environment (Already Done)
We already added `VITE_API_URL` in Part 3, Step 3. Just make sure your frontend code uses it!

---

## 🔧 Troubleshooting

### Frontend Shows Blank Page
**Solution**: Check browser console (F12) for errors
- If you see CORS errors → Check backend `CORS_ORIGIN` is set correctly
- If you see network errors → Check backend is running and URL is correct

### Backend Health Check Fails
**Solution**: 
1. Check Render logs: Dashboard → Your Service → "Logs"
2. Verify MongoDB connection string is correct
3. Check all environment variables are set

### MongoDB Connection Error
**Solution**:
1. Check IP whitelist in MongoDB Atlas (should be 0.0.0.0/0)
2. Verify connection string format
3. Make sure password doesn't have special characters (or URL encode them)

### Build Fails
**Solution**:
1. Check Render build logs
2. Verify `package.json` has all dependencies
3. Make sure Node version is compatible (18+)

### Free Tier Limitations
**Render Free Tier**:
- Apps sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- 750 hours/month free (per service)
- Bandwidth: 100 GB/month

**MongoDB Atlas Free Tier**:
- 512 MB storage
- Shared RAM
- No backups (manual export recommended)

---

## 🚀 Optional: Custom Domain Setup

### Step 1: Add Custom Domain
1. Go to your Render service dashboard
2. Click **"Settings"** → **"Custom Domain"**
3. Add your domain: `yourapp.com`
4. Follow DNS configuration instructions

### Step 2: Update Environment Variables
After adding custom domain, update:
- Backend `CORS_ORIGIN` → `https://yourapp.com`
- Backend `CLIENT_URL` → `https://yourapp.com`
- Frontend `VITE_API_URL` → `https://api.yourapp.com` (if using subdomain)

---

## 📊 Monitoring & Maintenance

### View Logs
1. Go to service dashboard
2. Click **"Logs"** tab
3. Real-time logs appear here

### Auto-Deploy
Every time you push to GitHub `main` branch, Render automatically:
1. Pulls latest code
2. Runs build command
3. Deploys new version
4. Zero downtime!

### Manual Deploy
1. Go to service dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 🎉 Success Checklist

- [ ] MongoDB Atlas cluster created and connection string saved
- [ ] Backend service deployed on Render
- [ ] Frontend service deployed on Render
- [ ] Backend health check returns OK
- [ ] Frontend loads without errors
- [ ] Can sign up and login
- [ ] Can create workspace
- [ ] CORS configured correctly
- [ ] Environment variables set properly

---

## 🆘 Need Help?

If you encounter issues:

1. **Check Render Logs**: Service Dashboard → Logs tab
2. **Check MongoDB Atlas**: Database → Metrics
3. **Browser Console**: F12 → Console tab (for frontend errors)
4. **GitHub Issues**: https://github.com/Amarjit99/Chatbot-NLU-Trainer--Evaluator/issues

---

## 📝 Important URLs to Save

After deployment, save these URLs:

```
Frontend URL: https://chatbot-nlu-frontend.onrender.com
Backend URL:  https://chatbot-nlu-backend.onrender.com
Health Check: https://chatbot-nlu-backend.onrender.com/api/health
MongoDB:      Your connection string (keep private!)
```

---

## 🎊 Congratulations!

Your **Chatbot NLU Trainer & Evaluator** is now **LIVE** on the internet! 🌐

**Share your project**:
- Update GitHub README with live demo link
- Share on social media
- Add to your portfolio

**Next Steps**:
- Monitor usage and performance
- Consider upgrading to paid tier for better performance
- Set up monitoring alerts
- Create regular MongoDB backups
