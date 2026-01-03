'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

    const getPhaseProgress = (project) => {
        // Simple heuristic for progress if stageData exists
        // Or just return the phase name
        return project.phase;
    };

    const getLastActivity = (project) => {
        // If we have updatedAt, use it. Otherwise createdAt
        const date = new Date(project.updatedAt || project.createdAt);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard 🍎</h1>
                    <button
                        onClick={() => router.push('/project-management')}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
                    >
                        Back to Projects
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Select a Student</h2>
                    <select
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        className="w-full md:w-1/2 p-3 border border-gray-300 rounded-lg text-lg"
                    >
                        <option value="">-- Choose a student --</option>
                        {students.map(student => (
                            <option key={student._id} value={student.username}>
                                {student.username} ({student.email})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedStudent && (
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-2xl font-bold mb-6 text-indigo-700">
                            Projects: {selectedStudent}
                        </h2>

                        {loading ? (
                            <p className="text-gray-500">Loading projects...</p>
                        ) : studentProjects.length === 0 ? (
                            <p className="text-gray-500 italic">No projects found for this student.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {studentProjects.map(project => (
                                    <div key={project._id} className="border rounded-xl p-5 hover:shadow-lg transition bg-white border-l-4 border-l-indigo-500">
                                        <h3 className="font-bold text-xl mb-2">{project.name}</h3>

                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Current Phase</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                                                        {project.phase}
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Last Active</span>
                                                <p className="text-sm text-gray-600">{getLastActivity(project)}</p>
                                            </div>

                                            {/* Future: Add specific checklist progress bars here */}
                                            {project.stageData && (
                                                <div className="mt-2 pt-2 border-t border-gray-100">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Quick Stats</span>
                                                    <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
                                                        {project.stageData.empathize?.checklist && (
                                                            <li>Empathize tasks: Checked?</li>
                                                        )}
                                                        {/* We would need to parse the checklist object to count 'true' values */}
                                                    </ul>
                                                </div>
                                            )}

                                            <button
                                                className="w-full mt-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition"
                                                onClick={() => {
                                                    // Allow teacher to view the project (read-only mode ideally, but for now normal access)
                                                    router.push(`/project?id=${project._id}&name=${project.name}&phase=${project.phase}`);
                                                }}
                                            >
                                                View Project Details →
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
