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
                            <ProtectedRoute allowedRoles={[ROLES.DIGITAL_MARKETER]}>
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
