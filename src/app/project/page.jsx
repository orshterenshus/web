
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SharePopover from '@/components/SharePopover';
import EmpathyMap from '@/components/EmpathyMap';
import StageChecklist from '@/components/StageChecklist';

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

function ProjectContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialName = searchParams.get('name') || 'Project';
    const initialPhase = searchParams.get('phase') || 'Empathize';
    const projectId = searchParams.get('id');

    const [currentPhase, setCurrentPhase] = useState(initialPhase);
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

    // Stage-specific data (empathy map, checklists, etc.)
    const [stageData, setStageData] = useState({});

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

    // Fetch stage data on mount
    useEffect(() => {
        const fetchStageData = async () => {
            if (!projectId) return;
            try {
                const response = await fetch(`/api/projects/${projectId}/stageData`);
                if (response.ok) {
                    const data = await response.json();
                    setStageData(data.stageData || {});
                }
            } catch (error) {
                console.error('Failed to fetch stage data:', error);
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

    const handleFileUpload = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map(file => ({
                name: file.name,
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                date: 'Just now'
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };



    const getStepClass = (stepPhase) => {
        const steps = ['Empathize', 'Define', 'Ideate', 'Prototype', 'Test'];
        const currentIndex = steps.indexOf(currentPhase);
        const stepIndex = steps.indexOf(stepPhase);

        if (stepIndex === currentIndex) {
            return "bg-blue-600 text-white";
        } else if (stepIndex < currentIndex) {
            return "bg-green-500 text-white";
        } else {
            return "bg-white border-2 border-gray-300 text-gray-500";
        }
    };

    return (
        <div className="bg-gray-50 text-gray-800 font-sans h-screen flex flex-col overflow-hidden">
            {/* Phase Change Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={cancelPhaseChange}
                    ></div>

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform transition-all animate-in fade-in zoom-in duration-200">
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                            Move to {pendingPhase}?
                        </h3>

                        {/* Description */}
                        <p className="text-gray-600 text-center mb-6">
                            Make sure you've completed the key tasks in the <strong>{currentPhase}</strong> phase before moving on.
                            You can always come back to previous phases if needed.
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={cancelPhaseChange}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                            >
                                Stay Here
                            </button>
                            <button
                                onClick={confirmPhaseChange}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
                            >
                                Yes, Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error/Info Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowErrorModal(false)}
                    ></div>

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform transition-all">
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                            Hold On! ✋
                        </h3>

                        {/* Description */}
                        <p className="text-gray-600 text-center mb-6">
                            {errorMessage}
                        </p>

                        {/* Button */}
                        <button
                            onClick={() => setShowErrorModal(false)}
                            className="w-full px-4 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}

            {/* Nav */}
            <nav className="bg-white shadow-sm border-b border-gray-200 z-10 shrink-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center font-bold text-blue-600 text-xl cursor-pointer" onClick={() => router.push('/project-management')}>
                                DesignBot
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <a href="#" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Workspace
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">Project Progress: {initialName}</h2>
                        <div className="flex items-center justify-between w-full relative">
                            <div className="absolute w-full top-1/2 transform -translate-y-1/2 bg-gray-200 h-1 z-0"></div>

                            {['Empathize', 'Define', 'Ideate', 'Prototype', 'Test'].map((phase, idx) => (
                                <div key={phase} className="relative z-10 text-center cursor-pointer" onClick={() => changePhase(phase)}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto font-bold shadow-lg transition-all ${getStepClass(phase)}`}>
                                        {idx + 1}
                                    </div>
                                    <span className="text-sm font-medium mt-2 block text-gray-600">{phase}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Phase-specific content area with dynamic colors */}
                    <div className={`rounded-xl shadow-lg p-6 mb-6 transition-colors duration-300 ${currentPhase === 'Empathize' ? 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200' :
                            currentPhase === 'Define' ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200' :
                                currentPhase === 'Ideate' ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200' :
                                    currentPhase === 'Prototype' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200' :
                                        'bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200'
                        }`}>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${currentPhase === 'Empathize' ? 'bg-purple-200' :
                                        currentPhase === 'Define' ? 'bg-blue-200' :
                                            currentPhase === 'Ideate' ? 'bg-yellow-200' :
                                                currentPhase === 'Prototype' ? 'bg-green-200' :
                                                    'bg-indigo-200'
                                    }`}>
                                    {currentPhase === 'Empathize' && '💜'}
                                    {currentPhase === 'Define' && '🎯'}
                                    {currentPhase === 'Ideate' && '💡'}
                                    {currentPhase === 'Prototype' && '🛠️'}
                                    {currentPhase === 'Test' && '🧪'}
                                </div>
                                <div>
                                    <h3 className={`text-xl font-bold ${currentPhase === 'Empathize' ? 'text-purple-800' :
                                            currentPhase === 'Define' ? 'text-blue-800' :
                                                currentPhase === 'Ideate' ? 'text-yellow-800' :
                                                    currentPhase === 'Prototype' ? 'text-green-800' :
                                                        'text-indigo-800'
                                        }`}>Phase: {currentPhase}</h3>
                                    <p className="text-sm text-gray-600">
                                        {currentPhase === 'Empathize' && 'Understand your users deeply'}
                                        {currentPhase === 'Define' && 'Define the core problem'}
                                        {currentPhase === 'Ideate' && 'Generate creative solutions'}
                                        {currentPhase === 'Prototype' && 'Build quick prototypes'}
                                        {currentPhase === 'Test' && 'Test and iterate'}
                                    </p>
                                </div>
                            </div>
                            <SharePopover
                                projectId={projectId}
                                triggerButton={
                                    <button
                                        className="flex items-center gap-2 text-sm bg-white/80 text-gray-700 px-3 py-2 rounded-md hover:bg-white transition-colors shadow"
                                    >
                                        Share Project
                                    </button>
                                }
                            />
                        </div>

                        {/* Empathize Stage - Show Empathy Map */}
                        {currentPhase === 'Empathize' && projectId && (
                            <EmpathyMap
                                projectId={projectId}
                                data={stageData}
                                onUpdate={setStageData}
                            />
                        )}

                        {/* Checklist for current stage */}
                        {projectId && (
                            <StageChecklist
                                projectId={projectId}
                                stage={currentPhase}
                                data={stageData}
                                onUpdate={setStageData}
                            />
                        )}

                        {/* File upload area */}
                        <div className="bg-white rounded-xl shadow p-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Upload Research Files</h4>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors"
                                onClick={() => document.getElementById('file-upload')?.click()}
                            >
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">Upload a file</span>
                                    {' '}or drag and drop
                                </p>
                                <input id="file-upload" type="file" className="hidden" multiple onChange={handleFileUpload} />
                            </div>

                            {files.length > 0 && (
                                <div className="mt-4">
                                    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {files.map((f, i) => (
                                            <li key={i} className="bg-gray-50 border rounded-lg p-3 flex items-center">
                                                <div className="bg-blue-100 p-2 rounded text-blue-600 font-bold text-xs">FILE</div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">{f.name}</p>
                                                    <p className="text-xs text-gray-500">{f.size}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                <aside className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl z-20">
                    <div className="p-4 border-b border-gray-200 bg-blue-600 text-white">
                        <h2 className="text-lg font-semibold">Socratic Bot</h2>
                        <p className="text-xs text-blue-100">Design Thinking Mentor</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {isLoadingHistory ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-gray-500 text-sm">Loading chat history...</div>
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className="flex items-start">
                                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${msg.sender === 'Bot' ? 'bg-blue-600' : 'bg-green-500'}`}>
                                        {msg.sender === 'Bot' ? 'Bot' : 'You'}
                                    </div>
                                    <div className="ml-3 bg-white p-3 rounded-lg shadow-sm text-sm text-gray-700 border border-gray-100"
                                        dangerouslySetInnerHTML={{ __html: msg.text }}>
                                    </div>
                                </div>
                            ))
                        )}
                        {isTyping && (
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-blue-600">
                                    Bot
                                </div>
                                <div className="ml-3 bg-white p-3 rounded-lg shadow-sm text-sm text-gray-500 border border-gray-100">
                                    <span className="animate-pulse">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-white">
                        <form onSubmit={sendMessage} className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Type a message..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                            />
                            <button type="submit" className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition">
                                Send
                            </button>
                        </form>
                    </div>
                </aside>
            </div>

        </div>
    );
}

export default function ProjectPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProjectContent />
        </Suspense>
    );
}
