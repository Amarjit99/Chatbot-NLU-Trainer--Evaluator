"""
🤖 Chatbot NLU Trainer & Evaluator - Streamlit Demo
==================================================

A simplified Streamlit interface for the Chatbot NLU Trainer & Evaluator.
This demo showcases the key features in a free-tier hosting environment.

Author: Amarjit Kumar
Repository: https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1
"""

import streamlit as st
import pandas as pd
import json
import requests
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
import os
from typing import Dict, List, Any

# Page config
st.set_page_config(
    page_title="🤖 Chatbot NLU Trainer & Evaluator",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
        border-radius: 10px;
        color: white;
        text-align: center;
        margin-bottom: 2rem;
    }
    
    .feature-card {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        border-left: 4px solid #667eea;
        margin: 1rem 0;
    }
    
    .metric-card {
        background: linear-gradient(45deg, #667eea, #764ba2);
        color: white;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
    }
    
    .stButton > button {
        width: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.5rem 1rem;
    }
</style>
""", unsafe_allow_html=True)

# Main header
st.markdown("""
<div class="main-header">
    <h1>🤖 Chatbot NLU Trainer & Evaluator</h1>
    <p>Advanced Natural Language Understanding Training Platform</p>
</div>
""", unsafe_allow_html=True)

# Sidebar navigation
st.sidebar.title("🚀 Navigation")
page = st.sidebar.selectbox(
    "Choose a feature:",
    [
        "🏠 Home",
        "🤖 NLU Training Demo",
        "📊 Model Evaluation",
        "🏷️ Entity Annotation",
        "📈 Analytics Dashboard",
        "🔧 API Testing",
        "📚 Documentation"
    ]
)

# Load sample data
@st.cache_data
def load_sample_data():
    """Load sample training data for demo"""
    sample_data = {
        "training_data": [
            {"text": "I want to book a flight to New York", "intent": "book_flight", "entities": [{"entity": "destination", "value": "New York", "start": 26, "end": 34}]},
            {"text": "Cancel my reservation", "intent": "cancel_booking", "entities": []},
            {"text": "What's the weather like today?", "intent": "weather_query", "entities": [{"entity": "time", "value": "today", "start": 24, "end": 29}]},
            {"text": "Book a table for 4 people", "intent": "book_table", "entities": [{"entity": "number", "value": "4", "start": 17, "end": 18}]},
            {"text": "I need help with my account", "intent": "help_request", "entities": []},
        ],
        "intents": ["book_flight", "cancel_booking", "weather_query", "book_table", "help_request"],
        "entities": ["destination", "time", "number", "account"]
    }
    return sample_data

# Simulated model training function
def simulate_training(training_data, backend="huggingface"):
    """Simulate model training with progress"""
    import time
    
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    steps = [
        "Preprocessing training data...",
        "Tokenizing text...",
        "Extracting features...",
        "Training classifier...",
        "Validating model...",
        "Computing metrics...",
        "Model training complete!"
    ]
    
    for i, step in enumerate(steps):
        status_text.text(step)
        time.sleep(0.5)
        progress_bar.progress((i + 1) / len(steps))
    
    # Simulated results
    results = {
        "accuracy": 0.94,
        "precision": 0.92,
        "recall": 0.89,
        "f1_score": 0.90,
        "training_time": "2.3 seconds",
        "backend": backend,
        "model_size": "15.2 MB"
    }
    
    return results

# Page routing
if page == "🏠 Home":
    # Project overview
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("""
        ## 🌟 Welcome to Chatbot NLU Trainer & Evaluator
        
        This is a **production-ready NLU training platform** that supports multiple backends 
        and provides advanced features for training, evaluating, and deploying chatbot models.
        
        ### ✨ Key Features:
        - 🔐 **Secure Authentication** with JWT tokens
        - 🏢 **Multi-Workspace Support** for project organization
        - 🤖 **Multi-Backend Training** (HuggingFace, Rasa, spaCy)
        - 🎯 **Active Learning** with uncertainty-based sampling
        - 🏷️ **Entity Annotation** tools for NER training
        - 📊 **Advanced Analytics** and model comparison
        - 🐳 **Docker Deployment** ready for production
        """)
        
        # GitHub link
        st.markdown("""
        ### 🔗 Project Repository
        **GitHub**: [chatbot-nlu-trainer-evaluator1](https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1)
        """)
    
    with col2:
        st.markdown("""
        <div class="feature-card">
            <h3>🚀 Production Ready</h3>
            <p>100% complete with Docker deployment</p>
        </div>
        
        <div class="feature-card">
            <h3>🔧 Multi-Backend</h3>
            <p>HuggingFace, Rasa, spaCy integration</p>
        </div>
        
        <div class="feature-card">
            <h3>📊 Analytics</h3>
            <p>Comprehensive model evaluation</p>
        </div>
        """, unsafe_allow_html=True)
    
    # Technology stack
    st.markdown("---")
    st.markdown("## 🛠️ Technology Stack")
    
    tech_cols = st.columns(4)
    
    with tech_cols[0]:
        st.markdown("""
        **Frontend:**
        - React 19.1.1
        - Vite 7.1.5
        - Material-UI
        """)
    
    with tech_cols[1]:
        st.markdown("""
        **Backend:**
        - Node.js + Express
        - MongoDB + Mongoose
        - JWT Authentication
        """)
    
    with tech_cols[2]:
        st.markdown("""
        **AI/ML:**
        - HuggingFace Transformers
        - Rasa Open Source
        - spaCy NLP
        """)
    
    with tech_cols[3]:
        st.markdown("""
        **Deployment:**
        - Docker + Compose
        - Nginx
        - PM2 Process Manager
        """)

elif page == "🤖 NLU Training Demo":
    st.header("🤖 NLU Model Training Demo")
    
    # Load sample data
    sample_data = load_sample_data()
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("📝 Training Data")
        
        # Display sample training data
        training_df = pd.DataFrame(sample_data["training_data"])
        st.dataframe(training_df, use_container_width=True)
        
        # Backend selection
        st.subheader("🔧 Training Configuration")
        backend = st.selectbox(
            "Select NLU Backend:",
            ["huggingface", "rasa", "spacy"],
            help="Choose the backend for training your NLU model"
        )
        
        # Training parameters
        epochs = st.slider("Training Epochs", 1, 10, 5)
        batch_size = st.selectbox("Batch Size", [8, 16, 32], index=1)
        
        # Train button
        if st.button("🚀 Start Training"):
            st.subheader("📈 Training Progress")
            results = simulate_training(sample_data["training_data"], backend)
            
            # Display results
            st.success("✅ Training completed successfully!")
            
            # Metrics display
            metrics_cols = st.columns(4)
            with metrics_cols[0]:
                st.metric("Accuracy", f"{results['accuracy']:.2%}")
            with metrics_cols[1]:
                st.metric("Precision", f"{results['precision']:.2%}")
            with metrics_cols[2]:
                st.metric("Recall", f"{results['recall']:.2%}")
            with metrics_cols[3]:
                st.metric("F1 Score", f"{results['f1_score']:.2%}")
    
    with col2:
        st.subheader("🎯 Model Testing")
        
        # Text input for testing
        test_text = st.text_area(
            "Enter text to classify:",
            "I want to book a flight to London tomorrow",
            height=100
        )
        
        if st.button("🔍 Predict Intent"):
            # Simulated prediction
            predictions = {
                "intent": "book_flight",
                "confidence": 0.95,
                "entities": [
                    {"entity": "destination", "value": "London", "confidence": 0.92},
                    {"entity": "time", "value": "tomorrow", "confidence": 0.88}
                ]
            }
            
            st.subheader("📊 Prediction Results")
            
            # Intent prediction
            st.markdown(f"**Predicted Intent:** `{predictions['intent']}`")
            st.markdown(f"**Confidence:** {predictions['confidence']:.2%}")
            
            # Entities
            st.markdown("**Detected Entities:**")
            for entity in predictions["entities"]:
                st.markdown(f"- `{entity['entity']}`: {entity['value']} ({entity['confidence']:.2%})")
        
        st.subheader("📈 Intent Distribution")
        
        # Simulated intent distribution chart
        intent_data = pd.DataFrame({
            "Intent": sample_data["intents"],
            "Count": [25, 18, 22, 15, 20]
        })
        
        fig = px.pie(intent_data, values="Count", names="Intent", 
                    title="Training Data Intent Distribution")
        st.plotly_chart(fig, use_container_width=True)

elif page == "📊 Model Evaluation":
    st.header("📊 Model Performance Evaluation")
    
    # Simulated evaluation data
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("🎯 Classification Metrics")
        
        # Create confusion matrix data
        confusion_data = {
            "Predicted": ["book_flight", "book_flight", "cancel_booking", "weather_query", "help_request"],
            "Actual": ["book_flight", "cancel_booking", "cancel_booking", "weather_query", "help_request"],
            "Count": [45, 3, 22, 38, 17]
        }
        
        # Metrics by intent
        metrics_data = pd.DataFrame({
            "Intent": ["book_flight", "cancel_booking", "weather_query", "help_request"],
            "Precision": [0.94, 0.88, 0.95, 0.92],
            "Recall": [0.91, 0.89, 0.93, 0.94],
            "F1-Score": [0.92, 0.88, 0.94, 0.93]
        })
        
        st.dataframe(metrics_data, use_container_width=True)
        
        # Overall metrics
        st.markdown("### 📈 Overall Performance")
        overall_cols = st.columns(3)
        with overall_cols[0]:
            st.metric("Overall Accuracy", "92.4%", "2.1%")
        with overall_cols[1]:
            st.metric("Macro F1-Score", "91.8%", "1.8%")
        with overall_cols[2]:
            st.metric("Training Time", "2.3s", "-0.5s")
    
    with col2:
        st.subheader("📈 Performance Visualization")
        
        # Performance comparison chart
        fig = go.Figure()
        
        fig.add_trace(go.Scatter(
            x=metrics_data["Intent"],
            y=metrics_data["Precision"],
            mode='lines+markers',
            name='Precision',
            line=dict(color='blue', width=3)
        ))
        
        fig.add_trace(go.Scatter(
            x=metrics_data["Intent"],
            y=metrics_data["Recall"],
            mode='lines+markers',
            name='Recall',
            line=dict(color='red', width=3)
        ))
        
        fig.add_trace(go.Scatter(
            x=metrics_data["Intent"],
            y=metrics_data["F1-Score"],
            mode='lines+markers',
            name='F1-Score',
            line=dict(color='green', width=3)
        ))
        
        fig.update_layout(
            title="Performance Metrics by Intent",
            xaxis_title="Intent",
            yaxis_title="Score",
            yaxis=dict(range=[0.8, 1.0])
        )
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Model comparison
        st.subheader("🔄 Backend Comparison")
        comparison_data = pd.DataFrame({
            "Backend": ["HuggingFace", "Rasa", "spaCy"],
            "Accuracy": [94.2, 91.8, 89.5],
            "Training Time (s)": [2.3, 5.1, 1.8],
            "Model Size (MB)": [15.2, 25.8, 8.4]
        })
        
        st.dataframe(comparison_data, use_container_width=True)

elif page == "🏷️ Entity Annotation":
    st.header("🏷️ Entity Annotation Interface")
    
    st.markdown("""
    This interface allows you to annotate entities in text for Named Entity Recognition (NER) training.
    """)
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("📝 Text Annotation")
        
        # Sample text for annotation
        sample_texts = [
            "I want to book a flight to New York tomorrow at 3 PM",
            "Cancel my reservation for John Smith",
            "What's the weather like in London next week?",
            "Book a table for 4 people at 7 PM tonight"
        ]
        
        selected_text = st.selectbox("Select text to annotate:", sample_texts)
        
        # Manual text input
        text_input = st.text_area("Or enter custom text:", selected_text, height=100)
        
        # Entity types
        entity_types = st.multiselect(
            "Available Entity Types:",
            ["PERSON", "LOCATION", "TIME", "NUMBER", "ORGANIZATION"],
            default=["PERSON", "LOCATION", "TIME", "NUMBER"]
        )
        
        if st.button("🔍 Auto-Detect Entities"):
            # Simulated entity detection
            entities = [
                {"text": "New York", "label": "LOCATION", "start": 26, "end": 34},
                {"text": "tomorrow", "label": "TIME", "start": 35, "end": 43},
                {"text": "3 PM", "label": "TIME", "start": 47, "end": 51}
            ]
            
            st.subheader("🎯 Detected Entities")
            for entity in entities:
                st.markdown(f"- **{entity['text']}** → `{entity['label']}` (Position: {entity['start']}-{entity['end']})")
    
    with col2:
        st.subheader("📊 Annotation Statistics")
        
        # Annotation stats
        stats_data = pd.DataFrame({
            "Entity Type": ["PERSON", "LOCATION", "TIME", "NUMBER"],
            "Count": [45, 67, 32, 28],
            "Accuracy": [0.94, 0.91, 0.96, 0.89]
        })
        
        st.dataframe(stats_data, use_container_width=True)
        
        # Entity distribution chart
        fig = px.bar(stats_data, x="Entity Type", y="Count", 
                    title="Entity Distribution in Dataset")
        st.plotly_chart(fig, use_container_width=True)

elif page == "📈 Analytics Dashboard":
    st.header("📈 Analytics Dashboard")
    
    # Dashboard metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown("""
        <div class="metric-card">
            <h3>125</h3>
            <p>Total Models</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <div class="metric-card">
            <h3>4,892</h3>
            <p>Training Samples</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown("""
        <div class="metric-card">
            <h3>94.2%</h3>
            <p>Avg Accuracy</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        st.markdown("""
        <div class="metric-card">
            <h3>32</h3>
            <p>Active Users</p>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # Charts
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("📊 Training Activity")
        
        # Training activity over time
        dates = pd.date_range(start="2024-01-01", end="2024-12-31", freq="M")
        activity_data = pd.DataFrame({
            "Date": dates,
            "Models Trained": [12, 15, 18, 22, 25, 28, 32, 35, 38, 42, 45, 48]
        })
        
        fig = px.line(activity_data, x="Date", y="Models Trained", 
                     title="Monthly Training Activity")
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        st.subheader("🎯 Model Performance Distribution")
        
        # Performance distribution
        import numpy as np
        np.random.seed(42)
        accuracy_scores = np.random.normal(0.92, 0.05, 100)
        accuracy_scores = np.clip(accuracy_scores, 0.8, 1.0)
        
        fig = px.histogram(x=accuracy_scores, nbins=20, 
                          title="Model Accuracy Distribution")
        fig.update_xaxis(title="Accuracy Score")
        fig.update_yaxis(title="Number of Models")
        st.plotly_chart(fig, use_container_width=True)

elif page == "🔧 API Testing":
    st.header("🔧 API Testing Interface")
    
    st.markdown("""
    Test the REST API endpoints of the Chatbot NLU Trainer & Evaluator.
    """)
    
    # API endpoint selection
    endpoints = {
        "Authentication": {
            "POST /api/auth/register": "User registration",
            "POST /api/auth/login": "User login",
            "GET /api/auth/profile": "Get user profile"
        },
        "Training": {
            "POST /api/training/upload-and-train": "Upload data and train model",
            "POST /api/training/predict": "Predict intent for text",
            "GET /api/training/models": "List all trained models"
        },
        "Evaluation": {
            "POST /api/evaluation/evaluate": "Evaluate model performance",
            "GET /api/evaluation/metrics": "Get evaluation metrics"
        }
    }
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("🔗 API Endpoints")
        
        category = st.selectbox("Select Category:", list(endpoints.keys()))
        endpoint = st.selectbox("Select Endpoint:", list(endpoints[category].keys()))
        
        st.markdown(f"**Description:** {endpoints[category][endpoint]}")
        
        # Request configuration
        st.subheader("📝 Request Configuration")
        method = endpoint.split(" ")[0]
        url = endpoint.split(" ")[1]
        
        st.code(f"{method} {url}")
        
        if method == "POST":
            request_body = st.text_area(
                "Request Body (JSON):",
                '{"text": "I want to book a flight to Paris"}',
                height=100
            )
        
        # API key input
        api_key = st.text_input("API Key (if required):", type="password")
        
        if st.button("🚀 Send Request"):
            # Simulated API response
            if "predict" in url:
                response = {
                    "intent": "book_flight",
                    "confidence": 0.95,
                    "entities": [
                        {"entity": "destination", "value": "Paris", "confidence": 0.92}
                    ],
                    "response_time": "45ms"
                }
            else:
                response = {
                    "status": "success",
                    "message": "Request processed successfully",
                    "data": {"example": "response"}
                }
            
            st.subheader("📤 Response")
            st.code(json.dumps(response, indent=2))
    
    with col2:
        st.subheader("📖 API Documentation")
        
        st.markdown("""
        ### 🔐 Authentication
        
        All API requests require JWT authentication:
        ```
        Authorization: Bearer <your_jwt_token>
        ```
        
        ### 📋 Response Format
        
        All responses follow this structure:
        ```json
        {
            "success": true,
            "data": { ... },
            "message": "Success message"
        }
        ```
        
        ### ⚠️ Error Handling
        
        Error responses include:
        ```json
        {
            "success": false,
            "error": "Error message",
            "code": 400
        }
        ```
        """)
        
        st.subheader("🔗 Full API Documentation")
        st.markdown("[View Complete API Docs](https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1)")

elif page == "📚 Documentation":
    st.header("📚 Project Documentation")
    
    # Documentation sections
    doc_sections = [
        {
            "title": "🚀 Quick Start Guide",
            "content": """
            ### Prerequisites
            - Docker & Docker Compose
            - Node.js 18+ (for development)
            - MongoDB Atlas account
            
            ### Installation
            ```bash
            git clone https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1.git
            cd chatbot-nlu-trainer-evaluator1
            cp .env.example .env
            docker-compose up -d
            ```
            
            ### Access
            - Frontend: http://localhost
            - Backend: http://localhost:3001
            """
        },
        {
            "title": "🏗️ Architecture Overview",
            "content": """
            ### System Components
            - **Frontend**: React + Vite application
            - **Backend**: Node.js + Express API server
            - **Database**: MongoDB with Mongoose ODM
            - **AI/ML**: Multi-backend NLU integration
            
            ### Key Features
            - JWT-based authentication
            - Multi-workspace support
            - Real-time model training
            - Advanced analytics dashboard
            """
        },
        {
            "title": "🔧 Configuration",
            "content": """
            ### Environment Variables
            ```env
            NODE_ENV=production
            JWT_SECRET=your-secure-secret
            MONGO_URI=mongodb://localhost:27017/chatbot-nlu
            HUGGINGFACE_API_KEY=your-api-key
            ```
            
            ### Docker Configuration
            The project includes production-ready Docker configuration
            with multi-stage builds and health checks.
            """
        },
        {
            "title": "📊 API Reference",
            "content": """
            ### Authentication Endpoints
            - `POST /api/auth/register` - User registration
            - `POST /api/auth/login` - User login
            - `GET /api/auth/profile` - Get user profile
            
            ### Training Endpoints
            - `POST /api/training/upload-and-train` - Train new model
            - `POST /api/training/predict` - Predict intent
            - `GET /api/training/models` - List models
            
            ### Evaluation Endpoints
            - `POST /api/evaluation/evaluate` - Evaluate model
            - `GET /api/evaluation/metrics` - Get metrics
            """
        }
    ]
    
    # Display documentation sections
    for section in doc_sections:
        with st.expander(section["title"], expanded=False):
            st.markdown(section["content"])
    
    # External links
    st.markdown("---")
    st.markdown("### 🔗 Additional Resources")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("""
        **📂 Repository**
        - [GitHub Repository](https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1)
        - [Issues](https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1/issues)
        - [Releases](https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1/releases)
        """)
    
    with col2:
        st.markdown("""
        **📖 Documentation**
        - [User Guide](https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1/blob/main/USER_GUIDE.md)
        - [Deployment Guide](https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1/blob/main/DEPLOYMENT_GUIDE.md)
        - [Quick Start](https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1/blob/main/QUICK_START.md)
        """)
    
    with col3:
        st.markdown("""
        **🛠️ Development**
        - [Contributing Guide](https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1/blob/main/CONTRIBUTING.md)
        - [Code of Conduct](https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1/blob/main/CODE_OF_CONDUCT.md)
        - [License](https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1/blob/main/LICENSE)
        """)

# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; color: #666; padding: 1rem;">
    <p>🤖 <strong>Chatbot NLU Trainer & Evaluator</strong> | Built with ❤️ by Amarjit Kumar</p>
    <p>⭐ <a href="https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1" target="_blank">Star on GitHub</a> | 
    📚 <a href="https://github.com/Amarjit99/chatbot-nlu-trainer-evaluator1/blob/main/README.md" target="_blank">Documentation</a></p>
</div>
""", unsafe_allow_html=True)