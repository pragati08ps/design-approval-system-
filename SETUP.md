# Design Approval Workflow System - Setup Guide

Complete setup guide for running the Design Approval Workflow System.

## Prerequisites

Before starting, ensure you have:

- ✅ **Python 3.9 or higher** - [Download Python](https://www.python.org/downloads/)
- ✅ **Node.js 16 or higher** - [Download Node.js](https://nodejs.org/)
- ✅ **MongoDB 6.0 or higher** - [Download MongoDB](https://www.mongodb.com/try/download/community)

## Step 1: Install and Start MongoDB

### macOS
```bash
# Install MongoDB using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

### Ubuntu/Linux
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Windows
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer
3. MongoDB will start automatically as a Windows service

### Verify MongoDB is running
```bash
# Connect to MongoDB shell
mongosh

# You should see MongoDB shell prompt
# Type 'exit' to quit
```

## Step 2: Set Up Backend

```bash
# Navigate to project directory
cd /Users/default/internal-tool/designfinal

# Go to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# The .env file is already configured
# Verify it exists and has correct settings
cat .env
```

Expected `.env` content:
```
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=design_approval_system
SECRET_KEY=your-secret-key-change-this-in-production-use-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=7
APP_TITLE=Design Approval Workflow System
APP_VERSION=1.0.0
DEBUG=True
FRONTEND_URL=http://localhost:5173
```

## Step 3: Start Backend Server

```bash
# Make sure you're in the backend directory with venv activated
cd backend
source venv/bin/activate  # Skip if already activated

# Start the FastAPI server
python -m app.main
```

You should see:
```
✅ Connected to MongoDB: design_approval_system
🚀 Design Approval Workflow System v1.0.0 started successfully!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Keep this terminal open!** The backend server is now running.

Test it: Open http://localhost:8000 in your browser
- You should see: `{"message":"Design Approval Workflow System API","version":"1.0.0","status":"running"}`
- API Docs: http://localhost:8000/docs

## Step 4: Set Up Frontend (New Terminal)

Open a **new terminal window** and:

```bash
# Navigate to project directory
cd /Users/default/internal-tool/designfinal

# Go to frontend directory
cd frontend

# Install dependencies
npm install
```

This will install all React, Vite, and Tailwind CSS dependencies.

## Step 5: Start Frontend Development Server

```bash
# Make sure you're in the frontend directory
cd frontend

# Start the development server
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

## Step 6: Access the Application

Open your browser and go to: **http://localhost:5173**

You should see the Design Approval System login page!

## Step 7: Create Your First Users

### Register Users for Each Role

1. Click **"Register here"** on the login page
2. Create a user for each role to test the complete workflow:

**Digital Marketer:**
- Name: Sarah Johnson
- Email: sarah@company.com
- Password: password123
- Role: Digital Marketer

**Designer:**
- Name: Mike Chen
- Email: mike@company.com
- Password: password123
- Role: Designer

**Graphic Designer:**
- Name: Emma Davis
- Email: emma@company.com
- Password: password123
- Role: Graphic Designer

**Manager:**
- Name: James Wilson
- Email: james@company.com
- Password: password123
- Role: Manager

**Admin:**
- Name: Lisa Anderson
- Email: lisa@company.com
- Password: password123
- Role: Admin

**Client:**
- Name: Robert Taylor
- Email: robert@company.com
- Password: password123
- Role: Client

## Step 8: Test the Complete Workflow

### 1. Digital Marketer Creates Project
- Login as sarah@company.com
- Click **"+ Create New Project"**
- Fill in:
  - Project Name: "Summer Campaign 2024"
  - Description: "Marketing materials for summer campaign"
  - Expected Date: (choose a future date)
  - Optional: Upload a content file
- Click **"Create Project"**

### 2. Designer Uploads Design
- Logout and login as mike@company.com
- Click **"Upload Design"**
- Select the project
- Choose Design Type: "Poster"
- Upload a design file (any image/PDF)
- Click **"Upload Design"**

### 3. Graphic Designer Reviews
- Logout and login as emma@company.com
- Click on the project card
- Review the design (click "Preview" to view)
- Add a remark: "Looks good, approved!"
- Click **"✓ Approve"**

### 4. Manager Reviews
- Logout and login as james@company.com
- Click on the project
- Click **"✓ Approve"**

### 5. Admin Reviews
- Logout and login as lisa@company.com
- Click on the project
- Click **"✓ Approve"**

### 6. Client Final Approval
- Logout and login as robert@company.com
- Click on the project
- Add final feedback
- Click **"✓ Approve"**

### 7. Mark as Posted
- Project is now in **Completed** stage
- Check the **"Mark as Posted"** checkbox

**Congratulations!** 🎉 You've completed a full workflow cycle!

## Testing Rejection Flow

To test the rejection and rework flow:

1. At any approval stage, click **"✗ Reject"**
2. Add a remark explaining what needs to be changed
3. Click **"Confirm Reject"**
4. Login as Designer
5. The project will be back in "Design Upload" stage
6. Re-upload the corrected design
7. The workflow continues from where it was rejected

## Ports Used

- **Backend API**: http://localhost:8000
- **Frontend App**: http://localhost:5173
- **MongoDB**: localhost:27017

## Stopping the Application

### Stop Frontend
- Press `Ctrl+C` in the frontend terminal

### Stop Backend
- Press `Ctrl+C` in the backend terminal

### Stop MongoDB (if needed)
```bash
# macOS
brew services stop mongodb-community

# Linux
sudo systemctl stop mongod
```

## Troubleshooting

### Backend won't start
**Problem:** `pymongo.errors.ServerSelectionTimeoutError`
- **Solution:** Ensure MongoDB is running (`mongosh` to test)

### Frontend won't build
**Problem:** `npm install` fails
- **Solution:** Delete `node_modules` and `package-lock.json`, run `npm install` again

### Can't login
**Problem:** Network error on login
- **Solution:** Ensure backend is running at http://localhost:8000
- **Solution:** Check browser console for CORS errors

### Port already in use
**Problem:** Port 8000 or 5173 already in use
- **Solution:** Stop other processes using those ports or change ports in config files

## Next Steps

- Explore the API documentation at http://localhost:8000/docs
- Try uploading different file types (PDF, images, videos)
- Test the version history feature with multiple uploads
- Add remarks at different stages
- View the complete project timeline

## Production Deployment

For production deployment, see:
- `backend/README.md` for backend deployment
- `frontend/README.md` for frontend deployment
- Update environment variables for security
- Set up proper MongoDB authentication
- Configure HTTPS
- Use production builds

## Support

If you encounter issues:
1. Check the README files in backend/ and frontend/
2. Verify all prerequisites are installed
3. Ensure MongoDB is running
4. Check console logs for errors
5. Verify ports are not in use

Enjoy using the Design Approval Workflow System! 🚀
