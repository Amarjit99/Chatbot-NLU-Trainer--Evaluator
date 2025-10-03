# Advanced Multi-Backend NLU Chatbot Trainer

A cutting-edge full-stack chatbot application with multi-backend AI-powered intent recognition supporting HuggingFace, Rasa, and spaCy. Features comprehensive model evaluation, versioning, comparison capabilities, and unified training orchestration for production-ready AI model management.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure login/signup with JWT tokens
- **Workspace Management**: Create and manage multiple workspaces
- **JSON to YAML Conversion**: Automatic conversion of training data
- **Real-time Predictions**: Get intent suggestions with confidence scores
- **Cross-Platform Compatibility**: Works on Windows, macOS, and Linux

### Multi-Backend NLU Support (Phase 2 - COMPLETED ✅)
- **HuggingFace Integration**: Advanced transformer models with API integration
- **Rasa Open Source**: Enterprise-grade conversational AI framework
- **spaCy Integration**: Industrial-strength NLP with custom model training
- **Unified Training Interface**: Single interface to train across all backends
- **Backend Comparison**: Compare performance across different NLU engines
- **Automatic Backend Selection**: Smart backend recommendation based on data
- **Network Health Monitoring**: Real-time connectivity checks and error handling
- **Fallback Mechanisms**: Automatic fallback to available backends

### Advanced AI Features (Phase 1 - COMPLETED ✅)
- **Model Evaluation**: Comprehensive performance metrics (accuracy, F1 score, precision, recall)
- **Visual Metrics Dashboard**: Interactive confusion matrix and performance charts
- **Holdout Evaluation**: Automatic test set evaluation with configurable ratios
- **Model Versioning**: Track and manage different model versions
- **Model Comparison**: Compare multiple model versions side-by-side
- **Export Functionality**: Export trained models, predictions, and evaluation results
- **Performance Analytics**: Detailed statistics and trend analysis

### User Interface
- **Modern UI**: Beautiful, responsive interface with React 19.1.1
- **Tabbed Interface**: Organized workflow with Training, Evaluation, and Versioning tabs
- **Multi-Backend Dashboard**: Real-time training progress across all backends
- **Interactive Dashboards**: Real-time metrics visualization
- **Connection Diagnostics**: Built-in network troubleshooting tools
- **Mobile Responsive**: Optimized for all device sizes

## 📋 Prerequisites

### Required
- Node.js (v18 or higher recommended)
- npm or yarn package manager
- MongoDB Atlas account (or local MongoDB instance)

### Backend Services (Choose one or more)
- **HuggingFace**: Account with API key for transformer models
- **Rasa Open Source**: Docker installation for local Rasa server
- **spaCy**: Python environment with spaCy models installed

### Development Environment
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Code editor (VS Code recommended)
- Git for version control

## 🛠️ Installation & Setup

### Step 1: Clone and Navigate to Project
```bash
cd /Users/smacair/Desktop/NLU_Chatbot
```

### Step 2: Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file:**
```bash
cp .env.example .env
```

4. **Configure environment variables in `.env`:**
```env
# Server Configuration
PORT=3001
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://Amrit99:Amrit%40123@chatbot-nlu-cluster.6wtqrl4.mongodb.net/?retryWrites=true&w=majority&appName=chatbot-nlu-cluster

JWT_SECRET=your_secure_jwt_secret_here

# Database Configuration
MONGO_URI=your_mongodb_connection_string_here

# HuggingFace Configuration
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
HUGGINGFACE_MODEL_NAME=microsoft/DialoGPT-medium

# Rasa Configuration (Optional)
RASA_SERVER_URL=http://localhost:5005
RASA_PROJECT_PATH=./rasa_projects

# spaCy Configuration (Optional)
SPACY_MODEL_PATH=./spacy_models
SPACY_DEFAULT_MODEL=en_core_web_sm
```

5. **Configure Backend Services:**

   **For HuggingFace:**
   - Go to [HuggingFace](https://huggingface.co/settings/tokens)
   - Create a new token
   - Replace `your_huggingface_api_key_here` with your actual API key

   **For Rasa (Optional):**
   ```bash
   # Install Rasa
   pip install rasa
   
   # Initialize Rasa project
   rasa init --no-prompt
   
   # Start Rasa server
   rasa run --enable-api --cors "*"
   ```

   **For spaCy (Optional):**
   ```bash
   # Install spaCy
   pip install spacy
   
   # Download language model
   python -m spacy download en_core_web_sm
   ```

### Step 3: Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd ../frontend
```

2. **Install dependencies:**
```bash
npm install
```

### Step 4: Create Uploads Directory
```bash
cd ../backend
mkdir uploads
```

## 🚀 Running the Application

### Terminal 1: Start Backend Server
```bash
cd backend
npm run dev
```
The backend will start on `http://localhost:3001`

### Terminal 2: Start Frontend Server
```bash
cd frontend
npm run dev
```
The frontend will start on `http://localhost:5173`

## 📖 How to Use

### 1. **Authentication**
- Open `http://localhost:5173`
- Sign up for a new account or login
- You'll be redirected to the workspace

### 2. **Create Workspace**
- Click "Create New Workspace" 
- Enter a workspace name
- Click "Create"

### 3. **Upload Training Data**
- Select a workspace (click on it)
- Upload a JSON file with training data
- Format example:
```json
[
  {
    "text": "I want to book a table for dinner",
    "intent": "book_table"
  },
  {
    "text": "Can I reserve a table for 4 people?",
    "intent": "book_table"
  }
]
```

### 4. **Multi-Backend Training**
- Navigate to the "Multi-Backend Training" tab
- Select which backends you want to use (HuggingFace, Rasa, spaCy)
- Upload your training data (JSON format)
- Click "Train All Selected Backends"
- Monitor real-time training progress for each backend
- Compare results across different NLU engines

### 5. **Model Evaluation & Comparison**
- Use the "Evaluation Dashboard" to assess model performance
- Compare accuracy, precision, recall, and F1 scores across backends
- View confusion matrices and performance visualizations
- Export evaluation reports for analysis

### 6. **Predict Intents**
- Type text in the "AI Intent Prediction" textarea
- Select which backend to use for prediction
- Click "Predict Intent"
- View the predicted intent with confidence score
- Compare predictions across different backends

## 📁 Project Structure

```
Chatbot NLU Trainer/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── chat.js
│   │   │   ├── training.js
│   │   │   ├── evaluation.js
│   │   │   └── modelVersioning.js
│   │   ├── services/
│   │   │   ├── huggingfaceService.js
│   │   │   ├── evaluationService.js
│   │   │   ├── modelVersioningService.js
│   │   │   ├── multiBackendTrainingService.js
│   │   │   ├── rasaIntegrationService.js
│   │   │   └── spacyIntegrationService.js
│   │   ├── utils/
│   │   │   └── jsonToYaml.js
│   │   └── index.js
│   ├── uploads/
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── Pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Workspace.jsx
│   │   │   ├── EvaluationDashboard.jsx
│   │   │   ├── ModelVersioningDashboard.jsx
│   │   │   └── MultiBackendTraining.jsx
│   │   ├── components/
│   │   │   └── BackendSelection.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   │   └── data/
│   │       └── utterances.json
│   └── package.json
├── sample-training-data.json
├── PROJECT_STATUS.md
├── USER_GUIDE.md
├── QUICK_START.md
└── .gitignore
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Training & Prediction
- `POST /api/training/upload-and-train` - Upload JSON and train model
- `POST /api/training/predict` - Predict intent for text
- `GET /api/training/model-info/:workspaceId` - Get model information
- `GET /api/training/models` - List all trained models
- `DELETE /api/training/model/:workspaceId` - Delete trained model

### Chat
- `POST /api/chat/ask` - Chat with bot (protected)

### Multi-Backend Training (NEW - Phase 2)
- `POST /api/multi-backend/train` - Train across multiple NLU backends
- `GET /api/multi-backend/status/:jobId` - Get training status
- `POST /api/multi-backend/predict` - Predict using specific backend
- `GET /api/multi-backend/compare` - Compare backend performance
- `GET /api/multi-backend/health` - Check backend connectivity
- `POST /api/multi-backend/cancel/:jobId` - Cancel training job

### HuggingFace Integration
- `POST /api/huggingface/train` - Train HuggingFace model
- `POST /api/huggingface/predict` - HuggingFace prediction
- `GET /api/huggingface/models` - List available models

### Rasa Integration 
- `POST /api/rasa/train` - Train Rasa model
- `POST /api/rasa/predict` - Rasa NLU prediction
- `GET /api/rasa/status` - Rasa server status

### spaCy Integration
- `POST /api/spacy/train` - Train spaCy model
- `POST /api/spacy/predict` - spaCy prediction
- `GET /api/spacy/models` - List spaCy models

### Evaluation (Phase 1)
- `POST /api/evaluation/evaluate` - Evaluate model on test data
- `POST /api/evaluation/evaluate-holdout` - Holdout evaluation
- `GET /api/evaluation/results/:evaluationId` - Get evaluation results
- `GET /api/evaluation/workspace/:workspaceId` - Get workspace evaluations
- `POST /api/evaluation/compare` - Compare evaluations
- `GET /api/evaluation/export/:evaluationId` - Export evaluation

### Model Versioning (Phase 1)
- `GET /api/model-versioning/versions/:workspaceId` - Get model versions
- `GET /api/model-versioning/active/:workspaceId` - Get active version
- `POST /api/model-versioning/create` - Create new version
- `PUT /api/model-versioning/version/:versionId` - Update version
- `POST /api/model-versioning/compare` - Compare versions
- `DELETE /api/model-versioning/version/:versionId` - Delete version
- `GET /api/model-versioning/export/:versionId` - Export version
- `GET /api/model-versioning/statistics` - Get versioning statistics

## 📝 Sample Training Data

Use the provided `sample-training-data.json` file as an example. It contains various intents like:
- `book_table` - Restaurant reservations
- `book_flight` - Flight bookings
- `book_hotel` - Hotel reservations
- `book_taxi` - Taxi bookings
- `check_weather` - Weather queries
- `food_order` - Food ordering
- `business_hours` - Business hours queries
- `complaint` - Customer complaints

## 🐛 Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**
   - Check your MongoDB URI in `.env`
   - Ensure MongoDB Atlas cluster is running

2. **HuggingFace API Error**
   - Verify your API key is correct
   - Check if you have sufficient API credits

3. **File Upload Issues**
   - Ensure uploads directory exists
   - Check file size (max 10MB)
   - Verify JSON format is valid

4. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing processes: `lsof -ti:3001 | xargs kill`

5. **Multi-Backend Connection Issues**
   - **Rasa**: Ensure Rasa server is running on port 5005
   - **spaCy**: Verify Python environment and spaCy models
   - **HuggingFace**: Check API key and network connectivity
   - Use the built-in connection diagnostics in the Multi-Backend Training tab

## 🛠️ Technology Stack

### Frontend
- **React**: 19.1.1 with Hooks and Context API
- **Vite**: 7.1.5 for fast development and building
- **CSS3**: Modern responsive design with Flexbox/Grid
- **Axios**: HTTP client for API communication
- **ESLint**: Code quality and formatting

### Backend
- **Node.js**: JavaScript runtime with Express.js framework
- **MongoDB**: Document database with Mongoose ODM
- **JWT**: Secure authentication and authorization
- **Multer**: File upload handling
- **CORS**: Cross-origin resource sharing

### AI/ML Backends
- **HuggingFace Transformers**: State-of-the-art NLP models
- **Rasa Open Source**: Conversational AI framework
- **spaCy**: Industrial-strength NLP library
- **Custom Training Pipeline**: Unified interface for all backends

### DevOps & Tools
- **Git**: Version control with comprehensive .gitignore
- **PM2**: Process management for production
- **Docker**: Containerization support
- **Environment Variables**: Secure configuration management

## 🔒 Security Notes

- Never commit `.env` files to version control
- Use strong JWT secrets in production
- Implement rate limiting for API endpoints
- Validate all user inputs

## 🚀 Production Deployment

### Environment Setup
1. **Environment Variables**: Configure production values in `.env`
2. **Database**: Use production MongoDB cluster with replica sets
3. **Security**: Enable HTTPS, security headers, and input validation
4. **API Keys**: Secure HuggingFace and other service credentials

### Backend Services
- **Rasa**: Deploy Rasa server with Docker containers
- **spaCy**: Configure Python environment with required models
- **HuggingFace**: Set up API rate limiting and caching
- **MongoDB**: Enable authentication and connection pooling

### Scaling & Monitoring
- **PM2**: Process management with cluster mode
- **Docker**: Containerized deployment with orchestration
- **Load Balancing**: Nginx reverse proxy for high availability
- **Logging**: Centralized logging with Winston and Morgan
- **Health Checks**: Endpoint monitoring and auto-recovery

### Performance Optimization
- **Caching**: Redis for model predictions and training results
- **CDN**: Static asset delivery optimization
- **Database Indexing**: Optimize queries with proper indexes
- **Model Compression**: Optimize model sizes for faster inference

## � Project Status

- **Phase 1**: ✅ Complete - Model evaluation, versioning, and comparison
- **Phase 2**: ✅ Complete - Multi-backend NLU support (HuggingFace, Rasa, spaCy)
- **Phase 3**: 🚧 Planning - Active learning and continuous model improvement
- **Overall Progress**: 85% Complete

See `PROJECT_STATUS.md` for detailed implementation roadmap.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration for code style
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure cross-platform compatibility

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **HuggingFace** for providing excellent transformer models and APIs
- **Rasa** for the open-source conversational AI framework
- **spaCy** for industrial-strength natural language processing
- **MongoDB** for reliable document database services
- **React & Vite** for modern frontend development tools

## �📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review `USER_GUIDE.md` for detailed usage instructions
3. Consult `QUICK_START.md` for rapid setup
4. Verify all dependencies are installed correctly
5. Ensure all environment variables are properly configured
6. Check console logs for detailed error messages
7. Test backend connectivity using the built-in diagnostics

### Getting Help
- 📖 Documentation: Check project documentation files
- 🐛 Bug Reports: Create detailed issue reports with steps to reproduce
- 💡 Feature Requests: Suggest new features with use case descriptions
- 🔧 Technical Issues: Include system information and error logs

---

**Happy Multi-Backend NLU Training! 🤖✨🚀**
