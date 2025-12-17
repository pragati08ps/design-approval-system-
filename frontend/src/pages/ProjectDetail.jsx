import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsAPI } from '../api/projects';
import { uploadsAPI } from '../api/uploads';
import { remarksAPI } from '../api/remarks';
import Navbar from '../components/layout/Navbar';
import StatusBadge from '../components/workflow/StatusBadge';
import Loading from '../components/common/Loading';
import { STAGE_NAMES, API_BASE_URL } from '../utils/constants';

const ProjectDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [versions, setVersions] = useState([]);
    const [remarks, setRemarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [remarkText, setRemarkText] = useState('');
    const [showRemarkModal, setShowRemarkModal] = useState(false);
    const [actionType, setActionType] = useState('');

    useEffect(() => {
        fetchProjectData();
    }, [id]);

    const fetchProjectData = async () => {
        try {
            const [projectRes, versionsRes, remarksRes] = await Promise.all([
                projectsAPI.getById(id),
                uploadsAPI.getVersions(id),
                remarksAPI.getByProject(id)
            ]);

            setProject(projectRes.data);
            setVersions(versionsRes.data);
            setRemarks(remarksRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const canApprove = () => {
        const stage = project?.current_stage;
        const role = user?.role;

        if (stage === 'graphic_designer' && role === 'Graphic Designer') return true;
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
                                                <a
                                                    href={`${API_BASE_URL}/uploads/preview/${version.file_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn-secondary text-sm"
                                                >
                                                    Preview
                                                </a>
                                                <a
                                                    href={`${API_BASE_URL}/uploads/${version.file_id}`}
                                                    download
                                                    className="btn-primary text-sm"
                                                >
                                                    Download
                                                </a>
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
        </div>
    );
};

export default ProjectDetail;
