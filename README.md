# Design Approval Workflow System

A comprehensive multi-stage design approval system built with FastAPI, React, MongoDB, and Tailwind CSS.

## 🚀 Features

### ✅ Multi-stage Approval Workflow
- Digital Marketer → Designer → Graphic Designer → Manager → Admin → Client → Completed
- Sequential approval process with role-based stages

### ✅ Role-Based Access Control
- 7 distinct user roles with specific permissions
- JWT-based authentication
- Secure password hashing

### ✅ Admin User Management (NEW!)
- Create, edit, and delete users
- Manage user roles and permissions
- Admin dashboard for user administration

### ✅ File Management
- Upload any file format using GridFS
- Version history tracking
- File preview and download
- Support for images, PDFs, videos, and more

### ✅ Collaboration
- Remarks and feedback system
- Real-time status tracking
- Project timeline visualization
- Approval/rejection flow with comments

### ✅ Complete Workflow
- Project creation by Digital Marketers
- Design uploads by Designers
- Sequential approvals by stakeholders
- Rejection and rework flow
- Posting status tracking

## 📁 Project Structure

```
design-approval-system/
├── backend/          # FastAPI Backend
│   ├── app/
│   │   ├── auth/         # Authentication utilities
│   │   ├── models/       # Pydantic models
│   │   ├── routers/      # API endpoints
│   │   └── utils/        # Helper functions
│   └── requirements.txt
└── frontend/         # React Frontend
    ├── src/
    │   ├── api/          # API services
    │   ├── components/   # React components
    │   ├── pages/        # Page components
    │   └── context/      # Context providers
    └── package.json
```

## 🛠️ Quick Start

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

**Backend runs at:** http://localhost:8000  
**API Docs:** http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

**Frontend runs at:** http://localhost:5173

## 👥 User Roles

1. **Digital Marketer** - Creates projects and uploads content
2. **Designer** - Uploads designs and handles rework
3. **Graphic Designer** - First approval stage
4. **Manager** - Second approval stage
5. **Admin** - Final internal approval + User Management
6. **Client** - Client review and final approval
7. **CEO** - View-only access to all projects

## 🔄 Workflow Sequence

1. **Digital Marketer** creates project and uploads content
2. **Designer** uploads design with type selection
3. **Graphic Designer** reviews → Approve/Reject
4. **Manager** reviews → Approve/Reject
5. **Admin** reviews → Approve/Reject (final internal)
6. **Client** reviews → Approve/Reject (final)
7. Project marked as **Completed**
8. Posted status can be updated

**Note:** Rejection at any stage returns to Designer for rework.

## 🎨 Design Types

- Poster
- Webpage
- Video
- Brochure
- Flyers
- Logo
- Nameboard
- Letterhead

## 💻 Tech Stack

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

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info

### Users (Admin Only)
- `GET /users/` - List all users
- `POST /users/` - Create new user
- `PUT /users/{user_id}` - Update user
- `DELETE /users/{user_id}` - Delete user

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
- `GET /uploads/project/{project_id}/versions` - Get file versions

### Remarks
- `POST /remarks` - Add remark
- `GET /remarks/project/{project_id}` - Get project remarks

## ⚙️ Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=design_approval_system
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=7
FRONTEND_URL=http://localhost:5173
```

## 🔧 Development

### Backend Development
```bash
cd backend
source venv/bin/activate
python -m app.main
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

## 🗄️ MongoDB Collections

- `users` - User accounts and credentials
- `projects` - Project information and metadata
- `uploads` - File version history
- `approvals` - Approval records and timestamps
- `remarks` - Comments and feedback
- `fs.files` & `fs.chunks` - GridFS file storage

## 📚 Documentation

For detailed setup instructions, see [SETUP.md](./SETUP.md)

## 🎯 Key Features

### For Admins
- **User Management Dashboard** - Create, edit, delete users
- **Role Assignment** - Assign roles to team members
- **Project Oversight** - View all projects across the system

### For Digital Marketers
- **Project Creation** - Initiate new design projects
- **Content Upload** - Attach project briefs and requirements

### For Designers
- **Design Upload** - Submit design files with version control
- **Rework Management** - Handle feedback and resubmissions

### For Approvers (Graphic Designer, Manager, Admin, Client)
- **Review Interface** - View designs inline
- **Approval Actions** - Approve or reject with comments
- **Feedback System** - Add detailed remarks

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/pragati08ps/design-approval-system-.git
   cd design-approval-system-
   ```

2. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Start MongoDB service

3. **Start Backend**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python -m app.main
   ```

4. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application**
   - Open http://localhost:5173
   - Register your first admin user
   - Create additional users through the admin panel

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 📞 Support

For issues and questions, please create an issue in the repository.

---

**Built with ❤️ using FastAPI, React, and MongoDB**
