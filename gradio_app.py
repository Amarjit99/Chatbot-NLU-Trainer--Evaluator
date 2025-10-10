"""
🤖 Chatbot NLU Trainer & Evaluator - Hugging Face Spaces Demo
============================================================

A Gradio-based interface for the Chatbot NLU Trainer & Evaluator.
Optimized for Hugging Face Spaces free-tier deployment.

Author: Amarjit Kumar
Repository: https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1
"""

import gradio as gr
import pandas as pd
import json
import numpy as np
from datetime import datetime
import plotly.express as px
import plotly.graph_objects as go
from typing import Dict, List, Tuple
import time

# Sample data for demonstration
SAMPLE_TRAINING_DATA = [
    {"text": "I want to book a flight to New York", "intent": "book_flight", "entities": [{"entity": "destination", "value": "New York"}]},
    {"text": "Cancel my reservation", "intent": "cancel_booking", "entities": []},
    {"text": "What's the weather like today?", "intent": "weather_query", "entities": [{"entity": "time", "value": "today"}]},
    {"text": "Book a table for 4 people", "intent": "book_table", "entities": [{"entity": "number", "value": "4"}]},
    {"text": "I need help with my account", "intent": "help_request", "entities": []},
]

INTENTS = ["book_flight", "cancel_booking", "weather_query", "book_table", "help_request"]

def simulate_training(training_data: str, backend: str, epochs: int) -> Tuple[str, str]:
    """Simulate model training with progress updates"""
    
    # Parse training data
    try:
        data = json.loads(training_data) if training_data.strip().startswith('[') else SAMPLE_TRAINING_DATA
    except:
        data = SAMPLE_TRAINING_DATA
    
    # Simulate training steps
    progress_steps = [
        "🔄 Initializing training environment...",
        "📊 Preprocessing training data...",
        "🔤 Tokenizing text samples...",
        "🧠 Training neural network...",
        "✅ Training completed successfully!"
    ]
    
    progress_text = ""
    for step in progress_steps:
        progress_text += f"{step}\n"
        time.sleep(0.5)
    
    # Generate simulated results
    accuracy = np.random.uniform(0.85, 0.95)
    precision = np.random.uniform(0.80, 0.92)
    recall = np.random.uniform(0.82, 0.90)
    f1_score = 2 * (precision * recall) / (precision + recall)
    
    results = {
        "status": "success",
        "backend": backend,
        "epochs": epochs,
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1_score,
        "training_time": f"{np.random.uniform(1.5, 3.5):.1f} seconds",
        "model_size": f"{np.random.uniform(10, 25):.1f} MB",
        "samples_processed": len(data)
    }
    
    results_text = f"""
🎉 **Training Results:**

**Model Performance:**
- 🎯 Accuracy: {results['accuracy']:.2%}
- 🔍 Precision: {results['precision']:.2%}
- 📊 Recall: {results['recall']:.2%}
- ⚖️ F1-Score: {results['f1_score']:.2%}

**Training Details:**
- 🔧 Backend: {results['backend']}
- 🔄 Epochs: {results['epochs']}
- ⏱️ Training Time: {results['training_time']}
- 💾 Model Size: {results['model_size']}
- 📈 Samples Processed: {results['samples_processed']}
"""
    
    return progress_text, results_text

def predict_intent(text: str, model_backend: str) -> Tuple[str, str]:
    """Simulate intent prediction"""
    
    if not text.strip():
        return "❌ Please enter some text to analyze.", ""
    
    # Simulated prediction logic
    predictions = {
        "flight": ("book_flight", 0.95, [{"entity": "destination", "value": "destination_city"}]),
        "cancel": ("cancel_booking", 0.92, []),
        "weather": ("weather_query", 0.88, [{"entity": "time", "value": "time_ref"}]),
        "table": ("book_table", 0.90, [{"entity": "number", "value": "party_size"}]),
        "help": ("help_request", 0.85, []),
    }
    
    # Simple keyword-based prediction for demo
    text_lower = text.lower()
    if any(word in text_lower for word in ["flight", "fly", "airport"]):
        intent, confidence, entities = predictions["flight"]
    elif any(word in text_lower for word in ["cancel", "remove", "delete"]):
        intent, confidence, entities = predictions["cancel"]
    elif any(word in text_lower for word in ["weather", "temperature", "rain"]):
        intent, confidence, entities = predictions["weather"]
    elif any(word in text_lower for word in ["table", "restaurant", "book", "reservation"]):
        intent, confidence, entities = predictions["table"]
    elif any(word in text_lower for word in ["help", "support", "assistance"]):
        intent, confidence, entities = predictions["help"]
    else:
        intent, confidence, entities = ("unknown", 0.45, [])
    
    # Add some randomness
    confidence += np.random.uniform(-0.05, 0.05)
    confidence = max(0.0, min(1.0, confidence))
    
    result_text = f"""
🔍 **Intent Prediction Results:**

**Predicted Intent:** `{intent}`
**Confidence Score:** {confidence:.2%}
**Model Backend:** {model_backend}

**Analysis:**
- Input Text: "{text}"
- Processing Time: ~{np.random.uniform(50, 150):.0f}ms
- Model Version: v1.0.0
"""
    
    entities_text = ""
    if entities:
        entities_text = "**Detected Entities:**\n"
        for entity in entities:
            entities_text += f"- {entity['entity']}: {entity['value']}\n"
    else:
        entities_text = "**Detected Entities:** None"
    
    return result_text, entities_text

def evaluate_model(test_data: str) -> Tuple[str, str]:
    """Simulate model evaluation"""
    
    # Generate synthetic evaluation metrics
    np.random.seed(42)
    
    intents = ["book_flight", "cancel_booking", "weather_query", "book_table", "help_request"]
    metrics = {}
    
    for intent in intents:
        precision = np.random.uniform(0.80, 0.95)
        recall = np.random.uniform(0.82, 0.93)
        f1 = 2 * (precision * recall) / (precision + recall)
        support = np.random.randint(15, 45)
        
        metrics[intent] = {
            "precision": precision,
            "recall": recall,
            "f1-score": f1,
            "support": support
        }
    
    # Overall metrics
    overall_accuracy = np.random.uniform(0.88, 0.94)
    macro_avg_f1 = np.mean([m["f1-score"] for m in metrics.values()])
    
    results_text = f"""
📊 **Model Evaluation Results:**

**Overall Performance:**
- 🎯 Accuracy: {overall_accuracy:.2%}
- ⚖️ Macro F1-Score: {macro_avg_f1:.2%}
- 📈 Total Test Samples: {sum(m['support'] for m in metrics.values())}

**Per-Intent Performance:**
"""
    
    for intent, metric in metrics.items():
        results_text += f"""
**{intent}:**
- Precision: {metric['precision']:.2%}
- Recall: {metric['recall']:.2%}
- F1-Score: {metric['f1-score']:.2%}
- Support: {metric['support']} samples
"""
    
    # Create confusion matrix visualization
    confusion_text = """
📈 **Confusion Matrix Analysis:**

Model shows strong performance across all intent categories with minimal cross-class confusion.
Key insights:
- Highest performance: weather_query and book_flight
- Areas for improvement: help_request disambiguation
- Recommendation: Increase training data for edge cases
"""
    
    return results_text, confusion_text

def create_sample_data() -> str:
    """Generate sample training data in JSON format"""
    return json.dumps(SAMPLE_TRAINING_DATA, indent=2)

def get_project_info() -> str:
    """Return project information"""
    return """
# 🤖 Chatbot NLU Trainer & Evaluator

## 🚀 Production-Ready NLU Training Platform

This is a comprehensive Natural Language Understanding training platform that supports multiple backends and provides advanced features for building, training, and deploying chatbot models.

### ✨ Key Features:
- 🔐 **Secure Authentication** with JWT tokens
- 🏢 **Multi-Workspace Support** for project organization  
- 🤖 **Multi-Backend Training** (HuggingFace, Rasa, spaCy)
- 🎯 **Active Learning** with uncertainty-based sampling
- 🏷️ **Entity Annotation** tools for NER training
- 📊 **Advanced Analytics** and model comparison
- 🐳 **Docker Deployment** ready for production

### 🛠️ Technology Stack:
- **Frontend**: React 19.1.1 + Vite 7.1.5
- **Backend**: Node.js + Express + MongoDB
- **AI/ML**: HuggingFace Transformers, Rasa, spaCy
- **Deployment**: Docker + Compose, production-ready

### 🔗 Links:
- **GitHub Repository**: [chatbot-nlu-trainer-evaluator1](https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1)
- **Documentation**: Complete guides available in repository
- **Live Demo**: This Hugging Face Space

### 📊 Project Status:
**✅ 100% Complete** - All development phases finished, production-ready with comprehensive documentation.
"""

# Create Gradio interface
def create_gradio_app():
    """Create the main Gradio application"""
    
    # Custom CSS for better styling
    custom_css = """
    .gradio-container {
        font-family: 'Inter', sans-serif;
    }
    .header-text {
        text-align: center;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem;
        border-radius: 10px;
        margin-bottom: 1rem;
    }
    """
    
    with gr.Blocks(css=custom_css, title="🤖 Chatbot NLU Trainer & Evaluator") as app:
        
        # Header
        gr.HTML("""
        <div class="header-text">
            <h1>🤖 Chatbot NLU Trainer & Evaluator</h1>
            <p>Advanced Natural Language Understanding Training Platform</p>
            <p><a href="https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1" target="_blank" style="color: white;">⭐ GitHub Repository</a></p>
        </div>
        """)
        
        with gr.Tabs():
            # Tab 1: Project Overview
            with gr.Tab("🏠 Project Overview"):
                gr.Markdown(get_project_info())
                
                with gr.Row():
                    with gr.Column():
                        gr.Markdown("""
                        ### 🎯 Demo Features
                        This Hugging Face Space demonstrates the core functionality of the full application:
                        - **NLU Model Training** simulation
                        - **Intent Prediction** with confidence scores
                        - **Model Evaluation** with detailed metrics
                        - **Interactive Testing** interface
                        """)
                    
                    with gr.Column():
                        gr.Markdown("""
                        ### 🚀 Full Application
                        The complete application includes:
                        - Multi-user authentication system
                        - Workspace management
                        - Real-time model training
                        - Entity annotation tools
                        - Analytics dashboard
                        - Production deployment with Docker
                        """)
            
            # Tab 2: NLU Training Demo
            with gr.Tab("🤖 NLU Training"):
                gr.Markdown("### 🔧 Train Your NLU Model")
                
                with gr.Row():
                    with gr.Column():
                        training_data_input = gr.Textbox(
                            label="Training Data (JSON format)",
                            value=create_sample_data(),
                            lines=10,
                            placeholder="Enter your training data in JSON format..."
                        )
                        
                        backend_select = gr.Dropdown(
                            choices=["huggingface", "rasa", "spacy"],
                            value="huggingface",
                            label="Select NLU Backend"
                        )
                        
                        epochs_slider = gr.Slider(
                            minimum=1,
                            maximum=10,
                            value=5,
                            step=1,
                            label="Training Epochs"
                        )
                        
                        train_btn = gr.Button("🚀 Start Training", variant="primary")
                    
                    with gr.Column():
                        training_progress = gr.Textbox(
                            label="Training Progress",
                            lines=5,
                            placeholder="Training progress will appear here..."
                        )
                        
                        training_results = gr.Textbox(
                            label="Training Results",
                            lines=10,
                            placeholder="Training results will appear here..."
                        )
                
                train_btn.click(
                    fn=simulate_training,
                    inputs=[training_data_input, backend_select, epochs_slider],
                    outputs=[training_progress, training_results]
                )
            
            # Tab 3: Intent Prediction
            with gr.Tab("🔍 Intent Prediction"):
                gr.Markdown("### 🎯 Test Intent Classification")
                
                with gr.Row():
                    with gr.Column():
                        text_input = gr.Textbox(
                            label="Enter text to classify",
                            placeholder="I want to book a flight to London tomorrow",
                            lines=3
                        )
                        
                        model_backend = gr.Dropdown(
                            choices=["huggingface", "rasa", "spacy"],
                            value="huggingface",
                            label="Model Backend"
                        )
                        
                        predict_btn = gr.Button("🔍 Predict Intent", variant="primary")
                        
                        # Example buttons
                        gr.Markdown("### 💡 Try these examples:")
                        examples = [
                            "I want to book a flight to New York",
                            "Cancel my reservation",
                            "What's the weather like today?",
                            "Book a table for 4 people",
                            "I need help with my account"
                        ]
                        
                        for example in examples:
                            gr.Button(example, size="sm").click(
                                lambda x=example: x,
                                outputs=text_input
                            )
                    
                    with gr.Column():
                        prediction_results = gr.Textbox(
                            label="Prediction Results",
                            lines=8,
                            placeholder="Prediction results will appear here..."
                        )
                        
                        entities_output = gr.Textbox(
                            label="Detected Entities",
                            lines=5,
                            placeholder="Detected entities will appear here..."
                        )
                
                predict_btn.click(
                    fn=predict_intent,
                    inputs=[text_input, model_backend],
                    outputs=[prediction_results, entities_output]
                )
            
            # Tab 4: Model Evaluation
            with gr.Tab("📊 Model Evaluation"):
                gr.Markdown("### 📈 Evaluate Model Performance")
                
                with gr.Row():
                    with gr.Column():
                        test_data_input = gr.Textbox(
                            label="Test Data (optional)",
                            placeholder="Enter test data or use default dataset",
                            lines=5
                        )
                        
                        evaluate_btn = gr.Button("📊 Evaluate Model", variant="primary")
                        
                        gr.Markdown("""
                        ### 📋 Evaluation Metrics
                        - **Accuracy**: Overall classification accuracy
                        - **Precision**: Ratio of correct positive predictions
                        - **Recall**: Ratio of correct predictions over actual positives
                        - **F1-Score**: Harmonic mean of precision and recall
                        """)
                    
                    with gr.Column():
                        evaluation_results = gr.Textbox(
                            label="Evaluation Results",
                            lines=15,
                            placeholder="Evaluation results will appear here..."
                        )
                        
                        confusion_analysis = gr.Textbox(
                            label="Confusion Matrix Analysis",
                            lines=8,
                            placeholder="Confusion matrix analysis will appear here..."
                        )
                
                evaluate_btn.click(
                    fn=evaluate_model,
                    inputs=[test_data_input],
                    outputs=[evaluation_results, confusion_analysis]
                )
            
            # Tab 5: API Documentation
            with gr.Tab("📚 API Documentation"):
                gr.Markdown("""
                ### 🔗 REST API Endpoints
                
                The full application provides a comprehensive REST API:
                
                #### 🔐 Authentication
                - `POST /api/auth/register` - User registration
                - `POST /api/auth/login` - User login  
                - `GET /api/auth/profile` - Get user profile
                
                #### 🤖 Training & Prediction
                - `POST /api/training/upload-and-train` - Upload data and train model
                - `POST /api/training/predict` - Predict intent for text
                - `GET /api/training/models` - List all trained models
                - `DELETE /api/training/model/:id` - Delete trained model
                
                #### 📊 Model Evaluation
                - `POST /api/evaluation/evaluate` - Evaluate model performance
                - `GET /api/evaluation/metrics/:modelId` - Get evaluation metrics
                - `POST /api/evaluation/compare` - Compare multiple models
                
                #### 🏷️ Entity Management
                - `POST /api/entities/annotate` - Annotate entities in text
                - `GET /api/entities/types` - Get available entity types
                - `POST /api/entities/train` - Train NER model
                
                #### 🎯 Active Learning
                - `GET /api/active-learning/uncertain-samples` - Get uncertain samples
                - `POST /api/active-learning/feedback` - Provide feedback
                - `GET /api/active-learning/history` - Get learning history
                
                ### 📋 Authentication
                All API requests require JWT authentication:
                ```
                Authorization: Bearer <your_jwt_token>
                ```
                
                ### 📊 Response Format
                ```json
                {
                    "success": true,
                    "data": { ... },
                    "message": "Success message"
                }
                ```
                
                ### 🚀 Getting Started
                1. Clone the repository: [GitHub Link](https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1)
                2. Follow setup instructions in README.md
                3. Use Docker for easy deployment: `docker-compose up -d`
                4. Access the full application at `http://localhost`
                """)
        
        # Footer
        gr.HTML("""
        <div style="text-align: center; margin-top: 2rem; padding: 1rem; background-color: #f8f9fa; border-radius: 10px;">
            <p><strong>🤖 Chatbot NLU Trainer & Evaluator</strong> | Built with ❤️ by Amarjit Kumar</p>
            <p>
                <a href="https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1" target="_blank">⭐ GitHub</a> | 
                <a href="https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1/blob/main/README.md" target="_blank">📚 Documentation</a> |
                <a href="https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1/blob/main/DEPLOYMENT_GUIDE.md" target="_blank">🚀 Deployment Guide</a>
            </p>
        </div>
        """)
    
    return app

# Launch the app
if __name__ == "__main__":
    app = create_gradio_app()
    app.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=True,
        show_api=False
    )