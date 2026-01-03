
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SharePopover from '@/components/SharePopover';

export default function ProjectManagementPage() {
    const [projects, setProjects] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const [projectName, setProjectName] = useState('');
    const [projectPhase, setProjectPhase] = useState('Empathize');

    // Modal State
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [projectToShare, setProjectToShare] = useState(null);

    useEffect(() => {
        // Check authentication
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) {
            router.push('/login');
            return;
        }
        const user = JSON.parse(userStr);
        setCurrentUser(user);


        // Fetch projects
        if (currentUser) {
            // We need to call fetchProjects here or inside a separate useEffect dependent on currentUser
            // But since fetchProjects relies on currentUser state which might not be set immediately if we just set it...
            // actually currentUser is set above.
        }
    }, [router]);

    // Effect to fetch projects once currentUser is set
    useEffect(() => {
        if (currentUser) {
            fetchProjects();
        }
    }, [currentUser]);

    const fetchProjects = async () => {
        if (!currentUser) return;
        try {
            const res = await fetch('/api/projects', {
                headers: {
                    'X-Current-User': currentUser.username
                }
            });
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (error) {
            console.error('Failed to fetch projects', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        router.push('/login');
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: projectName,
                    phase: projectPhase,
                    createdBy: currentUser.username
                }),
            });

            if (res.ok) {
                setProjectName('');
                setProjectPhase('Empathize');
                fetchProjects(); // Refresh list
            } else {
                alert('Failed to create project');
            }
        } catch (error) {
            console.error('Error creating project', error);
        }
    };

    const navigateToProject = (project) => {
        const params = new URLSearchParams({
            id: project._id,
            name: project.name,
            phase: project.phase
        });
        router.push(`/project?${params.toString()}`);
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="font-sans bg-gray-100 min-h-screen flex flex-col items-center p-10 text-gray-800">
            <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="font-bold text-3xl text-gray-800">Projects Management</h1>
                    <div>
                        {currentUser?.role === 'teacher' && (
                            <button
                                onClick={() => router.push('/teacher-dashboard')}
                                className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition mr-2"
                            >
                                Teacher Dashboard 🍎
                            </button>
                        )}
                        {currentUser?.isAdmin && (
                            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition mr-2">
                                Manage Users
                            </button>
                        )}
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Existing Projects</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projects.length === 0 ? (
                            <p>No projects found. Create one below!</p>
                        ) : (
                            projects.map((project) => (
                                <div
                                    key={project._id}
                                    className="p-4 border rounded shadow-sm hover:shadow-md transition bg-gray-50 cursor-pointer relative"
                                    onClick={() => navigateToProject(project)}
                                >
                                    <h3 className="font-bold text-lg">{project.name}</h3>
                                    <p className="text-gray-600">Phase: {project.phase}</p>
                                    <div className="mt-2 text-sm text-gray-500 flex gap-2">
                                        <button className="text-blue-500 hover:underline">Open</button>
                                        <SharePopover
                                            projectId={project._id}
                                            onShareSuccess={fetchProjects}
                                            triggerButton={
                                                <button className="text-green-500 hover:underline">
                                                    Share
                                                </button>
                                            }
                                        />
                                    </div>
                                    {/* Shared Badge */}
                                    {currentUser && project.createdBy !== currentUser.username && (
                                        <div className="absolute top-2 right-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-semibold">
                                            Shared with me
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="border-t pt-8 border-gray-200">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Create New Project</h2>
                    <form onSubmit={handleCreateProject} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                            <input
                                type="text"
                                id="projectName"
                                required
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label htmlFor="projectPhase" className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                            <select
                                id="projectPhase"
                                required
                                value={projectPhase}
                                onChange={(e) => setProjectPhase(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            >
                                <option value="Empathize">Empathize</option>
                                <option value="Define">Define</option>
                                <option value="Ideate">Ideate</option>
                                <option value="Prototype">Prototype</option>
                                <option value="Test">Test</option>
                            </select>
                        </div>
                        <button type="submit" className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition w-full md:w-auto">
                            Create Project
                        </button>
                    </form>
                </div>
            </div>

        </div>
    );
}
