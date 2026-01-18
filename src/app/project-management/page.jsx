'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SharePopover from '@/components/Shared/SharePopover';

export default function ProjectManagementPage() {
    const [projects, setProjects] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const [projectName, setProjectName] = useState('');
    const [projectPhase, setProjectPhase] = useState('Empathize');
    const [projectEmoji, setProjectEmoji] = useState('🚀');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // Filter & Sort State
    const ALL_PHASES = ['Empathize', 'Define', 'Ideate', 'Prototype', 'Test'];
    const [sortBy, setSortBy] = useState('updated');
    const [filterPhases, setFilterPhases] = useState([...ALL_PHASES]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef(null);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const sortRef = useRef(null);
    const [sortDirection, setSortDirection] = useState('desc');

    // Click outside handler for filter & sort dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setIsFilterOpen(false);
            }
            if (sortRef.current && !sortRef.current.contains(event.target)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Derived Projects List
    const processedProjects = useMemo(() => {
        // ... existing memo logic ...
        let result = [...projects];

        // 1. Filter (Multi-select)
        if (filterPhases.length > 0) {
            result = result.filter(p => filterPhases.includes(p.phase));
        } else {
            result = []; // If nothing selected, show nothing? Or all? Usually nothing.
        }

        // 2. Sort
        result.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'updated') {
                comparison = new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0); // Base ASC
            } else if (sortBy === 'name') {
                comparison = a.name.localeCompare(b.name); // Base ASC
            } else if (sortBy === 'phase') {
                const phases = ['Empathize', 'Define', 'Ideate', 'Prototype', 'Test'];
                comparison = phases.indexOf(a.phase) - phases.indexOf(b.phase); // Base ASC
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [projects, filterPhases, sortBy, sortDirection]);


    const togglePhase = (phase) => {
        setFilterPhases(prev =>
            prev.includes(phase)
                ? prev.filter(p => p !== phase)
                : [...prev, phase]
        );
    };

    const toggleAllPhases = () => {
        if (filterPhases.length === ALL_PHASES.length) {
            setFilterPhases([]); // Deselect all
        } else {
            setFilterPhases([...ALL_PHASES]); // Select all
        }
    };

    const EMOJI_LIST = [
        '🚀', '⭐', '💡', '🔥', '✨', '🎨', '🎯', '🦄', '🌈', '⚡',
        '💫', '🔮', '🎉', '🌱', '🌍', '🛠️', '🏰', '🗺️', '🧩', '🎲',
        '🎳', '🎮', '🎪', '🎭', '🌲', '🌺', '🌻', '🏔️', '🏖️', '⛩️',
        '🏢', '🛤️', '⚓', '🚲', '🛴', '🛸', '🤖', '👾', '🎃', '👻'
    ];

    // ... (rest of logic) ...

    // Modal State
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [projectToShare, setProjectToShare] = useState(null);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);

    useEffect(() => {
        // Check authentication
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) {
            router.push('/login');
            return;
        }
        const user = JSON.parse(userStr);
        setCurrentUser(user);
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
                    name: projectName,
                    phase: projectPhase,
                    emoji: projectEmoji,
                    createdBy: currentUser.username
                }),
            });

            if (res.ok) {
                setProjectName('');
                setProjectPhase('Empathize');
                setProjectEmoji('🚀');
                fetchProjects(); // Refresh list
            } else {
                alert('Failed to create project');
            }
        } catch (error) {
            console.error('Error creating project', error);
        }
    };

    const handleDeleteProject = (e, project) => {
        e.stopPropagation();
        setProjectToDelete(project);
        setShowDeleteConfirmModal(true);
    };

    const confirmDeleteProject = async () => {
        if (!projectToDelete) return;

        try {
            const res = await fetch(`/api/projects/${projectToDelete._id}?user=${currentUser.username}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchProjects();
                setShowDeleteConfirmModal(false);
                setProjectToDelete(null);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete project');
                setShowDeleteConfirmModal(false);
            }
        } catch (error) {
            console.error('Failed to delete project:', error);
            alert('Failed to delete project');
            setShowDeleteConfirmModal(false);
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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                <p className="text-slate-400">Loading your workspace...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen p-8 relative overflow-x-hidden bg-[#0f172a] text-slate-200 font-sans selection:bg-purple-500/30">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 glass-card p-6 rounded-2xl">
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400">
                            Project Dashboard
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Welcome back, <span className="text-white font-medium">{currentUser?.username}</span></p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                        {currentUser?.role === 'teacher' && (
                            <button
                                onClick={() => router.push('/teacher-dashboard')}
                                className="px-5 py-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-all text-sm font-semibold flex items-center gap-2"
                            >
                                <span>🍎</span> Teacher Dashboard
                            </button>
                        )}
                        {currentUser?.isAdmin && (
                            <button className="px-5 py-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all text-sm font-semibold">
                                Manage Users
                            </button>
                        )}
                        <button
                            onClick={handleLogout}
                            className="px-5 py-2.5 rounded-xl bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm font-semibold"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                            Your Projects
                        </h2>

                        {/* Search, Sort & Filter Controls */}
                        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                            {/* Multi-Select Filter */}
                            <div className="relative min-w-[180px]" ref={filterRef}>
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className="glass-input w-full px-4 py-2 rounded-lg flex items-center justify-between text-sm bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                                >
                                    <span className="truncate">
                                        {filterPhases.length === ALL_PHASES.length
                                            ? 'All Phases'
                                            : filterPhases.length === 0
                                                ? 'No Phases Selected'
                                                : `${filterPhases.length} Selected`}
                                    </span>
                                    <svg className={`w-3 h-3 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </button>

                                {/* Dropdown Menu */}
                                {isFilterOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-64 glass-card bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                        {/* Select All Control */}
                                        <div className="p-3 border-b border-slate-700/50 flex items-center justify-between bg-black/20">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Phases</span>
                                            <button
                                                onClick={toggleAllPhases}
                                                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                                            >
                                                {filterPhases.length === ALL_PHASES.length ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>

                                        {/* Options List */}
                                        <div className="p-2 space-y-1 max-h-60 overflow-y-auto no-scrollbar">
                                            {ALL_PHASES.map((phase) => {
                                                const isSelected = filterPhases.includes(phase);
                                                return (
                                                    <label
                                                        key={phase}
                                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-blue-500/10' : 'hover:bg-white/5'}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => togglePhase(phase)}
                                                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/20"
                                                        />
                                                        <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-slate-400'}`}>
                                                            {phase}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sort Group */}
                            <div className="flex items-center gap-2">
                                <div className="relative min-w-[180px]" ref={sortRef}>
                                    <button
                                        onClick={() => setIsSortOpen(!isSortOpen)}
                                        className="glass-input w-full px-4 py-2 rounded-lg flex items-center justify-between text-sm bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                                    >
                                        <span className="truncate">
                                            {sortBy === 'updated' && '🕒 Last Updated'}
                                            {sortBy === 'phase' && '📊 Phase Progress'}
                                            {sortBy === 'name' && 'sz Name (A-Z)'}
                                        </span>
                                        <svg className={`w-3 h-3 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </button>

                                    {isSortOpen && (
                                        <div className="absolute top-full right-0 mt-2 w-full glass-card bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                            <div className="p-1">
                                                {[
                                                    { value: 'updated', label: '🕒 Last Updated' },
                                                    { value: 'phase', label: '📊 Phase Progress' },
                                                    { value: 'name', label: 'sz Name (A-Z)' }
                                                ].map((option) => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => {
                                                            setSortBy(option.value);
                                                            setIsSortOpen(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${sortBy === option.value ? 'bg-blue-500/10 text-white font-medium' : 'text-slate-400 hover:bg-white/5'}`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Sort Direction Toggle */}
                                <button
                                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    className="p-2.5 rounded-lg glass-input bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                                    title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                                >
                                    {sortDirection === 'asc' ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h5m4 0v12m0 0l-4-4m4 4l4-4"></path></svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Global Scrollbar Styles */}
                    <style jsx global>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                        /* Custom thin scrollbar for other areas */
                        ::-webkit-scrollbar {
                            width: 6px;
                            height: 6px;
                        }
                        ::-webkit-scrollbar-track {
                            background: rgba(255, 255, 255, 0.02);
                        }
                        ::-webkit-scrollbar-thumb {
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 10px;
                        }
                        ::-webkit-scrollbar-thumb:hover {
                            background: rgba(255, 255, 255, 0.2);
                        }
                    `}</style>



                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {processedProjects.length === 0 ? (
                            <div className="col-span-full glass-panel p-12 rounded-2xl text-center border-dashed border-2 border-slate-700">
                                <span className="text-4xl block mb-4">✨</span>
                                <p className="text-slate-400 mb-2">No projects found.</p>
                                <p className="text-slate-500 text-sm">{projects.length === 0 ? "Create your first innovation journey below!" : "Try adjusting your filters."}</p>
                            </div>
                        ) : (
                            processedProjects.map((project) => (
                                <div
                                    key={project._id}
                                    className="group glass-panel p-6 rounded-2xl relative cursor-pointer hover:border-blue-500/30 hover:bg-white/5 hover:z-50 transition-all duration-300"
                                    onClick={() => navigateToProject(project)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 rounded-lg bg-blue-500/10 text-2xl group-hover:scale-110 transition-transform duration-300">
                                            {project.emoji || '🚀'}
                                        </div>
                                        {/* Phase Badge */}
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${{
                                            'Empathize': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                                            'Define': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                                            'Ideate': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
                                            'Prototype': 'bg-green-500/20 text-green-300 border-green-500/30',
                                            'Test': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                        }[project.phase] || 'bg-white/5 border-white/10 text-slate-300'
                                            }`}>
                                            {project.phase}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-lg text-white mb-2 group-hover:text-blue-400 transition-colors">{project.name}</h3>
                                    <p className="text-xs text-slate-500 mb-6">Last updated: {new Date(project.updatedAt || Date.now()).toLocaleDateString()}</p>

                                    <div className="flex items-center justify-between text-sm mt-auto border-t border-white/5 pt-4">
                                        <button className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                            Open Workspace →
                                        </button>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => handleDeleteProject(e, project)}
                                                className="text-slate-400 hover:text-red-400 transition-colors p-1.5 hover:bg-red-500/10 rounded-lg"
                                                title="Delete Project"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <SharePopover
                                                    projectId={project._id}
                                                    onShareSuccess={fetchProjects}
                                                    triggerButton={
                                                        <button className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                                        </button>
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shared Badge */}
                                    {currentUser && project.createdBy !== currentUser.username && (
                                        <div className="absolute top-4 right-4">
                                            <span className="flex h-2 w-2 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Create Project Section */}
                <div className="glass-card p-8 rounded-2xl border-t-0 border-l-0 border-r-0 border-b-2 border-indigo-500/50">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="text-2xl">✨</span> Start New Journey
                    </h2>
                    <form onSubmit={handleCreateProject} className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 w-full space-y-2">
                            <label htmlFor="projectName" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Name</label>
                            <input
                                type="text"
                                id="projectName"
                                required
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="glass-input w-full px-4 py-3 rounded-xl"
                                placeholder="e.g. Sustainable City Garden"
                            />
                        </div>
                        <div className="flex-1 w-full space-y-2">
                            <label htmlFor="projectPhase" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Starting Phase</label>
                            <div className="relative">
                                <select
                                    id="projectPhase"
                                    required
                                    value={projectPhase}
                                    onChange={(e) => setProjectPhase(e.target.value)}
                                    className="glass-input w-full px-4 py-3 rounded-xl appearance-none cursor-pointer"
                                >
                                    <option value="Empathize" className="bg-slate-800 text-purple-300">💜 Empathize</option>
                                    <option value="Define" className="bg-slate-800 text-blue-300">🎯 Define</option>
                                    <option value="Ideate" className="bg-slate-800 text-yellow-300">💡 Ideate</option>
                                    <option value="Prototype" className="bg-slate-800 text-green-300">🛠️ Prototype</option>
                                    <option value="Test" className="bg-slate-800 text-indigo-300">🧪 Test</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-auto relative">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Icon</label>
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="glass-input w-full md:w-16 h-[50px] rounded-xl flex items-center justify-center text-2xl hover:bg-white/5 transition-colors"
                            >
                                {projectEmoji}
                            </button>

                            {showEmojiPicker && (
                                <div className="absolute bottom-full left-0 mb-2 w-64 p-4 bg-[#1e293b] rounded-xl border border-slate-600 shadow-2xl grid grid-cols-5 gap-2 z-50">
                                    <div className="absolute inset-0 z-[-1]" onClick={() => setShowEmojiPicker(false)}></div>
                                    {EMOJI_LIST.map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => {
                                                setProjectEmoji(emoji);
                                                setShowEmojiPicker(false);
                                            }}
                                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-xl transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button type="submit" className="w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-green-500/20 transition-all duration-300 transform hover:-translate-y-0.5 custom-gradient-bg bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-green-500/40">
                            Create Project +
                        </button>
                    </form>
                </div>

                {/* Delete Confirmation Modal */}
                {
                    showDeleteConfirmModal && (
                        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirmModal(false)}></div>
                            <div className="relative glass-card bg-[#1e293b] rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl animate-in zoom-in duration-200">
                                <div className="flex justify-center mb-6">
                                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 text-3xl">
                                        🗑️
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-center text-white mb-2">Delete Project?</h3>
                                <p className="text-slate-400 text-center mb-8">
                                    Are you sure you want to delete <strong>{projectToDelete?.name}</strong>? This action <strong>cannot</strong> be undone.
                                </p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowDeleteConfirmModal(false)}
                                        className="flex-1 px-4 py-3 rounded-xl font-medium bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDeleteProject}
                                        className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                                    >
                                        Delete Forever
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
