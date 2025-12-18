import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../api/analytics';
import Navbar from '../components/layout/Navbar';
import Loading from '../components/common/Loading';
import { ROLES } from '../utils/constants';

const Analytics = () => {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await analyticsAPI.getDashboard();
            setAnalytics(response.data);
        } catch (err) {
            setError('Failed to load analytics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (user?.role !== ROLES.ADMIN && user?.role !== ROLES.MANAGER && user?.role !== ROLES.CEO) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        Access denied. Analytics are only available to Admin, Manager, and CEO.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <Loading />
                ) : analytics ? (
                    <>
                        {/* Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                title="Total Projects"
                                value={analytics.overview.total_projects}
                                icon="📊"
                                color="blue"
                            />
                            <StatCard
                                title="Active Projects"
                                value={analytics.overview.active_projects}
                                icon="🚀"
                                color="green"
                            />
                            <StatCard
                                title="Total Users"
                                value={analytics.overview.total_users}
                                icon="👥"
                                color="purple"
                            />
                            <StatCard
                                title="Total Tasks"
                                value={analytics.overview.total_tasks}
                                icon="✅"
                                color="orange"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Projects by Status */}
                            <div className="bg-white  rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects by Status</h3>
                                <div className="space-y-3">
                                    {Object.entries(analytics.projects.by_status).map(([status, count]) => (
                                        <div key={status} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 capitalize">
                                                {status.replace('_', ' ')}
                                            </span>
                                            <div className="flex items-center">
                                                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full"
                                                        style={{ width: `${(count / analytics.overview.total_projects) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-bold text-gray-900 w-8 text-right">{count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tasks Overview */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks Overview</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <TaskStatItem label="Pending" value={analytics.tasks.pending} color="yellow" />
                                    <TaskStatItem label="In Progress" value={analytics.tasks.in_progress} color="blue" />
                                    <TaskStatItem label="Completed" value={analytics.tasks.completed} color="green" />
                                    <TaskStatItem label="Overdue" value={analytics.tasks.overdue} color="red" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Projects by Design Type */}
                            {Object.keys(analytics.projects.by_type).length > 0 && (
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects by Design Type</h3>
                                    <div className="space-y-2">
                                        {Object.entries(analytics.projects.by_type)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([type, count]) => (
                                                <div key={type} className="flex justify-between items-center py-2 border-b border-gray-100">
                                                    <span className="text-sm text-gray-700">{type}</span>
                                                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Users by Role */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h3>
                                <div className="space-y-2">
                                    {Object.entries(analytics.users.by_role)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([role, count]) => (
                                            <div key={role} className="flex justify-between items-center py-2 border-b border-gray-100">
                                                <span className="text-sm text-gray-700">{role}</span>
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                                    {count}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="text-4xl font-bold">{analytics.overview.completed_projects}</div>
                                    <div className="text-sm mt-1 opacity-90">Completed Projects</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold">{analytics.overview.posted_projects}</div>
                                    <div className="text-sm mt-1 opacity-90">Posted Projects</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold">{analytics.projects.average_approval_days}</div>
                                    <div className="text-sm mt-1 opacity-90">Avg. Approval Days</div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};

// Helper Components
const StatCard = ({ title, value, icon, color }) => {
    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        purple: 'bg-purple-500',
        orange: 'bg-orange-500'
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`${colorClasses[color]} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

const TaskStatItem = ({ label, value, color }) => {
    const colorClasses = {
        yellow: 'bg-yellow-100 text-yellow-800',
        blue: 'bg-blue-100 text-blue-800',
        green: 'bg-green-100 text-green-800',
        red: 'bg-red-100 text-red-800'
    };

    return (
        <div className={`${colorClasses[color]} rounded-lg p-4 text-center`}>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs mt-1">{label}</div>
        </div>
    );
};

export default Analytics;
