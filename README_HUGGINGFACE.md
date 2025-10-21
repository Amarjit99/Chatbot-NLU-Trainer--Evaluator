---
title: Chatbot NLU Trainer & Evaluator
emoji: 🤖
colorFrom: blue
colorTo: purple
sdk: gradio
sdk_version: 4.8.0
app_file: app.py
pinned: false
license: mit
---

# 🤖 Chatbot NLU Trainer & Evaluator

A comprehensive platform for training, evaluating, and managing NLU (Natural Language Understanding) models for chatbots.

## Features

### 🎯 Core Features
- **Intent Classification Training** - Train models to understand user intentions
- **Entity Recognition** - Extract key information from user messages
- **Multi-Backend Support** - Train with HuggingFace, Rasa, or spaCy
- **Model Evaluation** - Comprehensive metrics and confusion matrices
- **Active Learning** - Improve models with uncertain predictions
- **Model Versioning** - Track and manage different model versions

### 📊 Analytics & Monitoring
- Real-time training progress
- Performance metrics visualization
- Confidence score analysis
- Intent distribution charts

### 🔧 Built With
- **Frontend:** Gradio for interactive UI
- **Backend:** Python with scikit-learn, transformers
- **Visualization:** Plotly for charts and graphs
- **Storage:** JSON-based data management

## How to Use

### 1. Training Tab
- Upload your training data (JSON format)
- Select backend (HuggingFace/Rasa/spaCy)
- Configure training parameters
- Start training and monitor progress

### 2. Evaluation Tab
- Test your trained model
- View performance metrics
- Analyze confusion matrix
- Check per-intent statistics

### 3. Prediction Tab
- Enter text to classify
- View predicted intent and confidence
- See alternative predictions
- Get entity extraction results

### 4. Active Learning
- Review uncertain predictions
- Provide correct labels
- Retrain model with feedback
- Improve model accuracy

## Sample Data Format

```json
[
  {
    "text": "I want to book a flight to New York",
    "intent": "book_flight",
    "entities": [
      {"entity": "destination", "value": "New York"}
    ]
  },
  {
    "text": "Cancel my reservation",
    "intent": "cancel_booking",
    "entities": []
  }
]
```

## Links

- **GitHub Repository:** [Chatbot-NLU-Trainer--Evaluator](https://github.com/Amarjit99/Chatbot-NLU-Trainer--Evaluator)
- **Full Application:** [React + Node.js Version](https://github.com/Amarjit99/Chatbot-NLU-Trainer--Evaluator)

## Author

**Amarjit Kumar**
- GitHub: [@Amarjit99](https://github.com/Amarjit99)

## License

MIT License - See LICENSE file for details

---

*This is a demo version optimized for Hugging Face Spaces. For the full-featured application with MongoDB integration, user management, and advanced features, check out the GitHub repository.*
