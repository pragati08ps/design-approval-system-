import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../api/users';
import { tasksAPI } from '../api/tasks';
import { projectsAPI } from '../api/projects';
import Navbar from '../components/layout/Navbar';
import Loading from '../components/common/Loading';
import TaskDetailModal from '../components/task/TaskDetailModal';
import { ROLES, DESIGN_TYPES, LOGO_CHECKPOINTS } from '../utils/constants';

const TaskManagement = () => {
    const { user: currentUser } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assigned_to: '',
        project_id: '',
        due_date: '',
        priority: 'medium',
        design_type: '',
        checkpoints: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tasksRes, usersRes, projectsRes] = await Promise.all([
                tasksAPI.getAll(),
                currentUser.role === 'Admin' ? usersAPI.getAll() : Promise.resolve({ data: [] }),
                projectsAPI.getAll()
            ]);
            setTasks(tasksRes.data);
            setUsers(usersRes.data);
            setProjects(projectsRes.data);
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleCreateTask = () => {
        setEditingTask(null);
        setFormData({
            title: '',
            description: '',
            assigned_to: '',
            project_id: '',
            due_date: '',
            priority: 'medium',
            design_type: '',
            checkpoints: []
        });
        setShowModal(true);
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setFormData({
            title: task.title,
            description: task.description || '',
            assigned_to: task.assigned_to,
            project_id: task.project_id || '',
            due_date: task.due_date.split('T')[0],
            priority: task.priority,
            design_type: task.design_type || '',
            checkpoints: task.checkpoints || []
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            // Convert assigned_to to array if string (for create) or keep as array (for update)
            const assignedToArray = formData.assigned_to
                ? (Array.isArray(formData.assigned_to) ? formData.assigned_to : [formData.assigned_to])
                : [];

            const submitData = {
                ...formData,
                assigned_to: assignedToArray,
                due_date: new Date(formData.due_date).toISOString()
            };

            if (editingTask) {
                await tasksAPI.update(editingTask.id, submitData);
                setSuccess('Task updated successfully!');
            } else {
                await tasksAPI.create(submitData);
                setSuccess('Task created successfully!');
            }

            setShowModal(false);
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save task');
        }
    };

    const handleDeleteTask = async (taskId, taskTitle) => {
        if (!confirm(`Are you sure you want to delete task "${taskTitle}"?`)) {
            return;
        }

        try {
            await tasksAPI.delete(taskId);
            setSuccess('Task deleted successfully!');
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete task');
        }
    };

    const handleUpdateStatus = async (taskId, newStatus) => {
        try {
            await tasksAPI.update(taskId, { status: newStatus });
            setSuccess('Task status updated!');
            fetchData();
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError('Failed to update task status');
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-green-100 text-green-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-orange-100 text-orange-800',
            urgent: 'bg-red-100 text-red-800'
        };
        return colors[priority] || colors.medium;
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-gray-100 text-gray-800',
            in_progress: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || colors.pending;
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setShowDetailModal(true);
    };

    const canManageTasks = ['Admin', 'Manager', 'Digital Marketer'].includes(currentUser?.role);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
                        <p className="text-gray-600 mt-1">Manage and track tasks across projects</p>
                    </div>
                    {canManageTasks && (
                        <button onClick={handleCreateTask} className="btn-primary">
                            + Create New Task
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                        {success}
                    </div>
                )}

                {loading ? (
                    <Loading />
                ) : (
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tasks.map((task) => (
                                        <tr
                                            key={task.id}
                                            onClick={() => handleTaskClick(task)}
                                            className="hover:bg-blue-50 cursor-pointer transition"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                                {task.description && (
                                                    <div className="text-sm text-gray-500">{task.description.substring(0, 50)}{task.description.length > 50 ? '...' : ''}</div>
                                                )}
                                                {task.filename && (
                                                    <div className="text-xs text-green-600 mt-1">✓ File uploaded</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {task.assigned_to_name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {task.project_name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(task.due_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    value={task.status}
                                                    onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                                                    className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${getStatusColor(task.status)}`}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                                {canManageTasks && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditTask(task)}
                                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTask(task.id, task.title)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {tasks.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    No tasks found. {canManageTasks && 'Create your first task to get started.'}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Task Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingTask ? 'Edit Task' : 'Create New Task'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} className="px-6 py-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                                    <select
                                        name="assigned_to"
                                        value={formData.assigned_to}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select User</option>
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Design Type</label>
                                    <select
                                        name="design_type"
                                        value={formData.design_type}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Design Type</option>
                                        {DESIGN_TYPES.map(type => (
                                            <option key={type} value={type}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {formData.design_type === 'logo' && (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <label className="block text-sm font-semibold text-blue-900 mb-2">Logo Requirements (Checklist for Designer)</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {LOGO_CHECKPOINTS.map(cp => (
                                                <label key={cp} className="flex items-center space-x-2 text-sm text-blue-800 cursor-pointer hover:bg-blue-100 p-1 rounded transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.checkpoints.some(c => c.title === cp)}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                checkpoints: checked
                                                                    ? [...prev.checkpoints, { title: cp, completed: false }]
                                                                    : prev.checkpoints.filter(c => c.title !== cp)
                                                            }));
                                                        }}
                                                        className="rounded text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span>{cp.charAt(0).toUpperCase() + cp.slice(1)}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Project (Optional)</label>
                                    <select
                                        name="project_id"
                                        value={formData.project_id}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">No Project</option>
                                        {projects.map((project) => (
                                            <option key={project.id} value={project.id}>
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        name="due_date"
                                        value={formData.due_date}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingTask ? 'Update Task' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Detail Modal */}
            {showDetailModal && selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setShowDetailModal(false)}
                    onUpdate={fetchData}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};

export default TaskManagement;
