# 🔧 Frontend API URL Migration Guide

## Issue
The frontend currently has hardcoded `localhost:3001` URLs that need to be updated to use environment variables for production deployment.

## Solution

### Step 1: Import API_URL in each file

Add this import at the top of files that make API calls:
```javascript
import API_URL from '../config/api';
```

### Step 2: Replace hardcoded URLs

**Before**:
```javascript
fetch('http://localhost:3001/api/auth/login', options)
```

**After**:
```javascript
fetch(`${API_URL}/api/auth/login`, options)
```

## Files to Update

The following files contain hardcoded API URLs and need to be updated:

1. `frontend/src/Pages/ActiveLearningDashboard.jsx`
2. `frontend/src/Pages/AdminDashboard.jsx`
3. `frontend/src/Pages/AdminDashboard-backup.jsx`
4. `frontend/src/Pages/EntityAnnotation.jsx`
5. `frontend/src/Pages/EvaluationDashboard.jsx`
6. `frontend/src/Pages/Login.jsx`
7. `frontend/src/Pages/Signup.jsx`
8. `frontend/src/Pages/Workspace.jsx`
9. `frontend/src/Pages/ModelVersioningDashboard.jsx`
10. `frontend/src/Pages/MultiBackendTraining.jsx`
11. `frontend/src/Pages/UserProfile.jsx`
12. `frontend/src/utils/auth.js`

## Quick Fix Script

You can use this PowerShell script to update all files at once:

```powershell
# Navigate to frontend directory
cd frontend/src

# Update all .jsx and .js files
Get-ChildItem -Recurse -Include *.jsx,*.js | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $updated = $content -replace "http://localhost:3001", '${API_URL}'
    $updated -replace "'`${API_URL}'", '`${API_URL}' | Set-Content $_.FullName
}
```

## Verification

After updates, verify that:
1. Development still works: `npm run dev`
2. Production build succeeds: `npm run build`
3. No hardcoded localhost URLs remain: Search for "localhost:3001"

## Environment Variables

- **Development**: Uses `frontend/.env.development` → `http://localhost:3001`
- **Production**: Uses `frontend/.env.production` → `https://chatbot-nlu-backend.onrender.com`

The `import.meta.env.VITE_API_URL` variable is automatically set by Vite based on the environment.
