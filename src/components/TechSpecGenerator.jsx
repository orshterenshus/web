'use client';

import React, { useState } from 'react';

export default function TechSpecGenerator({
    projectId,
    currentUser,
    winningConcept,
    constraints,
    onUpdate,
    initialTechSpec
}) {
    // Alias to match logical names
    const winningSolution = winningConcept;
    const existingData = initialTechSpec || {
        functionalRequirements: [],
        nonFunctionalRequirements: [],
        techStack: {},
        architectureDiagram: ''
    };

    // --- STATE MANAGEMENT ---
    const [funcCount, setFuncCount] = useState(5);
    const [nonFuncCount, setNonFuncCount] = useState(3);
    const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);
    const [isLoadingArch, setIsLoadingArch] = useState(false);
    const [error, setError] = useState(null);
    const [showDiagram, setShowDiagram] = useState(false);
    const [inputValues, setInputValues] = useState({ functional: '', nonFunctional: '' });

    // Architecture State (Synced locally for inputs, prop-driven initially)
    const [techStack, setTechStack] = useState({
        frontend: existingData?.techStack?.frontend || '',
        backend: existingData?.techStack?.backend || '',
        db: existingData?.techStack?.database || '',
        dataFlow: existingData?.architectureDiagram || ''
    });

    // --- HANDLERS ---

    // Helper to Merge Updates correctly for Parent State
    const notifyParent = (partialUpdate) => {
        if (onUpdate) {
            onUpdate({ ...existingData, ...partialUpdate });
        }
    };

    // 1. Generate Requirements
    const handleDraftSpecs = async () => {
        if (!winningSolution) return;
        setIsLoadingSpecs(true);
        setError(null);

        try {
            const response = await fetch(`/api/projects/${projectId}/generate-techspec`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: currentUser?.username || 'User',
                    winningConcept: winningSolution,
                    constraints,
                    action: 'requirements',
                    funcCount,
                    nonFuncCount
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Generation failed");

            // Notify Parent
            if (data.techSpec) {
                notifyParent({
                    functionalRequirements: data.techSpec.functionalRequirements,
                    nonFunctionalRequirements: data.techSpec.nonFunctionalRequirements
                });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoadingSpecs(false);
        }
    };

    // 2. Suggest Architecture
    const handleSuggestArchitecture = async () => {
        if (!winningSolution) return;
        setIsLoadingArch(true);
        setError(null);

        try {
            // Using existing route with new action behavior
            const response = await fetch(`/api/projects/${projectId}/generate-techspec`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: currentUser?.username, // Restore required field
                    winningConcept: winningSolution,
                    constraints, // Pass constraints for context
                    action: 'architecture'
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to generate architecture");

            // CRITICAL: Update State immediately so Diagram updates
            // Map the new "architecture" response structure to our internal state
            const arch = data.architecture || {};
            const newStack = {
                frontend: arch.frontend || '',
                backend: arch.backend || '',
                db: arch.database || '', // note: backend returns 'database', state uses 'db' (mapped below)
                dataFlow: arch.description || '' // Backend returns 'description', we map to 'dataFlow'
            };

            // Update local state (mapped to match state properties)
            setTechStack({
                ...newStack,
                db: arch.database // explicit map
            });

            // Auto-save and notify parent
            if (onUpdate) {
                onUpdate({
                    techStack: {
                        frontend: newStack.frontend,
                        backend: newStack.backend,
                        database: arch.database
                    },
                    architectureDiagram: newStack.dataFlow
                });
            }

            // Auto-open the diagram to show off the result
            setShowDiagram(true);

        } catch (err) {
            console.error(err);
            setError("Architecture Error: " + err.message);
        } finally {
            setIsLoadingArch(false);
        }
    };

    // 3. Manual Update of Architecture Fields
    const handleStackChange = (field, value) => {
        const updated = { ...techStack, [field]: value };
        setTechStack(updated);

        notifyParent({
            techStack: {
                frontend: updated.frontend,
                backend: updated.backend,
                database: updated.db
            },
            architectureDiagram: updated.dataFlow
        });
    };

    // 4. Requirement List Handlers (Restored)
    const addRequirement = (type) => {
        const value = inputValues[type]?.trim();
        if (!value) return;

        const listKey = `${type}Requirements`;
        const currentList = existingData[listKey] || [];
        notifyParent({ [listKey]: [...currentList, value] });

        setInputValues({ ...inputValues, [type]: '' });
    };

    const removeRequirement = (type, index) => {
        const listKey = `${type}Requirements`;
        const currentList = existingData[listKey] || [];
        notifyParent({ [listKey]: currentList.filter((_, i) => i !== index) });
    };

    // --- RENDER HELPERS ---
    const isButtonDisabled = !winningSolution || isLoadingSpecs;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 mt-6">

            {/* SECTION A: REQUIREMENTS */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    🤖 AI Technical Specification
                </h3>

                {!winningSolution && (
                    <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded flex items-center gap-2">
                        ⚠️ Please select a "Winning Solution" in the Matrix above to unlock these tools.
                    </div>
                )}

                <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg mb-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Func. Req Qty</label>
                        <input
                            type="number" min="1" max="20"
                            value={funcCount}
                            onChange={(e) => setFuncCount(parseInt(e.target.value) || 5)}
                            className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Non-Func Qty</label>
                        <input
                            type="number" min="1" max="20"
                            value={nonFuncCount}
                            onChange={(e) => setNonFuncCount(parseInt(e.target.value) || 3)}
                            className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
                        />
                    </div>
                    <button
                        onClick={handleDraftSpecs}
                        disabled={isButtonDisabled}
                        className={`px-6 py-2 rounded-lg font-bold text-white transition-all shadow-md flex items-center gap-2 ${isButtonDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                    >
                        {isLoadingSpecs && (
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isLoadingSpecs ? 'Generating...' : 'Draft Specs with AI'}
                    </button>
                </div>

                {error && <p className="text-red-500 mt-2 text-sm bg-red-50 p-2 rounded border border-red-100">{error}</p>}

                {/* RESTORED: Requirements Lists Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Functional */}
                    <div>
                        <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <span className="text-blue-500">⚡</span> Functional
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-3 min-h-[150px] border border-gray-100">
                            <ul className="space-y-2 mb-3">
                                {existingData.functionalRequirements?.map((req, i) => (
                                    <li key={i} className="bg-white p-2 rounded shadow-sm text-sm flex gap-2 group">
                                        <span className="text-blue-500 font-bold">{i + 1}.</span>
                                        <span className="flex-1 text-gray-700">{req}</span>
                                        <button onClick={() => removeRequirement('functional', i)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100">×</button>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Add requirement..."
                                    value={inputValues.functional}
                                    onChange={e => setInputValues({ ...inputValues, functional: e.target.value })}
                                    onKeyPress={e => e.key === 'Enter' && addRequirement('functional')}
                                    className="flex-1 px-2 py-1 text-sm border rounded"
                                />
                                <button onClick={() => addRequirement('functional')} className="bg-blue-500 text-white px-2 rounded">+</button>
                            </div>
                        </div>
                    </div>

                    {/* Non-Functional */}
                    <div>
                        <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <span className="text-purple-500">🛡️</span> Non-Functional
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-3 min-h-[150px] border border-gray-100">
                            <ul className="space-y-2 mb-3">
                                {existingData.nonFunctionalRequirements?.map((req, i) => (
                                    <li key={i} className="bg-white p-2 rounded shadow-sm text-sm flex gap-2 group">
                                        <span className="text-purple-500 font-bold">{i + 1}.</span>
                                        <span className="flex-1 text-gray-700">{req}</span>
                                        <button onClick={() => removeRequirement('nonFunctional', i)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100">×</button>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Add requirement..."
                                    value={inputValues.nonFunctional}
                                    onChange={e => setInputValues({ ...inputValues, nonFunctional: e.target.value })}
                                    onKeyPress={e => e.key === 'Enter' && addRequirement('nonFunctional')}
                                    className="flex-1 px-2 py-1 text-sm border rounded"
                                />
                                <button onClick={() => addRequirement('nonFunctional')} className="bg-purple-500 text-white px-2 rounded">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION B: SYSTEM ARCHITECTURE */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-indigo-500">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">🏗️ System Architecture</h3>
                        <p className="text-sm text-gray-500">Define the Tech Stack and Data Flow</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowDiagram(!showDiagram)}
                            className={`font-semibold px-4 py-2 rounded transition-colors ${showDiagram ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            {showDiagram ? 'Hide Diagram' : 'Show Diagram 👁️'}
                        </button>
                        <button
                            onClick={handleSuggestArchitecture}
                            disabled={!winningSolution || isLoadingArch}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                        >
                            {isLoadingArch ? (
                                <>
                                    <span className="animate-spin">⚙️</span> Thinking...
                                </>
                            ) : (
                                <>
                                    <span>✨</span> Suggest Architecture
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* 1. The Visual Diagram (Conditional) */}
                {showDiagram && (
                    <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-center gap-8 animate-in zoom-in duration-300">
                        {/* Client Node */}
                        <div className="text-center group">
                            <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-sm border-2 border-blue-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <span className="text-4xl">💻</span>
                            </div>
                            <p className="font-bold text-gray-700">Client Layer</p>
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded mt-1 inline-block font-mono">
                                {techStack.frontend || '...'}
                            </span>
                        </div>

                        {/* Arrow 1 */}
                        <div className="flex flex-col items-center text-gray-400 text-xs font-mono opacity-50">
                            <span className="mb-1">Request ➔</span>
                            <div className="w-16 h-0.5 bg-gray-300"></div>
                            <span className="mt-1"> Response</span>
                        </div>

                        {/* Logic Node */}
                        <div className="text-center group">
                            <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-sm border-2 border-purple-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <span className="text-4xl">⚙️</span>
                            </div>
                            <p className="font-bold text-gray-700">Logic Layer</p>
                            <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded mt-1 inline-block font-mono">
                                {techStack.backend || '...'}
                            </span>
                        </div>

                        {/* Arrow 2 */}
                        <div className="flex flex-col items-center text-gray-400 text-xs font-mono opacity-50">
                            <span className="mb-1">Query ➔</span>
                            <div className="w-16 h-0.5 bg-gray-300"></div>
                            <span className="mt-1"> Data</span>
                        </div>

                        {/* Data Node */}
                        <div className="text-center group">
                            <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-sm border-2 border-green-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <span className="text-4xl">🛢️</span>
                            </div>
                            <p className="font-bold text-gray-700">Data Layer</p>
                            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded mt-1 inline-block font-mono">
                                {techStack.db || '...'}
                            </span>
                        </div>
                    </div>
                )}

                {/* 2. The Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Frontend</label>
                        <input
                            type="text"
                            value={techStack.frontend}
                            onChange={(e) => handleStackChange('frontend', e.target.value)}
                            placeholder="e.g. React, Vue"
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Backend</label>
                        <input
                            type="text"
                            value={techStack.backend}
                            onChange={(e) => handleStackChange('backend', e.target.value)}
                            placeholder="e.g. Node.js, Python"
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Database</label>
                        <input
                            type="text"
                            value={techStack.db}
                            onChange={(e) => handleStackChange('db', e.target.value)}
                            placeholder="e.g. MongoDB, PostgreSQL"
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                        />
                    </div>
                </div>

                {/* 3. Data Flow Text */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Data Flow & Description</label>
                    <textarea
                        rows={6}
                        value={techStack.dataFlow}
                        onChange={(e) => handleStackChange('dataFlow', e.target.value)}
                        placeholder="Explain how data moves through the system (Safety, API, Storage)..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 font-mono text-sm leading-relaxed bg-gray-50 focus:bg-white transition-colors"
                    />
                </div>
            </div>
        </div>
    );
};
