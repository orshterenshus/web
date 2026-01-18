'use client';

import { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import SharePopover from '@/components/Shared/SharePopover';
import EmpathizePhase from '@/components/DesignCanvas/EmpathizePhase';
import StageChecklist from '@/components/ProgressTracker/StageChecklist';
import ProjectPDFExport from '@/components/Shared/ProjectPDFExport';
import PersonaContextWidget from '@/components/PersonaContextWidget';
import POVBuilder from '@/components/POVBuilder';
import RealityBoard from '@/components/RealityBoard';
import BrainstormingCanvas from '@/components/BrainstormingCanvas';
import AISpark from '@/components/AISpark';
import PrioritizationMatrix from '@/components/PrioritizationMatrix';
import TechSpecGenerator from '@/components/TechSpecGenerator';
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

// Helpers for Schema Mapping (Frontend Keys <-> Backend Semantic Keys)
const mapMatrixToBackend = (matrix) => matrix ? ({
    quickWins: matrix.highLow || [],
    majorProjects: matrix.highHigh || [],
    fillIns: matrix.lowLow || [],
    thanklessTasks: matrix.lowHigh || []
}) : {};

const mapMatrixFromBackend = (matrix) => matrix ? ({
    highLow: matrix.quickWins || [],
    highHigh: matrix.majorProjects || [],
    lowLow: matrix.fillIns || [],
    lowHigh: matrix.thanklessTasks || []
}) : {};

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
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Delete Confirmation Modal State
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

    // Stage-specific data (empathy map, checklists, etc.)
    const [stageData, setStageData] = useState({});

    // Mobile chat panel toggle
    const [showMobileChat, setShowMobileChat] = useState(false);

    // Desktop chat minimized state
    const [isChatMinimized, setIsChatMinimized] = useState(false);

    // New Data States for Define & Ideate Phases
    const [currentUser, setCurrentUser] = useState(null);
    const [defineData, setDefineData] = useState(null);
    const [ideateData, setIdeateData] = useState(null);
    const [ideas, setIdeas] = useState([]);
    const [winningConcept, setWinningConcept] = useState(null);
    const [matrixData, setMatrixData] = useState({});
    const [techSpecData, setTechSpecData] = useState({});

    // UX Refactor: Progressive State
    const [showMatrix, setShowMatrix] = useState(false);

    // Resizable Sidebar State
    const [sidebarWidth, setSidebarWidth] = useState(400);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef(null);

    const startResizing = useCallback((mouseDownEvent) => {
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((mouseMoveEvent) => {
        if (isResizing) {
            const newWidth = window.innerWidth - mouseMoveEvent.clientX;
            if (newWidth > 300 && newWidth < 800) {
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    // Prevent duplicate welcome messages
    const initialFetchDone = useRef(false);

    // Auto-Open Matrix if data exists
    // (Auto-Open Logic moved to data loading effect for better hydration reliability)

    // Load current user
    useEffect(() => {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            try {
                setCurrentUser(JSON.parse(userStr));
            } catch (e) {
                console.error('Failed to parse user', e);
            }
        }
    }, []);

    const handleIdeaAdded = (newIdea) => {
        if (typeof newIdea === 'string' && currentUser) {
            const ideaObj = {
                id: Date.now().toString(),
                text: newIdea,
                color: { bg: 'bg-yellow-200', border: 'border-yellow-400', text: 'text-yellow-900' },
                position: { x: Math.random() * 60 + 5, y: Math.random() * 60 + 5 },
                createdBy: currentUser.username,
                createdAt: new Date()
            };
            setIdeas(prev => [...prev, ideaObj]);
        }
    };

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
            if (!projectId || initialFetchDone.current) {
                if (!projectId) {
                    setIsLoadingHistory(false);
                    // Show welcome message if no project ID
                    setMessages([{
                        sender: 'Bot',
                        text: getWelcomeMessage(initialPhase)
                    }]);
                }
                return;
            }

            initialFetchDone.current = true;

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
    // Fetch stage data AND saved phase on mount - ROBUST STATE RESTORATION
    // Fetch stage data AND saved phase on mount - ARCHITECTURAL REFACTOR (Separate Ideation)
    useEffect(() => {
        const fetchStageData = async () => {
            if (!projectId) return;
            try {
                // 1. Fetch Main Project Data (Legacy phases + metadata)
                const projectRes = await fetch(`/api/projects/${projectId}/stageData`, { cache: 'no-store' });
                if (projectRes.ok) {
                    const projectData = await projectRes.json();
                    setStageData(projectData.stageData || {});
                    setDefineData(projectData.define || {});
                    setCurrentPhase(projectData.phase || 'Empathize');
                }

                // 2. Fetch BRAND NEW Ideation Data Service
                const ideationRes = await fetch(`/api/ideation/${projectId}`, { cache: 'no-store' });
                if (ideationRes.ok) {
                    const ideation = await ideationRes.json();

                    // A. Restore Brainstorming
                    const notes = ideation.brainstorming?.notes || [];
                    setIdeas(notes.map(n => ({
                        ...n,
                        text: n.content,
                        position: { x: n.x, y: n.y }
                    })));

                    // B. Restore Matrix
                    const matrix = mapMatrixFromBackend(ideation.matrix);
                    setMatrixData(matrix);

                    // C. Restore Winner
                    const winner = ideation.matrix?.winningSolution;
                    if (winner) setWinningConcept(winner.content || winner);

                    // D. Restore Specs
                    if (ideation.specs) {
                        setTechSpecData({
                            functionalRequirements: ideation.specs.requirements?.functional || [],
                            nonFunctionalRequirements: ideation.specs.requirements?.nonFunctional || [],
                            techStack: {
                                frontend: ideation.specs.architecture?.frontend,
                                backend: ideation.specs.architecture?.backend,
                                database: ideation.specs.architecture?.db
                            },
                            architectureDiagram: ideation.specs.architecture?.dataFlow
                        });
                    }

                    // E. Restore Flow Visibility
                    if (ideation.brainstorming?.isFinished) {
                        setShowMatrix(true);
                    }
                }

            } catch (error) {
                console.error('❌ Failed to restore project state:', error);
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

        // Allow going back immediately - REMOVED to show confirmation modal
        /* if (targetIndex < currentIndex) {
            setCurrentPhase(formattedPhase);
            return;
        } */

        // Only allow moving to the NEXT phase (block skipping ahead) - REMOVED to allow future navigation
        /* if (targetIndex > currentIndex + 1) {
            // Show styled error modal instead of browser alert
            setErrorMessage(`Please complete the ${phases[currentIndex + 1]} phase first before moving to ${formattedPhase}.`);
            setShowErrorModal(true);
            return;
        } */

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

    // MASTER SAVE FUNCTION
    const saveIdeationState = async (updatedData = {}) => {
        if (!projectId) return;

        // Merge updatedData with current state to ensure we have the latest before saving
        const currentIdeas = updatedData.ideas || ideas;
        const currentMatrix = updatedData.matrix || matrixData;
        const currentWinner = updatedData.winningConcept !== undefined ? updatedData.winningConcept : winningConcept;
        const currentTechSpec = updatedData.techSpec || techSpecData;

        // Construct Payload matching new Schema
        // Determines Override > State
        const notesToSave = updatedData.ideas || ideas;
        const matrixToSave = updatedData.matrix || matrixData;
        const winnerToSave = updatedData.winningConcept !== undefined ? updatedData.winningConcept : winningConcept;
        const techSpecToSave = updatedData.techSpec || techSpecData;

        // Construct Payload for NEW IDEATION SCHEMA
        const payload = {
            brainstorming: {
                notes: notesToSave.map(idea => ({
                    id: idea.id,
                    content: idea.text || idea.content,
                    x: idea.position?.x,
                    y: idea.position?.y,
                    color: idea.color,
                    rotation: idea.rotation
                })),
                isFinished: showMatrix // persist visibility stage
            },
            matrix: {
                ...mapMatrixToBackend(matrixToSave),
                winningSolution: typeof winnerToSave === 'string' ? { id: 'manual', content: winnerToSave } : winnerToSave
            },
            specs: {
                requirements: {
                    functional: techSpecToSave.functionalRequirements || [],
                    nonFunctional: techSpecToSave.nonFunctionalRequirements || []
                },
                architecture: {
                    frontend: techSpecToSave.techStack?.frontend,
                    backend: techSpecToSave.techStack?.backend,
                    db: techSpecToSave.techStack?.database, // Use 'db' as per new schema
                    dataFlow: techSpecToSave.architectureDiagram
                }
            }
        };

        try {
            console.log('Using New Ideation API for Upsert...');
            await fetch(`/api/ideation/${projectId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            // Update local state if provided in args (to sync UI)
            if (updatedData.ideas) setIdeas(updatedData.ideas);
            if (updatedData.matrix) setMatrixData(updatedData.matrix);
            if (updatedData.winningConcept !== undefined) setWinningConcept(updatedData.winningConcept);
            if (updatedData.techSpec) setTechSpecData(updatedData.techSpec);

        } catch (error) {
            console.error('Master Save Failed:', error);
        }
    };



    // UX Handlers for Ideate Phase
    // UX Handlers for Ideate Phase - SCROLL FIX
    const handleFinishBrainstorming = async () => {
        setShowMatrix(true);
        await saveIdeationState({ ideas }); // Force save current ideas
        // Only scroll here, once, on user interaction (UX Fix)
        setTimeout(() => {
            document.getElementById('matrix-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
    };

    const handleWinnerSelected = (concept) => {
        setWinningConcept(concept);
        saveIdeationState({ winningConcept: concept });
        // Only scroll here
        setTimeout(() => {
            document.getElementById('specs-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
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

                {/* Success Modal */}
                {showSuccessModal && (
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)}></div>
                        <div className="relative glass-card bg-[#1e293b] rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl animate-in zoom-in duration-200">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 text-3xl">
                                    💾
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-center text-white mb-2">Progress Saved!</h3>
                            <p className="text-slate-400 text-center mb-8">Your work has been successfully saved to the cloud.</p>
                            <button onClick={() => setShowSuccessModal(false)} className="w-full px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-500 transition-colors shadow-lg shadow-green-500/20">
                                Awesome
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
                <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth pb-48 no-scrollbar">
                    <div className="max-w-5xl mx-auto">

                        {/* Phase Progress Bar - Strict Linear Flow */}
                        <div className="relative flex items-center justify-between bg-white/5 p-4 rounded-2xl mb-10 overflow-x-auto gap-4 border border-white/5 no-scrollbar">
                            {/* Continuous Line Background */}
                            <div className="absolute left-10 right-10 top-1/2 h-0.5 bg-white/10 -z-10"></div>

                            {/* Continuous Progress Line */}
                            <div
                                className="absolute left-10 top-1/2 h-0.5 bg-emerald-500/50 -z-10 transition-all duration-500 ease-in-out"
                                style={{
                                    width: `calc(${['Empathize', 'Define', 'Ideate', 'Prototype', 'Test'].indexOf(currentPhase) / 4 * 100}% - 5rem)`
                                }}
                            ></div>

                            {['Empathize', 'Define', 'Ideate', 'Prototype', 'Test'].map((phase, index) => {
                                const phases = ['Empathize', 'Define', 'Ideate', 'Prototype', 'Test'];
                                const currentPhaseIndex = phases.indexOf(currentPhase);

                                const isNextStep = index === currentPhaseIndex + 1;
                                const isActive = index === currentPhaseIndex;
                                const isPast = index < currentPhaseIndex;
                                const isClickable = true; // Always allow clicking to any phase (future/past/next)

                                return (
                                    <button
                                        key={phase}
                                        disabled={!isClickable}
                                        onClick={() => changePhase(phase)}
                                        className={`
                                            relative flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all whitespace-nowrap z-10
                                            ${isActive
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105 ring-1 ring-blue-400' // Current
                                                : isPast
                                                    ? 'bg-[#0f172a] text-emerald-400 border border-emerald-500/20 cursor-pointer hover:bg-slate-800 opacity-100 shadow-sm' // Past (Done & Clickable)
                                                    : 'bg-[#0f172a] text-slate-300 border border-white/5 cursor-pointer hover:bg-slate-800 hover:border-blue-500/30 shadow-sm' // Future (Clickable)
                                            }
                                        `}
                                    >

                                        {/* Status Indicator */}
                                        {isPast && <span>✓</span>}
                                        {isActive && <span className="animate-pulse">📍</span>}

                                        <span>{phase}</span>
                                    </button>
                                );
                            })}
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

                                {/* DEFINE PHASE COMPONENTS */}
                                {currentPhase === 'Define' && projectId && (
                                    <div className="space-y-8 mb-8">
                                        {/* Persona Widget (if available from previous step or define data) */}
                                        {/* Persona Widget (Hydrate from POV name if explicit object object won't exist on reload) */}
                                        {(() => {
                                            const activePersonaName = defineData?.persona?.name || defineData?.pov?.personaName;
                                            const activePersona = stageData?.empathize?.personas?.find(p => p.name === activePersonaName) || defineData?.persona;

                                            return activePersona ? (
                                                <PersonaContextWidget persona={activePersona} />
                                            ) : (
                                                <PersonaContextWidget persona={{ name: 'Target User' }} />
                                            );
                                        })()}

                                        <POVBuilder
                                            projectId={projectId}
                                            persona={defineData?.persona}
                                            availablePersonas={stageData?.empathize?.personas || []}
                                            initialData={defineData}
                                            currentUser={currentUser}
                                            onPersonaSelect={(persona) => {
                                                setDefineData(prev => ({ ...prev, persona }));
                                            }}
                                            onPOVComplete={(data) => {
                                                setDefineData(prev => ({
                                                    ...prev,
                                                    pov: data.pov,
                                                    hmwQuestions: data.hmwQuestions,
                                                    selectedHmw: data.selectedHmw
                                                }));
                                            }}
                                        />

                                        <RealityBoard
                                            projectId={projectId}
                                            pov={defineData?.pov}
                                            initialConstraints={defineData?.constraints}
                                            initialValidationFlags={defineData?.validationFlags}
                                            currentUser={currentUser}
                                            onConstraintsSaved={(constraints) => {
                                                setDefineData(prev => ({ ...prev, constraints }));
                                            }}
                                        />
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

                                {/* IDEATE PHASE COMPONENTS - Progressive Workflow */}
                                {currentPhase === 'Ideate' && projectId && (
                                    <div className="space-y-12 pb-32 animate-fadeIn">

                                        {/* Persona Context Reminder */}
                                        {defineData?.persona && (
                                            <div className="mb-4">
                                                <PersonaContextWidget persona={defineData.persona} />
                                            </div>
                                        )}

                                        {/* STEP 1: BRAINSTORMING (Always Visible) */}
                                        <section className="space-y-8 relative">
                                            {/* Header */}
                                            <div className="glass-panel rounded-xl p-6 border border-purple-500/30 mb-6 bg-purple-900/10">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-purple-500/20 p-3 rounded-full border border-purple-500/30">
                                                        <span className="text-2xl">⚡</span>
                                                    </div>
                                                    <div>
                                                        <h2 className="text-sm font-bold text-purple-300 uppercase tracking-wide">Step 1: Brainstorming</h2>
                                                        {defineData?.selectedHmw ? (
                                                            <p className="text-xl font-bold text-white mt-1">{defineData.selectedHmw}</p>
                                                        ) : (
                                                            <p className="text-slate-400 italic mt-1">No HMW question selected.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <BrainstormingCanvas
                                                projectId={projectId}
                                                currentUser={currentUser}
                                                onIdeasUpdated={(newIdeas) => {
                                                    setIdeas(newIdeas);
                                                    saveIdeationState({ ideas: newIdeas });
                                                }}
                                                onSave={() => saveIdeationState()}
                                                initialIdeas={ideas}
                                            />

                                            <AISpark
                                                projectId={projectId}
                                                pov={defineData?.pov}
                                                currentUser={currentUser}
                                                onIdeaGenerated={handleIdeaAdded}
                                            />

                                            {/* Transition Action to Step 2 */}
                                            {!showMatrix && ideas.length > 0 && (
                                                <div className="flex justify-center mt-12 pb-4">
                                                    <button
                                                        onClick={handleFinishBrainstorming}
                                                        className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full hover:from-blue-700 hover:to-indigo-700 hover:scale-105 shadow-xl hover:shadow-blue-500/50"
                                                    >
                                                        <span className="mr-3 text-xl">⬇️</span>
                                                        <span>Finish Brainstorming & Prioritize</span>
                                                        <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 animate-pulse"></div>
                                                    </button>
                                                </div>
                                            )}
                                        </section>

                                        {/* STEP 2: MATRIX (Conditional) */}
                                        {showMatrix && (
                                            <section id="matrix-section" className="animate-in fade-in slide-in-from-bottom-10 duration-700 relative z-10">
                                                <div className="flex items-center gap-4 mb-8 border-t border-gray-600/20 pt-12">
                                                    <div className="bg-blue-100 p-3 rounded-full shadow-lg">
                                                        <span className="text-2xl">📊</span>
                                                    </div>
                                                    <h2 className="text-3xl font-bold text-white">Step 2: Prioritize Your Ideas</h2>
                                                </div>

                                                <PrioritizationMatrix
                                                    projectId={projectId}
                                                    ideas={ideas}
                                                    currentUser={currentUser}
                                                    onWinningConcept={handleWinnerSelected}
                                                    initialPrioritizedIdeas={matrixData}
                                                    initialVotes={stageData?.ideate?.prioritization?.votes}
                                                    initialWinningConcept={winningConcept}
                                                    onMatrixUpdate={(matrix) => {
                                                        setMatrixData(matrix);
                                                        saveIdeationState({ matrix });
                                                    }}
                                                />
                                            </section>
                                        )}

                                        {/* STEP 3: SPECS & ARCH (Conditional) */}
                                        {winningConcept && (
                                            <section id="specs-section" className="animate-in fade-in slide-in-from-bottom-10 duration-700 pb-24 relative z-10">
                                                <div className="flex items-center gap-4 mb-8 border-t border-gray-600/20 pt-12">
                                                    <div className="bg-indigo-100 p-3 rounded-full shadow-lg">
                                                        <span className="text-2xl">🏗️</span>
                                                    </div>
                                                    <h2 className="text-3xl font-bold text-white">Step 3: Define & Architect</h2>
                                                </div>

                                                <TechSpecGenerator
                                                    projectId={projectId}
                                                    winningConcept={winningConcept}
                                                    pov={defineData?.pov}
                                                    constraints={defineData?.constraints}
                                                    currentUser={currentUser}
                                                    initialTechSpec={techSpecData}
                                                    onUpdate={(ts) => {
                                                        setTechSpecData(ts);
                                                    }}
                                                    onSave={() => saveIdeationState()}
                                                />

                                                {/* File Upload Section (Moved Here) */}
                                                <div className="mt-12">
                                                    <div className="glass-panel rounded-xl p-6 border border-dashed border-white/20 hover:border-blue-500/50 transition-colors">
                                                        <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Research Files</h4>
                                                        <div
                                                            onClick={() => !isUploading && document.getElementById('file-upload')?.click()}
                                                            className={`rounded-xl p-8 text-center cursor-pointer transition-all ${isUploading ? 'bg-white/5' : 'hover:bg-white/5'}`}
                                                        >
                                                            {isUploading ? (
                                                                <div className="flex flex-col items-center">
                                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                                                                    <p className="text-slate-400 text-sm">Uploading...</p>
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

                                                {/* HUGE SPACER */}
                                                <div className="w-full h-64 pointer-events-none bg-transparent"></div>
                                            </section>
                                        )}


                                        {/* FIXED ACTION BAR (Sticky Store) */}
                                        <div className="fixed bottom-0 left-0 right-0 glass-panel border-t border-white/10 bg-[#0f172a]/90 backdrop-blur-md p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-50 flex justify-between items-center px-8">
                                            <div className="text-sm text-slate-300 font-medium flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${winningConcept ? 'bg-green-500 text-green-500' : 'bg-yellow-500 text-yellow-500'}`}></span>
                                                Status: <span className="text-white">{winningConcept ? 'Architecture Phase' : showMatrix ? 'Prioritization Phase' : 'Brainstorming'}</span>
                                            </div>

                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => saveIdeationState()}
                                                    className="px-6 py-2 rounded-lg font-semibold transition-colors bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5"
                                                >
                                                    Save Draft
                                                </button>

                                                <button
                                                    onClick={() => { saveIdeationState(); setShowSuccessModal(true); }}
                                                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-green-900/20 hover:shadow-green-500/30 transform hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                                >
                                                    <span>💾</span> Save All Progress
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Checklist for Empathize, Prototype, Test phases only */}
                                {projectId && ['Empathize', 'Prototype', 'Test'].includes(currentPhase) && (
                                    <div className="mb-8">
                                        <StageChecklist projectId={projectId} stage={currentPhase} data={stageData} onUpdate={setStageData} />
                                    </div>
                                )}

                                { /* Old File Upload Removed */}
                            </div>
                        </div>
                        {/* MASSIVE SCROLL SPACER */}
                        <div className="w-full h-64 bg-transparent pointer-events-none"></div>
                    </div>
                </main>

                {/* Chat Sidebar */}
                {

                    isChatMinimized ? (
                        <div className="hidden lg:flex flex-col w-12 bg-[#1e293b] border-l border-white/5 items-center py-6 z-20">
                            <button onClick={() => setIsChatMinimized(false)} className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors" title="Expand Chat">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                            </button>
                            <div className="mt-8 text-slate-400 text-xs font-bold transform -rotate-90 whitespace-nowrap tracking-widest origin-center">CHAT</div>
                        </div>
                    ) : (
                        <aside
                            ref={sidebarRef}
                            style={{ width: showMobileChat ? '100%' : `${sidebarWidth}px` }}
                            className={`fixed lg:relative inset-y-0 right-0 bg-[#1e293b]/95 backdrop-blur-xl border-l border-white/5 flex flex-col shadow-2xl z-30 transform transition-transform duration-300 ease-in-out ${showMobileChat ? 'translate-x-0 w-full' : 'translate-x-full lg:translate-x-0'}`}
                        >
                            {/* Resize Handle */}
                            <div
                                className="hidden lg:block absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500/50 transition-colors z-50"
                                onMouseDown={startResizing}
                            ></div>

                            {/* Chat Header */}
                            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center shrink-0">
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

                            {/* Global Style for hiding scrollbar */}
                            <style jsx global>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                                {isLoadingHistory ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                        <p className="text-sm">Loading history...</p>
                                    </div>
                                ) : (
                                    messages.filter((msg, index, self) =>
                                        index === self.findIndex((t) => (
                                            t.timestamp === msg.timestamp && t.text === msg.text
                                        ))
                                    ).map((msg, i) => (
                                        <div key={i} className={`flex items-start gap-3 ${msg.sender !== 'Bot' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${msg.sender === 'Bot' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
                                                {msg.sender === 'Bot' ? 'AI' : 'Me'}
                                            </div>
                                            <div
                                                className={`p-3.5 rounded-2xl text-sm shadow-md max-w-[85%] leading-relaxed ${msg.sender === 'Bot'
                                                    ? 'bg-white/10 text-slate-200 border border-white/5 rounded-tl-none'
                                                    : 'bg-blue-600 text-white rounded-tr-none shadow-blue-500/10'
                                                    }`}
                                                dangerouslySetInnerHTML={{
                                                    __html: msg.text
                                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                                        .replace(/\n/g, '<br />')
                                                }}
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
                            <div className="p-4 bg-white/5 border-t border-white/5 shrink-0">
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
                    )
                }
            </div>

            {/* Hidden PDF Export Component - Keeping original as it's for print */}
            <div style={{ display: 'none' }}>
                <ProjectPDFExport
                    ref={pdfContentRef}
                    projectName={initialName}
                    currentPhase={currentPhase}
                    stageData={stageData}
                    defineData={defineData}
                    ideateData={{
                        ideas,
                        matrix: matrixData,
                        winningConcept,
                        techSpec: techSpecData
                    }}
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
