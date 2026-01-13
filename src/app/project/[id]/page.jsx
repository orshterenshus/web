'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PersonaContextWidget from '@/components/PersonaContextWidget';
import POVBuilder from '@/components/POVBuilder';
import RealityBoard from '@/components/RealityBoard';
import BrainstormingCanvas from '@/components/BrainstormingCanvas';
import AISpark from '@/components/AISpark';
import PrioritizationMatrix from '@/components/PrioritizationMatrix';
import TechSpecGenerator from '@/components/TechSpecGenerator';

function DefinePhaseContent({ projectId, project, currentUser }) {
    const [povData, setPovData] = useState(project?.define?.pov || null);

    return (
        <div className="space-y-6">
            {/* Persona Context Widget */}
            {project?.define?.persona && (
                <PersonaContextWidget persona={project.define.persona} />
            )}

            {/* POV Builder */}
            <POVBuilder
                projectId={projectId}
                persona={project?.define?.persona}
                currentUser={currentUser}
                onPOVComplete={(data) => setPovData(data.pov)}
            />

            {/* Reality Board */}
            <RealityBoard
                projectId={projectId}
                pov={povData}
                currentUser={currentUser}
            />
        </div>
    );
}

function IdeatePhaseContent({ projectId, project, currentUser }) {
    const [ideas, setIdeas] = useState(project?.ideate?.ideas || []);
    const [winningConcept, setWinningConcept] = useState(project?.ideate?.prioritization?.winningConcept || null);

    const handleIdeaAdded = (newIdea) => {
        if (typeof newIdea === 'string') {
            const ideaObj = {
                id: Date.now().toString(),
                text: newIdea,
                createdBy: currentUser.username,
                createdAt: new Date()
            };
            setIdeas(prev => [...prev, ideaObj]);
        }
    };

    return (
        <div className="space-y-6">
            {/* Persona Context Widget */}
            {project?.define?.persona && (
                <PersonaContextWidget persona={project.define.persona} />
            )}

            {/* Brainstorming Canvas */}
            <BrainstormingCanvas
                projectId={projectId}
                currentUser={currentUser}
                onIdeasUpdated={setIdeas}
            />

            {/* AI Spark */}
            <AISpark
                projectId={projectId}
                pov={project?.define?.pov}
                currentUser={currentUser}
                onIdeaGenerated={handleIdeaAdded}
            />

            {/* Prioritization Matrix */}
            {ideas.length > 0 && (
                <PrioritizationMatrix
                    projectId={projectId}
                    ideas={ideas}
                    currentUser={currentUser}
                    onWinningConcept={setWinningConcept}
                />
            )}

            {/* Technical Specification Generator */}
            {winningConcept && (
                <TechSpecGenerator
                    projectId={projectId}
                    winningConcept={winningConcept}
                    pov={project?.define?.pov}
                    constraints={project?.define?.constraints}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
}

function ProjectContent() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id;

    const [project, setProject] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPhase, setCurrentPhase] = useState('Empathize');
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');

    useEffect(() => {
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) {
            router.push('/login');
            return;
        }
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        fetchProject(user);
    }, [projectId]);

    const fetchProject = async (user) => {
        const username = user?.username || currentUser?.username;
        if (!username) {
            setError('User not found');
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`/api/projects/${projectId}?user=${encodeURIComponent(username)}`);
            if (res.ok) {
                const projectData = await res.json();
                setProject(projectData);
                setCurrentPhase(projectData.phase);

                const loadedMessages = projectData.messages || [];
                if (loadedMessages.length === 0) {
                    setMessages([
                        { sender: 'Bot', text: `Hello! I'm your AI assistant for the <strong>${projectData.phase}</strong> phase. How can I help you today?` }
                    ]);
                } else {
                    setMessages(loadedMessages);
                }
            } else if (res.status === 404) {
                setError('Project not found');
            } else if (res.status === 403) {
                setError('You do not have access to this project');
            } else {
                setError('Failed to load project');
            }
        } catch (error) {
            console.error('Failed to fetch project', error);
            setError('Failed to load project');
        } finally {
            setLoading(false);
        }
    };

    const changePhase = async (phase) => {
        const formattedPhase = phase.charAt(0).toUpperCase() + phase.slice(1);
        setCurrentPhase(formattedPhase);

        try {
            const res = await fetch(`/api/projects/${projectId}?user=${encodeURIComponent(currentUser.username)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phase: formattedPhase }),
            });
            if (!res.ok) {
                console.error('Failed to update phase');
            }
        } catch (error) {
            console.error('Error updating phase', error);
        }

        setMessages(prev => [...prev, {
            sender: 'Bot',
            text: `Switched to <strong>${formattedPhase}</strong> phase. Let's focus on this stage!`
        }]);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const newMessage = { sender: 'You', text: chatInput, timestamp: new Date() };
        setMessages(prev => [...prev, newMessage]);
        setChatInput('');

        try {
            await fetch(`/api/projects/${projectId}?user=${encodeURIComponent(currentUser.username)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newMessage })
            });
        } catch (error) {
            console.error('Failed to save message', error);
        }

        const userText = newMessage.text;

        setTimeout(async () => {
            let botReplyText = "That's an interesting perspective. Tell me more.";
            if (userText.toLowerCase().includes('hello')) botReplyText = "Hi there! Ready to design?";

            const botMessage = { sender: 'Bot', text: botReplyText, timestamp: new Date() };
            setMessages(prev => [...prev, botMessage]);

            try {
                await fetch(`/api/projects/${projectId}?user=${encodeURIComponent(currentUser.username)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: botMessage })
                });
            } catch (error) {
                console.error('Failed to save bot message', error);
            }
        }, 1000);
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

    if (loading) return <div className="p-10 text-center">Loading project...</div>;
    if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
    if (!project) return <div className="p-10 text-center">Project not found</div>;

    return (
        <div className="bg-gray-50 text-gray-800 font-sans min-h-screen flex flex-col">
            {/* Nav */}
            <nav className="bg-white shadow-sm border-b border-gray-200 z-10 shrink-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center font-bold text-blue-600 text-xl cursor-pointer" onClick={() => router.push('/project-management')}>
                                DesignBot
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <span className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Workspace
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Side - Phase Content */}
                <main className="flex-1 overflow-y-auto">
                    {/* Phase Progress Tracker */}
                    <div className="bg-white border-b border-gray-200 px-6 py-6">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">
                            {project.name}
                        </h2>
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

                    {/* Phase-Specific Content */}
                    <div className="p-6">
                        {currentPhase === 'Define' && (
                            <DefinePhaseContent
                                projectId={projectId}
                                project={project}
                                currentUser={currentUser}
                            />
                        )}

                        {currentPhase === 'Ideate' && (
                            <IdeatePhaseContent
                                projectId={projectId}
                                project={project}
                                currentUser={currentUser}
                            />
                        )}

                        {/* Fallback for other phases */}
                        {currentPhase !== 'Define' && currentPhase !== 'Ideate' && (
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                                <div className="text-6xl mb-4">🚧</div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                    {currentPhase} Phase
                                </h3>
                                <p className="text-gray-600">
                                    Interactive tools for this phase are coming soon!
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    For now, use the chat assistant to guide you through this phase.
                                </p>
                            </div>
                        )}
                    </div>
                </main>

                {/* Right Side - Chat Assistant */}
                <aside className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl z-20">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <h2 className="text-lg font-semibold">AI Assistant</h2>
                        <p className="text-xs text-blue-100">Design Thinking Companion</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg, i) => (
                            <div key={i} className="flex items-start">
                                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${msg.sender === 'Bot' ? 'bg-blue-600' : 'bg-green-500'}`}>
                                    {msg.sender === 'Bot' ? '🤖' : '👤'}
                                </div>
                                <div className="ml-3 bg-white p-3 rounded-lg shadow-sm text-sm text-gray-700 border border-gray-100"
                                    dangerouslySetInnerHTML={{ __html: msg.text }}>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-white">
                        <form onSubmit={sendMessage} className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ask me anything..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                            />
                            <button type="submit" className="bg-blue-600 text-white rounded-full px-4 py-2 hover:bg-blue-700 transition text-sm font-medium">
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