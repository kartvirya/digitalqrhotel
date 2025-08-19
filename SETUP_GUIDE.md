# Digital QR Restaurant Management System - Environment Setup Guide

## Overview

This guide explains how to set up environment variables for both development and production environments.

## Files Created

1. `env.example` - Main environment variables template
2. `pr1/settings_prod.py` - Production Django settings
3. `frontend/env.example` - Frontend environment variables template
4. `frontend/build-with-env.sh` - Frontend build script with environment support
5. `start_prod.sh` - Production startup script
6. `requirements.txt` - Python dependencies

## Quick Setup

### 1. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Create Environment Files

```bash
# Copy the example files
cp env.example .env
cp frontend/env.example frontend/.env
```

### 3. Configure Environment Variables

Edit the `.env` files with your specific values:

#### Backend (.env)
```bash
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=False
ENVIRONMENT=production

# Database (for production, consider PostgreSQL)
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# Network Configuration
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Allowed Hosts (comma-separated)
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# CORS and CSRF
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
CSRF_TRUSTED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

#### Frontend (frontend/.env)
```bash
# Backend API URL
REACT_APP_BACKEND_URL=https://your-domain.com

# Frontend URL
REACT_APP_FRONTEND_URL=https://your-domain.com

# Environment
REACT_APP_ENVIRONMENT=production

# API Configuration
REACT_APP_API_TIMEOUT=30000
```

## Development Setup

### 1. Development Environment

```bash
# Copy example files
cp env.example .env
cp frontend/env.example frontend/.env
```

### 2. Configure for Development

#### Backend (.env)
```bash
DEBUG=True
ENVIRONMENT=development
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

#### Frontend (frontend/.env)
```bash
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_FRONTEND_URL=http://localhost:3000
REACT_APP_ENVIRONMENT=development
REACT_APP_ENABLE_DEBUG_MODE=true
```

### 3. Start Development Servers

```bash
# Start backend
python manage.py runserver 8000

# In another terminal, start frontend
cd frontend
npm start
```

## Production Setup

### 1. Production Environment

```bash
# Copy and configure environment files
cp env.example .env
cp frontend/env.example frontend/.env

# Edit the files with production values
```

### 2. Generate Secret Key

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 3. Database Setup (Optional - for PostgreSQL)

```bash
# Install PostgreSQL adapter
pip install psycopg2-binary

# Update .env file
DB_ENGINE=django.db.backends.postgresql
DB_NAME=your_database_name
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_database_user
DB_PASSWORD=your_database_password
```

### 4. Start Production Servers

```bash
# Make scripts executable
chmod +x start_prod.sh
chmod +x frontend/build-with-env.sh

# Start production servers
./start_prod.sh
```

## Environment Variables Reference

### Backend Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SECRET_KEY` | Django secret key | - | Yes |
| `DEBUG` | Debug mode | False | No |
| `ENVIRONMENT` | Environment name | production | No |
| `DB_ENGINE` | Database engine | sqlite3 | No |
| `DB_NAME` | Database name | db.sqlite3 | No |
| `DB_HOST` | Database host | localhost | No |
| `DB_PORT` | Database port | 5432 | No |
| `DB_USER` | Database user | - | No |
| `DB_PASSWORD` | Database password | - | No |
| `BACKEND_PORT` | Backend server port | 8000 | No |
| `FRONTEND_PORT` | Frontend server port | 3000 | No |
| `ALLOWED_HOSTS` | Allowed hosts | localhost,127.0.0.1 | No |
| `CORS_ALLOWED_ORIGINS` | CORS origins | http://localhost:3000 | No |
| `CSRF_TRUSTED_ORIGINS` | CSRF origins | http://localhost:3000 | No |

### Frontend Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REACT_APP_BACKEND_URL` | Backend API URL | http://localhost:8000 | No |
| `REACT_APP_FRONTEND_URL` | Frontend URL | http://localhost:3000 | No |
| `REACT_APP_ENVIRONMENT` | Environment | production | No |
| `REACT_APP_API_TIMEOUT` | API timeout (ms) | 30000 | No |
| `REACT_APP_ENABLE_DEBUG_MODE` | Debug mode | false | No |

## Build Process

### Frontend Build with Environment Variables

```bash
cd frontend
./build-with-env.sh
```

This script will:
1. Load environment variables from `.env` files
2. Set default values for missing variables
3. Build the React app with the configured environment

### Production Build

```bash
# The start_prod.sh script automatically uses the build-with-env.sh script
./start_prod.sh
```

## Security Considerations

### Production Security

1. **Never commit `.env` files** - They contain sensitive information
2. **Use strong secret keys** - Generate new ones for production
3. **Enable HTTPS** - Set `SECURE_SSL_REDIRECT=True` in production
4. **Configure CORS properly** - Only allow necessary origins
5. **Use secure cookies** - Set `SESSION_COOKIE_SECURE=True` and `CSRF_COOKIE_SECURE=True`

### Environment File Security

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo "frontend/.env" >> .gitignore
echo "*.env" >> .gitignore
```

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Ensure `.env` files exist and are properly formatted
   - Check that variable names match exactly (case-sensitive)

2. **Frontend can't connect to backend**
   - Verify `REACT_APP_BACKEND_URL` is correct
   - Check CORS settings in backend
   - Ensure backend is running

3. **Build fails**
   - Check that all required environment variables are set
   - Verify Node.js and npm are installed
   - Check for syntax errors in `.env` files

### Debug Mode

Enable debug mode to see more detailed error messages:

```bash
# Backend
DEBUG=True

# Frontend
REACT_APP_ENABLE_DEBUG_MODE=true
```

## Deployment

### Docker Deployment (Optional)

Create a `Dockerfile` and `docker-compose.yml` for containerized deployment.

### Cloud Deployment

1. **Heroku**: Use environment variables in Heroku dashboard
2. **AWS**: Use AWS Systems Manager Parameter Store
3. **Google Cloud**: Use Google Secret Manager
4. **Azure**: Use Azure Key Vault

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the environment variables reference
3. Ensure all dependencies are installed
4. Verify environment file syntax
