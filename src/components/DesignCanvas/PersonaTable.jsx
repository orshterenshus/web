'use client';

import { useState, useEffect } from 'react';
import ConfirmationModal from '../Shared/ConfirmationModal';

export default function PersonaTable({ projectId, data, onUpdate, activePersonaId, onPersonaSelect, activeAiPersonaId, onAiPersonaSelect, activeTab, onTabChange }) {
    const [personas, setPersonas] = useState([]);
    const [aiPersonas, setAiPersonas] = useState([]);
    // activeTab is now a prop: 'user' or 'ai'
    const [isCreating, setIsCreating] = useState(false);

    // Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [personaToDelete, setPersonaToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (data?.empathize) {
            if (data.empathize.personas) setPersonas(data.empathize.personas);
            if (data.empathize.aiPersonas) setAiPersonas(data.empathize.aiPersonas);
        }
    }, [data]);

    const handleAddPersona = async () => {
        setIsCreating(true);
        const isAi = activeTab === 'ai';
        const newPersona = {
            id: Date.now().toString(),
            name: isAi ? 'New AI Persona' : 'New User Persona',
            demographics: '', // or 'System Config' for AI? keeping simple for now
            bio: '',
            needs: '',
            frustrations: '',
            image: null
        };

        const currentList = isAi ? aiPersonas : personas;
        const updatedList = [...currentList, newPersona];
        const fieldName = isAi ? 'aiPersonas' : 'personas';

        await updateData(updatedList, fieldName);

        // Select the new persona (if we want to auto-select, we need a way to bubble this up if it was creating a user persona)
        if (!isAi) {
            onPersonaSelect(newPersona.id);
        } else {
            if (onAiPersonaSelect) onAiPersonaSelect(newPersona.id);
        }
        setIsCreating(false);
    };

    const handleUpdatePersona = (id, field, value) => {
        const isAi = activeTab === 'ai';
        const currentList = isAi ? aiPersonas : personas;

        const updatedList = currentList.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        );

        if (isAi) {
            setAiPersonas(updatedList);
        } else {
            setPersonas(updatedList);
        }
    };

    const handleBlurPersona = () => {
        // Save on blur
        const isAi = activeTab === 'ai';
        const currentList = isAi ? aiPersonas : personas;
        const fieldName = isAi ? 'aiPersonas' : 'personas';
        updateData(currentList, fieldName);
    }

    const handleDeleteClick = (id) => {
        setPersonaToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDeletePersona = async () => {
        if (!personaToDelete) return;

        setIsDeleting(true);

        const isAi = activeTab === 'ai';
        const currentList = isAi ? aiPersonas : personas;
        const fieldName = isAi ? 'aiPersonas' : 'personas';

        const updatedList = currentList.filter(p => p.id !== personaToDelete);

        await updateData(updatedList, fieldName);

        if (!isAi && activePersonaId === personaToDelete) {
            if (updatedList.length > 0) {
                onPersonaSelect(updatedList[0].id);
            } else {
                onPersonaSelect(null);
            }
        }

        if (isAi && activeAiPersonaId === personaToDelete) {
            if (updatedList.length > 0) {
                if (onAiPersonaSelect) onAiPersonaSelect(updatedList[0].id);
            } else {
                if (onAiPersonaSelect) onAiPersonaSelect(null);
            }
        }

        setIsDeleting(false);
        setDeleteModalOpen(false);
        setPersonaToDelete(null);
    };

    const updateData = async (updatedList, fieldName = 'personas') => {
        try {
            const response = await fetch(`/api/projects/${projectId}/stageData`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stage: 'empathize',
                    field: fieldName,
                    value: updatedList,
                    action: 'set'
                })
            });

            if (response.ok) {
                const result = await response.json();
                onUpdate(result.stageData);
            }
        } catch (error) {
            console.error('Failed to update personas:', error);
        }
    };

    // If no personas exist in current view, show empty state
    const isAiTab = activeTab === 'ai';
    const displayList = isAiTab ? aiPersonas : personas;

    // Resolve active item for edit view
    const currentActiveId = isAiTab ? activeAiPersonaId : activePersonaId;
    const activePersona = displayList.find(p => p.id === currentActiveId);

    // Auto-Generate AI Persona
    const [isGenerating, setIsGenerating] = useState(false);

    const handleAutoGeneratePersona = async () => {
        setIsGenerating(true);
        try {
            // Need project name for context - currently projectId is all we have.
            // Ideally passthrough projectName prop, but for now we can rely on ID or default.
            // Let's see if we can get the project name from parent or context.
            // For now, we'll send a default or attempt to fetch if needed, 
            // but the API handles a fallback title.

            const res = await fetch(`/api/projects/${projectId}/generate-persona`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectName: 'Current Project' })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.persona) {
                    const newPersona = data.persona;
                    const updatedList = [...aiPersonas, newPersona];

                    await updateData(updatedList, 'aiPersonas');
                    if (onAiPersonaSelect) onAiPersonaSelect(newPersona.id);
                }
            } else {
                alert('Failed to generate AI persona');
            }
        } catch (error) {
            console.error('Error auto-generating persona:', error);
            alert('Error generating persona');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="glass-panel rounded-xl shadow-lg overflow-hidden mb-8 border border-white/10">
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isAiTab ? 'bg-purple-900/30 text-purple-300 border-purple-500/30' : 'bg-blue-900/30 text-blue-300 border-blue-500/30'}`}>
                            <span className="text-xl">{isAiTab ? '🤖' : '👤'}</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-200">{isAiTab ? 'AI Personas' : 'User Personas'}</h3>
                            <p className="text-sm text-slate-400">{isAiTab ? 'Define the AI agent personality' : 'Define who you are designing for'}</p>
                        </div>
                    </div>

                    {/* View Switcher */}
                    <div className="flex bg-black/20 rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => onTabChange('user')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!isAiTab ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            User Personas
                        </button>
                        <button
                            onClick={() => onTabChange('ai')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${isAiTab ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            AI Personas
                        </button>
                    </div>
                </div>

                {/* Persona Tabs / List */}
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {displayList.map((p) => (
                        <div
                            key={p.id}
                            onClick={() => {
                                if (isAiTab) {
                                    if (onAiPersonaSelect) onAiPersonaSelect(p.id);
                                } else {
                                    onPersonaSelect(p.id);
                                }
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap transition-all border ${(currentActiveId === p.id)
                                ? (isAiTab ? 'bg-purple-600 text-white shadow-md border-purple-500' : 'bg-blue-600 text-white shadow-md border-blue-500')
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 border-white/5 hover:border-white/10'
                                }`}
                        >
                            {p.image ? (
                                <img src={p.image} alt="" className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                                <span className="text-lg">{isAiTab ? '🤖' : '👤'}</span>
                            )}
                            <span className="font-medium text-sm">{p.name || 'Untitled'}</span>
                        </div>
                    ))}
                    <button
                        onClick={handleAddPersona}
                        disabled={isCreating}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 border border-white/5 transition-colors disabled:opacity-50 ${isAiTab ? 'hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-500/30' : 'hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-500/30'}`}
                        title="Add Persona"
                    >
                        {isCreating ? '...' : '+'}
                    </button>
                </div>

                {/* AI Auto-Generate Button (Only visible in AI Tab) */}
                {isAiTab && (
                    <button
                        onClick={handleAutoGeneratePersona}
                        disabled={isGenerating || isCreating}
                        className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Auto-Generate AI Persona"
                    >
                        {isGenerating ? (
                            <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                        ) : (
                            <span>✨</span>
                        )}
                        Auto-Generate
                    </button>
                )}
            </div>

            {/* Content or Empty State */}
            {displayList.length === 0 ? (
                <div className="p-12 text-center bg-white/5 backdrop-blur-sm">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${isAiTab ? 'bg-purple-900/30 border-purple-500/30 text-purple-300' : 'bg-blue-900/30 border-blue-500/30 text-blue-300'}`}>
                        <span className="text-3xl">{isAiTab ? '🤖' : '👤'}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{isAiTab ? 'No AI Personas Yet' : 'No User Personas Yet'}</h3>
                    <p className="text-slate-400 mb-6">{isAiTab ? 'Create an AI persona to simulate interactions.' : 'Create personas to represent your target audience.'}</p>
                    <button
                        onClick={handleAddPersona}
                        disabled={isCreating}
                        className={`px-6 py-3 text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isAiTab ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/30' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30'}`}
                    >
                        {isCreating ? 'Creating...' : (isAiTab ? '+ Create AI Persona' : '+ Create First Persona')}
                    </button>
                </div>
            ) : (
                <div className="p-6 bg-white/5 backdrop-blur-sm">
                    {activePersona ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column: Basic Info */}
                            <div className="space-y-4">
                                <div className="glass-panel p-4 rounded-xl shadow-sm border border-white/10 bg-black/20">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="relative w-20 h-20 bg-white/5 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/10 group">
                                            {activePersona.image ? (
                                                <img src={activePersona.image} alt={activePersona.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-500 text-2xl">{isAiTab ? '🤖' : '👤'}</div>
                                            )}
                                            <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                <span className="text-white text-xs font-bold">Upload</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                handleUpdatePersona(activePersona.id, 'image', reader.result);
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={activePersona.name}
                                                onChange={(e) => handleUpdatePersona(activePersona.id, 'name', e.target.value)}
                                                onBlur={handleBlurPersona}
                                                className="w-full text-lg font-bold text-white bg-transparent border-none p-0 focus:ring-0 placeholder-slate-600"
                                                placeholder={isAiTab ? "AI Assistant Name" : "Jane Doe"}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-panel p-4 rounded-xl shadow-sm border border-white/10 bg-black/20">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{isAiTab ? 'Role & Capabilities' : 'Demographics'}</label>
                                    <textarea
                                        value={activePersona.demographics}
                                        onChange={(e) => handleUpdatePersona(activePersona.id, 'demographics', e.target.value)}
                                        onBlur={handleBlurPersona}
                                        className="w-full text-sm text-slate-300 bg-transparent border-none p-0 focus:ring-0 placeholder-slate-600 resize-none h-20"
                                        placeholder={isAiTab ? "What is the AI's primary function and role?" : "Age, Occupation, Location, Education..."}
                                    />
                                </div>

                                <div className="glass-panel p-4 rounded-xl shadow-sm border border-white/10 bg-black/20">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{isAiTab ? 'Personality / Tone' : 'Bio / Story'}</label>
                                    <textarea
                                        value={activePersona.bio}
                                        onChange={(e) => handleUpdatePersona(activePersona.id, 'bio', e.target.value)}
                                        onBlur={handleBlurPersona}
                                        className="w-full text-sm text-slate-300 bg-transparent border-none p-0 focus:ring-0 placeholder-slate-600 resize-none h-32"
                                        placeholder={isAiTab ? "Friendly, Professional, Sarcastic, etc." : "A short background story about this persona..."}
                                    />
                                </div>
                            </div>

                            {/* Right Column: Needs & Pain Points */}
                            <div className="space-y-4">
                                <div className="glass-panel p-4 rounded-xl shadow-sm border border-white/10 bg-black/20 relative group">
                                    <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${isAiTab ? 'bg-purple-500' : 'bg-green-500'}`}></div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ml-2 ${isAiTab ? 'text-purple-400' : 'text-green-400'}`}>{isAiTab ? 'Goals & Objectives' : 'Needs & Goals'}</label>
                                    <textarea
                                        value={activePersona.needs}
                                        onChange={(e) => handleUpdatePersona(activePersona.id, 'needs', e.target.value)}
                                        onBlur={handleBlurPersona}
                                        className="w-full text-sm text-slate-300 bg-transparent border-none p-2 focus:ring-0 placeholder-slate-600 resize-none h-32"
                                        placeholder={isAiTab ? "What is the AI trying to solve?" : "What are they trying to achieve?"}
                                    />
                                </div>

                                <div className="glass-panel p-4 rounded-xl shadow-sm border border-white/10 bg-black/20 relative group">
                                    <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${isAiTab ? 'bg-indigo-500' : 'bg-red-500'}`}></div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ml-2 ${isAiTab ? 'text-indigo-400' : 'text-red-400'}`}>{isAiTab ? 'Constraints & Limitations' : 'Frustrations & Pain Points'}</label>
                                    <textarea
                                        value={activePersona.frustrations}
                                        onChange={(e) => handleUpdatePersona(activePersona.id, 'frustrations', e.target.value)}
                                        onBlur={handleBlurPersona}
                                        className="w-full text-sm text-slate-300 bg-transparent border-none p-2 focus:ring-0 placeholder-slate-600 resize-none h-32"
                                        placeholder={isAiTab ? "What are the boundaries?" : "What prevents them from achieving their goals?"}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            Select a {isAiTab ? 'AI persona' : 'user persona'} to edit
                        </div>
                    )}

                    {activePersona && (
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => handleDeleteClick(activePersona.id)}
                                className="text-red-400 text-sm hover:text-red-300 font-medium flex items-center gap-1 bg-red-500/10 px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Delete {isAiTab ? 'AI Persona' : 'Persona'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDeletePersona}
                title={isAiTab ? "Delete AI Persona?" : "Delete Persona?"}
                message={`Are you sure you want to delete this ${isAiTab ? 'AI ' : ''}persona? This action cannot be undone.`}
                confirmText="Delete"
                isDangerous={true}
                isLoading={isDeleting}
            />
        </div>
    );
}
