'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import SharePopover from '@/components/Shared/SharePopover';
import EmpathizePhase from '@/components/DesignCanvas/EmpathizePhase';
import StageChecklist from '@/components/ProgressTracker/StageChecklist';
import ProjectPDFExport from '@/components/Shared/ProjectPDFExport';
import SketchPad from '@/components/SketchPad';
import FeedbackMatrix from '@/components/Test/FeedbackMatrix';

// Phase-specific information for the chatbot
const PHASE_INFO = {
    'Empathize': {
        tools: ['Empathy Maps', 'User Interviews', 'Observation Notes'],
        capabilities: 'building Empathy Maps, conducting user interviews, and understanding what your users See, Think, Do, and Feel',
        firstQuestion: 'How can you enter your user\'s inner circle?'
    },
    'Define': {
        tools: ['User Personas', 'How Might We (HMW) statements', 'Problem Statements'],
        capabilities: 'creating User Personas, crafting HMW statements, and defining the core problem',
        firstQuestion: 'How can you phrase the problem to focus on needs rather than solutions?'
    },
    'Ideate': {
        tools: ['Brainstorming Board', 'Idea Prioritization Matrix', 'SCAMPER technique'],
        capabilities: 'brainstorming ideas, evaluating feasibility vs. innovation, and combining concepts',
        firstQuestion: 'What happens if you flip the problem on its head?'
    },
    'Prototype': {
        tools: ['Storyboards', 'Paper Sketches', 'Wireframes', 'Low-Fi Prototypes'],
        capabilities: 'building quick prototypes, testing core functions, and simulating user experiences',
        firstQuestion: 'How can you build the simplest version that still communicates the core idea?'
    },
    'Test': {
        tools: ['Testing Checklists', 'Feedback Forms', 'User Testing Scripts'],
        capabilities: 'planning user tests, gathering feedback, and deciding whether to iterate or proceed',
        firstQuestion: 'What assumptions are you testing with your prototype?'
    }
};

function getWelcomeMessage(phase) {
    const info = PHASE_INFO[phase] || PHASE_INFO['Empathize'];
    return `Hello! 👋 I'm your Socratic Design Thinking Coach, here to guide you through your project.<br><br>` +
        `You're currently in the <strong>${phase}</strong> phase.<br><br>` +
        `<strong>In this phase, I can help you with:</strong><br>` +
        `• ${info.tools.join('<br>• ')}<br><br>` +
        `I'll be asking thought-provoking questions to help you ${info.capabilities}.<br><br>` +
        `Ready to dive in? Here's a guiding question to get us started:<br>` +
        `<em>"${info.firstQuestion}"</em>`;
}

function getPhaseChangeMessage(phase) {
    const info = PHASE_INFO[phase] || PHASE_INFO['Empathize'];
    return `Great! You've moved to the <strong>${phase}</strong> phase. 🎯<br><br>` +
        `<strong>In this phase, I can help you with:</strong><br>` +
        `• ${info.tools.join('<br>• ')}<br><br>` +
        `Let's get started! Here's a guiding question:<br>` +
        `<em>"${info.firstQuestion}"</em>`;
}

// Checklist items configuration for calculating unchecked items
const CHECKLIST_CONFIG = {
    empathize: [
        { key: 'createdPersona', label: 'Create User Persona(s)' },
        { key: 'conductedInterviews', label: 'Conduct User Interviews' },
        { key: 'mappedUserEmpathy', label: 'Map User Empathy (Says/Thinks/Does/Feels)' },
        { key: 'mappedAIEmpathy', label: 'Map AI Persona Empathy' },
        { key: 'documentedObservations', label: 'Document Key Observations' }
    ],
    define: [
        { key: 'createdPersona', label: 'Create User Persona' },
        { key: 'definedProblem', label: 'Define problem statement' },
        { key: 'createdHMW', label: 'Create HMW questions' },
        { key: 'identifiedNeeds', label: 'Identify user needs' },
        { key: 'synthesizedInsights', label: 'Synthesize insights' }
    ],
    ideate: [
        { key: 'brainstormed', label: 'Brainstorm ideas' },
        { key: 'prioritizedIdeas', label: 'Prioritize ideas' },
        { key: 'selectedTopIdea', label: 'Select top idea' },
        { key: 'sketchedConcepts', label: 'Sketch concepts' },
        { key: 'exploredAlternatives', label: 'Explore alternatives' }
    ],
    prototype: [
        { key: 'builtPrototype', label: 'Build prototype' },
        { key: 'definedTestGoals', label: 'Define test goals' },
        { key: 'createdUserFlow', label: 'Create user flow' },
        { key: 'preparedMaterials', label: 'Prepare materials' },
        { key: 'identifiedAssumptions', label: 'Identify assumptions' }
    ],
    test: [
        { key: 'conductedTests', label: 'Conduct user tests' },
        { key: 'gatheredFeedback', label: 'Gather feedback' },
        { key: 'documentedLearnings', label: 'Document learnings' },
        { key: 'iteratedPrototype', label: 'Iterate on prototype' },
        { key: 'validatedSolution', label: 'Validate solution' }
    ]
};

// Helper to get unchecked items for a phase
function getUncheckedItems(phase, stageData) {
    const phaseKey = phase.toLowerCase();
    const config = CHECKLIST_CONFIG[phaseKey];
    if (!config) return [];

    const checklist = stageData?.[phaseKey]?.checklist || {};
    return config.filter(item => !checklist[item.key]);
}


function ProjectContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialName = searchParams.get('name') || 'Project';
    const initialPhase = searchParams.get('phase') || 'Empathize';
    const projectId = searchParams.get('id');
    const [projectEmoji, setProjectEmoji] = useState('DB'); // Start with DB code, update after fetch

    // For existing projects, start with null phase and load from DB
    // For new projects (no projectId), use the URL param
    const [currentPhase, setCurrentPhase] = useState(projectId ? null : initialPhase);
    const [isLoadingPhase, setIsLoadingPhase] = useState(!!projectId);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [files, setFiles] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    // Confirmation modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingPhase, setPendingPhase] = useState(null);

    // Error/Info modal state
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Delete Confirmation Modal State
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

    // Stage-specific data (empathy map, checklists, etc.)
    const [stageData, setStageData] = useState({});

    // Mobile chat panel toggle
    const [showMobileChat, setShowMobileChat] = useState(false);

    // Desktop chat minimized state
    const [isChatMinimized, setIsChatMinimized] = useState(false);

    // PDF Export
    const pdfContentRef = useRef(null);
    const handlePrint = useReactToPrint({
        contentRef: pdfContentRef,
        documentTitle: `${initialName} - Design Thinking Report`,
    });

    // File Upload State & Handlers
    const [isUploading, setIsUploading] = useState(false);

    const fetchFiles = async () => {
        if (!projectId) return;
        try {
            const res = await fetch(`/api/projects/${projectId}/files`);
            if (res.ok) {
                const data = await res.json();
                setFiles(data.files);
            }
        } catch (error) {
            console.error('Failed to fetch files:', error);
        }
    };

    const fetchProjectDetails = async () => {
        if (!projectId) return;
        try {
            const userStr = localStorage.getItem('currentUser');
            if (!userStr) return;
            const user = JSON.parse(userStr);

            const res = await fetch(`/api/projects/${projectId}?user=${user.username}`);
            if (res.ok) {
                const data = await res.json();
                if (data.emoji) setProjectEmoji(data.emoji);
            }
        } catch (error) {
            console.error('Failed to fetch project details:', error);
        }
    };

    // Fetch files and details on load
    useEffect(() => {
        if (projectId) {
            fetchFiles();
            fetchProjectDetails();
        }
    }, [projectId]);

    // Unified upload function
    const uploadFileToProject = async (file) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const userStr = localStorage.getItem('currentUser');
            if (userStr) {
                const user = JSON.parse(userStr);
                formData.append('uploadedBy', user.username);
            }
        } catch (err) {
            console.error('Error getting user', err);
        }

        try {
            const res = await fetch(`/api/projects/${projectId}/files`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                await fetchFiles();
                return true;
            } else {
                const errorData = await res.json();
                setErrorMessage(errorData.error || 'Failed to upload file');
                setShowErrorModal(true);
                return false;
            }
        } catch (error) {
            console.error('Upload error:', error);
            setErrorMessage('An unexpected error occurred during upload');
            setShowErrorModal(true);
            return false;
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileUpload = async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const success = await uploadFileToProject(e.target.files[0]);
        if (success) {
            e.target.value = null;
        }
    };

    const handleSketchSave = async (dataUrl) => {
        try {
            // Convert dataURL to File/Blob
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], `sketch-${Date.now()}.png`, { type: 'image/png' });

            // Upload
            const success = await uploadFileToProject(file);
            if (success) {
                // Optional: Show success notification or scroll to files
                alert("Sketch saved to project files!");
            }
        } catch (error) {
            console.error("Error saving sketch:", error);
            setErrorMessage("Failed to save sketch");
            setShowErrorModal(true);
        }
    };

    const handleDeleteProject = () => {
        setShowDeleteConfirmModal(true);
    };

    const confirmDeleteProject = async () => {
        try {
            const userStr = localStorage.getItem('currentUser');
            if (!userStr) return;
            const user = JSON.parse(userStr);

            const res = await fetch(`/api/projects/${projectId}?user=${user.username}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                router.push('/project-management');
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

    const handleDeleteFile = async (publicId) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            const res = await fetch(`/api/projects/${projectId}/files?publicId=${publicId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setFiles(files.filter(f => f.publicId !== publicId));
            } else {
                alert('Failed to delete file');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error deleting file');
        }
    };

    // Helper function to save a message to the database
    const saveMessageToDb = async (message) => {
        if (!projectId) return;
        try {
            await fetch(`/api/projects/${projectId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message),
            });
        } catch (error) {
            console.error('Failed to save message:', error);
        }
    };

    // Fetch chat history on component mount
    useEffect(() => {
        const fetchChatHistory = async () => {
            if (!projectId) {
                setIsLoadingHistory(false);
                // Show welcome message if no project ID
                setMessages([{
                    sender: 'Bot',
                    text: getWelcomeMessage(initialPhase)
                }]);
                return;
            }

            try {
                const response = await fetch(`/api/projects/${projectId}/messages`);
                const data = await response.json();

                if (data.chatHistory && data.chatHistory.length > 0) {
                    setMessages(data.chatHistory);
                } else {
                    // No history — send and save welcome message
                    const welcomeMessage = {
                        sender: 'Bot',
                        text: getWelcomeMessage(initialPhase),
                        phase: initialPhase,
                        timestamp: new Date(),
                    };
                    setMessages([welcomeMessage]);
                    await saveMessageToDb(welcomeMessage);
                }
            } catch (error) {
                console.error('Failed to fetch chat history:', error);
                // Fallback to welcome message on error
                setMessages([{
                    sender: 'Bot',
                    text: getWelcomeMessage(initialPhase)
                }]);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        fetchChatHistory();
    }, [projectId, initialPhase]);

    // Fetch stage data AND saved phase on mount
    useEffect(() => {
        const fetchStageData = async () => {
            if (!projectId) return;
            try {
                const response = await fetch(`/api/projects/${projectId}/stageData`);

                if (response.ok) {
                    const data = await response.json();
                    setStageData(data.stageData || {});
                    // Load saved phase from database - this is the source of truth
                    const savedPhase = data.phase || 'Empathize';
                    setCurrentPhase(savedPhase);
                } else {
                    // If fetch fails, default to Empathize
                    setCurrentPhase('Empathize');
                }
            } catch (error) {
                console.error('   ❌ Failed to fetch stage data:', error);
                // On error, default to Empathize
                setCurrentPhase('Empathize');
            } finally {
                setIsLoadingPhase(false);
            }
        };
        fetchStageData();
    }, [projectId]);

    const changePhase = (phase) => {
        const formattedPhase = phase.charAt(0).toUpperCase() + phase.slice(1);
        const phases = ['Empathize', 'Define', 'Ideate', 'Prototype', 'Test'];
        const currentIndex = phases.indexOf(currentPhase);
        const targetIndex = phases.indexOf(formattedPhase);

        // Don't do anything if staying on the same phase
        if (formattedPhase === currentPhase) return;

        // Only allow moving to the NEXT phase (not previous, not skipping ahead)
        if (targetIndex !== currentIndex + 1) {
            // Show styled error modal instead of browser alert
            if (targetIndex < currentIndex) {
                setErrorMessage("You cannot go back to previous phases. Keep moving forward! 🚀");
            } else if (targetIndex > currentIndex + 1) {
                setErrorMessage(`Please complete the ${phases[currentIndex + 1]} phase first before moving to ${formattedPhase}.`);
            }
            setShowErrorModal(true);
            return;
        }

        // Show confirmation modal for the next phase
        setPendingPhase(formattedPhase);
        setShowConfirmModal(true);
    };

    const confirmPhaseChange = async () => {
        if (!pendingPhase) return;

        setCurrentPhase(pendingPhase);
        setShowConfirmModal(false);

        // Save phase to database
        if (projectId) {
            try {
                const userStr = localStorage.getItem('currentUser');
                const user = userStr ? JSON.parse(userStr) : null;
                const username = user?.username;

                if (username) {
                    await fetch(`/api/projects/${projectId}?user=${encodeURIComponent(username)}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phase: pendingPhase })
                    });
                }
            } catch (error) {
                console.error('Failed to save phase:', error);
            }
        }

        const phaseMessage = {
            sender: 'Bot',
            text: getPhaseChangeMessage(pendingPhase),
            phase: pendingPhase,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, phaseMessage]);
        await saveMessageToDb(phaseMessage);
        setPendingPhase(null);
    };

    const cancelPhaseChange = () => {
        setShowConfirmModal(false);
        setPendingPhase(null);
    };

    const [isTyping, setIsTyping] = useState(false);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || isTyping) return;

        const userMessage = {
            sender: 'You',
            text: chatInput,
            phase: currentPhase,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        const userText = chatInput;
        setChatInput('');

        // Save user message to database
        await saveMessageToDb(userMessage);

        // Call Gemini API for response
        setIsTyping(true);
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userText,
                    phase: currentPhase,
                    conversationHistory: messages.slice(-10), // Last 10 messages for context
                }),
            });

            const data = await response.json();

            let botReplyText;
            if (response.ok && data.reply) {
                botReplyText = data.reply;
            } else {
                botReplyText = data.error || "I'm having trouble responding right now. Please try again.";
            }

            const botMessage = {
                sender: 'Bot',
                text: botReplyText,
                phase: currentPhase,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, botMessage]);
            await saveMessageToDb(botMessage);
        } catch (error) {
            console.error('Failed to get AI response:', error);
            const errorMessage = {
                sender: 'Bot',
                text: "I'm having trouble connecting. Please check your connection and try again.",
                phase: currentPhase,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
            await saveMessageToDb(errorMessage);
        } finally {
            setIsTyping(false);
        }
    };


    const getStepClass = (stepPhase) => {
        const steps = ['Empathize', 'Define', 'Ideate', 'Prototype', 'Test'];
        const currentIndex = steps.indexOf(currentPhase);
        const stepIndex = steps.indexOf(stepPhase);

        if (stepIndex === currentIndex) {
            return "bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-110 border-2 border-blue-400";
        } else if (stepIndex < currentIndex) {
            return "bg-green-500 text-white border-2 border-green-400";
        } else {
            return "bg-white/10 text-slate-500 border-2 border-slate-700";
        }
    };

    // Show loading state while phase is being fetched
    if (isLoadingPhase) {
        return (
            <div className="bg-[#0f172a] text-white font-sans h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#0f172a] text-slate-200 font-sans h-screen flex flex-col overflow-hidden relative selection:bg-purple-500/30">
            {/* Background Drops */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
            </div>

            {/* Modal Layer */}
            <div className="relative z-50">
                {/* Phase Change Confirmation Modal */}
                {showConfirmModal && (() => {
                    const uncheckedItems = getUncheckedItems(currentPhase, stageData);
                    const hasUnchecked = uncheckedItems.length > 0;

                    return (
                        <div className="fixed inset-0 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={cancelPhaseChange}></div>
                            <div className="relative glass-card bg-[#1e293b] rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200">
                                <div className="flex justify-center mb-6">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${hasUnchecked ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                        <span className="text-3xl">{hasUnchecked ? '⚠️' : '🚀'}</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-center text-white mb-2">Move to {pendingPhase}?</h3>
                                <p className="text-slate-400 text-center mb-6">
                                    {hasUnchecked ? (
                                        <>You have <strong className="text-amber-500">{uncheckedItems.length} unchecked tasks</strong> in {currentPhase}.</>
                                    ) : (
                                        <>Great job! All tasks in {currentPhase} are complete.</>
                                    )}
                                </p>
                                {hasUnchecked && (
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 max-h-32 overflow-y-auto custom-scrollbar">
                                        <ul className="space-y-2">
                                            {uncheckedItems.slice(0, 5).map(item => (
                                                <li key={item.key} className="flex items-center gap-3 text-sm text-amber-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                    {item.label}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div className="flex gap-4">
                                    <button onClick={cancelPhaseChange} className="flex-1 px-4 py-3 rounded-xl font-medium bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
                                        Stay Here
                                    </button>
                                    <button onClick={confirmPhaseChange} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
                                        Continue
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirmModal && (
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
                                Are you sure you want to delete <strong>{initialName}</strong>? This action <strong>cannot</strong> be undone.
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
                )}

                {/* Error Modal */}
                {showErrorModal && (
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowErrorModal(false)}></div>
                        <div className="relative glass-card bg-[#1e293b] rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 text-3xl">
                                    ✋
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-center text-white mb-2">Hold On!</h3>
                            <p className="text-slate-400 text-center mb-8">{errorMessage}</p>
                            <button onClick={() => setShowErrorModal(false)} className="w-full px-4 py-3 bg-red-500/80 text-white rounded-xl font-medium hover:bg-red-500 transition-colors">
                                Got it
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Header */}
            <header className="glass-panel border-b border-white/5 z-20 shrink-0 relative">
                <div className="w-full px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => router.push('/project-management')}>
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all text-xl">
                                {projectEmoji}
                            </div>
                            <span className="font-bold text-lg text-white tracking-tight">DesignBot</span>
                        </div>
                        <nav className="hidden md:flex items-center gap-2">
                            <button
                                onClick={() => router.push('/project-management')}
                                className="px-3 py-1 rounded-full bg-white/5 text-sm text-slate-400 border border-white/5 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all font-medium"
                            >
                                Workspace
                            </button>
                            <span className="text-slate-600">/</span>
                            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-sm text-blue-200 border border-blue-500/20">
                                {initialName}
                            </span>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Mobile Chat Toggle */}
                        <button onClick={() => setShowMobileChat(!showMobileChat)} className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            {showMobileChat ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative z-10">
                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                    <div className="max-w-5xl mx-auto">

                        {/* Phase Progress Bar */}
                        <div className="mb-10 relative">
                            <div className="absolute top-5 left-0 w-full h-0.5 bg-white/10 z-0"></div>
                            <div className="relative z-10 flex justify-between px-2">
                                {['Empathize', 'Define', 'Ideate', 'Prototype', 'Test'].map((phase, idx) => (
                                    <div key={phase} className="flex flex-col items-center cursor-pointer group" onClick={() => changePhase(phase)}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${getStepClass(phase)} group-hover:scale-110`}>
                                            {idx + 1}
                                        </div>
                                        <span className={`text-xs font-semibold mt-3 transition-colors ${phase === currentPhase ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                            {phase}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stage Content Card */}
                        <div className={`glass-card rounded-2xl p-0 overflow-hidden mb-8 transition-all duration-500`}>
                            {/* Card Header */}
                            <div className={`p-6 border-b border-white/5 bg-white/5`}>
                                <div className="flex flex-wrap justify-between items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                                            {currentPhase === 'Empathize' && '💜'}
                                            {currentPhase === 'Define' && '🎯'}
                                            {currentPhase === 'Ideate' && '💡'}
                                            {currentPhase === 'Prototype' && '🛠️'}
                                            {currentPhase === 'Test' && '🧪'}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white tracking-tight">Phase: {currentPhase}</h2>
                                            <p className="text-slate-400 text-sm">
                                                {currentPhase === 'Empathize' && 'Understand your users deeply'}
                                                {currentPhase === 'Define' && 'Define the core problem'}
                                                {currentPhase === 'Ideate' && 'Generate creative solutions'}
                                                {currentPhase === 'Prototype' && 'Build quick prototypes'}
                                                {currentPhase === 'Test' && 'Test and iterate'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={handlePrint} className="glass-button px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            Export PDF
                                        </button>
                                        <button onClick={handleDeleteProject} className="glass-button px-4 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            Delete
                                        </button>
                                        <SharePopover projectId={projectId} triggerButton={
                                            <button className="glass-button px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                                Share
                                            </button>
                                        } />
                                    </div>
                                </div>
                            </div>

                            {/* Card Content Body */}
                            <div className="p-6 md:p-8 bg-[#0f172a]/50">
                                {/* Empathize Stage - Show Empathy Map */}
                                {currentPhase === 'Empathize' && projectId && (
                                    <div className="mb-8">
                                        <EmpathizePhase projectId={projectId} data={stageData} onUpdate={setStageData} />
                                    </div>
                                )}

                                {/* Checklist for current stage */}
                                {projectId && (
                                    <div className="mb-8">
                                        <StageChecklist projectId={projectId} stage={currentPhase} data={stageData} onUpdate={setStageData} />
                                    </div>
                                )}

                                {/* Prototype Sketch Pad */}
                                {currentPhase === 'Prototype' && (
                                    <div className="mb-8">
                                        <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Prototype Sketch Pad</h4>
                                        <div className="h-[600px] rounded-xl overflow-hidden border border-white/20 shadow-lg">
                                            <SketchPad onSave={handleSketchSave} />
                                        </div>
                                    </div>
                                )}

                                {/* Test Feedback Matrix */}
                                {currentPhase === 'Test' && (
                                    <div className="mb-8">
                                        <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">User Feedback Matrix</h4>
                                        <FeedbackMatrix
                                            projectId={projectId}
                                            data={stageData?.test?.feedbackMatrix || []}
                                            onUpdate={setStageData}
                                            onExport={uploadFileToProject}
                                        />
                                    </div>
                                )}

                                {/* File Upload Area */}
                                <div className="glass-panel rounded-xl p-6 border border-dashed border-white/20 hover:border-blue-500/50 transition-colors">
                                    <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Research Files</h4>

                                    <div
                                        onClick={() => !isUploading && document.getElementById('file-upload')?.click()}
                                        className={`rounded-xl p-8 text-center cursor-pointer transition-all ${isUploading ? 'bg-white/5' : 'hover:bg-white/5'}`}
                                    >
                                        {isUploading ? (
                                            <div className="flex flex-col items-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                                                <p className="text-slate-400 text-sm">Uploading your file...</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-3">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                                </div>
                                                <p className="text-slate-300 font-medium">Click to upload or drag and drop</p>
                                                <p className="text-slate-500 text-xs">PDF, Images, Text (Max 10MB)</p>
                                            </div>
                                        )}
                                        <input id="file-upload" type="file" className="hidden" multiple onChange={handleFileUpload} disabled={isUploading} />
                                    </div>

                                    {files.length > 0 && (
                                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                                            {files.map((f, i) => (
                                                <li key={i} className="glass-button p-3 rounded-xl flex items-center justify-between group">
                                                    <div className="flex items-center min-w-0 gap-3">
                                                        <div className={`p-2 rounded-lg text-xs font-bold ${f.fileType === 'image' ? 'bg-purple-500/20 text-purple-300' : f.fileType === 'pdf' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                                            {f.fileType === 'image' ? 'IMG' : f.fileType === 'pdf' ? 'PDF' : 'DOC'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-200 hover:text-white truncate block" title={f.name}>
                                                                {f.name}
                                                            </a>
                                                            <p className="text-[10px] text-slate-500">{f.size ? (f.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleDeleteFile(f.publicId)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Chat Sidebar */}
                {isChatMinimized ? (
                    <div className="hidden lg:flex flex-col w-12 bg-[#1e293b] border-l border-white/5 items-center py-6 z-20">
                        <button onClick={() => setIsChatMinimized(false)} className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors" title="Expand Chat">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                        </button>
                        <div className="mt-8 text-slate-400 text-xs font-bold transform -rotate-90 whitespace-nowrap tracking-widest origin-center">CHAT</div>
                    </div>
                ) : (
                    <aside className={`fixed lg:relative inset-y-0 right-0 w-full sm:w-96 bg-[#1e293b]/95 backdrop-blur-xl border-l border-white/5 flex flex-col shadow-2xl z-30 transform transition-transform duration-300 ease-in-out ${showMobileChat ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>

                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#1e293b] rounded-full"></span>
                                </div>
                                <div>
                                    <h2 className="font-bold text-white text-sm">Socratic Bot</h2>
                                    <p className="text-xs text-blue-400">Design Mentor</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setIsChatMinimized(true)} className="hidden lg:block p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                                </button>
                                <button onClick={() => setShowMobileChat(false)} className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {isLoadingHistory ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                    <p className="text-sm">Loading history...</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <div key={i} className={`flex items-start gap-3 ${msg.sender !== 'Bot' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${msg.sender === 'Bot' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
                                            {msg.sender === 'Bot' ? 'AI' : 'Me'}
                                        </div>
                                        <div
                                            className={`p-3.5 rounded-2xl text-sm shadow-md max-w-[85%] leading-relaxed ${msg.sender === 'Bot'
                                                ? 'bg-white/10 text-slate-200 border border-white/5 rounded-tl-none'
                                                : 'bg-blue-600 text-white rounded-tr-none shadow-blue-500/10'
                                                }`}
                                            dangerouslySetInnerHTML={{ __html: msg.text }}
                                        ></div>
                                    </div>
                                ))
                            )}
                            {isTyping && (
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">AI</div>
                                    <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none border border-white/5 flex gap-1.5 items-center">
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Chat Input */}
                        <div className="p-4 bg-white/5 border-t border-white/5">
                            <form onSubmit={sendMessage} className="relative">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Type your answer..."
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                />
                                <button
                                    type="submit"
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${chatInput.trim() ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}
                                    disabled={!chatInput.trim()}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                </button>
                            </form>
                        </div>
                    </aside>
                )}
            </div>

            {/* Hidden PDF Export Component - Keeping original as it's for print */}
            <div style={{ display: 'none' }}>
                <ProjectPDFExport
                    ref={pdfContentRef}
                    projectName={initialName}
                    currentPhase={currentPhase}
                    stageData={stageData}
                    messages={messages}
                    createdBy={localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser'))?.username : 'Unknown'}
                    createdAt={new Date()}
                />
            </div>
        </div >
    );
}

export default function ProjectPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Loading...</div>}>
            <ProjectContent />
        </Suspense>
    );
}
