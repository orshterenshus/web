'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Cosmic Phase Configuration
const PHASE_CONFIG = {
    'Empathize': {
        emoji: '💜',
        bgGradient: 'bg-purple-900/20',
        border: 'border-purple-500/30',
        borderLeft: 'border-l-purple-500',
        badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        progress: 'bg-purple-500',
        icon: 'bg-purple-500/20 text-purple-300',
        index: 1
    },
    'Define': {
        emoji: '🎯',
        bgGradient: 'bg-blue-900/20',
        border: 'border-blue-500/30',
        borderLeft: 'border-l-blue-500',
        badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
        progress: 'bg-blue-500',
        icon: 'bg-blue-500/20 text-blue-300',
        index: 2
    },
    'Ideate': {
        emoji: '💡',
        bgGradient: 'bg-yellow-900/10',
        border: 'border-yellow-500/30',
        borderLeft: 'border-l-yellow-500',
        badge: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
        progress: 'bg-yellow-500',
        icon: 'bg-yellow-500/20 text-yellow-300',
        index: 3
    },
    'Prototype': {
        emoji: '🛠️',
        bgGradient: 'bg-green-900/20',
        border: 'border-green-500/30',
        borderLeft: 'border-l-green-500',
        badge: 'bg-green-500/20 text-green-300 border border-green-500/30',
        progress: 'bg-green-500',
        icon: 'bg-green-500/20 text-green-300',
        index: 4
    },
    'Test': {
        emoji: '🧪',
        bgGradient: 'bg-indigo-900/20',
        border: 'border-indigo-500/30',
        borderLeft: 'border-l-indigo-500',
        badge: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
        progress: 'bg-indigo-500',
        icon: 'bg-indigo-500/20 text-indigo-300',
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
        <div className="min-h-screen p-8 relative overflow-hidden bg-[#0f172a] text-slate-200 font-sans selection:bg-purple-500/30">
            {/* Cosmic Background */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute bottom-[-20%] right-[20%] w-[600px] h-[600px] bg-indigo-900/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center glass-card p-6 rounded-2xl">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <span className="text-4xl">🍎</span> Teacher Dashboard
                        </h1>
                        <p className="text-slate-400 mt-1">Monitor student progress in Design Thinking projects</p>
                    </div>
                    <button
                        onClick={() => router.push('/project-management')}
                        className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                    >
                        ← Back to Projects
                    </button>
                </div>

                {/* Student Selector */}
                <div className="glass-panel p-8 rounded-2xl">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-3 text-white">
                        <span className="text-2xl">👨‍🎓</span> Select a Student
                    </h2>
                    <div className="relative max-w-xl">
                        <select
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            className="glass-input w-full p-4 rounded-xl text-lg appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-slate-800 text-slate-400">-- Choose a student --</option>
                            {students.map(student => (
                                <option key={student._id} value={student.username} className="bg-slate-800 text-white">
                                    {student.username} ({student.email})
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                    {students.length === 0 && (
                        <p className="text-slate-500 mt-3 text-sm italic">No students found in the system.</p>
                    )}
                </div>

                {/* Projects Grid */}
                {selectedStudent && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <span>📁</span> Projects: <span className="text-blue-400">{selectedStudent}</span>
                            </h2>
                            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium border border-blue-500/20">
                                {studentProjects.length} project{studentProjects.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                                <span className="ml-4 text-slate-400 text-lg">Loading projects...</span>
                            </div>
                        ) : studentProjects.length === 0 ? (
                            <div className="glass-panel p-16 rounded-2xl text-center border-dashed border-2 border-slate-700/50">
                                <span className="text-6xl mb-6 block opacity-50">📭</span>
                                <p className="text-slate-400 text-xl italic">No projects found for this student.</p>
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
                                            className={`rounded-2xl p-6 hover:translate-y-[-4px] transition-all duration-300 border-l-4 ${config.borderLeft} ${config.bgGradient} backdrop-blur-md border ${config.border} shadow-lg relative overflow-hidden`}
                                        >

                                            {/* Project Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <h3 className="font-bold text-xl text-white tracking-wide">{project.name}</h3>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${config.icon}`}>
                                                    {config.emoji}
                                                </div>
                                            </div>

                                            {/* Current Phase Badge */}
                                            <div className="mb-6">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Phase</span>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm ${config.badge}`}>
                                                        {config.emoji} {project.phase}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-mono">Step {config.index}/5</span>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mb-6">
                                                <div className="flex justify-between text-xs mb-2">
                                                    <span className="font-bold text-slate-400 uppercase tracking-wider">Completion</span>
                                                    <span className="font-bold text-white">{completion}%</span>
                                                </div>
                                                <div className="w-full bg-black/20 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor] ${config.progress}`}
                                                        style={{ width: `${completion}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Stats Row */}
                                            <div className="grid grid-cols-2 gap-3 mb-6">
                                                <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5">
                                                    <span className="text-lg font-bold text-white">{messageCount}</span>
                                                    <p className="text-xs text-slate-400 mt-1">💬 Messages</p>
                                                </div>
                                                <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5">
                                                    <span className="text-lg font-bold text-white">{config.index}</span>
                                                    <p className="text-xs text-slate-400 mt-1">📍 Phase Step</p>
                                                </div>
                                            </div>

                                            {/* Last Activity */}
                                            <div className="mb-6">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last Active</span>
                                                <p className="text-sm text-slate-300 mt-1 font-medium">{getLastActivity(project)}</p>
                                            </div>

                                            {/* View Button */}
                                            <button
                                                className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 border border-white/10 hover:bg-white/10 text-white shadow-lg`}
                                                style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                                                onClick={() => {
                                                    router.push(`/project?id=${project._id}&name=${project.name}&phase=${project.phase}`);
                                                }}
                                            >
                                                View Details →
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
