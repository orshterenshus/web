'use client';

import { useState, useRef, useEffect } from 'react';

export default function BrainstormingCanvas({ projectId, currentUser, onIdeasUpdated, initialIdeas }) {
    const [ideas, setIdeas] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [selectedIdea, setSelectedIdea] = useState(null);
    const [draggedIdea, setDraggedIdea] = useState(null);
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (initialIdeas && initialIdeas.length > 0) {
            setIdeas(initialIdeas);
        }
    }, [initialIdeas]);

    const colors = [
        { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-[var(--foreground)]' },
        { bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-[var(--foreground)]' },
        { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-[var(--foreground)]' },
        { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-[var(--foreground)]' },
        { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-[var(--foreground)]' },
        { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-[var(--foreground)]' }
    ];

    const addIdea = () => {
        if (!inputValue.trim()) return;

        const newIdea = {
            id: Date.now().toString(),
            text: inputValue,
            color: colors[Math.floor(Math.random() * colors.length)],
            position: {
                x: Math.random() * 60 + 5, // Random position in percentage
                y: Math.random() * 60 + 5
            },
            createdBy: currentUser.username,
            createdAt: new Date(),
            combined: false
        };

        const newIdeas = [...ideas, newIdea];
        setIdeas(newIdeas);
        setInputValue('');
        setIsSaved(false);

        if (onIdeasUpdated) {
            onIdeasUpdated(newIdeas);
        }
        saveIdeas(newIdeas);
    };

    const deleteIdea = (id) => {
        const newIdeas = ideas.filter(idea => idea.id !== id);
        setIdeas(newIdeas);
        setSelectedIdea(null);
        setIsSaved(false);
        saveIdeas(newIdeas);
    };

    const handleDragStart = (e, idea) => {
        setDraggedIdea(idea);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetIdea) => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggedIdea || draggedIdea.id === targetIdea.id) {
            setDraggedIdea(null);
            return;
        }

        const combinedText = `${draggedIdea.text} + ${targetIdea.text}`;

        const combinedIdea = {
            id: Date.now().toString(),
            text: combinedText,
            color: { ...targetIdea.color, bg: 'bg-gradient-to-br from-purple-300 to-pink-300', border: 'border-purple-500', text: 'text-purple-900' },
            position: targetIdea.position,
            createdBy: currentUser.username,
            createdAt: new Date(),
            combined: true,
            originalIdeas: [draggedIdea.id, targetIdea.id]
        };

        const newIdeas = [
            ...ideas.filter(i => i.id !== draggedIdea.id && i.id !== targetIdea.id),
            combinedIdea
        ];

        setIdeas(newIdeas);
        setDraggedIdea(null);
        setIsSaved(false);
        saveIdeas(newIdeas);
    };

    const handleCanvasDrop = (e) => {
        e.preventDefault();
        if (!draggedIdea || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const newIdeas = ideas.map(idea =>
            idea.id === draggedIdea.id
                ? { ...idea, position: { x: Math.max(0, Math.min(95, x)), y: Math.max(0, Math.min(95, y)) } }
                : idea
        );

        setIdeas(newIdeas);
        setDraggedIdea(null);
        setIsSaved(false);
        saveIdeas(newIdeas);
    };

    const saveIdeas = async (ideasToSave = ideas) => {
        setIsSaving(true);
        setIsSaved(false);
        try {
            const response = await fetch(`/api/projects/${projectId}/ideas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: currentUser.username,
                    ideas: ideasToSave
                })
            });

            if (response.ok) {
                setIsSaved(true);
            }
        } catch (err) {
            console.error('Error saving ideas:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="glass-panel rounded-xl shadow-lg border border-[var(--glass-border)] overflow-hidden flex flex-col h-[800px]">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-600/50 via-purple-600/50 to-indigo-600/50 px-6 py-4 flex items-center justify-between text-white border-b border-[var(--glass-border)] backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                        <svg className="w-6 h-6 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Brainstorming Canvas</h2>
                        <p className="text-slate-300 text-sm flex items-center gap-2">
                            <span className="font-bold text-pink-300">{ideas.length} ideas</span>
                            <span className="opacity-75">Drag notes to organize</span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => saveIdeas()}
                    disabled={isSaving}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-sm backdrop-blur-sm"
                >
                    {isSaving ? (
                        <span>Saving...</span>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                            Save Canvas
                        </>
                    )}
                </button>
            </div>

            {/* Canvas Area (Infinite/Scrollable) */}
            <div
                ref={canvasRef}
                className="flex-1 bg-[var(--background)] relative overflow-hidden cursor-crosshair"
                style={{
                    backgroundImage: 'radial-gradient(var(--text-muted) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    opacity: 0.8
                }}
                onDragOver={handleDragOver}
                onDrop={handleCanvasDrop}
            >
                {/* Render Notes */}
                {ideas.map((idea) => {
                    // Defensive check to prevent crashes
                    if (!idea || !idea.position || typeof idea.position.x === 'undefined') return null;

                    return (
                        <div
                            key={idea.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, idea)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, idea)}
                            className={`absolute p-4 rounded-lg shadow-lg w-48 transition-transform hover:scale-105 cursor-move ${idea.color?.bg || 'bg-yellow-500/20'} ${idea.color?.border || 'border-yellow-500/50'} border-l-4 backdrop-blur-md border border-[var(--glass-border)]`}
                            style={{
                                left: `${idea.position.x}%`,
                                top: `${idea.position.y}%`,
                                transform: `rotate(${Math.random() * 6 - 3}deg)`
                            }}
                            onMouseDown={() => setSelectedIdea(idea)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold opacity-50 text-[var(--foreground)]">IDEA</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteIdea(idea.id); }}
                                    className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-500/10"
                                >
                                    ×
                                </button>
                            </div>
                            <p className={`font-medium text-sm leading-relaxed ${idea.color?.text || 'text-[var(--foreground)]'}`}>{idea.text}</p>
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="bg-[var(--card-bg)] border-t border-[var(--glass-border)] p-4 backdrop-blur-lg">
                <div className="max-w-3xl mx-auto flex gap-3">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addIdea()}
                        placeholder="Type your idea and press Enter..."
                        className="flex-1 px-4 py-3 bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 outline-none transition-all text-[var(--foreground)] placeholder-[var(--text-muted)]"
                    />
                    <button
                        onClick={addIdea}
                        className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-pink-500/20 flex items-center gap-2"
                    >
                        <span>+ Add Note</span>
                    </button>
                </div>

                {/* Helper Text */}
                <div className="max-w-3xl mx-auto mt-3 flex items-center gap-6 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                        Type & Enter to add
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        Drag to organize
                    </span>
                </div>
            </div>
        </div>
    );
}
