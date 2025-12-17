import { useNavigate } from 'react-router-dom';
import StatusBadge from '../workflow/StatusBadge';

const ProjectCard = ({ project }) => {
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div
            className="card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/project/${project.id}`)}
        >
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {project.project_name}
                </h3>
                <StatusBadge stage={project.current_stage} />
            </div>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {project.content_description}
            </p>

            <div className="space-y-2 text-sm">
                {project.design_type && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-medium text-gray-900">{project.design_type}</span>
                    </div>
                )}

                <div className="flex justify-between">
                    <span className="text-gray-500">Created by:</span>
                    <span className="font-medium text-gray-900">{project.digital_marketer_name}</span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-500">Expected:</span>
                    <span className="font-medium text-gray-900">
                        {formatDate(project.expected_completion_date)}
                    </span>
                </div>

                {project.posted && (
                    <div className="pt-2 border-t">
                        <span className="badge bg-purple-100 text-purple-800">Posted</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectCard;
