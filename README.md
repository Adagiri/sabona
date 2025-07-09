# Sabonah Backend - Development Environment

## 🚀 Quick Start

This project includes a development script that automatically manages your local development environment including PostgreSQL, Redis, and web interfaces.

## 📋 Prerequisites

- **Docker Desktop** or **Docker + Docker Compose**
- **Node.js 16+**
- **pnpm** (or npm)

### Install Docker Desktop
```bash
# Download and install Docker Desktop
curl -fsSL https://desktop.docker.com/linux/main/amd64/docker-desktop-4.25.0-amd64.deb -o docker-desktop.deb
sudo apt install ./docker-desktop.deb

# Start Docker Desktop
systemctl --user start docker-desktop
```

## 🛠️ Setup

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd sabonah-backend
pnpm install
```

### 2. Create Development Script
```bash
# Create the script file
touch dev.sh

# Copy the script content from the project
# Make it executable
chmod +x dev.sh
```

### 3. Environment Variables
Create a `.env` file for local development:
```bash
# App Configuration
APP_ENV=dev
APP_PORT=3001
APP_DEBUG=true
APP_LOG_LEVEL=1
APP_TOKEN_EXPIRATION=604800000

# Database - LOCAL for development (Docker container)
APP_DATABASE_URL=postgresql://sabonah_postgres:click123@localhost:5432/sabonah_db?schema=public

# Redis - LOCAL for development (Docker container)
APP_REDIS_HOST=localhost
APP_REDIS_PORT=6379

# AWS (keep your production values)
APP_AWS_ACCESS_KEY=your_access_key
APP_AWS_SECRET_KEY=your_secret_key
APP_AWS_REGION=us-east-1
APP_AWS_BUCKET=your_bucket
APP_AWS_BUCKET_BASE_URL=https://s3.us-east-1.amazonaws.com/your_bucket
APP_AWS_STS_ROLE_ARN=arn:aws:iam::your_account:role/s3-role

# Add other environment variables as needed...
```

## 🎯 Development Script Usage

### Start Development Environment
```bash
./dev.sh start
# or simply
./dev.sh
```

### Stop Development Environment
```bash
./dev.sh stop
```

### Restart Everything
```bash
./dev.sh restart
```

### Check Status
```bash
./dev.sh status
```

### Clean Up All Data (⚠️ DELETES ALL DATA)
```bash
./dev.sh cleanup
```

### Get Help
```bash
./dev.sh help
```

## 🔧 What the Script Does

### On START:
✅ Checks if Docker is running  
✅ Creates Docker volumes if they don't exist  
✅ Starts PostgreSQL, Redis, pgAdmin, and Redis GUI  
✅ Waits for services to be ready  
✅ Shows service URLs and next steps  

### On STOP:
✅ Stops Node.js app (if running)  
✅ Stops all Docker containers  
✅ Clean shutdown (data persists)  

## 🌐 Service URLs

After running `./dev.sh start`, these services will be available:

| Service | URL | Credentials |
|---------|-----|-------------|
| **PostgreSQL** | `localhost:5432` | `sabonah_postgres` / `click123` |
| **Redis** | `localhost:6379` | No auth required |
| **pgAdmin** | http://localhost:8080 | `admin@sabonah.com` / `admin123` |
| **Redis GUI** | http://localhost:8081 | Auto-connects |
| **Your App** | http://localhost:3001 | After starting with npm |

## 📝 Development Workflow

### 1. Start Development Environment
```bash
./dev.sh start
```

### 2. Setup Database
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate
```

### 3. Start Your Application
```bash
# Development mode with hot reload
npm run start:dev

# Or production build
npm run build
npm run start:prod
```

### 4. Access Services
- **Your API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/v1/api
- **Database GUI**: http://localhost:8080
- **Redis GUI**: http://localhost:8081

### 5. Stop Development Environment
```bash
./dev.sh stop
```

## 🗄️ Database Management

### Connect to PostgreSQL via pgAdmin
1. Open http://localhost:8080
2. Login with `admin@sabonah.com` / `admin123`
3. Add New Server:
   - **Name**: Sabonah DB
   - **Host**: `db` (container name)
   - **Port**: `5432`
   - **Username**: `sabonah_postgres`
   - **Password**: `click123`
   - **Database**: `sabonah_db`

### Direct Database Commands
```bash
# Connect to PostgreSQL container
docker exec -it sabonah.db psql -U sabonah_postgres -d sabonah_db

# Run Prisma commands
npm run db:migrate
npm run db:generate
npm run db:deploy
```

## 🔴 Redis Management

### Connect via Redis GUI
- Open http://localhost:8081
- Redis Commander auto-connects to your local Redis instance

### Direct Redis Commands
```bash
# Connect to Redis container
docker exec -it sabonah.redis redis-cli

# Test Redis connection
docker exec -it sabonah.redis redis-cli ping
```

## 📁 Data Persistence

Your development data is stored in Docker volumes:
- **PostgreSQL data**: `sabonah_postgres_data`
- **Redis data**: `sabonah_redis_data`
- **pgAdmin settings**: `backend_pgadmin_data`

Data persists between container restarts unless you run `./dev.sh cleanup`.

## 🔧 Troubleshooting

### Docker Issues
```bash
# Check if Docker is running
docker --version

# Restart Docker
sudo systemctl restart docker
# or restart Docker Desktop

# Check container status
docker-compose ps
```

### Database Connection Issues
```bash
# Check if PostgreSQL is ready
docker exec sabonah.db pg_isready -U sabonah_postgres

# View PostgreSQL logs
docker-compose logs db
```

### Redis Connection Issues
```bash
# Test Redis connection
docker exec sabonah.redis redis-cli ping

# View Redis logs
docker-compose logs redis
```

### Port Conflicts
If you get port conflict errors, check what's using the ports:
```bash
# Check what's using port 5432
sudo lsof -i :5432

# Check what's using port 6379
sudo lsof -i :6379
```

## 📦 Environment Variables Reference

### Required for Local Development
- `APP_DATABASE_URL` - PostgreSQL connection string
- `APP_REDIS_HOST` - Redis host (localhost for local dev)
- `APP_REDIS_PORT` - Redis port (6379)

### Required for Production Features
- `APP_AWS_*` - AWS credentials and configuration
- `APP_TWILIO_*` - Twilio SMS service credentials
- `APP_FIREBASE_*` - Firebase authentication credentials

## 🚀 Deployment

For production deployment to AWS App Runner, refer to the `apprunner.yaml` configuration and Parameter Store/Secrets Manager setup.

## 📚 Additional Commands

### View Script Help
```bash
./dev.sh help
```

### Check All Container Status
```bash
docker-compose ps
```

### View Container Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs db
docker-compose logs redis
```

### Backup Database
```bash
# Backup PostgreSQL data
docker exec sabonah.db pg_dump -U sabonah_postgres sabonah_db > backup.sql

# Restore from backup
docker exec -i sabonah.db psql -U sabonah_postgres sabonah_db < backup.sql
```

---

## 🆘 Need Help?

1. **Check service status**: `./dev.sh status`
2. **View logs**: `docker-compose logs [service-name]`
3. **Restart everything**: `./dev.sh restart`
4. **Clean reset**: `./dev.sh cleanup` (⚠️ deletes all data)