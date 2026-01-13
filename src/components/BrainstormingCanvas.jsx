'use client';

import { useState, useRef, useEffect } from 'react';

export default function BrainstormingCanvas({ projectId, currentUser, onIdeasUpdated }) {
    const [ideas, setIdeas] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [selectedIdea, setSelectedIdea] = useState(null);
    const [draggedIdea, setDraggedIdea] = useState(null);
    const [isSaved, setIsSaved] = useState(false);
    const canvasRef = useRef(null);

    const colors = [
        { bg: 'bg-yellow-200', border: 'border-yellow-400', text: 'text-yellow-900' },
        { bg: 'bg-pink-200', border: 'border-pink-400', text: 'text-pink-900' },
        { bg: 'bg-blue-200', border: 'border-blue-400', text: 'text-blue-900' },
        { bg: 'bg-green-200', border: 'border-green-400', text: 'text-green-900' },
        { bg: 'bg-purple-200', border: 'border-purple-400', text: 'text-purple-900' },
        { bg: 'bg-orange-200', border: 'border-orange-400', text: 'text-orange-900' }
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

        setIdeas(prev => [...prev, newIdea]);
        setInputValue('');
        setIsSaved(false);

        if (onIdeasUpdated) {
            onIdeasUpdated([...ideas, newIdea]);
        }
    };

    const deleteIdea = (id) => {
        setIdeas(prev => prev.filter(idea => idea.id !== id));
        setSelectedIdea(null);
        setIsSaved(false);
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

        // Combine ideas
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

        setIdeas(prev => [
            ...prev.filter(i => i.id !== draggedIdea.id && i.id !== targetIdea.id),
            combinedIdea
        ]);

        setDraggedIdea(null);
        setIsSaved(false);
    };

    const handleCanvasDrop = (e) => {
        e.preventDefault();
        if (!draggedIdea || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setIdeas(prev => prev.map(idea =>
            idea.id === draggedIdea.id
                ? { ...idea, position: { x: Math.max(0, Math.min(95, x)), y: Math.max(0, Math.min(95, y)) } }
                : idea
        ));

        setDraggedIdea(null);
        setIsSaved(false);
    };

    const saveIdeas = async () => {
        try {
            const response = await fetch(`/api/projects/${projectId}/ideas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: currentUser.username,
                    ideas
                })
            });

            if (response.ok) {
                setIsSaved(true);
            }
        } catch (err) {
            console.error('Error saving ideas:', err);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Brainstorming Canvas
                        </h2>
                        <p className="text-white text-sm mt-1 flex items-center gap-4">
                            <span>💡 {ideas.length} ideas</span>
                            <span className="opacity-75">Drag notes onto each other to combine ideas</span>
                        </p>
                    </div>

                    {ideas.length > 0 && (
                        <button
                            onClick={saveIdeas}
                            className="px-4 py-2 bg-white text-orange-600 rounded-lg font-bold hover:bg-orange-50 transition-colors shadow-lg flex items-center gap-2"
                        >
                            {isSaved ? (
                                <>
                                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Saved
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    Save
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-4">
                {/* Quick Add Input */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addIdea()}
                        placeholder="Type your idea and press Enter..."
                        className="flex-1 px-4 py-3 border-2 border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg"
                    />
                    <button
                        onClick={addIdea}
                        className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-bold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                        + Add Sticky Note
                    </button>
                </div>

                {/* Canvas */}
                <div
                    ref={canvasRef}
                    onDragOver={handleDragOver}
                    onDrop={handleCanvasDrop}
                    className="relative w-full h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                        backgroundSize: '30px 30px'
                    }}
                >
                    {ideas.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <p className="text-lg font-medium">Start brainstorming!</p>
                                <p className="text-sm mt-1">Add your first sticky note above</p>
                            </div>
                        </div>
                    )}

                    {ideas.map(idea => (
                        <div
                            key={idea.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, idea)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, idea)}
                            onClick={() => setSelectedIdea(idea)}
                            className={`absolute w-48 p-4 rounded-lg shadow-lg cursor-move transition-all duration-200 hover:shadow-2xl hover:scale-105 border-l-4 ${idea.color.bg} ${idea.color.border} ${selectedIdea?.id === idea.id ? 'ring-4 ring-blue-400 scale-105' : ''
                                } ${draggedIdea?.id === idea.id ? 'opacity-50' : ''}`}
                            style={{
                                left: `${idea.position.x}%`,
                                top: `${idea.position.y}%`,
                                transform: `rotate(${Math.random() * 6 - 3}deg)`
                            }}
                        >
                            {idea.combined && (
                                <div className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                                    ★
                                </div>
                            )}
                            <p className={`text-sm font-medium ${idea.color.text} break-words`}>
                                {idea.text}
                            </p>
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-300">
                                <span className="text-xs text-gray-600 font-medium">
                                    {idea.createdBy}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteIdea(idea.id);
                                    }}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Instructions */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        How to use:
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>✏️ Type an idea and press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">Enter</kbd> to create a sticky note</li>
                        <li>🖱️ Drag notes around the canvas to organize them</li>
                        <li>🔀 Drag one note onto another to combine ideas (creates a starred note)</li>
                        <li>🗑️ Click the trash icon to delete a note</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
