'use client';

import { useState } from 'react';

export default function EmpathyMap({ projectId, data, onUpdate, activePersonaId, activeAiPersonaId, activePersonaName, activeAiPersonaName, activeTab }) {
    const [newNote, setNewNote] = useState({ quadrant: null, text: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null); // Stores ID of note being deleted

    const quadrants = [
        { key: 'says', label: 'Says', icon: '💬', color: 'bg-purple-100 dark:bg-purple-500/10 border-purple-300 dark:border-purple-500/30', textColor: 'text-purple-700 dark:text-purple-300' },
        { key: 'thinks', label: 'Thinks', icon: '💭', color: 'bg-pink-100 dark:bg-pink-500/10 border-pink-300 dark:border-pink-500/30', textColor: 'text-pink-700 dark:text-pink-300' },
        { key: 'does', label: 'Does', icon: '🎯', color: 'bg-indigo-100 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/30', textColor: 'text-indigo-700 dark:text-indigo-300' },
        { key: 'feels', label: 'Feels', icon: '❤️', color: 'bg-rose-100 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30', textColor: 'text-rose-700 dark:text-rose-300' }
    ];

    // Helper to get nested field path based on wrapper structure
    // Stores scoped maps in `empathyMapScoped.[personaId].[type].[quadrant]`
    // User Persona -> empathyMaps.[userId].user.[quadrant]
    // AI Persona -> empathyMaps.[aiId].ai.[quadrant]
    const getFieldPath = (type, quadrant) => {
        const id = type === 'user' ? activePersonaId : activeAiPersonaId;
        if (!id) return null;
        return `empathyMaps.${id}.${type}.${quadrant}`;
    };

    const handleAddNote = async (quadrant) => {
        const currentId = activeTab === 'user' ? activePersonaId : activeAiPersonaId;
        if (!newNote.text.trim() || !currentId) return;

        setIsAdding(true);
        try {
            const noteData = {
                id: Date.now().toString(),
                text: newNote.text.trim(),
                createdAt: new Date()
            };

            const fieldPath = getFieldPath(activeTab, quadrant);

            const response = await fetch(`/api/projects/${projectId}/stageData`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stage: 'empathize',
                    field: fieldPath,
                    value: noteData,
                    action: 'push'
                })
            });

            if (response.ok) {
                const result = await response.json();
                onUpdate(result.stageData);
                setNewNote({ quadrant: null, text: '' });
            }
        } catch (error) {
            console.error('Failed to add note:', error);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteNote = async (quadrant, noteId) => {
        const currentId = activeTab === 'user' ? activePersonaId : activeAiPersonaId;
        if (!currentId || isDeleting) return;

        setIsDeleting(noteId);
        try {
            const fieldPath = getFieldPath(activeTab, quadrant);

            const response = await fetch(`/api/projects/${projectId}/stageData`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stage: 'empathize',
                    field: fieldPath,
                    value: { id: noteId },
                    action: 'pull'
                })
            });

            if (response.ok) {
                const result = await response.json();
                onUpdate(result.stageData);
            }
        } catch (error) {
            console.error('Failed to delete note:', error);
        } finally {
            setIsDeleting(null);
        }
    };

    const getNotes = (quadrant) => {
        const currentId = activeTab === 'user' ? activePersonaId : activeAiPersonaId;
        if (!currentId || !data?.empathize?.empathyMaps?.[currentId]) return [];

        const typeMap = data.empathize.empathyMaps[currentId][activeTab];
        return typeMap?.[quadrant] || [];
    };

    if (!activePersonaId && activeTab === 'user') return null;

    return (
        <div className="glass-panel rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-300 dark:border-purple-500/30">
                        <span className="text-xl">🗺️</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[var(--foreground)]">Empathy Map</h3>
                        <p className="text-sm text-[var(--text-muted)]">Map out what the persona Says, Thinks, Does, and Feels</p>
                    </div>
                </div>
                {/* Current Persona Indicator */}
                <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border ${activeTab === 'ai' ? 'bg-purple-600 dark:bg-purple-900/40 text-white dark:text-purple-200 border-purple-500 dark:border-purple-500/30' : 'bg-blue-600 dark:bg-blue-900/40 text-white dark:text-blue-200 border-blue-500 dark:border-blue-500/30'}`}>
                    <span>{activeTab === 'ai' ? '🤖' : '👤'}</span>
                    <span>{activeTab === 'ai' ? (activeAiPersonaName || 'AI Persona') : (activePersonaName || 'User Persona')}</span>
                </div>
            </div>

            {/* Warning if no AI persona selected */}
            {activeTab === 'ai' && !activeAiPersonaId && (
                <div className="text-center p-8 bg-purple-900/20 rounded-lg border border-purple-500/30 mb-6">
                    <p className="text-purple-300 font-medium">No AI Persona Selected</p>
                    <p className="text-sm text-purple-400 mt-1">Please create or select an AI Persona above to start mapping.</p>
                </div>
            )}

            {(activeTab === 'user' || activeAiPersonaId) && (
                <div className="grid grid-cols-2 gap-4">
                    {quadrants.map((q) => (
                        <div
                            key={q.key}
                            className={`${q.color} border rounded-xl p-4 min-h-[180px] flex flex-col backdrop-blur-sm`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{q.icon}</span>
                                    <span className={`font-bold ${q.textColor}`}>{q.label}</span>
                                </div>
                                <button
                                    className={`w-7 h-7 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] flex items-center justify-center ${q.textColor} font-bold text-lg shadow-sm transition-all hover:scale-110`}
                                >
                                    +
                                </button>
                            </div>

                            {/* Notes */}
                            <div className="flex-1 space-y-2 overflow-y-auto max-h-[120px] custom-scrollbar">
                                {getNotes(q.key).map((note) => (
                                    <div
                                        key={note.id}
                                        className="bg-[var(--card-bg)] rounded-lg p-2 pr-7 text-sm text-[var(--text-main)] font-medium shadow-sm group relative min-h-[40px] flex items-center border border-[var(--border-subtle)]"
                                    >
                                        <p className="break-words w-full">{typeof note === 'object' ? note.text : note}</p>
                                        <button
                                            onClick={() => handleDeleteNote(q.key, note.id)}
                                            disabled={isDeleting === note.id}
                                            className={`absolute top-1 right-1 w-5 h-5 rounded-full text-lg flex items-center justify-center transition-all ${isDeleting === note.id ? 'text-slate-500' : 'text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100'}`}
                                            title="Delete note"
                                        >
                                            {isDeleting === note.id ? '...' : '×'}
                                        </button>
                                    </div>
                                ))}
                                {getNotes(q.key).length === 0 && (
                                    <p className="text-xs text-slate-500 italic text-center mt-4">Empty</p>
                                )}
                            </div>

                            {/* Add Note Input */}
                            {newNote.quadrant === q.key && (
                                <div className="mt-3 flex gap-2">
                                    <input
                                        type="text"
                                        value={newNote.text}
                                        onChange={(e) => setNewNote({ ...newNote, text: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote(q.key)}
                                        className="flex-1 glass-input px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-main)]"
                                        autoFocus
                                        placeholder="Type a note..."
                                    />
                                    <button
                                        onClick={() => handleAddNote(q.key)}
                                        disabled={isAdding}
                                        className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-500 disabled:opacity-50 shadow-lg shadow-purple-500/20"
                                    >
                                        {isAdding ? '...' : 'Add'}
                                    </button>
                                    <button
                                        onClick={() => setNewNote({ quadrant: null, text: '' })}
                                        className="px-2 py-2 text-slate-400 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
