'use client';

import { useState } from 'react';

export default function EmpathyMap({ projectId, data, onUpdate }) {
    const [newNote, setNewNote] = useState({ quadrant: null, text: '' });
    const [isAdding, setIsAdding] = useState(false);

    const quadrants = [
        { key: 'says', label: 'Says', icon: '💬', color: 'bg-purple-100 border-purple-300', textColor: 'text-purple-700' },
        { key: 'thinks', label: 'Thinks', icon: '💭', color: 'bg-pink-100 border-pink-300', textColor: 'text-pink-700' },
        { key: 'does', label: 'Does', icon: '🎯', color: 'bg-violet-100 border-violet-300', textColor: 'text-violet-700' },
        { key: 'feels', label: 'Feels', icon: '❤️', color: 'bg-rose-100 border-rose-300', textColor: 'text-rose-700' }
    ];

    const handleAddNote = async (quadrant) => {
        if (!newNote.text.trim()) return;

        setIsAdding(true);
        try {
            const noteData = {
                id: Date.now().toString(),
                text: newNote.text.trim(),
                createdAt: new Date()
            };

            const response = await fetch(`/api/projects/${projectId}/stageData`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stage: 'empathize',
                    field: `empathyMap.${quadrant}`,
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
        try {
            const response = await fetch(`/api/projects/${projectId}/stageData`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stage: 'empathize',
                    field: `empathyMap.${quadrant}`,
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
        }
    };

    const getNotes = (quadrant) => {
        return data?.empathize?.empathyMap?.[quadrant] || [];
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">🗺️</span>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Empathy Map</h3>
                    <p className="text-sm text-gray-500">Map out what your user Says, Thinks, Does, and Feels</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {quadrants.map((q) => (
                    <div
                        key={q.key}
                        className={`${q.color} border-2 rounded-xl p-4 min-h-[180px] flex flex-col`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{q.icon}</span>
                                <span className={`font-bold ${q.textColor}`}>{q.label}</span>
                            </div>
                            <button
                                onClick={() => setNewNote({ quadrant: q.key, text: '' })}
                                className={`w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center ${q.textColor} font-bold text-lg shadow-sm transition-all hover:scale-110`}
                            >
                                +
                            </button>
                        </div>

                        {/* Notes */}
                        <div className="flex-1 space-y-2 overflow-y-auto max-h-[120px]">
                            {getNotes(q.key).map((note) => (
                                <div
                                    key={note.id}
                                    className="bg-white/90 rounded-lg p-2 text-sm text-gray-700 shadow-sm group relative"
                                >
                                    <p>{note.text}</p>
                                    <button
                                        onClick={() => handleDeleteNote(q.key, note.id)}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-400 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Note Input */}
                        {newNote.quadrant === q.key && (
                            <div className="mt-3 flex gap-2">
                                <input
                                    type="text"
                                    value={newNote.text}
                                    onChange={(e) => setNewNote({ ...newNote, text: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote(q.key)}
                                    placeholder="Type a note..."
                                    className="flex-1 px-3 py-2 rounded-lg text-sm border-0 focus:ring-2 focus:ring-purple-400"
                                    autoFocus
                                />
                                <button
                                    onClick={() => handleAddNote(q.key)}
                                    disabled={isAdding}
                                    className="px-3 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50"
                                >
                                    {isAdding ? '...' : 'Add'}
                                </button>
                                <button
                                    onClick={() => setNewNote({ quadrant: null, text: '' })}
                                    className="px-2 py-2 text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
