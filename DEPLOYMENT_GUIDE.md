# 🚀 **Chatbot NLU Trainer - Deployment Guide**

## 📋 **Prerequisites**
- Docker and Docker Compose installed
- Node.js 18+ (for development)
- Git (for cloning)

## 🎯 **Quick Start (Production Deployment)**

### 1. **Clone and Setup**
```bash
git clone <repository-url>
cd Chatbot\ NLU\ Trainer
cp .env.example .env
```

### 2. **Configure Environment**
Edit `.env` file with your production settings:
```bash
# Critical: Change JWT secret in production!
JWT_SECRET=your-production-jwt-secret-at-least-32-characters-long
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

## 🎯 **Next Steps**

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

**🎉 Your Chatbot NLU Trainer is ready for production!**