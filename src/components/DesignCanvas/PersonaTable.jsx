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

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAiTab ? 'bg-purple-100' : 'bg-blue-100'}`}>
                            <span className="text-xl">{isAiTab ? '🤖' : '👤'}</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{isAiTab ? 'AI Personas' : 'User Personas'}</h3>
                            <p className="text-sm text-gray-500">{isAiTab ? 'Define the AI agent personality' : 'Define who you are designing for'}</p>
                        </div>
                    </div>

                    {/* View Switcher */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => onTabChange('user')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!isAiTab ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            User Personas
                        </button>
                        <button
                            onClick={() => onTabChange('ai')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${isAiTab ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
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
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap transition-all ${(currentActiveId === p.id)
                                    ? (isAiTab ? 'bg-purple-600 text-white shadow-md' : 'bg-blue-600 text-white shadow-md')
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                        className={`w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors disabled:opacity-50 ${isAiTab ? 'hover:bg-purple-100 hover:text-purple-600' : 'hover:bg-blue-100 hover:text-blue-600'}`}
                        title="Add Persona"
                    >
                        {isCreating ? '...' : '+'}
                    </button>
                </div>
            </div>

            {/* Content or Empty State */}
            {displayList.length === 0 ? (
                <div className="p-12 text-center bg-slate-50">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isAiTab ? 'bg-purple-100' : 'bg-blue-100'}`}>
                        <span className="text-3xl">{isAiTab ? '🤖' : '👤'}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{isAiTab ? 'No AI Personas Yet' : 'No User Personas Yet'}</h3>
                    <p className="text-gray-500 mb-6">{isAiTab ? 'Create an AI persona to simulate interactions.' : 'Create personas to represent your target audience.'}</p>
                    <button
                        onClick={handleAddPersona}
                        disabled={isCreating}
                        className={`px-6 py-3 text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isAiTab ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/30' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30'}`}
                    >
                        {isCreating ? 'Creating...' : (isAiTab ? '+ Create AI Persona' : '+ Create First Persona')}
                    </button>
                </div>
            ) : (
                <div className="p-6 bg-slate-50">
                    {activePersona ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column: Basic Info */}
                            <div className="space-y-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="relative w-20 h-20 bg-gray-100 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200 group">
                                            {activePersona.image ? (
                                                <img src={activePersona.image} alt={activePersona.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">{isAiTab ? '🤖' : '👤'}</div>
                                            )}
                                            <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
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
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={activePersona.name}
                                                onChange={(e) => handleUpdatePersona(activePersona.id, 'name', e.target.value)}
                                                onBlur={handleBlurPersona}
                                                className="w-full text-lg font-bold text-gray-800 border-none p-0 focus:ring-0 placeholder-gray-300"
                                                placeholder={isAiTab ? "AI Assistant Name" : "Jane Doe"}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{isAiTab ? 'Role & Capabilities' : 'Demographics'}</label>
                                    <textarea
                                        value={activePersona.demographics}
                                        onChange={(e) => handleUpdatePersona(activePersona.id, 'demographics', e.target.value)}
                                        onBlur={handleBlurPersona}
                                        className="w-full text-sm text-gray-600 border-none p-0 focus:ring-0 placeholder-gray-300 resize-none h-20"
                                        placeholder={isAiTab ? "What is the AI's primary function and role?" : "Age, Occupation, Location, Education..."}
                                    />
                                </div>

                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{isAiTab ? 'Personality / Tone' : 'Bio / Story'}</label>
                                    <textarea
                                        value={activePersona.bio}
                                        onChange={(e) => handleUpdatePersona(activePersona.id, 'bio', e.target.value)}
                                        onBlur={handleBlurPersona}
                                        className="w-full text-sm text-gray-600 border-none p-0 focus:ring-0 placeholder-gray-300 resize-none h-32"
                                        placeholder={isAiTab ? "Friendly, Professional, Sarcastic, etc." : "A short background story about this persona..."}
                                    />
                                </div>
                            </div>

                            {/* Right Column: Needs & Pain Points */}
                            <div className="space-y-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group">
                                    <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${isAiTab ? 'bg-purple-500' : 'bg-green-500'}`}></div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ml-2 ${isAiTab ? 'text-purple-600' : 'text-green-600'}`}>{isAiTab ? 'Goals & Objectives' : 'Needs & Goals'}</label>
                                    <textarea
                                        value={activePersona.needs}
                                        onChange={(e) => handleUpdatePersona(activePersona.id, 'needs', e.target.value)}
                                        onBlur={handleBlurPersona}
                                        className="w-full text-sm text-gray-600 border-none p-2 focus:ring-0 placeholder-gray-300 resize-none h-32"
                                        placeholder={isAiTab ? "What is the AI trying to solve?" : "What are they trying to achieve?"}
                                    />
                                </div>

                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group">
                                    <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${isAiTab ? 'bg-indigo-500' : 'bg-red-500'}`}></div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ml-2 ${isAiTab ? 'text-indigo-500' : 'text-red-500'}`}>{isAiTab ? 'Constraints & Limitations' : 'Frustrations & Pain Points'}</label>
                                    <textarea
                                        value={activePersona.frustrations}
                                        onChange={(e) => handleUpdatePersona(activePersona.id, 'frustrations', e.target.value)}
                                        onBlur={handleBlurPersona}
                                        className="w-full text-sm text-gray-600 border-none p-2 focus:ring-0 placeholder-gray-300 resize-none h-32"
                                        placeholder={isAiTab ? "What are the boundaries?" : "What prevents them from achieving their goals?"}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            Select a {isAiTab ? 'AI persona' : 'user persona'} to edit
                        </div>
                    )}

                    {activePersona && (
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => handleDeleteClick(activePersona.id)}
                                className="text-red-400 text-sm hover:text-red-600 font-medium flex items-center gap-1"
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
