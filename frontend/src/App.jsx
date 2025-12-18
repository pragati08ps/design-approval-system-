import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './utils/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import UploadDesign from './pages/UploadDesign';
import ProjectDetail from './pages/ProjectDetail';
import UserManagement from './pages/UserManagement';
import TaskManagement from './pages/TaskManagement';
import Analytics from './pages/Analytics';
import Calendar from './pages/Calendar';
import { ROLES } from './utils/constants';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/create-project"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.DIGITAL_MARKETER]}>
                                <CreateProject />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/upload-design"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.DESIGNER]}>
                                <UploadDesign />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/user-management"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                                <UserManagement />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/tasks"
                        element={
                            <ProtectedRoute>
                                <TaskManagement />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/analytics"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.PYTHON_DEVELOPER]}>
                                <Analytics />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/calendar"
                        element={
                            <ProtectedRoute>
                                <Calendar />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/project/:id"
                        element={
                            <ProtectedRoute>
                                <ProjectDetail />
                            </ProtectedRoute>
                        }
                    />

                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
