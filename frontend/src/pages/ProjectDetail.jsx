import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsAPI } from '../api/projects';
import { uploadsAPI } from '../api/uploads';
import { remarksAPI } from '../api/remarks';
import { tasksAPI } from '../api/tasks';
import { usersAPI } from '../api/users';
import Navbar from '../components/layout/Navbar';
import StatusBadge from '../components/workflow/StatusBadge';
import Loading from '../components/common/Loading';
import TaskDetailModal from '../components/task/TaskDetailModal';
import MultiSelect from '../components/common/MultiSelect';
import { downloadFile, previewFile } from '../utils/fileUtils';
import { STAGE_NAMES, API_BASE_URL, ROLES, DESIGN_TYPES, LOGO_CHECKPOINTS } from '../utils/constants';

const ProjectDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [versions, setVersions] = useState([]);
    const [remarks, setRemarks] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [remarkText, setRemarkText] = useState('');
    const [showRemarkModal, setShowRemarkModal] = useState(false);
    const [actionType, setActionType] = useState('');
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [downloadingFileId, setDownloadingFileId] = useState(null);
    const [previewingFileId, setPreviewingFileId] = useState(null);
    const [taskFormData, setTaskFormData] = useState({
        title: '',
        description: '',
        assigned_to: [], // Changed to array for multi-select
        due_date: '',
        priority: 'medium',
        allocated_hours: '',
        design_type: '',
        checkpoints: []
    });

    useEffect(() => {
        fetchProjectData();
    }, [id]);

    const fetchProjectData = async () => {
        try {
            const promises = [
                projectsAPI.getById(id),
                uploadsAPI.getVersions(id),
                remarksAPI.getByProject(id),
                tasksAPI.getAll(),
                usersAPI.getAll() // All users can create tasks, so fetch user list
            ];

            const results = await Promise.all(promises);

            setProject(results[0].data);
            setVersions(results[1].data);
            setRemarks(results[2].data);

            // Filter tasks for this project
            const allTasks = results[3].data;
            const projectTasks = allTasks.filter(task => task.project_id === id);
            setTasks(projectTasks);

            // Set users
            setUsers(results[4].data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const canApprove = () => {
        const stage = project?.current_stage;
        const role = user?.role;

        if (stage === 'frontend_developer' && role === 'Frontend Developer') return true;
        if (stage === 'manager' && role === 'Manager') return true;
        if (stage === 'admin' && role === 'Admin') return true;
        if (stage === 'client' && role === 'Client') return true;

        return false;
    };

    const handleApproveReject = async (action) => {
        setActionType(action);
        if (action === 'reject') {
            setShowRemarkModal(true);
        } else {
            await performAction(action, null);
        }
    };

    const performAction = async (action, remark) => {
        setActionLoading(true);
        try {
            await projectsAPI.approveOrReject(id, action, remark);
            setShowRemarkModal(false);
            setRemarkText('');
            fetchProjectData();
        } catch (err) {
            alert(err.response?.data?.detail || 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddRemark = async () => {
        if (!remarkText.trim()) return;

        try {
            await remarksAPI.add({ project_id: id, remark_text: remarkText });
            setRemarkText('');
            fetchProjectData();
        } catch (err) {
            alert('Failed to add remark');
        }
    };

    const handlePostingUpdate = async (posted) => {
        try {
            await projectsAPI.updatePosting(id, posted);
            fetchProjectData();
        } catch (err) {
            alert('Failed to update posting status');
        }
    };

    const handleCreateTask = () => {
        setTaskFormData({
            title: '',
            description: '',
            assigned_to: [],
            due_date: '',
            priority: 'medium',
            allocated_hours: '',
            design_type: '',
            checkpoints: []
        });
        setShowTaskModal(true);
    };

    const handleTaskFormChange = (e) => {
        setTaskFormData({
            ...taskFormData,
            [e.target.name]: e.target.value
        });
    };

    const handleTaskSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...taskFormData,
                project_id: id,
                due_date: new Date(taskFormData.due_date).toISOString(),
                allocated_hours: taskFormData.allocated_hours ? parseFloat(taskFormData.allocated_hours) : null
            };
            console.log("Submitting Task Payload:", payload);

            await tasksAPI.create(payload);
            setShowTaskModal(false);
            fetchProjectData();
        } catch (err) {
            console.error("Task Creation Error:", err);
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'object' ? JSON.stringify(detail) : (detail || 'Failed to create task');
            alert(`Error: ${message}`);
        }
    };

    const handleTaskStatusUpdate = async (taskId, newStatus) => {
        try {
            await tasksAPI.update(taskId, { status: newStatus });
            fetchProjectData();
        } catch (err) {
            alert('Failed to update task status');
        }
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setShowTaskDetailModal(true);
    };

    const handleFileDownload = async (fileId, filename) => {
        setDownloadingFileId(fileId);
        try {
            await downloadFile(fileId, filename);
        } catch (err) {
            console.error('Download failed:', err);
        } finally {
            setDownloadingFileId(null);
        }
    };

    const handleFilePreview = async (fileId, filename) => {
        setPreviewingFileId(fileId);
        try {
            await previewFile(fileId, filename);
        } catch (err) {
            console.error('Preview failed:', err);
        } finally {
            setPreviewingFileId(null);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <Loading />;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button onClick={() => navigate('/dashboard')} className="btn-secondary mb-6">
                    ← Back to Dashboard
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Project Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card">
                            <div className="flex justify-between items-start mb-4">
                                <h1 className="text-2xl font-bold text-gray-900">{project.project_name}</h1>
                                <StatusBadge stage={project.current_stage} />
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm text-gray-500">Description:</span>
                                    <p className="text-gray-900 mt-1">{project.content_description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm text-gray-500">Created by:</span>
                                        <p className="font-medium">{project.digital_marketer_name}</p>
                                    </div>

                                    {project.design_type && (
                                        <div>
                                            <span className="text-sm text-gray-500">Design Type:</span>
                                            <p className="font-medium">{project.design_type}</p>
                                        </div>
                                    )}

                                    <div>
                                        <span className="text-sm text-gray-500">Expected Date:</span>
                                        <p className="font-medium">{formatDate(project.expected_completion_date)}</p>
                                    </div>

                                    {project.actual_completion_date && (
                                        <div>
                                            <span className="text-sm text-gray-500">Completed Date:</span>
                                            <p className="font-medium">{formatDate(project.actual_completion_date)}</p>
                                        </div>
                                    )}
                                </div>

                                {project.current_stage === 'completed' && (
                                    <div className="pt-4 border-t">
                                        <label className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={project.posted}
                                                onChange={(e) => handlePostingUpdate(e.target.checked)}
                                                className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
                                            />
                                            <span className="font-medium text-gray-900">Mark as Posted</span>
                                        </label>
                                    </div>
                                )}
                            </div>

                            {canApprove() && (
                                <div className="mt-6 pt-6 border-t flex gap-4">
                                    <button
                                        onClick={() => handleApproveReject('approve')}
                                        disabled={actionLoading}
                                        className="btn-success flex-1"
                                    >
                                        ✓ Approve
                                    </button>
                                    <button
                                        onClick={() => handleApproveReject('reject')}
                                        disabled={actionLoading}
                                        className="btn-danger flex-1"
                                    >
                                        ✗ Reject
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* File Versions */}
                        <div className="card">
                            <h2 className="text-lg font-semibold mb-4">File Versions</h2>
                            {versions.length === 0 ? (
                                <p className="text-gray-500">No files uploaded yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {versions.map((version) => (
                                        <div key={version.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{version.filename}</p>
                                                <p className="text-sm text-gray-500">
                                                    Version {version.version} • {version.uploader_name} • {formatDate(version.uploaded_at)}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleFilePreview(version.file_id, version.filename)}
                                                    disabled={previewingFileId === version.file_id}
                                                    className="btn-secondary text-sm"
                                                >
                                                    {previewingFileId === version.file_id ? 'Opening...' : '👁️ Preview'}
                                                </button>
                                                <button
                                                    onClick={() => handleFileDownload(version.file_id, version.filename)}
                                                    disabled={downloadingFileId === version.file_id}
                                                    className="btn-primary text-sm"
                                                >
                                                    {downloadingFileId === version.file_id ? 'Downloading...' : '⬇️ Download'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Tasks Section */}
                        <div className="card">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">Project Tasks</h2>
                                <button
                                    onClick={handleCreateTask}
                                    className="btn-primary text-sm"
                                >
                                    + Add Task
                                </button>
                            </div>

                            {/* Task Assignments Summary */}
                            {tasks.length > 0 && (
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
                                    <h3 className="text-md font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="text-xl">👥</span> Task Assignments Overview
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {tasks.map(task => (
                                            <div
                                                key={task.id}
                                                onClick={() => handleTaskClick(task)}
                                                className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-200"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="text-sm font-semibold text-gray-900 flex-1 truncate">
                                                        {task.title}
                                                    </div>
                                                    <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                            task.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {task.status === 'in_progress' ? (task.is_timer_running ? '⚡ Active' : 'In Progress') :
                                                            task.status === 'completed' ? 'Done' :
                                                                task.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                                                    </span>
                                                    {task.is_timer_running && (
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <span className="text-gray-600">👤</span>
                                                        <span className="font-semibold text-blue-900">{task.assigned_to_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <span className="text-gray-600">📅</span>
                                                        <span className="font-semibold text-red-800">
                                                            {new Date(task.due_date).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <span className="text-gray-600">⏰</span>
                                                        <span className="font-semibold text-red-700">
                                                            {new Date(task.due_date).toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {tasks.length === 0 ? (
                                <p className="text-gray-500">No tasks for this project yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            onClick={() => handleTaskClick(task)}
                                            className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                                                    {task.description && (
                                                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                                    )}
                                                    {task.filename && (
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                                                                ✓ File Uploaded
                                                            </span>
                                                            <span className="text-xs text-gray-500">{task.filename}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                                    task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            </div>

                                            {task.is_timer_running && (
                                                <div className="flex items-center gap-2 mb-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold w-fit animate-pulse border border-green-200">
                                                    <span>⚡ Timer Running...</span>
                                                </div>
                                            )}

                                            {/* Enhanced Assignment & Due Date Display */}
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <div className="text-xs text-gray-600 mb-1">👤 Assigned To</div>
                                                        <div className="font-bold text-blue-900">{task.assigned_to_name}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-600 mb-1">⏰ Due Date & Time</div>
                                                        <div className="font-bold text-red-900">
                                                            {new Date(task.due_date).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </div>
                                                        <div className="text-sm font-semibold text-red-700">
                                                            {new Date(task.due_date).toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <select
                                                        value={task.status}
                                                        onChange={(e) => handleTaskStatusUpdate(task.id, e.target.value)}
                                                        className={`px-2 py-1 text-xs font-semibold rounded border-0 ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                                task.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleTaskClick(task);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 font-semibold"
                                                >
                                                    View Details →
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Remarks Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="card sticky top-8">
                            <h2 className="text-lg font-semibold mb-4">Remarks & Feedback</h2>

                            {/* Add Remark */}
                            <div className="mb-4">
                                <textarea
                                    value={remarkText}
                                    onChange={(e) => setRemarkText(e.target.value)}
                                    placeholder="Add a remark..."
                                    rows={3}
                                    className="input-field"
                                />
                                <button
                                    onClick={handleAddRemark}
                                    disabled={!remarkText.trim()}
                                    className="btn-primary w-full mt-2"
                                >
                                    Add Remark
                                </button>
                            </div>

                            {/* Remarks List */}
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {remarks.length === 0 ? (
                                    <p className="text-sm text-gray-500">No remarks yet</p>
                                ) : (
                                    remarks.map((remark) => (
                                        <div key={remark.id} className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900">{remark.user_name}</p>
                                                    <p className="text-xs text-gray-500">{remark.user_role}</p>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {formatDate(remark.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700">{remark.remark_text}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                At stage: {STAGE_NAMES[remark.stage]}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reject Modal */}
            {showRemarkModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Reject with Remark</h3>
                        <textarea
                            value={remarkText}
                            onChange={(e) => setRemarkText(e.target.value)}
                            placeholder="Please provide a reason for rejection..."
                            rows={4}
                            className="input-field mb-4"
                        />
                        <div className="flex gap-4">
                            <button
                                onClick={() => performAction('reject', remarkText)}
                                disabled={!remarkText.trim() || actionLoading}
                                className="btn-danger flex-1"
                            >
                                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowRemarkModal(false);
                                    setRemarkText('');
                                }}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Add Task to Project</h3>
                        <form onSubmit={handleTaskSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={taskFormData.title}
                                        onChange={handleTaskFormChange}
                                        required
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        value={taskFormData.description}
                                        onChange={handleTaskFormChange}
                                        rows={3}
                                        className="input-field"
                                    />
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Design Type</label>
                                    <select
                                        name="design_type"
                                        value={taskFormData.design_type}
                                        onChange={handleTaskFormChange}
                                        required
                                        className="input-field"
                                    >
                                        <option value="">Select Design Type</option>
                                        {DESIGN_TYPES.map(type => (
                                            <option key={type} value={type}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {taskFormData.design_type === 'logo' && (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <label className="block text-sm font-semibold text-blue-900 mb-2">Logo Requirements (Checklist for Designer)</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {LOGO_CHECKPOINTS.map(cp => (
                                                <label key={cp} className="flex items-center space-x-2 text-sm text-blue-800 cursor-pointer hover:bg-blue-100 p-1 rounded transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={taskFormData.checkpoints.some(c => c.title === cp)}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            setTaskFormData(prev => ({
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To (Select Multiple)</label>
                                    <MultiSelect
                                        options={users.map(u => ({ value: u.id, label: `${u.name} (${u.role})` }))}
                                        value={taskFormData.assigned_to}
                                        onChange={(selectedIds) => setTaskFormData({ ...taskFormData, assigned_to: selectedIds })}
                                        placeholder="Select one or more users..."
                                    />
                                </div>


                                <div>
                                    <input
                                        type="date"
                                        name="due_date"
                                        value={taskFormData.due_date}
                                        onChange={handleTaskFormChange}
                                        required
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Allocated Time (Hours)</label>
                                    <input
                                        type="number"
                                        name="allocated_hours"
                                        value={taskFormData.allocated_hours}
                                        onChange={handleTaskFormChange}
                                        placeholder="e.g. 2.5"
                                        step="0.5"
                                        min="0"
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select
                                        name="priority"
                                        value={taskFormData.priority}
                                        onChange={handleTaskFormChange}
                                        className="input-field"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button type="submit" className="btn-primary flex-1">
                                    Create Task
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowTaskModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Detail Modal */}
            {showTaskDetailModal && selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setShowTaskDetailModal(false)}
                    onUpdate={fetchProjectData}
                    currentUser={user}
                />
            )}
        </div>
    );
};

export default ProjectDetail;
