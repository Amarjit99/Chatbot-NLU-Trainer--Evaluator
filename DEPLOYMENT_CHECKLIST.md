# ✅ Pre-Deployment Checklist

## Before Deploying to Render.com

### 1. MongoDB Atlas Setup
- [ ] Created MongoDB Atlas account
- [ ] Created free tier cluster (M0)
- [ ] Created database user with password
- [ ] Saved connection string securely
- [ ] Whitelisted all IPs (0.0.0.0/0)
- [ ] Tested connection locally

### 2. Environment Variables Ready
- [ ] JWT_SECRET generated (32+ characters)
- [ ] MONGO_URI connection string ready
- [ ] HuggingFace API key obtained (optional)
- [ ] All secrets documented securely

### 3. Code Preparation
- [ ] All changes committed to Git
- [ ] Latest code pushed to GitHub main branch
- [ ] No sensitive data in code (check .env is in .gitignore)
- [ ] Frontend API URLs use environment variables
- [ ] Package.json dependencies are up to date

### 4. Render Account
- [ ] Render.com account created
- [ ] GitHub account connected to Render
- [ ] Repository access granted

### 5. Configuration Files
- [ ] `render.yaml` exists and is configured
- [ ] `frontend/.env.production` created
- [ ] `frontend/.env.development` created
- [ ] `frontend/src/config/api.js` created
- [ ] `.gitignore` includes `.env` files

### 6. Build Scripts Verified
- [ ] Backend `npm start` works locally
- [ ] Frontend `npm run build` works locally
- [ ] No build errors in local testing

## During Deployment

### Backend Deployment
- [ ] Web service created on Render
- [ ] Node runtime selected
- [ ] Build command: `cd backend && npm install`
- [ ] Start command: `cd backend && npm start`
- [ ] Environment variables added:
  - [ ] NODE_ENV=production
  - [ ] PORT=3001
  - [ ] MONGO_URI
  - [ ] JWT_SECRET
  - [ ] CORS_ORIGIN
  - [ ] CLIENT_URL
  - [ ] HUGGINGFACE_API_KEY (optional)
- [ ] Backend deployed successfully
- [ ] Backend URL copied

### Frontend Deployment
- [ ] Static site created on Render
- [ ] Build command: `cd frontend && npm install && npm run build`
- [ ] Publish directory: `frontend/dist`
- [ ] Environment variables added:
  - [ ] VITE_API_URL=(backend URL)
  - [ ] NODE_ENV=production
- [ ] Frontend deployed successfully
- [ ] Frontend URL copied

### CORS Configuration
- [ ] Backend CORS_ORIGIN updated with frontend URL
- [ ] Backend CLIENT_URL updated with frontend URL
- [ ] Backend redeployed with updated CORS settings

## After Deployment

### Testing
- [ ] Frontend loads without errors
- [ ] Backend health check works: `/api/health`
- [ ] Can access signup page
- [ ] Can create new account
- [ ] Can login successfully
- [ ] Can create workspace
- [ ] Can upload training data
- [ ] Can train model (if HuggingFace configured)
- [ ] No CORS errors in browser console
- [ ] No authentication errors

### Monitoring
- [ ] Check Render logs for errors
- [ ] Check MongoDB Atlas connections
- [ ] Verify SSL certificate is active (https)
- [ ] Test from different devices/browsers

### Documentation
- [ ] README.md updated with live demo link
- [ ] Deployment guide reviewed
- [ ] Environment variable documentation complete
- [ ] Troubleshooting guide accessible

## Optional Enhancements

### Custom Domain (Optional)
- [ ] Domain purchased/available
- [ ] DNS records configured
- [ ] Custom domain added in Render
- [ ] SSL certificate verified
- [ ] Environment variables updated with custom domain

### Monitoring & Analytics (Optional)
- [ ] Error tracking set up (e.g., Sentry)
- [ ] Analytics configured (e.g., Google Analytics)
- [ ] Uptime monitoring enabled
- [ ] Performance monitoring active

### Backups (Recommended)
- [ ] MongoDB backup strategy planned
- [ ] Regular export schedule set
- [ ] Backup storage location decided

## Common Issues & Solutions

### Deployment Fails
✅ Check Render build logs  
✅ Verify all dependencies in package.json  
✅ Ensure Node version compatibility

### CORS Errors
✅ Verify CORS_ORIGIN matches frontend URL exactly  
✅ Include protocol (https://)  
✅ No trailing slash  
✅ Redeploy backend after changes

### MongoDB Connection Fails
✅ Check IP whitelist (0.0.0.0/0)  
✅ Verify connection string format  
✅ Test password (no special characters causing issues)  
✅ Check MongoDB Atlas cluster is running

### Frontend Blank Page
✅ Check browser console for errors  
✅ Verify VITE_API_URL is set correctly  
✅ Check API URL uses https:// not http://  
✅ Clear browser cache

### Free Tier Sleeping
✅ First request after 15min takes ~30 seconds  
✅ Consider using a keep-alive service  
✅ Or upgrade to paid tier for 24/7 uptime

## Success Indicators

✅ Backend health endpoint returns 200 OK  
✅ Frontend loads and shows login page  
✅ Can sign up, login, and create workspace  
✅ All API calls complete successfully  
✅ No errors in Render logs  
✅ MongoDB shows active connections  

---

## 🎉 Ready to Deploy!

Once all checkboxes are complete, you're ready to go live! Follow the [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) guide for step-by-step instructions.

**Estimated Total Time**: 20-30 minutes  
**Cost**: $0 (Free tier)

Good luck with your deployment! 🚀
