import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROLES } from '../../utils/constants';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const showNav = [ROLES.ADMIN, ROLES.MANAGER, ROLES.PYTHON_DEVELOPER].includes(user?.role);

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <h1 className="text-xl font-bold text-primary-600 cursor-pointer" onClick={() => navigate('/dashboard')}>
                            Design Approval System
                        </h1>

                        {showNav && (
                            <div className="hidden md:flex space-x-4">
                                <NavLink
                                    to="/dashboard"
                                    active={isActive('/dashboard')}
                                    onClick={() => navigate('/dashboard')}
                                >
                                    Dashboard
                                </NavLink>
                                <NavLink
                                    to="/tasks"
                                    active={isActive('/tasks')}
                                    onClick={() => navigate('/tasks')}
                                >
                                    Tasks
                                </NavLink>
                                <NavLink
                                    to="/calendar"
                                    active={isActive('/calendar')}
                                    onClick={() => navigate('/calendar')}
                                >
                                    Calendar
                                </NavLink>
                                {(user?.role === ROLES.ADMIN || user?.role === ROLES.MANAGER) && (
                                    <NavLink
                                        to="/analytics"
                                        active={isActive('/analytics')}
                                        onClick={() => navigate('/analytics')}
                                    >
                                        Analytics
                                    </NavLink>
                                )}
                                {user?.role === ROLES.ADMIN && (
                                    <NavLink
                                        to="/user-management"
                                        active={isActive('/user-management')}
                                        onClick={() => navigate('/user-management')}
                                    >
                                        Users
                                    </NavLink>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                            <p className="text-xs text-gray-500">{user?.role}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="btn-secondary text-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

// NavLink Component
const NavLink = ({ children, active, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-2 rounded-md text-sm font-medium transition ${active
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
        >
            {children}
        </button>
    );
};

export default Navbar;

