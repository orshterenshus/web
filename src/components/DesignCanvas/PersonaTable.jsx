'use client';

import { useState, useEffect } from 'react';

export default function PersonaTable({ projectId, data, onUpdate, activePersonaId, onPersonaSelect }) {
    const [personas, setPersonas] = useState([]);

    useEffect(() => {
        if (data?.empathize?.personas) {
            setPersonas(data.empathize.personas);
        }
    }, [data]);

    const handleAddPersona = () => {
        const newPersona = {
            id: Date.now().toString(),
            name: 'New Persona',
            demographics: '',
            bio: '',
            needs: '',
            demographics: '',
            bio: '',
            needs: '',
            frustrations: '',
            image: null
        };
        const updatedPersonas = [...personas, newPersona];
        updateData(updatedPersonas);
        // Select the new persona
        onPersonaSelect(newPersona.id);
    };

    const handleUpdatePersona = (id, field, value) => {
        const updatedPersonas = personas.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        );
        setPersonas(updatedPersonas); // Optimistic update
    };

    const handleBlurPersona = () => {
        // Save on blur
        updateData(personas);
    }

    const handleDeletePersona = (id) => {
        if (confirm('Are you sure you want to delete this persona?')) {
            const updatedPersonas = personas.filter(p => p.id !== id);
            updateData(updatedPersonas);

            // If we deleted the active persona, select another one
            if (activePersonaId === id) {
                if (updatedPersonas.length > 0) {
                    onPersonaSelect(updatedPersonas[0].id);
                } else {
                    onPersonaSelect(null);
                }
            }
        }
    };

    const updateData = async (updatedPersonas) => {
        try {
            const response = await fetch(`/api/projects/${projectId}/stageData`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stage: 'empathize',
                    field: 'personas',
                    value: updatedPersonas,
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

    // If no personas exist, show empty state
    if (personas.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">👤</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">User Personas</h3>
                <p className="text-gray-500 mb-6">Create personas to represent your target audience.</p>
                <button
                    onClick={handleAddPersona}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/30"
                >
                    + Create First Persona
                </button>
            </div>
        );
    }

    const activePersona = personas.find(p => p.id === activePersonaId);

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">👤</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">User Personas</h3>
                            <p className="text-sm text-gray-500">Define who you are designing for</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {personas.map((p) => (
                        <div
                            key={p.id}
                            onClick={() => onPersonaSelect(p.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap transition-all ${activePersonaId === p.id
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {p.image ? (
                                <img src={p.image} alt="" className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                                <span className="text-lg">👤</span>
                            )}
                            <span className="font-medium text-sm">{p.name || 'Untitled'}</span>
                        </div>
                    ))}
                    <button
                        onClick={handleAddPersona}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                        title="Add Persona"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 bg-slate-50">
                {activePersona && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Basic Info */}
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="relative w-20 h-20 bg-gray-100 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200 group">
                                        {activePersona.image ? (
                                            <img src={activePersona.image} alt={activePersona.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">👤</div>
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
                                            placeholder="Jane Doe"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Demographics</label>
                                <textarea
                                    value={activePersona.demographics}
                                    onChange={(e) => handleUpdatePersona(activePersona.id, 'demographics', e.target.value)}
                                    onBlur={handleBlurPersona}
                                    className="w-full text-sm text-gray-600 border-none p-0 focus:ring-0 placeholder-gray-300 resize-none h-20"
                                    placeholder="Age, Occupation, Location, Education..."
                                />
                            </div>

                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bio / Story</label>
                                <textarea
                                    value={activePersona.bio}
                                    onChange={(e) => handleUpdatePersona(activePersona.id, 'bio', e.target.value)}
                                    onBlur={handleBlurPersona}
                                    className="w-full text-sm text-gray-600 border-none p-0 focus:ring-0 placeholder-gray-300 resize-none h-32"
                                    placeholder="A short background story about this persona..."
                                />
                            </div>
                        </div>

                        {/* Right Column: Needs & Pain Points */}
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-xl"></div>
                                <label className="block text-xs font-bold text-green-600 uppercase tracking-wider mb-1 ml-2">Needs & Goals</label>
                                <textarea
                                    value={activePersona.needs}
                                    onChange={(e) => handleUpdatePersona(activePersona.id, 'needs', e.target.value)}
                                    onBlur={handleBlurPersona}
                                    className="w-full text-sm text-gray-600 border-none p-2 focus:ring-0 placeholder-gray-300 resize-none h-32"
                                    placeholder="What are they trying to achieve?"
                                />
                            </div>

                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-xl"></div>
                                <label className="block text-xs font-bold text-red-500 uppercase tracking-wider mb-1 ml-2">Frustrations & Pain Points</label>
                                <textarea
                                    value={activePersona.frustrations}
                                    onChange={(e) => handleUpdatePersona(activePersona.id, 'frustrations', e.target.value)}
                                    onBlur={handleBlurPersona}
                                    className="w-full text-sm text-gray-600 border-none p-2 focus:ring-0 placeholder-gray-300 resize-none h-32"
                                    placeholder="What prevents them from achieving their goals?"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activePersona && (
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => handleDeletePersona(activePersona.id)}
                            className="text-red-400 text-sm hover:text-red-600 font-medium flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Delete Persona
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
