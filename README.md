# Design Approval Workflow System

A comprehensive multi-stage design approval system built with FastAPI, React, MongoDB, and Tailwind CSS.

## Project Structure

```
designfinal/
├── backend/          # FastAPI Backend
└── frontend/         # React Frontend
```

## Features

✅ **Multi-stage Approval Workflow**
- Digital Marketer → Designer → Graphic Designer → Manager → Admin → Client → Completed

✅ **Role-Based Access Control**
- 7 distinct user roles with specific permissions
- JWT-based authentication

✅ **File Management**
- Upload any file format using GridFS
- Version history tracking
- File preview and download

✅ **Collaboration**
- Remarks and feedback system
- Real-time status tracking
- Project timeline visualization

✅ **Complete Workflow**
- Project creation
- Design uploads
- Sequential approvals
- Rejection and rework flow
- Posting status tracking

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 16+
- MongoDB 6.0+

### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB connection string

# Run the server
python -m app.main
```

Backend will run at: http://localhost:8000
API Docs: http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will run at: http://localhost:5173

## User Roles

1. **Digital Marketer** - Creates projects and uploads content
2. **Designer** - Uploads designs and handles rework
3. **Graphic Designer** - First approval stage
4. **Manager** - Second approval stage
5. **Admin** - Final internal approval
6. **Client** - Client review and final approval
7. **CEO** - View-only access to all projects

## Workflow Sequence

1. Digital Marketer creates project and uploads content
2. Designer uploads design with type selection
3. Graphic Designer reviews → Approve/Reject
4. Manager reviews → Approve/Reject
5. Admin reviews → Approve/Reject (final internal)
6. Client reviews → Approve/Reject (final)
7. Project marked as Completed
8. Posted status can be updated

**Note:** Rejection at any stage returns to Designer for rework.

## Design Types

- Poster
- Webpage
- Video
- Brochure
- Flyers
- Logo
- Nameboard
- Letterhead

## Tech Stack

### Backend
- **Framework:** FastAPI
- **Database:** MongoDB with Motor (async driver)
- **File Storage:** GridFS
- **Authentication:** JWT (python-jose)
- **Password Hashing:** Bcrypt (passlib)
- **Validation:** Pydantic

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v3
- **Routing:** React Router v6
- **HTTP Client:** Axios

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Projects
- `GET /projects` - List projects (role-filtered)
- `POST /projects` - Create project
- `GET /projects/{id}` - Get project details
- `POST /projects/{id}/upload-content` - Upload content
- `POST /projects/{id}/upload-design` - Upload design
- `POST /projects/{id}/approve-reject` - Approve/reject
- `PATCH /projects/{id}/posting` - Update posting status

### Uploads
- `GET /uploads/{file_id}` - Download file
- `GET /uploads/preview/{file_id}` - Preview file
- `GET /uploads/project/{project_id}/versions` - Get versions

### Remarks
- `POST /remarks` - Add remark
- `GET /remarks/project/{project_id}` - Get project remarks

## Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=design_approval_system
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=7
FRONTEND_URL=http://localhost:5173
```

## Development

### Backend Development
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Build for Production
```bash
cd frontend
npm run build
```

## MongoDB Collections

- `users` - User accounts
- `projects` - Project information
- `uploads` - File version history
- `approvals` - Approval records
- `remarks` - Comments and feedback
- `fs.files` & `fs.chunks` - GridFS file storage

## License

MIT

## Support

For issues and questions, please create an issue in the repository.
