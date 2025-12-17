import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsAPI } from '../api/projects';
import Navbar from '../components/layout/Navbar';
import ProjectCard from '../components/project/ProjectCard';
import Loading from '../components/common/Loading';
import { ROLES } from '../utils/constants';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await projectsAPI.getAll();
            setProjects(response.data);
        } catch (err) {
            setError('Failed to load projects');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getActionButton = () => {
        switch (user?.role) {
            case ROLES.DIGITAL_MARKETER:
                return (
                    <button
                        onClick={() => navigate('/create-project')}
                        className="btn-primary"
                    >
                        + Create New Project
                    </button>
                );
            case ROLES.DESIGNER:
                return (
                    <button
                        onClick={() => navigate('/upload-design')}
                        className="btn-primary"
                    >
                        Upload Design
                    </button>
                );
            case ROLES.ADMIN:
                return (
                    <button
                        onClick={() => navigate('/user-management')}
                        className="btn-primary"
                    >
                        Manage Users
                    </button>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

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
                        {projects.length === 0 ? (
                            <div className="text-center py-12">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {user?.role === ROLES.DIGITAL_MARKETER
                                        ? 'Get started by creating a new project.'
                                        : 'No projects available at the moment.'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {projects.map((project) => (
                                    <ProjectCard key={project.id} project={project} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
