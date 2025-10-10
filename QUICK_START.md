# ⚡ **Chatbot NLU Trainer & Evaluator - Quick Start Guide**

<div align="center">

**Get up and running in under 5 minutes!**

[![Quick Setup](https://img.shields.io/badge/Setup-5%20Minutes-green.svg)](https://github.com/Amarjit99/advanced-multi-backend-nlu-chatbot)
[![Beginner Friendly](https://img.shields.io/badge/Level-Beginner%20Friendly-brightgreen.svg)](https://github.com/Amarjit99/advanced-multi-backend-nlu-chatbot)

</div>

---

## 🚀 **Super Quick Start (5 Minutes)**

### Step 1: Clone & Setup
```bash
git clone https://github.com/Amarjit99/advanced-multi-backend-nlu-chatbot.git
cd advanced-multi-backend-nlu-chatbot
cp .env.example .env
```

### Step 2: Install Dependencies
```bash
# Install all dependencies at once
npm run install:all
```

### Step 3: Start Application
```bash
# Terminal 1 - Backend Server
cd backend; npm run dev

# Terminal 2 - Frontend Server (new terminal)
cd frontend; npm run dev
```

### Step 4: Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

---

## 🎯 **Essential First Steps**

### Step 1: Create Account & Workspace
1. **Sign Up** → Enter username, email, password
2. **Create Workspace** → Click "Create New Workspace" → Enter name
3. **Select Workspace** → Click on workspace in sidebar

### Step 2: Train Your First Model
1. **Go to Training Tab** → Click "Training" tab
2. **Upload Data** → Click "Choose File" → Select JSON file
3. **Train Model** → Click "Train Model" → Wait for completion
4. **Test Model** → Type text → Click "Predict Intent"

### Step 3: Evaluate Performance
1. **Go to Evaluation Tab** → Click "Evaluation" tab
2. **Upload Test Data** → Choose test JSON file → Click "Evaluate Model"
3. **View Results** → Check accuracy, F1 score, confusion matrix
4. **Try Holdout** → Click "Evaluate Holdout" for automatic testing

### Step 4: Manage Versions
1. **Go to Versioning Tab** → Click "Versioning" tab
2. **Create Version** → Click "Create New Version" → Add description & tags
3. **Compare Versions** → Select multiple versions → Click "Compare"
4. **Export Model** → Select version → Click "Export"

---

## 📋 Training Data Format

```json
[
  {
    "text": "I want to book a table",
    "intent": "book_table"
  },
  {
    "text": "What's the weather like?",
    "intent": "check_weather"
  }
]
```

---

## 🎯 Key Features Quick Reference

| Feature | Location | Purpose |
|---------|----------|---------|
| **Create Workspace** | Sidebar | Organize projects |
| **Upload Training Data** | Training Tab | Provide data for AI |
| **Train Model** | Training Tab | Create AI model |
| **Predict Intent** | Training Tab | Test with new text |
| **Evaluate Model** | Evaluation Tab | Measure performance |
| **Compare Evaluations** | Evaluation Tab | Compare results |
| **Create Version** | Versioning Tab | Save model versions |
| **Export Model** | Versioning Tab | Download for use |

---

## 🔧 Common Issues & Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Blank page | Check browser console (F12) |
| Upload fails | Verify JSON format |
| Training stuck | Check HuggingFace API key |
| No results | Refresh page |
| Can't create version | Ensure model is trained first |

---

## 📊 Understanding Results

### Training Results
- **Intents**: Number of different intents learned
- **Samples**: Number of training examples processed

### Evaluation Results
- **Accuracy**: Overall correctness (higher = better)
- **F1 Score**: Balanced performance (0-1, higher = better)
- **Precision**: Correct positive predictions
- **Recall**: Found positive cases

### Confusion Matrix
- **Diagonal**: Correct predictions
- **Off-diagonal**: Misclassifications

---

## 🎨 Interface Overview

```
┌─────────────────────────────────────────┐
│  Login/Signup                           │
├─────────────────────────────────────────┤
│  Sidebar    │  Main Content             │
│  - Workspaces│  ┌─────────────────────┐  │
│  - Create   │  │  Training Tab       │  │
│             │  │  Evaluation Tab     │  │
│             │  │  Versioning Tab     │  │
│             │  └─────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 💡 Pro Tips

1. **Start Small**: Begin with 3-5 intents
2. **Quality Data**: Use diverse, realistic examples
3. **Test Often**: Evaluate after each training
4. **Version Everything**: Track all improvements
5. **Compare Results**: Use comparison features

---

## 🚀 Ready to Go!

1. **Start servers** (2 terminals)
2. **Open browser** → `localhost:5174` (check terminal for port)
3. **Sign up** → Create workspace
4. **Upload data** → Train model
5. **Test & Evaluate** → Create versions

**Need help?** Check the full `USER_GUIDE.md` for detailed instructions!
