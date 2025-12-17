import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../api/projects';
import Navbar from '../components/layout/Navbar';

const CreateProject = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        project_name: '',
        content_description: '',
        expected_completion_date: ''
    });
    const [contentFile, setContentFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        setContentFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Create project
            const projectData = {
                ...formData,
                expected_completion_date: new Date(formData.expected_completion_date).toISOString()
            };

            const response = await projectsAPI.create(projectData);
            const projectId = response.data.id;

            // Upload content file if provided
            if (contentFile) {
                await projectsAPI.uploadContent(projectId, contentFile);
            }

            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Project</h1>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="card space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project Name *
                        </label>
                        <input
                            type="text"
                            name="project_name"
                            value={formData.project_name}
                            onChange={handleChange}
                            required
                            className="input-field"
                            placeholder="Enter project name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content Description *
                        </label>
                        <textarea
                            name="content_description"
                            value={formData.content_description}
                            onChange={handleChange}
                            required
                            rows={4}
                            className="input-field"
                            placeholder="Describe the content and requirements"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expected Completion Date *
                        </label>
                        <input
                            type="date"
                            name="expected_completion_date"
                            value={formData.expected_completion_date}
                            onChange={handleChange}
                            required
                            className="input-field"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content File (Optional)
                        </label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="input-field"
                        />
                        {contentFile && (
                            <p className="mt-2 text-sm text-gray-600">
                                Selected: {contentFile.name}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex-1"
                        >
                            {loading ? 'Creating...' : 'Create Project'}
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
            </div>
        </div>
    );
};

export default CreateProject;
