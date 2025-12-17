# Design Approval Workflow System - Backend

FastAPI backend with MongoDB and GridFS for the Design Approval Workflow System.

## Setup Instructions

### 1. Create Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your configuration
# Ensure MongoDB is running at the specified URI
```

### 4. Start MongoDB

Make sure MongoDB is running:

```bash
# Check if MongoDB is running
mongosh

# If not installed, install MongoDB:
# macOS: brew install mongodb-community
# Ubuntu: sudo apt-get install mongodb
# Windows: Download from https://www.mongodb.com/try/download/community
```

### 5. Run the Server

```bash
# From backend directory with activated venv
python -m app.main

# Or using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Configuration settings
│   ├── database.py          # MongoDB connection
│   ├── auth/
│   │   ├── jwt_handler.py   # JWT token operations
│   │   ├── password.py      # Password hashing
│   │   └── dependencies.py  # Auth dependencies
│   ├── models/
│   │   ├── user.py          # User schemas
│   │   ├── project.py       # Project schemas
│   │   ├── upload.py        # Upload schemas
│   │   ├── approval.py      # Approval schemas
│   │   └── remark.py        # Remark schemas
│   ├── routers/
│   │   ├── auth.py          # Authentication routes
│   │   ├── projects.py      # Project routes
│   │   ├── uploads.py       # File upload routes
│   │   └── remarks.py       # Remark routes
│   └── utils/
│       ├── gridfs_handler.py    # GridFS operations
│       └── permissions.py       # Permission checks
├── requirements.txt
├── .env.example
├── .env
└── README.md
```

## API Documentation

Once the server is running, visit http://localhost:8000/docs for interactive API documentation with:
- All endpoint details
- Request/response schemas
- Try-it-out functionality

## Key Features

### Authentication
- JWT-based authentication
- 7-day token expiration
- Password hashing with bcrypt
- Role-based access control

### File Handling
- GridFS for unlimited file size
- All file formats supported
- Version history tracking
- Download and preview endpoints

### Workflow Management
- Multi-stage approval process
- Stage transition validation
- Automatic stage progression
- Rejection handling with designer rework

### Database
- MongoDB with async Motor driver
- Automatic connection management
- Proper indexing for performance

## Environment Variables

Required environment variables in `.env`:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=design_approval_system

# JWT
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=7

# Application
APP_TITLE=Design Approval Workflow System
APP_VERSION=1.0.0
DEBUG=True

# CORS
FRONTEND_URL=http://localhost:5173
```

## Testing the API

### 1. Register a User

```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "Digital Marketer"
  }'
```

### 2. Login

```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Use the Token

Copy the `access_token` from the login response and use it in subsequent requests:

```bash
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Common Issues

### MongoDB Connection Error
```
pymongo.errors.ServerSelectionTimeoutError
```
**Solution:** Ensure MongoDB is running on the specified URI.

### Module Not Found
```
ModuleNotFoundError: No module named 'app'
```
**Solution:** Make sure you're in the `backend` directory and virtual environment is activated.

### Port Already in Use
```
OSError: [Errno 48] Address already in use
```
**Solution:** Stop other processes using port 8000 or change the port in the run command.

## Production Deployment

For production deployment:

1. Change `DEBUG=False` in `.env`
2. Use a strong `SECRET_KEY`
3. Set up proper MongoDB authentication
4. Use a production WSGI server (already using Uvicorn)
5. Set up reverse proxy (nginx/Apache)
6. Enable HTTPS
7. Configure proper CORS origins

## PEP-8 Compliance

This codebase follows PEP-8 standards:
- Type hints throughout
- Proper docstrings
- Consistent naming conventions
- 4-space indentation
- Maximum line length considerations
