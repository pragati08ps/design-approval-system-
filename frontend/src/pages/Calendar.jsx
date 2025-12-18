import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { tasksAPI } from '../api/tasks';
import { projectsAPI } from '../api/projects';
import Navbar from '../components/layout/Navbar';
import Loading from '../components/common/Loading';
import { STAGE_NAMES } from '../utils/constants';

const Calendar = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tasksRes, projectsRes] = await Promise.all([
                tasksAPI.getAll(),
                projectsAPI.getAll()
            ]);
            setTasks(tasksRes.data);
            setProjects(projectsRes.data);
        } catch (err) {
            console.error('Failed to load calendar data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek, year, month };
    };

    const getEventsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];

        const dateTasks = tasks.filter(task => {
            const taskDate = new Date(task.due_date).toISOString().split('T')[0];
            return taskDate === dateStr;
        });

        const dateProjects = projects.filter(project => {
            if (!project.expected_completion_date) return false;
            const projectDate = new Date(project.expected_completion_date).toISOString().split('T')[0];
            return projectDate === dateStr;
        });

        return { tasks: dateTasks, projects: dateProjects };
    };

    const getStageColor = (stage) => {
        const colors = {
            'digital_marketer': 'bg-yellow-100 text-yellow-800',
            'designer': 'bg-blue-100 text-blue-800',
            'graphic_designer': 'bg-purple-100 text-purple-800',
            'manager': 'bg-orange-100 text-orange-800',
            'admin': 'bg-red-100 text-red-800',
            'client': 'bg-green-100 text-green-800',
            'completed': 'bg-emerald-100 text-emerald-800'
        };
        return colors[stage] || 'bg-gray-100 text-gray-800';
    };

    const renderCalendar = () => {
        const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
        const days = [];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        // Empty cells for days before the month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="h-28 bg-gray-50"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const events = getEventsForDate(date);
            const isToday = new Date().toDateString() === date.toDateString();
            const hasEvents = events.tasks.length > 0 || events.projects.length > 0;

            days.push(
                <div
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={`h-28 border border-gray-200 p-2 cursor-pointer hover:bg-blue-50 transition ${isToday ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300' : ''
                        }`}
                >
                    <div className={`text-sm font-bold mb-1 ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                        {day}
                    </div>
                    {hasEvents && (
                        <div className="space-y-0.5 overflow-hidden">
                            {events.tasks.slice(0, 1).map((task, idx) => (
                                <div key={idx} className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded truncate font-medium">
                                    📋 {task.title}
                                </div>
                            ))}
                            {events.projects.slice(0, 1).map((project, idx) => (
                                <div key={idx} className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded truncate font-medium">
                                    🎨 {project.project_name}
                                </div>
                            ))}
                            {(events.tasks.length + events.projects.length) > 2 && (
                                <div className="text-xs text-blue-600 font-semibold">+{events.tasks.length + events.projects.length - 2} more</div>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-5 flex justify-between items-center">
                    <button
                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                        className="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 font-semibold transition"
                    >
                        ← Previous
                    </button>
                    <h2 className="text-2xl font-bold">
                        {monthNames[month]} {year}
                    </h2>
                    <button
                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                        className="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 font-semibold transition"
                    >
                        Next →
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-0">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                        <div key={day} className="bg-gray-100 text-gray-700 font-bold text-sm py-3 px-2 text-center border border-gray-200">
                            {day}
                        </div>
                    ))}
                    {days}
                </div>
            </div>
        );
    };

    const renderSelectedDateDetails = () => {
        if (!selectedDate) return null;

        const events = getEventsForDate(selectedDate);
        const dateStr = selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return (
            <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">📅 Events for {dateStr}</h3>
                    <button
                        onClick={() => setSelectedDate(null)}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                    >
                        ✕
                    </button>
                </div>

                {events.tasks.length === 0 && events.projects.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-gray-500 text-lg">No events on this date</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {events.tasks.length > 0 && (
                            <div>
                                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="text-2xl">📋</span> Tasks ({events.tasks.length})
                                </h4>
                                <div className="space-y-3">
                                    {events.tasks.map(task => (
                                        <div key={task.id} className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-4 hover:shadow-md transition">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="font-semibold text-gray-900 text-lg">{task.title}</div>
                                                    {task.description && (
                                                        <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                                                    )}
                                                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                                        <span className="bg-white px-2 py-1 rounded-full text-gray-700">
                                                            👤 {task.assigned_to_name}
                                                        </span>
                                                        {task.project_name && (
                                                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                                                🎨 {task.project_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                                        task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-green-100 text-green-800'
                                                    }`}>
                                                    {task.priority.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {events.projects.length > 0 && (
                            <div>
                                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="text-2xl">🎨</span> Project Deadlines ({events.projects.length})
                                </h4>
                                <div className="space-y-3">
                                    {events.projects.map(project => (
                                        <div
                                            key={project.id}
                                            onClick={() => navigate(`/project/${project.id}`)}
                                            className="border-l-4 border-purple-500 bg-purple-50 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="font-semibold text-gray-900 text-lg">{project.project_name}</div>
                                                    <div className="text-sm text-gray-600 mt-1">{project.content_description}</div>
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStageColor(project.current_stage)}`}>
                                                            {STAGE_NAMES[project.current_stage] || project.current_stage}
                                                        </span>
                                                        {project.design_type && (
                                                            <span className="px-3 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full font-semibold">
                                                                {project.design_type}
                                                            </span>
                                                        )}
                                                        <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                                                            👤 {project.digital_marketer_name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderProjectWorkflow = () => {
        return (
            <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="text-2xl">🔄</span> All Projects Workflow
                </h3>

                {projects.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📂</div>
                        <p className="text-gray-500 text-lg">No projects available</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {projects.map(project => (
                            <div
                                key={project.id}
                                onClick={() => navigate(`/project/${project.id}`)}
                                className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg text-gray-900">{project.project_name}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{project.content_description}</p>
                                    </div>
                                    <span className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap ${getStageColor(project.current_stage)}`}>
                                        {STAGE_NAMES[project.current_stage] || project.current_stage}
                                    </span>
                                </div>

                                {/* Workflow Progress Bar */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                        <span>Workflow Progress</span>
                                        <span>{getWorkflowProgress(project.current_stage)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                                            style={{ width: `${getWorkflowProgress(project.current_stage)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="bg-gray-100 px-2 py-1 rounded-full text-gray-700">
                                        👤 {project.digital_marketer_name}
                                    </span>
                                    {project.design_type && (
                                        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-semibold">
                                            {project.design_type}
                                        </span>
                                    )}
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        📅 Due: {new Date(project.expected_completion_date).toLocaleDateString()}
                                    </span>
                                    {project.posted && (
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">
                                            ✓ Posted
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const getWorkflowProgress = (stage) => {
        const stages = {
            'digital_marketer': 14,
            'designer': 28,
            'graphic_designer': 42,
            'manager': 57,
            'admin': 71,
            'client': 85,
            'completed': 100
        };
        return stages[stage] || 0;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">📅 Calendar & Project Workflow</h1>
                    <p className="text-gray-600 text-lg">View all tasks, project deadlines, and workflow progress</p>
                </div>

                {loading ? (
                    <Loading />
                ) : (
                    <>
                        {renderCalendar()}
                        {renderSelectedDateDetails()}

                        {/* Upcoming Events Summary */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="text-xl">⏰</span> Upcoming Tasks
                                </h3>
                                <div className="space-y-2">
                                    {tasks
                                        .filter(t => new Date(t.due_date) >= new Date() && t.status !== 'completed')
                                        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                                        .slice(0, 5)
                                        .map(task => (
                                            <div key={task.id} className="text-sm border-b border-gray-100 py-2 hover:bg-gray-50 transition">
                                                <div className="font-semibold text-gray-900">{task.title}</div>
                                                <div className="text-gray-500 text-xs flex items-center gap-2 mt-1">
                                                    <span>📅 {new Date(task.due_date).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>👤 {task.assigned_to_name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    {tasks.filter(t => new Date(t.due_date) >= new Date() && t.status !== 'completed').length === 0 && (
                                        <p className="text-gray-500 text-sm text-center py-4">No upcoming tasks</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="text-xl">🎯</span> Project Deadlines
                                </h3>
                                <div className="space-y-2">
                                    {projects
                                        .filter(p => p.expected_completion_date && new Date(p.expected_completion_date) >= new Date())
                                        .sort((a, b) => new Date(a.expected_completion_date) - new Date(b.expected_completion_date))
                                        .slice(0, 5)
                                        .map(project => (
                                            <div
                                                key={project.id}
                                                onClick={() => navigate(`/project/${project.id}`)}
                                                className="text-sm border-b border-gray-100 py-2 hover:bg-gray-50 transition cursor-pointer"
                                            >
                                                <div className="font-semibold text-gray-900">{project.project_name}</div>
                                                <div className="text-gray-500 text-xs flex items-center gap-2 mt-1">
                                                    <span>📅 {new Date(project.expected_completion_date).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span className={`px-1.5 py-0.5 rounded ${getStageColor(project.current_stage)}`}>
                                                        {STAGE_NAMES[project.current_stage]}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    {projects.filter(p => p.expected_completion_date && new Date(p.expected_completion_date) >= new Date()).length === 0 && (
                                        <p className="text-gray-500 text-sm text-center py-4">No upcoming deadlines</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* All Projects Workflow */}
                        {renderProjectWorkflow()}
                    </>
                )}
            </div>
        </div>
    );
};

export default Calendar;
