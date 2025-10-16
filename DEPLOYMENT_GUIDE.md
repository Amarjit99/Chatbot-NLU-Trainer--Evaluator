# 🚀 **Chatbot NLU Trainer & Evaluator - Deployment Guide**

<div align="center">

**Complete Production Deployment Guide for Chatbot NLU Trainer & Evaluator**

[![Production Ready](https://img.shields.io/badge/Production-Ready-green.svg)](https://github.com/Amarjit99/Chatbot-NLU-Trainer--Evaluator)
[![Docker Support](https://img.shields.io/badge/Docker-Supported-blue.svg)](https://github.com/Amarjit99/Chatbot-NLU-Trainer--Evaluator)
[![Multi-Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey.svg)](https://github.com/Amarjit99/Chatbot-NLU-Trainer--Evaluator)

</div>

---

## 📋 **Prerequisites**

### Required for Production:
- **Docker**: Version 20.10+ and Docker Compose V2
- **Git**: For repository cloning
- **MongoDB Atlas**: Cloud database (recommended) or local MongoDB
- **Domain/SSL**: For HTTPS in production (recommended)

### Optional AI Backend Services:
- **HuggingFace API Key**: For transformer models
- **Rasa Server**: For advanced conversational AI
- **spaCy Environment**: For industrial NLP

### Development Prerequisites:
- **Node.js**: Version 18.0+ (LTS recommended)
- **npm**: Version 8.0+ or Yarn
- **Code Editor**: VS Code recommended

---

## 🎯 **Quick Production Deployment (Recommended)**

### 1. **Repository Setup**
```bash
# Clone the repository
git clone https://github.com/Amarjit99/Chatbot-NLU-Trainer--Evaluator.git
cd Chatbot-NLU-Trainer--Evaluator

# Copy environment template
cp .env.example .env
```

### 2. **Environment Configuration**
Edit `.env` file with your production values:
```bash
# CRITICAL: Change these in production!
NODE_ENV=production
JWT_SECRET=your-super-secure-production-jwt-secret-min-32-characters
NODE_ENV=production
```

### 3. **Deploy with Docker**
```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. **Access Application**
- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

---

## 🏗️ **Development Setup**

### 1. **Backend Development**
```bash
cd backend
npm install
npm run dev
```

### 2. **Frontend Development**
```bash
cd frontend
npm install
npm run dev
```

---

## 🐳 **Docker Commands**

### Basic Operations
```bash
# Start services
docker-compose up -d

# Stop services  
docker-compose down

# Rebuild images
docker-compose build --no-cache

# View logs
docker-compose logs -f [service-name]

# Scale services
docker-compose up -d --scale backend=2
```

### Maintenance
```bash
# Update containers
docker-compose pull
docker-compose up -d

# Clean up
docker system prune -f
docker volume prune -f
```

---

## 🔒 **Security Configuration**

### 1. **Environment Variables**
- Change `JWT_SECRET` to a secure random string (32+ characters)
- Set `NODE_ENV=production`
- Configure `CORS_ORIGIN` for your domain

### 2. **Network Security**
- Frontend runs on port 80 (HTTP) - add SSL in production
- Backend runs on port 3001 (internal access only)
- Use reverse proxy (Nginx) for SSL termination

### 3. **File Permissions**
```bash
# Ensure upload directories have correct permissions
chmod 755 backend/uploads
chmod 755 backend/models
```

---

## 📊 **Monitoring & Health Checks**

### Health Endpoints
- **Backend Health**: `GET /api/health`
- **Docker Health**: Automatic container health checks

### Log Management
```bash
# View application logs
docker-compose logs backend
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f --tail=100
```

### Performance Monitoring
- Monitor container resource usage: `docker stats`
- Check disk space for uploads: `df -h`
- Monitor API response times via health check

---

## 🌐 **Production Deployment**

### 1. **Cloud Deployment (AWS/GCP/Azure)**
```bash
# Example with Docker Machine (AWS)
docker-machine create --driver amazonec2 chatbot-nlu-prod
eval $(docker-machine env chatbot-nlu-prod)
docker-compose up -d
```

### 2. **Reverse Proxy Setup (Nginx)**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. **SSL Configuration**
```bash
# Using Let's Encrypt
certbot --nginx -d your-domain.com
```

---

## 🔧 **Troubleshooting**

### Common Issues

#### Container Fails to Start
```bash
# Check logs
docker-compose logs backend

# Common fixes
docker-compose down
docker system prune -f
docker-compose up -d
```

#### Permission Denied Errors
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod 755 backend/uploads
```

#### Port Already in Use
```bash
# Check what's using port
sudo lsof -i :3001
sudo lsof -i :80

# Kill process or change port in docker-compose.yml
```

#### Out of Disk Space
```bash
# Clean Docker resources
docker system prune -f
docker volume prune -f
docker image prune -f
```

---

## 📈 **Scaling & Performance**

### Horizontal Scaling
```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Add load balancer (example with HAProxy)
docker run -d --name haproxy \
  -p 80:80 \
  -v $(pwd)/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg \
  haproxy:alpine
```

### Resource Limits
```yaml
# Add to docker-compose.yml services
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      memory: 256M
```

---

## � **Free-Tier Hosting Deployment**

### 🚀 **Streamlit Cloud Deployment**

Deploy the demo interface on Streamlit Cloud (100% free):

1. **Prepare for Streamlit**:
   ```bash
   # Use the streamlit_app.py file
   # Requirements: requirements.txt (already provided)
   ```

2. **Deploy to Streamlit Cloud**:
   - Go to [share.streamlit.io](https://share.streamlit.io)
   - Connect your GitHub repository
   - Select `streamlit_app.py` as the main file
   - Deploy automatically

3. **Configuration**:
   - Main file: `streamlit_app.py`
   - Python version: 3.9+
   - Requirements: `requirements.txt`

---

### 🤗 **Hugging Face Spaces Deployment**

Deploy on Hugging Face Spaces with Gradio interface:

1. **Create Hugging Face Space**:
   - Go to [huggingface.co/spaces](https://huggingface.co/spaces)
   - Create new Space with Gradio SDK
   - Clone your Space repository

2. **Deploy Configuration**:
   ```bash
   # Copy files to your Space
   cp gradio_app.py your-space/app.py
   cp requirements_gradio.txt your-space/requirements.txt
   ```

3. **Space Configuration**:
   - SDK: Gradio
   - Python version: 3.9+
   - Hardware: CPU Basic (free)

---

### 🚂 **Railway Deployment**

Deploy full application on Railway (free tier available):

1. **Prepare Railway Deployment**:
   ```bash
   # Files already created:
   # - railway.toml
   # - Procfile
   ```

2. **Deploy to Railway**:
   - Connect GitHub repository to Railway
   - Railway will auto-detect and deploy
   - Add environment variables from `.env.deployment`

3. **Configuration**:
   - Build command: Automatic detection
   - Start command: `npm start`
   - Environment: Copy from `.env.deployment`

---

### 🎨 **Render Deployment**

Deploy on Render web services (free tier):

1. **Prepare Render Deployment**:
   ```bash
   # File already created: render.yaml
   ```

2. **Deploy to Render**:
   - Connect GitHub repository
   - Select "Blueprint" deployment
   - Use `render.yaml` for configuration

3. **Configuration**:
   - Frontend: Static site
   - Backend: Web service
   - Database: PostgreSQL (free)

---

### ⚡ **Vercel Deployment**

Deploy frontend on Vercel (free for frontend):

1. **Frontend-Only Deployment**:
   ```bash
   cd frontend
   npm run build
   # Deploy dist/ folder to Vercel
   ```

2. **Configuration**:
   - Framework: React
   - Build command: `npm run build`
   - Output directory: `dist`

---

### 📋 **Free-Tier Hosting Comparison**

| Platform | Best For | Limitations | Features |
|----------|----------|-------------|-----------|
| **Streamlit Cloud** | Quick demos | Python only | Easy deployment, automatic updates |
| **Hugging Face Spaces** | ML demos | Limited compute | AI community, GPU options |
| **Railway** | Full apps | 500 hours/month | Full-stack, databases included |
| **Render** | Web services | Sleep after inactivity | Auto-scaling, SSL included |
| **Vercel** | Frontend | Static sites only | Global CDN, fast builds |

---

## �🎯 **Next Steps**

1. **Database Integration**: Add PostgreSQL for persistent user data
2. **Caching**: Implement Redis for improved performance  
3. **Monitoring**: Add Prometheus + Grafana for metrics
4. **CI/CD**: Setup automated deployment pipeline
5. **API Documentation**: Generate OpenAPI/Swagger docs

---

## 📞 **Support**

- **Documentation**: Check `README.md` for detailed features
- **Health Check**: Monitor `/api/health` endpoint
- **Logs**: Use `docker-compose logs` for debugging
- **Issues**: Check container status with `docker-compose ps`

---

## ✅ **Deployment Checklist**

- [ ] Environment variables configured (`.env`)
- [ ] JWT secret changed from default
- [ ] Docker and Docker Compose installed
- [ ] Ports 80 and 3001 available
- [ ] File permissions set correctly
- [ ] SSL certificate configured (production)
- [ ] Domain name pointed to server (production)
- [ ] Health checks passing
- [ ] Logs monitored for errors
- [ ] Backup strategy in place

**🎉 Your Chatbot NLU Trainer & Evaluator is ready for production!**
