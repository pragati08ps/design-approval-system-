import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsAPI } from '../api/projects';
import { tasksAPI } from '../api/tasks';
import Navbar from '../components/layout/Navbar';
import ProjectCard from '../components/project/ProjectCard';
import Loading from '../components/common/Loading';
import TaskDetailModal from '../components/task/TaskDetailModal';
import TaskReminders from '../components/task/TaskReminders';
import { ROLES } from '../utils/constants';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskDetail, setShowTaskDetail] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [projectsRes, tasksRes] = await Promise.all([
                projectsAPI.getAll(),
                tasksAPI.getAll()
            ]);
            setProjects(projectsRes.data);
            setTasks(tasksRes.data);
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setShowTaskDetail(true);
    };

    const getActionButton = () => {
        switch (user?.role) {
            case ROLES.DESIGNER:
                return (
                    <button
                        onClick={() => document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth' })}
                        className="btn-primary"
                    >
                        + Create Task
                    </button>
                );
            case ROLES.ADMIN:
            case ROLES.MANAGER:
            case ROLES.PYTHON_DEVELOPER:
                return (
                    <button
                        onClick={() => navigate('/create-project')}
                        className="btn-primary"
                    >
                        + Create New Project
                    </button>
                );
            default:
                return null;
        }
    };

    const showQuickActions = [ROLES.ADMIN, ROLES.MANAGER, ROLES.PYTHON_DEVELOPER].includes(user?.role);
    const isRegularUser = ![ROLES.ADMIN, ROLES.MANAGER, ROLES.PYTHON_DEVELOPER].includes(user?.role);

    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const upcomingTasks = tasks
        .filter(t => new Date(t.due_date) >= new Date() && t.status !== 'completed')
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Task Reminders - Persistent Banner */}
            <TaskReminders
                tasks={tasks}
                currentUser={user}
                onTaskClick={handleTaskClick}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600 mt-1">
                            Welcome back, {user?.name}
                        </p>
                    </div>
                    {getActionButton()}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <Loading />
                ) : (
                    <>
                        {/* Quick Actions for Admin/Manager */}
                        {showQuickActions && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <QuickActionCard
                                    title="Analytics"
                                    description="View system analytics and metrics"
                                    icon="📊"
                                    color="blue"
                                    onClick={() => navigate('/analytics')}
                                />
                                <QuickActionCard
                                    title="Tasks"
                                    description="Manage tasks and assignments"
                                    icon="✅"
                                    color="green"
                                    onClick={() => navigate('/tasks')}
                                />
                                <QuickActionCard
                                    title="Calendar"
                                    description="View events and deadlines"
                                    icon="📅"
                                    color="purple"
                                    onClick={() => navigate('/calendar')}
                                />
                                {user?.role === ROLES.ADMIN && (
                                    <QuickActionCard
                                        title="User Management"
                                        description="Manage system users"
                                        icon="👥"
                                        color="orange"
                                        onClick={() => navigate('/user-management')}
                                    />
                                )}
                            </div>
                        )}

                        {/* Enhanced Dashboard for Regular Users */}
                        {isRegularUser && (
                            <div className="space-y-6 mb-8">
                                {/* Quick Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <StatCard
                                        title="Pending Tasks"
                                        value={pendingTasks.length}
                                        icon="📝"
                                        color="yellow"
                                        onClick={() => navigate('/tasks')}
                                    />
                                    <StatCard
                                        title="Completed Tasks"
                                        value={completedTasks.length}
                                        icon="✅"
                                        color="green"
                                        onClick={() => navigate('/tasks')}
                                    />
                                    <StatCard
                                        title="Active Projects"
                                        value={projects.filter(p => p.current_stage !== 'completed').length}
                                        icon="🎨"
                                        color="blue"
                                    />
                                    <StatCard
                                        title="Calendar"
                                        icon="📅"
                                        color="purple"
                                        onClick={() => navigate('/calendar')}
                                        showValue={false}
                                    />
                                </div>

                                {/* Upcoming Tasks Section */}
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                            <span className="text-2xl">⏰</span> Upcoming Tasks
                                        </h2>
                                        <button
                                            onClick={() => navigate('/tasks')}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                                        >
                                            View All →
                                        </button>
                                    </div>
                                    {upcomingTasks.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No upcoming tasks</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {upcomingTasks.map(task => (
                                                <div
                                                    key={task.id}
                                                    onClick={() => handleTaskClick(task)}
                                                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition cursor-pointer"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-gray-900">{task.title}</h3>
                                                            {task.description && (
                                                                <p className="text-sm text-gray-600 mt-1">{task.description.substring(0, 100)}...</p>
                                                            )}
                                                        </div>
                                                        <span className={`ml-3 px-3 py-1 text-xs font-bold rounded-full ${task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                                            task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-green-100 text-green-800'
                                                            }`}>
                                                            {task.priority}
                                                        </span>
                                                    </div>

                                                    {/* Assignment Details */}
                                                    <div className="bg-gray-50 rounded p-2 mb-2 text-xs text-gray-700 grid grid-cols-2 gap-2">
                                                        <div>
                                                            <span className="font-semibold block text-gray-500">Assigned By:</span>
                                                            {task.created_by_name || 'Unknown'}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold block text-gray-500">Assigned To:</span>
                                                            {task.assigned_to_names?.join(', ') || 'Unassigned'}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                                                        <span className="flex items-center gap-1 font-medium text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                                                            <span>📅</span>
                                                            {new Date(task.due_date).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                            <span className="mx-1">•</span>
                                                            {new Date(task.due_date).toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}
                                                        </span>
                                                        {task.project_name && (
                                                            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-semibold">
                                                                🎨 {task.project_name}
                                                            </span>
                                                        )}
                                                        {task.design_type && (
                                                            <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-semibold">
                                                                ✨ {task.design_type.charAt(0).toUpperCase() + task.design_type.slice(1)}
                                                            </span>
                                                        )}
                                                        {task.filename && (
                                                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">
                                                                ✓ File Uploaded
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Projects Section */}
                        <div id="projects-section">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {isRegularUser ? 'My Projects' : 'All Projects'}
                                </h2>
                                {projects.length > 0 && (
                                    <span className="text-gray-600 text-sm">
                                        {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                                    </span>
                                )}
                            </div>

                            {projects.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                                    <div className="text-6xl mb-4">📂</div>
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Projects Yet</h3>
                                    <p className="text-gray-500">
                                        {showQuickActions
                                            ? 'Create your first project to get started!'
                                            : 'You will see projects here when they are assigned to you.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {projects.map((project) => (
                                        <ProjectCard key={project.id} project={project} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Task Detail Modal with File Upload */}
            {showTaskDetail && selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setShowTaskDetail(false)}
                    onUpdate={fetchData}
                    currentUser={user}
                />
            )}
        </div>
    );

};

// Quick Action Card Component
const QuickActionCard = ({ title, description, icon, color, onClick }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
        green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
        purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
        orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
    };

    return (
        <div
            onClick={onClick}
            className={`bg-gradient-to-br ${colorClasses[color]} text-white rounded-lg p-6 cursor-pointer transform hover:scale-105 transition shadow-lg`}
        >
            <div className="text-4xl mb-3">{icon}</div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-sm opacity-90">{description}</p>
        </div>
    );
};

// Stat Card Component for Regular Users
const StatCard = ({ title, value, icon, color, onClick, showValue = true }) => {
    const colorClasses = {
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        green: 'bg-green-50 border-green-200 text-green-800',
        blue: 'bg-blue-50 border-blue-200 text-blue-800',
        purple: 'bg-purple-50 border-purple-200 text-purple-800',
    };

    return (
        <div
            onClick={onClick}
            className={`${colorClasses[color]} border-2 rounded-lg p-5 ${onClick ? 'cursor-pointer hover:shadow-lg transform hover:scale-105' : ''} transition`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold opacity-75">{title}</p>
                    {showValue && <p className="text-3xl font-bold mt-2">{value}</p>}
                    {!showValue && <p className="text-sm font-semibold mt-2">View Schedule</p>}
                </div>
                <div className="text-4xl">{icon}</div>
            </div>
        </div>
    );
};

export default Dashboard;
