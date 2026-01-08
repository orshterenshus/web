'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Phase color configuration matching project page
const PHASE_CONFIG = {
    'Empathize': {
        emoji: '💜',
        bgGradient: 'bg-gradient-to-br from-purple-50 to-pink-50',
        border: 'border-purple-300',
        borderLeft: 'border-l-purple-500',
        badge: 'bg-purple-100 text-purple-700',
        progress: 'bg-purple-500',
        icon: 'bg-purple-200',
        index: 1
    },
    'Define': {
        emoji: '🎯',
        bgGradient: 'bg-gradient-to-br from-blue-50 to-cyan-50',
        border: 'border-blue-300',
        borderLeft: 'border-l-blue-500',
        badge: 'bg-blue-100 text-blue-700',
        progress: 'bg-blue-500',
        icon: 'bg-blue-200',
        index: 2
    },
    'Ideate': {
        emoji: '💡',
        bgGradient: 'bg-gradient-to-br from-yellow-50 to-orange-50',
        border: 'border-yellow-300',
        borderLeft: 'border-l-yellow-500',
        badge: 'bg-yellow-100 text-yellow-700',
        progress: 'bg-yellow-500',
        icon: 'bg-yellow-200',
        index: 3
    },
    'Prototype': {
        emoji: '🛠️',
        bgGradient: 'bg-gradient-to-br from-green-50 to-emerald-50',
        border: 'border-green-300',
        borderLeft: 'border-l-green-500',
        badge: 'bg-green-100 text-green-700',
        progress: 'bg-green-500',
        icon: 'bg-green-200',
        index: 4
    },
    'Test': {
        emoji: '🧪',
        bgGradient: 'bg-gradient-to-br from-indigo-50 to-violet-50',
        border: 'border-indigo-300',
        borderLeft: 'border-l-indigo-500',
        badge: 'bg-indigo-100 text-indigo-700',
        progress: 'bg-indigo-500',
        icon: 'bg-indigo-200',
        index: 5
    }
};

export default function TeacherDashboard() {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [studentProjects, setStudentProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Auth check
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) {
            router.push('/login');
            return;
        }
        const user = JSON.parse(userStr);
        if (user.role !== 'teacher') {
            alert('Access Denied: Teachers only');
            router.push('/project-management');
            return;
        }

        // Fetch students
        fetchStudents();
    }, [router]);

    useEffect(() => {
        if (selectedStudent) {
            fetchStudentProjects(selectedStudent);
        } else {
            setStudentProjects([]);
        }
    }, [selectedStudent]);

    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/users?role=student');
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (error) {
            console.error('Failed to fetch students', error);
        }
    };

    const fetchStudentProjects = async (username) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/teacher/student-projects?student=${username}`);
            if (res.ok) {
                const data = await res.json();
                setStudentProjects(data.projects || []);
            }
        } catch (error) {
            console.error('Failed to fetch projects', error);
        } finally {
            setLoading(false);
        }
    };

    const getPhaseConfig = (phase) => {
        return PHASE_CONFIG[phase] || PHASE_CONFIG['Empathize'];
    };

    const calculateCompletionPercentage = (project) => {
        const phaseIndex = getPhaseConfig(project.phase).index;
        return phaseIndex * 20; // Each phase = 20%
    };

    const getMessageCount = (project) => {
        // Messages are stored in chatHistory, not messages
        return project.chatHistory?.length || 0;
    };

    const getLastActivity = (project) => {
        const date = new Date(project.updatedAt || project.createdAt);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 font-sans text-gray-800">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard 🍎</h1>
                        <p className="text-gray-500 mt-1">Monitor student progress in Design Thinking projects</p>
                    </div>
                    <button
                        onClick={() => router.push('/project-management')}
                        className="bg-white text-gray-700 px-4 py-2 rounded-lg shadow hover:shadow-md transition border border-gray-200"
                    >
                        ← Back to Projects
                    </button>
                </div>

                {/* Student Selector */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <span className="text-2xl">👨‍🎓</span> Select a Student
                    </h2>
                    <select
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        className="w-full md:w-1/2 p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    >
                        <option value="">-- Choose a student --</option>
                        {students.map(student => (
                            <option key={student._id} value={student.username}>
                                {student.username} ({student.email})
                            </option>
                        ))}
                    </select>
                    {students.length === 0 && (
                        <p className="text-gray-400 mt-2 text-sm italic">No students found in the system.</p>
                    )}
                </div>

                {/* Projects Grid */}
                {selectedStudent && (
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
                                <span>📁</span> Projects: {selectedStudent}
                            </h2>
                            <span className="text-sm text-gray-500">
                                {studentProjects.length} project{studentProjects.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                                <span className="ml-3 text-gray-500">Loading projects...</span>
                            </div>
                        ) : studentProjects.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="text-5xl mb-4 block">📭</span>
                                <p className="text-gray-500 italic">No projects found for this student.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {studentProjects.map(project => {
                                    const config = getPhaseConfig(project.phase);
                                    const completion = calculateCompletionPercentage(project);
                                    const messageCount = getMessageCount(project);

                                    return (
                                        <div
                                            key={project._id}
                                            className={`rounded-xl p-5 hover:shadow-xl transition-all duration-300 border-l-4 ${config.borderLeft} ${config.bgGradient} border ${config.border}`}
                                        >
                                            {/* Project Header */}
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="font-bold text-xl text-gray-800">{project.name}</h3>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${config.icon}`}>
                                                    {config.emoji}
                                                </div>
                                            </div>

                                            {/* Current Phase Badge */}
                                            <div className="mb-4">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Current Phase</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.badge}`}>
                                                        {config.emoji} {project.phase}
                                                    </span>
                                                    <span className="text-xs text-gray-400">({config.index}/5)</span>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mb-4">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="font-bold text-gray-400 uppercase tracking-wide">Completion</span>
                                                    <span className="font-semibold text-gray-600">{completion}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className={`h-2.5 rounded-full transition-all duration-500 ${config.progress}`}
                                                        style={{ width: `${completion}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Stats Row */}
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div className="bg-white/60 rounded-lg p-2 text-center">
                                                    <span className="text-lg font-bold text-gray-700">{messageCount}</span>
                                                    <p className="text-xs text-gray-500">💬 Messages</p>
                                                </div>
                                                <div className="bg-white/60 rounded-lg p-2 text-center">
                                                    <span className="text-lg font-bold text-gray-700">{config.index}</span>
                                                    <p className="text-xs text-gray-500">📍 Phase</p>
                                                </div>
                                            </div>

                                            {/* Last Activity */}
                                            <div className="mb-4">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Last Active</span>
                                                <p className="text-sm text-gray-600">{getLastActivity(project)}</p>
                                            </div>

                                            {/* View Button */}
                                            <button
                                                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${config.badge} hover:opacity-80`}
                                                onClick={() => {
                                                    router.push(`/project?id=${project._id}&name=${project.name}&phase=${project.phase}`);
                                                }}
                                            >
                                                View Project Details →
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
