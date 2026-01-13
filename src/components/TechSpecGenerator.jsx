'use client';

import { useState, useEffect } from 'react';

export default function TechSpecGenerator({ projectId, winningConcept, pov, constraints, currentUser, initialTechSpec }) {
    const [techSpec, setTechSpec] = useState({
        functionalRequirements: [],
        nonFunctionalRequirements: [],
        architectureDiagram: '',
        techStack: {
            frontend: '',
            backend: '',
            database: '',
            infrastructure: ''
        }
    });

    useEffect(() => {
        if (initialTechSpec) {
            setTechSpec(prev => ({
                ...prev,
                ...initialTechSpec,
                techStack: initialTechSpec.techStack || prev.techStack
            }));
        }
    }, [initialTechSpec]);

    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);
    const [inputValues, setInputValues] = useState({
        functional: '',
        nonFunctional: ''
    });
    const [isSaved, setIsSaved] = useState(false);

    const addRequirement = (type) => {
        const value = inputValues[type]?.trim();
        if (!value) return;

        setTechSpec(prev => ({
            ...prev,
            [`${type}Requirements`]: [...prev[`${type}Requirements`], value]
        }));
        setInputValues(prev => ({ ...prev, [type]: '' }));
        setIsSaved(false);
    };

    const removeRequirement = (type, index) => {
        setTechSpec(prev => ({
            ...prev,
            [`${type}Requirements`]: prev[`${type}Requirements`].filter((_, i) => i !== index)
        }));
        setIsSaved(false);
    };

    const draftRequirements = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch(`/api/projects/${projectId}/generate-techspec`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: currentUser.username,
                    winningConcept,
                    pov,
                    constraints,
                    action: 'requirements'
                })
            });

            if (response.ok) {
                const data = await response.json();
                setTechSpec(prev => ({
                    ...prev,
                    functionalRequirements: data.techSpec?.functionalRequirements || [],
                    nonFunctionalRequirements: data.techSpec?.nonFunctionalRequirements || []
                }));
                setIsGenerated(true);
            }
        } catch (err) {
            console.error('Error requirements:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const suggestArchitecture = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch(`/api/projects/${projectId}/generate-techspec`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: currentUser.username,
                    winningConcept,
                    pov,
                    constraints,
                    action: 'architecture'
                })
            });

            if (response.ok) {
                const data = await response.json();
                setTechSpec(prev => ({
                    ...prev,
                    techStack: data.techStack || prev.techStack,
                    architectureDiagram: data.architectureDiagram || prev.architectureDiagram
                }));
            }
        } catch (err) {
            console.error('Error architecture:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const saveTechSpec = async () => {
        try {
            const response = await fetch(`/api/projects/${projectId}/techspec`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: currentUser.username,
                    techSpec
                })
            });

            if (response.ok) {
                setIsSaved(true);
            }
        } catch (err) {
            console.error('Error saving tech spec:', err);
        }
    };

    const exportToPDF = () => {
        // This would trigger PDF generation
        alert('PDF export functionality would be implemented here');
    };

    const exportToMarkdown = () => {
        let markdown = `# Technical Specification\n\n`;
        markdown += `## Project Overview\n`;
        markdown += `**Winning Concept:** ${winningConcept?.text || 'N/A'}\n\n`;

        if (pov) {
            markdown += `**Problem Statement (POV):**\n`;
            markdown += `${pov.personaName} needs a way to ${pov.userNeed} because ${pov.insight}.\n\n`;
        }

        markdown += `## Functional Requirements\n\n`;
        techSpec.functionalRequirements.forEach((req, i) => {
            markdown += `${i + 1}. ${req}\n`;
        });

        markdown += `\n## Non-Functional Requirements\n\n`;
        techSpec.nonFunctionalRequirements.forEach((req, i) => {
            markdown += `${i + 1}. ${req}\n`;
        });

        markdown += `\n## Architecture Design\n\n`;
        markdown += techSpec.architecture || 'Not specified';

        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `techspec-${projectId}.md`;
        a.click();
    };

    if (!winningConcept) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-400 to-gray-500 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Technical Specification Generator
                    </h2>
                </div>
                <div className="p-12 text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <p className="text-xl font-bold text-gray-700 mb-2">Locked</p>
                    <p className="text-gray-600">
                        Complete the prioritization matrix and select a winning concept to unlock this tool.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Module 3: Requirements Definition */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Requirements Definition
                    </h2>
                    <p className="text-cyan-100 text-sm mt-1">Transform your winning concept into specific requirements</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Winning Concept Display */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-r-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="text-3xl">🏆</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800 mb-1">Winning Concept</h3>
                                <p className="text-gray-700">{winningConcept.text}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        {!isGenerated && techSpec.functionalRequirements.length === 0 ? (
                            <button
                                onClick={draftRequirements}
                                disabled={isGenerating}
                                className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                            >
                                {isGenerating ? 'Drafting...' : '✨ Draft Specs with AI'}
                            </button>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Functional */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                <h3 className="font-bold text-gray-800">Functional Requirements</h3>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 min-h-[200px] border border-gray-100">
                                <div className="space-y-2 mb-3">
                                    {techSpec.functionalRequirements.map((req, index) => (
                                        <div key={index} className="flex gap-2 text-sm bg-white p-2 rounded shadow-sm">
                                            <span className="text-blue-500 font-bold">{index + 1}.</span>
                                            <span className="text-gray-700 flex-1">{req}</span>
                                            <button onClick={() => removeRequirement('functional', index)} className="text-gray-400 hover:text-red-500">×</button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inputValues.functional}
                                        onChange={(e) => setInputValues({ ...inputValues, functional: e.target.value })}
                                        onKeyPress={(e) => e.key === 'Enter' && addRequirement('functional')}
                                        placeholder="Add requirement..."
                                        className="flex-1 px-3 py-1.5 text-sm border rounded"
                                    />
                                    <button onClick={() => addRequirement('functional')} className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm">+</button>
                                </div>
                            </div>
                        </div>

                        {/* Non-Functional */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <h3 className="font-bold text-gray-800">Non-Functional Requirements</h3>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 min-h-[200px] border border-gray-100">
                                <div className="space-y-2 mb-3">
                                    {techSpec.nonFunctionalRequirements.map((req, index) => (
                                        <div key={index} className="flex gap-2 text-sm bg-white p-2 rounded shadow-sm">
                                            <span className="text-purple-500 font-bold">{index + 1}.</span>
                                            <span className="text-gray-700 flex-1">{req}</span>
                                            <button onClick={() => removeRequirement('nonFunctional', index)} className="text-gray-400 hover:text-red-500">×</button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inputValues.nonFunctional}
                                        onChange={(e) => setInputValues({ ...inputValues, nonFunctional: e.target.value })}
                                        onKeyPress={(e) => e.key === 'Enter' && addRequirement('nonFunctional')}
                                        placeholder="Add requirement..."
                                        className="flex-1 px-3 py-1.5 text-sm border rounded"
                                    />
                                    <button onClick={() => addRequirement('nonFunctional')} className="px-3 py-1.5 bg-purple-500 text-white rounded text-sm">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Module 4: System Architecture */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        System Architecture
                    </h2>
                    <p className="text-slate-300 text-sm mt-1">Tech Stack & Data Flow</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Frontend</label>
                            <input
                                type="text"
                                value={techSpec.techStack.frontend}
                                onChange={e => setTechSpec({ ...techSpec, techStack: { ...techSpec.techStack, frontend: e.target.value } })}
                                className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:white transition-colors"
                                placeholder="e.g. React, Vue"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Backend</label>
                            <input
                                type="text"
                                value={techSpec.techStack.backend}
                                onChange={e => setTechSpec({ ...techSpec, techStack: { ...techSpec.techStack, backend: e.target.value } })}
                                className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:white transition-colors"
                                placeholder="e.g. Node.js, Python"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Database</label>
                            <input
                                type="text"
                                value={techSpec.techStack.database}
                                onChange={e => setTechSpec({ ...techSpec, techStack: { ...techSpec.techStack, database: e.target.value } })}
                                className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:white transition-colors"
                                placeholder="e.g. PostgreSQL, Mongo"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Data Flow & Architecture Description</label>
                            <button onClick={suggestArchitecture} disabled={isGenerating} className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full hover:bg-slate-200 font-bold transition-all flex items-center gap-1">
                                🤖 Suggest Architecture
                            </button>
                        </div>
                        <textarea
                            value={techSpec.architectureDiagram}
                            onChange={(e) => {
                                setTechSpec({ ...techSpec, architectureDiagram: e.target.value });
                                setIsSaved(false);
                            }}
                            placeholder="Describe how data moves through the system..."
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 min-h-[150px] font-mono text-sm bg-gray-50"
                        />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            onClick={saveTechSpec}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold shadow hover:shadow-lg hover:bg-green-700 transition-all flex items-center gap-2"
                        >
                            {isSaved ? '✓ Saved' : 'Save Full Specification'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
