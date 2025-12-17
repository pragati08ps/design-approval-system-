import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../api/projects';
import Navbar from '../components/layout/Navbar';
import { DESIGN_TYPES } from '../utils/constants';

const UploadDesign = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [designType, setDesignType] = useState('');
    const [designFile, setDesignFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await projectsAPI.getAll();
            // Filter projects in designer stage
            const designerProjects = response.data.filter(p => p.current_stage === 'designer');
            setProjects(designerProjects);
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileChange = (e) => {
        setDesignFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await projectsAPI.uploadDesign(selectedProject, designType, designFile);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to upload design');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Design</h1>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {projects.length === 0 ? (
                    <div className="card text-center">
                        <p className="text-gray-600">No projects awaiting design upload.</p>
                        <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">
                            Back to Dashboard
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="card space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Project *
                            </label>
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                required
                                className="input-field"
                            >
                                <option value="">Choose a project</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.project_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Design Type *
                            </label>
                            <select
                                value={designType}
                                onChange={(e) => setDesignType(e.target.value)}
                                required
                                className="input-field"
                            >
                                <option value="">Select design type</option>
                                {DESIGN_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Design File *
                            </label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                required
                                className="input-field"
                            />
                            {designFile && (
                                <p className="mt-2 text-sm text-gray-600">
                                    Selected: {designFile.name} ({(designFile.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex-1"
                            >
                                {loading ? 'Uploading...' : 'Upload Design'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default UploadDesign;
