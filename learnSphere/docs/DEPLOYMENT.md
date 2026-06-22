# Deployment Guide for LearnSphere

## Production Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database backups tested
- [ ] SSL certificate ready
- [ ] API keys secured (OpenAI, etc.)
- [ ] Code tested in staging
- [ ] Database migrations verified
- [ ] Logs configured for production

### Environment Setup

#### Server Requirements

- Linux server (Ubuntu 20.04+ recommended)
- 2GB+ RAM
- 20GB+ disk space
- Node.js 18.x LTS
- Docker & Docker Compose
- Nginx for reverse proxy

#### Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Application Deployment

#### 1. Clone Repository

```bash
cd /var/www
git clone <your-repo-url> learnsphere
cd learnsphere
```

#### 2. Configure Environment

```bash
# Copy example env
cp .env.example .env

# Edit with production values
nano .env

# Required variables:
# - MONGODB_URI (use hosted MongoDB)
# - JWT_SECRET (strong random string)
# - OPENAI_API_KEY (your API key)
# - NODE_ENV=production
```

#### 3. Build and Deploy with Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

#### 4. Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/learnsphere
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Gzip compression
    gzip on;
    gzip_types text/html text/css text/javascript application/json;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 5. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/learnsphere /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
```

### Database Setup

#### MongoDB Atlas (Recommended for Production)

1. Create MongoDB Atlas account
2. Create cluster
3. Get connection string
4. Add connection string to .env
5. Whitelist IP addresses

#### Local MongoDB with Replication

```bash
# Start MongoDB with replica set
docker run -d --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=<strong-password> \
  -p 27017:27017 \
  mongo:7.0 --replSet rs0

# Initialize replica set
docker exec mongodb mongosh --eval "rs.initiate()"
```

### Monitoring & Logging

#### Setup Monitoring

```bash
# Install PM2 for process management
sudo npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit
```

#### Configure Logging

```bash
# Create log directory
mkdir -p /var/log/learnsphere

# Configure logrotate
sudo nano /etc/logrotate.d/learnsphere
```

```
/var/log/learnsphere/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

#### Application Monitoring

```javascript
// Add monitoring middleware to Express
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Backup Strategy

#### Database Backups

```bash
#!/bin/bash
# Daily MongoDB backup

BACKUP_DIR="/backups/mongodb"
DB_USER="admin"
DB_PASS="<password>"
DB_HOST="mongodb.example.com"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

mongodump --host $DB_HOST \
  --username $DB_USER \
  --password $DB_PASS \
  --out $BACKUP_DIR/dump_$DATE

# Compress and remove old backups
tar czf $BACKUP_DIR/dump_$DATE.tar.gz $BACKUP_DIR/dump_$DATE
rm -rf $BACKUP_DIR/dump_$DATE

# Remove backups older than 30 days
find $BACKUP_DIR -type f -mtime +30 -delete
```

Add to crontab:

```bash
crontab -e
# 0 2 * * * /home/deploy/backup-mongodb.sh
```

### Performance Tuning

#### Database Indexes

```javascript
// Create indexes for frequently queried fields
db.users.createIndex({ email: 1 });
db.courses.createIndex({ instructor: 1 });
db.assessments.createIndex({ studentId: 1, courseId: 1 });
db.enrollments.createIndex({ studentId: 1, courseId: 1 });
```

#### Caching

```bash
# Add Redis for session caching (future enhancement)
docker run -d --name redis \
  -p 6379:6379 \
  redis:7.0-alpine
```

### Security Hardening

#### SSL/TLS

- Use HSTS headers
- Regular certificate renewal
- TLS 1.2+ only

#### API Security

```javascript
// Helmet for security headers
import helmet from 'helmet';
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);
```

#### Database Security

- Use strong passwords
- Enable authentication
- Use IP whitelisting
- Regular security updates

#### Environment Security

- Keep .env out of git
- Use secrets manager for production
- Rotate credentials regularly
- Never commit API keys

### Troubleshooting

#### Container Issues

```bash
# View container logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart backend

# Rebuild on code changes
docker-compose up --build
```

#### Database Connection Issues

```bash
# Test connection
mongosh mongodb://user:pass@host:27017/learnsphere

# Check connection string in .env
cat .env | grep MONGODB_URI
```

#### Memory Issues

```bash
# Monitor resource usage
docker stats

# Increase memory limit in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

### Performance Monitoring

#### Application Metrics

```javascript
// Add metrics collection
import prometheus from 'prom-client';

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
});
```

#### Dashboard Setup

```bash
# Optional: Setup Grafana for monitoring
docker run -d --name grafana \
  -p 3001:3000 \
  grafana/grafana:latest
```

### Maintenance

#### Regular Tasks

- Monitor logs daily
- Check backup status weekly
- Review metrics weekly
- Update dependencies monthly
- Security audit quarterly
- Disaster recovery test quarterly

#### Update Process

```bash
# Update code
git pull origin main

# Rebuild containers
docker-compose build

# Stop old containers
docker-compose down

# Start new containers
docker-compose up -d

# Verify deployment
docker-compose ps
```

---

**Last Updated**: February 2026
