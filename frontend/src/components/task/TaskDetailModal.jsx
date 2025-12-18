import { useState, useEffect, useRef } from 'react';
import { tasksAPI } from '../../api/tasks';
import { usersAPI } from '../../api/users';
import MultiSelect from '../common/MultiSelect';
import { downloadFile, previewFile } from '../../utils/fileUtils';

const TaskDetailModal = ({ task, onClose, onUpdate, currentUser }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [downloading, setDownloading] = useState(false);

    const [previewing, setPreviewing] = useState(false);

    // Timer State
    const [timeLeft, setTimeLeft] = useState(null);
    const timerRef = useRef(null);

    // Calculate time left
    const calculateTimeLeft = () => {
        if (!task.allocated_hours) return null;

        const totalAllocatedMs = task.allocated_hours * 60 * 60 * 1000;
        let elapsedMs = task.time_spent_ms || 0;

        if (task.is_timer_running && task.start_time) {
            const startTime = new Date(task.start_time).getTime();
            const now = new Date().getTime();
            elapsedMs += (now - startTime);
        }

        const remaining = totalAllocatedMs - elapsedMs;
        return remaining > 0 ? remaining : 0;
    };

    // Initialize timer
    useEffect(() => {
        // Initial calculation
        setTimeLeft(calculateTimeLeft());

        if (task.is_timer_running && task.status !== 'completed') {
            // Start interval to update visibly
            timerRef.current = setInterval(() => {
                const remaining = calculateTimeLeft();
                setTimeLeft(remaining);
                if (remaining <= 0) {
                    clearInterval(timerRef.current);
                }
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [task.is_timer_running, task.time_spent_ms, task.start_time, task.status]);

    // Format time helper
    const formatTime = (ms) => {
        if (ms === null) return '--:--:--';
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleStartTask = async () => {
        setUploading(true);
        try {
            await tasksAPI.toggleTimer(task.id, 'start');
            onUpdate(); // refresh task data
        } catch (err) {
            setUploadError('Failed to start timer');
        } finally {
            setUploading(false);
        }
    };

    const handlePauseTask = async () => {
        setUploading(true);
        try {
            await tasksAPI.toggleTimer(task.id, 'pause');
            onUpdate(); // refresh task data
        } catch (err) {
            setUploadError('Failed to pause timer');
        } finally {
            setUploading(false);
        }
    };

    // Rework / Reassignment State
    const [reworkMode, setReworkMode] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [reworkData, setReworkData] = useState({
        remarks: '',
        reassign_to: [],
        due_date: ''
    });

    // Check if current user is Admin or Manager
    const isAdminOrManager = ['Admin', 'Manager'].includes(currentUser?.role);

    // Fetch users if Admin/Manager
    useState(() => {
        if (isAdminOrManager) {
            usersAPI.getAll().then(res => {
                setAllUsers(res.data);
            }).catch(err => console.error("Failed to fetch users", err));
        }
    }, [currentUser]);

    // Initialize rework data when entering rework mode
    const initRework = () => {
        const currentAssigned = Array.isArray(task.assigned_to) ? task.assigned_to : [task.assigned_to];
        setReworkData({
            remarks: '',
            reassign_to: currentAssigned,
            due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
        });
        setReworkMode(true);
    };

    const handleReworkSubmit = async () => {
        if (!reworkData.remarks || reworkData.reassign_to.length === 0 || !reworkData.due_date) {
            setUploadError('Please fill in all fields (Remarks, Assign To, Due Date)');
            return;
        }

        setUploading(true);
        try {
            // Append remarks to description to keep history
            const timestamp = new Date().toLocaleString();
            const newDescription = `[REWORK REQUESTED - ${timestamp}]\nRemarks: ${reworkData.remarks}\n\n---\n${task.description || ''}`;

            await tasksAPI.update(task.id, {
                status: 'pending', // Reset status to pending
                assigned_to: reworkData.reassign_to,
                due_date: new Date(reworkData.due_date).toISOString(),
                description: newDescription,
                priority: task.priority // Keep same priority or allow change? Keeping same for now.
            });

            setUploadSuccess('Task reassigned for rework successfully');
            setTimeout(() => {
                onUpdate();
                onClose();
            }, 1000);
        } catch (err) {
            setUploadError(err.response?.data?.detail || 'Failed to submit rework');
        } finally {
            setUploading(false);
        }
    };

    // Check if current user can upload - handle both array and string for assigned_to
    const assignedToArray = Array.isArray(task.assigned_to) ? task.assigned_to : [task.assigned_to];
    const isAssignedUser = assignedToArray.includes(currentUser?.id);
    const canUpload = isAssignedUser ||
        task.created_by === currentUser?.id ||
        ['Admin', 'Manager'].includes(currentUser?.role);

    const allCheckpointsCompleted = !task.checkpoints || task.checkpoints.length === 0 || task.checkpoints.every(cp => cp.completed);

    const handleFileSelect = (e) => {
        setSelectedFile(e.target.files[0]);
        setUploadError('');
        setUploadSuccess('');
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            setUploadError('Please select a file first');
            return;
        }

        setUploading(true);
        setUploadError('');
        setUploadSuccess('');

        try {
            await tasksAPI.uploadFile(task.id, selectedFile);
            setUploadSuccess('File uploaded successfully!');
            setSelectedFile(null);
            // Refresh task data
            setTimeout(() => {
                onUpdate();
                setUploadSuccess('');
            }, 2000);
        } catch (err) {
            setUploadError(err.response?.data?.detail || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async () => {
        if (!task.file_id || !task.filename) return;

        setDownloading(true);
        try {
            await downloadFile(task.file_id, task.filename);
        } catch (err) {
            setUploadError('Failed to download file');
        } finally {
            setDownloading(false);
        }
    };

    const handlePreview = async () => {
        if (!task.file_id) return;

        setPreviewing(true);
        try {
            await previewFile(task.file_id, task.filename);
        } catch (err) {
            setUploadError('Failed to preview file');
        } finally {
            setPreviewing(false);
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

    // Get assigned names as array or single string
    const assignedNames = task.assigned_to_names && Array.isArray(task.assigned_to_names)
        ? task.assigned_to_names.join(', ')
        : (task.assigned_to_name || 'Unknown');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 sticky top-0">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-2">{task.title}</h2>
                            <div className="flex flex-wrap gap-2">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                </span>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                                    {task.status.replace('_', ' ')}
                                </span>
                                {task.design_type && (
                                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                        🎨 {task.design_type.charAt(0).toUpperCase() + task.design_type.slice(1)}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 text-2xl font-bold ml-4"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-6">
                    {/* Description */}
                    {task.description && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                            <p className="text-gray-900">{task.description}</p>
                        </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Timer Section - Prominent at top of details */}
                        {task.allocated_hours && (
                            <div className="col-span-2 bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-indigo-900">⏱️ Time Tracking</h3>
                                    <p className="text-xs text-indigo-700">Allocated: {task.allocated_hours} hours</p>
                                </div>

                                <div className="flex items-center gap-4">
                                    {!task.is_timer_running ? (
                                        canUpload ? (
                                            <button
                                                onClick={handleStartTask}
                                                disabled={uploading}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 shadow-sm animate-pulse"
                                            >
                                                {task.time_spent_ms > 0 ? '▶ Resume Timer' : '▶ Start Timer'}
                                            </button>
                                        ) : (
                                            <span className="text-gray-500 font-medium italic">Not Started</span>
                                        )
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <div className={`text-2xl font-mono font-bold ${timeLeft === 0 ? 'text-red-600' :
                                                timeLeft < 3600000 ? 'text-orange-600' : 'text-green-600'
                                                }`}>
                                                {timeLeft === 0 ? 'TIME EXPIRED' : formatTime(timeLeft)}
                                            </div>
                                            {canUpload && (
                                                <button
                                                    onClick={handlePauseTask}
                                                    disabled={uploading}
                                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700 shadow-sm"
                                                >
                                                    ⏸ Pause
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-1">Assigned To</h3>
                            <p className="text-gray-900">{assignedNames}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-1">Created By</h3>
                            <p className="text-gray-900">{task.created_by_name}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-1">Due Date</h3>
                            <p className="text-gray-900">{new Date(task.due_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-1">Created</h3>
                            <p className="text-gray-900">{new Date(task.created_at).toLocaleDateString()}</p>
                        </div>
                        {task.project_name && (
                            <div className="col-span-2">
                                <h3 className="text-sm font-semibold text-gray-700 mb-1">Project</h3>
                                <p className="text-gray-900">{task.project_name}</p>
                            </div>
                        )}
                    </div>

                    {/* Uploaded File */}
                    {task.filename && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-green-900 mb-3">✓ Completed Work Uploaded</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="font-medium text-green-900">{task.filename}</p>
                                    <p className="text-sm text-green-700">
                                        Uploaded: {new Date(task.uploaded_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handlePreview}
                                        disabled={previewing}
                                        className="btn-secondary text-sm flex-1"
                                    >
                                        {previewing ? 'Opening...' : '👁️ Preview'}
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        disabled={downloading}
                                        className="btn-primary text-sm flex-1"
                                    >
                                        {downloading ? 'Downloading...' : '⬇️ Download'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Checklist Section */}
                    {task.checkpoints && task.checkpoints.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                ✅ Mandatory Checklist
                                {allCheckpointsCompleted && (
                                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Completed</span>
                                )}
                            </h3>
                            <div className="space-y-2">
                                {task.checkpoints.map((cp, index) => (
                                    <label key={index} className="flex items-center space-x-3 p-2 hover:bg-white rounded transition-colors cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={cp.completed}
                                            disabled={!canUpload || uploading}
                                            onChange={async (e) => {
                                                const newCheckpoints = [...task.checkpoints];
                                                newCheckpoints[index].completed = e.target.checked;
                                                try {
                                                    await tasksAPI.update(task.id, { checkpoints: newCheckpoints });
                                                    onUpdate();
                                                } catch (err) {
                                                    setUploadError('Failed to update checklist');
                                                }
                                            }}
                                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                        />
                                        <span className={`text-sm ${cp.completed ? 'text-gray-500 line-through' : 'text-gray-900 font-medium'}`}>
                                            {cp.title.charAt(0).toUpperCase() + cp.title.slice(1)}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            {!allCheckpointsCompleted && isAssignedUser && (
                                <p className="mt-3 text-xs text-orange-600 flex items-center gap-1">
                                    ⚠️ Please complete all checklist items before uploading your work.
                                </p>
                            )}
                        </div>
                    )}

                    {/* File Upload Section */}
                    {canUpload && (
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {task.filename ? 'Replace Completed Work' : 'Upload Completed Work'}
                            </h3>

                            {uploadSuccess && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                                    {uploadSuccess}
                                </div>
                            )}

                            {uploadError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                                    {uploadError}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select File (Any format)
                                    </label>
                                    <input
                                        type="file"
                                        onChange={handleFileSelect}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {selectedFile && (
                                        <p className="mt-2 text-sm text-gray-600">
                                            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={handleFileUpload}
                                    disabled={!selectedFile || uploading || !allCheckpointsCompleted}
                                    className={`btn-primary w-full ${(!allCheckpointsCompleted && selectedFile) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {uploading ? 'Uploading...' : task.filename ? 'Replace File' : 'Upload File'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Admin/Manager Rework & Reassign Section */}
                    {isAdminOrManager && task.status === 'completed' && (
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Reassign</h3>

                            {!reworkMode ? (
                                <div className="flex gap-4">
                                    {/* Placeholder for Approve button if needed later */}
                                    <button
                                        onClick={initRework}
                                        className="btn-primary bg-orange-600 hover:bg-orange-700 w-full"
                                    >
                                        Request Rework / Reassign
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
                                    <h4 className="font-semibold text-orange-900">Rework Details</h4>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Feedback</label>
                                        <textarea
                                            value={reworkData.remarks}
                                            onChange={(e) => setReworkData({ ...reworkData, remarks: e.target.value })}
                                            rows={3}
                                            placeholder="Explain what needs to be changed..."
                                            className="input-field"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                                        <MultiSelect
                                            options={allUsers.map(u => ({ value: u.id, label: `${u.name} (${u.role})` }))}
                                            value={reworkData.reassign_to}
                                            onChange={(val) => setReworkData({ ...reworkData, reassign_to: val })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Due Date</label>
                                        <input
                                            type="date"
                                            value={reworkData.due_date}
                                            onChange={(e) => setReworkData({ ...reworkData, due_date: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={handleReworkSubmit}
                                            disabled={uploading}
                                            className="btn-primary bg-orange-600 hover:bg-orange-700 flex-1"
                                        >
                                            {uploading ? 'Processing...' : 'Confirm Rework'}
                                        </button>
                                        <button
                                            onClick={() => setReworkMode(false)}
                                            className="btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end sticky bottom-0">
                    <button onClick={onClose} className="btn-secondary">
                        Close
                    </button>
                </div>
            </div>
        </div >
    );
};

export default TaskDetailModal;
