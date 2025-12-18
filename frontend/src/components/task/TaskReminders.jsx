import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TaskReminders = ({ tasks, currentUser, onTaskClick }) => {
    const [urgentTasks, setUrgentTasks] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Filter tasks that are due within 2 days and not completed
        // removed localStorage dismissal logic
        const now = new Date();
        const twoDaysFromNow = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000));

        const urgent = tasks.filter(task => {
            const dueDate = new Date(task.due_date);
            // Show any task that is pending and due soon, OR overdue
            // "Until the task is completed" implies overdue should also show
            const isDueOrOverdue = dueDate <= twoDaysFromNow;
            const isNotCompleted = task.status !== 'completed' && task.status !== 'cancelled';

            return isDueOrOverdue && isNotCompleted;
        });

        // Sort by due date
        urgent.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

        setUrgentTasks(urgent);
    }, [tasks]);

    if (urgentTasks.length === 0) {
        return null;
    }

    return (
        <div className="bg-red-50 border-b border-red-200 shadow-sm relative z-30 animate-slideDown">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start md:items-center gap-3">
                        <span className="text-2xl pt-1 md:pt-0">⚠️</span>
                        <div>
                            <h3 className="text-lg font-bold text-red-800">
                                Outstanding Urgent Tasks
                            </h3>
                            <p className="text-sm text-red-600">
                                You have {urgentTasks.length} task{urgentTasks.length !== 1 ? 's' : ''} that require{urgentTasks.length === 1 ? 's' : ''} immediate attention.
                                This alert will remain until completion.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                        {urgentTasks.slice(0, 3).map(task => (
                            <button
                                key={task.id}
                                onClick={() => onTaskClick(task)}
                                title={`Assigned By: ${task.created_by_name || 'Unknown'}\nAssigned To: ${task.assigned_to_names?.join(', ') || 'Unassigned'}`}
                                className="flex items-center gap-2 bg-white border border-red-200 text-red-700 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
                            >
                                <span className="truncate max-w-[150px]">{task.title}</span>
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                    {new Date(task.due_date) < new Date() ? 'Overdue' : 'Due Soon'}
                                </span>
                            </button>
                        ))}
                        {urgentTasks.length > 3 && (
                            <button
                                onClick={() => navigate('/tasks')}
                                className="text-sm font-medium text-red-700 hover:text-red-900 underline px-2"
                            >
                                + {urgentTasks.length - 3} more
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <style jsx>{`
                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default TaskReminders;
