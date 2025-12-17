# Design Approval Workflow System - Frontend

React frontend application with Tailwind CSS for the Design Approval Workflow System.

## Setup Instructions

### 1. Install Dependencies

```bash
# Navigate to frontend directory
cd frontend

# Install all dependencies
npm install
```

### 2. Configure API Endpoint

The API base URL is configured in `src/utils/constants.js`. By default, it points to `http://localhost:8000`.

If your backend is running on a different URL, update:

```javascript
export const API_BASE_URL = 'http://localhost:8000';
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at: http://localhost:5173

### 4. Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── axios.js         # Axios instance with interceptors
│   │   ├── auth.js          # Auth API calls
│   │   ├── projects.js      # Project API calls
│   │   ├── uploads.js       # Upload API calls
│   │   └── remarks.js       # Remark API calls
│   ├── components/
│   │   ├── common/
│   │   │   └── Loading.jsx
│   │   ├── layout/
│   │   │   └── Navbar.jsx
│   │   ├── project/
│   │   │   └── ProjectCard.jsx
│   │   └── workflow/
│   │       └── StatusBadge.jsx
│   ├── context/
│   │   └── AuthContext.jsx  # Authentication state
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── CreateProject.jsx
│   │   ├── UploadDesign.jsx
│   │   └── ProjectDetail.jsx
│   ├── utils/
│   │   ├── constants.js     # App constants
│   │   └── ProtectedRoute.jsx
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Tailwind styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Available Scripts

### `npm run dev`
Starts the development server with hot reload at http://localhost:5173

### `npm run build`
Creates an optimized production build in the `dist/` folder

### `npm run preview`
Preview the production build locally

## Features

### Authentication
- User registration with role selection
- Login with JWT token storage
- Automatic token attachment to requests
- Protected routes by authentication status
- Role-based access control

### Dashboard
- Role-specific project listing
- Quick action buttons based on user role
- Project cards with status badges
- Responsive grid layout

### Project Management
- Create projects (Digital Marketer)
- Upload designs (Designer)
- View project details
- Track workflow stages
- View file versions

### Workflow Actions
- Approve/Reject at appropriate stages
- Add remarks and feedback
- View remarks timeline
- Mark projects as posted

### File Handling
- Upload any file format
- Preview files in browser
- Download files
- Version history tracking

## User Roles & Permissions

1. **Digital Marketer**
   - Create new projects
   - Upload content files
   - View own projects

2. **Designer**
   - View projects in designer stage
   - Upload designs with type selection
   - Re-upload designs after rejection

3. **Graphic Designer**
   - Review designs at graphic_designer stage
   - Approve or reject with remarks

4. **Manager**
   - Review designs at manager stage
   - Approve or reject with remarks

5. **Admin**
   - Review designs at admin stage
   - Final internal approval
   - View all projects

6. **Client**
   - Review designs at client stage
   - Final approval
   - Add feedback

7. **CEO**
   - View all projects (read-only)
   - Track overall progress

## Tailwind CSS Utilities

Custom utility classes defined in `index.css`:

### Buttons
- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary action button
- `.btn-danger` - Danger/delete button
- `.btn-success` - Success/approve button

### Forms
- `.input-field` - Styled input field
- `.card` - Card container

### Badges
- `.badge` - Base badge
- `.badge-pending` - Yellow pending badge
- `.badge-approved` - Green approved badge
- `.badge-rejected` - Red rejected badge
- `.badge-completed` - Blue completed badge

## Routing

- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Main dashboard (protected)
- `/create-project` - Create project form (Digital Marketer only)
- `/upload-design` - Upload design form (Designer only)
- `/project/:id` - Project detail page (protected)

## API Integration

All API calls go through Axios instance with:
- Automatic JWT token attachment
- Response interceptors for error handling
- Automatic redirect to login on 401 errors
- Consistent error handling

## State Management

- **Authentication State**: Context API (`AuthContext`)
- **Component State**: React useState hooks
- **Data Fetching**: Direct API calls with loading states

## Styling

- **Framework**: Tailwind CSS v3
- **Approach**: Utility-first with custom components
- **Responsive**: Mobile-first design
- **Theme**: Custom primary color palette

## Common Issues

### API Connection Error
If you see network errors:
1. Ensure backend is running at http://localhost:8000
2. Check CORS configuration in backend
3. Verify API_BASE_URL in constants.js

### Build Errors
If you encounter build errors:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use
If port 5173 is busy:
```bash
# Vite will automatically try the next available port
# Or specify a different port in vite.config.js
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Serve the `dist/` directory using:
   - Nginx
   - Apache
   - Netlify
   - Vercel
   - Any static file server

3. Update `API_BASE_URL` to point to your production backend

## Environment Configuration

For different environments, update `src/utils/constants.js`:

```javascript
// Development
export const API_BASE_URL = 'http://localhost:8000';

// Production
export const API_BASE_URL = 'https://api.yourdomain.com';
```

## Performance Optimization

- Vite for fast builds
- Code splitting with React Router
- Lazy loading for images
- Optimized Tailwind CSS (unused styles purged in production)
- Minimal dependencies
