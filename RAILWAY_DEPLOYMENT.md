# 🚂 Deploy to Railway.app - Complete Full-Stack Guide

## 🎯 Overview

Deploy your **Chatbot NLU Trainer & Evaluator** to Railway.app - the **BEST free platform** for full-stack applications!

### ⚡ Why Railway is Better:

| Feature | Railway | Render | Heroku |
|---------|---------|--------|--------|
| **Sleep Time** | ❌ None | ✅ 15 min | ✅ 30 min |
| **Wake Time** | Instant | 30 sec | 20 sec |
| **Free Credit** | $5/month | None | Limited |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Auto Deploy** | ✅ | ✅ | ✅ |
| **Dashboard** | Excellent | Good | Basic |

### 🎁 What You Get (FREE):

- ✅ **$5 monthly credit** (enough for full-stack app)
- ✅ **No sleep/wake delays** (always fast)
- ✅ **Automatic HTTPS/SSL**
- ✅ **Custom domains** (free)
- ✅ **One-click database** provisioning
- ✅ **Better performance** than Render
- ✅ **Your `railway.toml` is already configured!**

**Estimated Time**: 8-12 minutes  
**Cost**: $0 (Free $5 credit)

---

## 📋 Prerequisites

1. ✅ **GitHub Account** - Your code is on GitHub
2. ✅ **Railway Account** - Sign up at https://railway.app (use GitHub)
3. ✅ **MongoDB Atlas** - Free database at https://mongodb.com/cloud/atlas

---

## 🗂️ Part 1: Setup MongoDB Atlas (5 minutes)

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Click **"Try Free"** or **"Sign Up"**
3. Use GitHub login (recommended)
4. Choose **FREE tier (M0)** cluster

### Step 2: Create Database Cluster
1. After login, click **"Build a Database"**
2. Choose **FREE (Shared)** - M0 tier
3. Cloud Provider: **AWS** (recommended)
4. Region: Choose closest to you
5. Cluster Name: `chatbot-nlu-cluster`
6. Click **"Create"**

### Step 3: Configure Database Access
1. **Create Database User**:
   - Username: `chatbot_user`
   - Password: Click **"Autogenerate Secure Password"** → **SAVE IT!**
   - Click **"Create User"**

2. **Setup Network Access**:
   - Click **"Network Access"** (left sidebar)
   - Click **"Add IP Address"**
   - Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Click **"Confirm"**

### Step 4: Get Connection String
1. Go to **"Database"** → Click **"Connect"**
2. Choose **"Connect your application"**
3. Copy the connection string:
   ```
   mongodb+srv://chatbot_user:<password>@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password
5. Add database name: `/chatbot_nlu` before the `?`

**Final format**:
```
mongodb+srv://chatbot_user:YourPassword123@cluster.abc12.mongodb.net/chatbot_nlu?retryWrites=true&w=majority
```

**✅ MongoDB Setup Complete!** Save this connection string.

---

## 🚂 Part 2: Deploy to Railway (7 minutes)

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Click **"Login"** or **"Start a New Project"**
3. Click **"Login with GitHub"** (recommended)
4. Authorize Railway to access your repositories

### Step 2: Create New Project
1. Click **"New Project"** button
2. Select **"Deploy from GitHub repo"**
3. Click **"Configure GitHub App"** if prompted
4. Find and select: **`Chatbot-NLU-Trainer--Evaluator`**
5. Railway will detect your `railway.toml` automatically!

### Step 3: Configure Services

Railway will automatically create TWO services from your configuration:
- 🟦 **Backend Service** (Node.js API)
- 🟩 **Frontend Service** (React/Vite)

#### A) Configure Backend Service

1. Click on the **Backend service** card
2. Go to **"Variables"** tab
3. Add these environment variables:

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `3001` | Backend port |
| `MONGO_URI` | `mongodb+srv://chatbot_user:...` | From Part 1 |
| `JWT_SECRET` | `your-32-char-secret` | Generate below |
| `CORS_ORIGIN` | `${{RAILWAY_STATIC_URL}}` | Auto frontend URL |
| `CLIENT_URL` | `${{RAILWAY_STATIC_URL}}` | Auto frontend URL |
| `HUGGINGFACE_API_KEY` | `hf_xxxxx` | Optional |

**Generate JWT_SECRET**:
```bash
# Run this in terminal (PowerShell)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Or visit: https://randomkeygen.com

4. Click **"Deploy"** if not auto-deployed

#### B) Configure Frontend Service

1. Click on the **Frontend service** card
2. Go to **"Variables"** tab
3. Add these environment variables:

| Variable Name | Value |
|---------------|-------|
| `VITE_API_URL` | `${{backend.RAILWAY_PUBLIC_DOMAIN}}` |
| `NODE_ENV` | `production` |

**Note**: Railway's `${{backend.RAILWAY_PUBLIC_DOMAIN}}` automatically links to your backend!

4. Click **"Deploy"**

### Step 4: Generate Public URLs

#### For Backend:
1. Click **Backend service**
2. Go to **"Settings"** tab
3. Scroll to **"Networking"**
4. Click **"Generate Domain"**
5. Copy the URL: `https://chatbot-nlu-backend-production.up.railway.app`

#### For Frontend:
1. Click **Frontend service**
2. Go to **"Settings"** tab
3. Scroll to **"Networking"**
4. Click **"Generate Domain"**
5. Copy the URL: `https://chatbot-nlu-frontend.up.railway.app`

### Step 5: Update Environment Variables

Now update backend environment variables with actual frontend URL:

1. Go to **Backend service** → **"Variables"**
2. Update these variables:
   - `CORS_ORIGIN`: `https://chatbot-nlu-frontend.up.railway.app`
   - `CLIENT_URL`: `https://chatbot-nlu-frontend.up.railway.app`
3. Service will auto-redeploy

---

## ✅ Part 3: Verify Deployment

### Step 1: Check Deployment Status

In Railway dashboard, you should see:
- 🟢 **Backend**: Deploy successful
- 🟢 **Frontend**: Deploy successful

### Step 2: Test Backend

Open backend URL in browser:
```
https://chatbot-nlu-backend-production.up.railway.app/api/health
```

**Expected response**:
```json
{
  "status": "ok",
  "message": "API is running",
  "timestamp": "2025-10-16T..."
}
```

### Step 3: Test Frontend

Open frontend URL:
```
https://chatbot-nlu-frontend.up.railway.app
```

**Expected**:
- ✅ Login page loads
- ✅ No errors in browser console (F12)
- ✅ Can see signup/login forms

### Step 4: Full Feature Test

1. **Sign Up**: Create a new account
2. **Login**: Login with credentials
3. **Create Workspace**: Test workspace creation
4. **Upload Data**: Try uploading sample data
5. **Train Model**: If HuggingFace configured

---

## 🔧 Troubleshooting

### Backend Won't Start

**Check Logs**:
1. Click **Backend service**
2. Go to **"Deployments"** tab
3. Click latest deployment
4. Check **"Build Logs"** and **"Deploy Logs"**

**Common Issues**:
- ❌ MongoDB connection failed → Check connection string
- ❌ Missing environment variables → Verify all vars are set
- ❌ Build failed → Check package.json dependencies

### Frontend Shows Blank Page

**Solution**:
1. Open browser console (F12)
2. Check for CORS errors
3. Verify `VITE_API_URL` is set correctly
4. Make sure backend URL uses `https://`

### CORS Errors

**Solution**:
1. Go to Backend service → Variables
2. Verify `CORS_ORIGIN` matches frontend URL exactly
3. Include `https://` protocol
4. No trailing slash
5. Save and redeploy

### MongoDB Connection Issues

**Solution**:
1. Check IP whitelist in MongoDB Atlas (0.0.0.0/0)
2. Verify username and password in connection string
3. Make sure database name is included
4. Test connection string format

### Build Takes Too Long

Railway has generous build times, but if it's stuck:
1. Check if dependencies are too large
2. Verify package.json has correct scripts
3. Check Railway dashboard for any errors

---

## 💰 Free Tier Limits

### Railway Free Plan:
- ✅ **$5 monthly credit** (resets monthly)
- ✅ **500 execution hours**
- ✅ **No sleep/wake time**
- ✅ **100 GB network egress**
- ✅ **8 GB RAM shared**
- ✅ **8 vCPU shared**

**Your app should use ~$3-4/month**, leaving credit buffer!

### MongoDB Atlas Free (M0):
- ✅ **512 MB storage**
- ✅ **Shared RAM**
- ✅ **No backups** (export manually)
- ✅ **10 connections**

---

## 🎨 Optional: Custom Domain

### Step 1: Add Custom Domain

1. Go to **Frontend service** → **"Settings"**
2. Scroll to **"Networking"** → **"Custom Domain"**
3. Click **"Add Domain"**
4. Enter your domain: `yourapp.com`

### Step 2: Configure DNS

Railway will show DNS records to add:

**CNAME Record**:
```
Type: CNAME
Name: @ or www
Value: [Railway provides this]
```

Add these records in your domain registrar (GoDaddy, Namecheap, etc.)

### Step 3: Update Environment Variables

After custom domain is active:
1. Update backend `CORS_ORIGIN` → `https://yourapp.com`
2. Update backend `CLIENT_URL` → `https://yourapp.com`

---

## 📊 Monitoring & Logs

### View Real-Time Logs

1. Click on any service (Backend or Frontend)
2. Go to **"Deployments"** tab
3. Click on current deployment
4. **Deploy Logs** → Real-time application logs
5. **Build Logs** → Build process logs

### Monitor Usage

1. Go to Project **"Usage"** tab
2. See:
   - 💰 **Credit usage** (out of $5)
   - 📊 **Network usage**
   - ⏱️ **Execution hours**
   - 💾 **Memory usage**

### Set Up Notifications

1. Go to Project **"Settings"**
2. Enable **"Deployment notifications"**
3. Get notified on:
   - Successful deploys
   - Failed deploys
   - Build errors

---

## 🔄 Auto-Deployment

Railway automatically deploys when you push to GitHub!

### How it Works:
1. You push code to GitHub `main` branch
2. Railway detects the push
3. Automatically pulls latest code
4. Runs build
5. Deploys new version
6. Zero downtime!

### Disable Auto-Deploy (Optional):
1. Go to Service → **"Settings"**
2. Scroll to **"Service"** section
3. Toggle **"Auto Deploy"** off

---

## 🚀 Advanced: Multiple Environments

### Create Staging Environment

1. Click **"New Project"**
2. Connect same repository
3. Select different branch: `staging`
4. Configure with different environment variables
5. Now you have:
   - **Production**: `main` branch
   - **Staging**: `staging` branch

---

## 🆘 Common Questions

### Q: Will my app sleep?
**A**: No! Unlike Render/Heroku, Railway has no sleep time. Always fast!

### Q: How much does it really cost?
**A**: $0-4/month with free credit. If you exceed $5, add payment method or app pauses.

### Q: Can I use my own database?
**A**: Yes! Use MongoDB Atlas (recommended) or Railway's PostgreSQL.

### Q: What happens if I run out of credit?
**A**: App pauses. Add payment method to continue, or wait for monthly reset.

### Q: Can I add more services?
**A**: Yes! Add workers, cron jobs, Redis, etc.

### Q: How do I rollback a deployment?
**A**: Go to Deployments → Click older deployment → "Redeploy"

---

## 📝 Important URLs to Save

After deployment, save these:

```
✅ Frontend:     https://chatbot-nlu-frontend.up.railway.app
✅ Backend:      https://chatbot-nlu-backend-production.up.railway.app
✅ Health Check: https://chatbot-nlu-backend-production.up.railway.app/api/health
✅ Dashboard:    https://railway.app/project/[your-project-id]
🔒 MongoDB:      [Your connection string - keep private!]
```

---

## 🎊 Success Checklist

- [ ] MongoDB Atlas cluster created
- [ ] MongoDB connection string saved
- [ ] Railway account created and connected to GitHub
- [ ] Project created from GitHub repository
- [ ] Backend service deployed with environment variables
- [ ] Frontend service deployed with environment variables
- [ ] Public domains generated for both services
- [ ] Backend health check returns OK
- [ ] Frontend loads without errors
- [ ] Can sign up and login
- [ ] Can create workspace
- [ ] No CORS errors
- [ ] All features working

---

## 🎯 Advantages Over Render

| Feature | Railway | Render |
|---------|---------|--------|
| **Sleep/Wake** | No sleep ✅ | Sleeps after 15min ❌ |
| **Performance** | Faster ⚡ | Slower 🐌 |
| **Dashboard** | Better 🎨 | Good ✅ |
| **Credits** | $5/month 💰 | None ❌ |
| **Setup Time** | 8-12 min ⏱️ | 15-20 min ⏱️ |
| **Logs** | Excellent 📊 | Good ✅ |
| **Deployment** | Instant ⚡ | 2-3 min ⏱️ |

---

## 📚 Additional Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **MongoDB Docs**: https://docs.mongodb.com/atlas/
- **Your Project Repo**: https://github.com/Amarjit99/Chatbot-NLU-Trainer--Evaluator

---

## 🆘 Need Help?

1. **Check Railway Logs**: Service → Deployments → Logs
2. **Check MongoDB**: Atlas dashboard → Metrics
3. **Browser Console**: F12 → Console (for frontend)
4. **Railway Discord**: Great community support
5. **GitHub Issues**: https://github.com/Amarjit99/Chatbot-NLU-Trainer--Evaluator/issues

---

## 🎉 Congratulations!

Your **Chatbot NLU Trainer & Evaluator** is now **LIVE** on Railway! 🚂

**Your app is**:
- ⚡ Fast (no sleep time)
- 🔒 Secure (HTTPS)
- 🌍 Public (accessible worldwide)
- 🚀 Auto-deploying (every git push)
- 💰 Free (with $5 monthly credit)

**Next Steps**:
1. Update README with live demo link
2. Share your project
3. Monitor usage in Railway dashboard
4. Consider custom domain

**Happy deploying!** 🎊
