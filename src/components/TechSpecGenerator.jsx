'use client';

import { useState, useEffect } from 'react';

export default function TechSpecGenerator({ projectId, winningConcept, pov, constraints, currentUser }) {
    const [techSpec, setTechSpec] = useState({
        functionalRequirements: [],
        nonFunctionalRequirements: [],
        architecture: ''
    });
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

    const generateTechSpec = async () => {
        if (!winningConcept) {
            alert('Please select a winning concept first');
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch(`/api/projects/${projectId}/generate-techspec`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: currentUser.username,
                    winningConcept,
                    pov,
                    constraints
                })
            });

            if (response.ok) {
                const data = await response.json();
                setTechSpec(data.techSpec);
                setIsGenerated(true);
            }
        } catch (err) {
            console.error('Error generating tech spec:', err);
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
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Technical Specification Generator
                        </h2>
                        <p className="text-cyan-100 text-sm mt-1">
                            Transform your winning concept into technical requirements
                        </p>
                    </div>

                    {isGenerated && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={exportToMarkdown}
                                className="px-3 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                            >
                                📄 Export MD
                            </button>
                            <button
                                onClick={exportToPDF}
                                className="px-3 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                            >
                                📑 Export PDF
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Winning Concept Display */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-r-lg p-4">
                    <div className="flex items-start gap-3">
                        <div className="text-3xl">🏆</div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-800 mb-1">Selected Winning Concept</h3>
                            <p className="text-gray-700">{winningConcept.text}</p>
                        </div>
                    </div>
                </div>

                {/* Generate Button */}
                {!isGenerated && (
                    <button
                        onClick={generateTechSpec}
                        disabled={isGenerating}
                        className="w-full px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating Technical Specification...
                            </>
                        ) : (
                            <>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Generate AI-Powered Tech Spec
                            </>
                        )}
                    </button>
                )}

                {/* Functional Requirements */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <h3 className="font-bold text-gray-700">Functional Requirements</h3>
                        <span className="text-xs text-gray-500">(What the system does)</span>
                    </div>

                    {isGenerated && techSpec.functionalRequirements.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No AI-generated requirements. Add your own below.</p>
                    )}

                    <div className="space-y-2">
                        {techSpec.functionalRequirements.map((req, index) => (
                            <div
                                key={index}
                                className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start justify-between group hover:bg-blue-100 transition-colors"
                            >
                                <div className="flex items-start gap-3 flex-1">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    <p className="text-sm text-gray-800 flex-1">{req}</p>
                                </div>
                                <button
                                    onClick={() => removeRequirement('functional', index)}
                                    className="text-red-500 hover:text-red-700 transition-colors ml-2"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputValues.functional}
                            onChange={(e) => setInputValues({ ...inputValues, functional: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && addRequirement('functional')}
                            placeholder="Add functional requirement..."
                            className="flex-1 px-4 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            onClick={() => addRequirement('functional')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Non-Functional Requirements */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <h3 className="font-bold text-gray-700">Non-Functional Requirements</h3>
                        <span className="text-xs text-gray-500">(Security, Performance, Scalability)</span>
                    </div>

                    {isGenerated && techSpec.nonFunctionalRequirements.length > 0 && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                                </svg>
                                <span className="text-sm font-bold text-purple-700">AI Suggested Requirements</span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {techSpec.nonFunctionalRequirements.map((req, index) => (
                            <div
                                key={index}
                                className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start justify-between group hover:bg-purple-100 transition-colors"
                            >
                                <div className="flex items-start gap-3 flex-1">
                                    <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    <p className="text-sm text-gray-800 flex-1">{req}</p>
                                </div>
                                <button
                                    onClick={() => removeRequirement('nonFunctional', index)}
                                    className="text-red-500 hover:text-red-700 transition-colors ml-2"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputValues.nonFunctional}
                            onChange={(e) => setInputValues({ ...inputValues, nonFunctional: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && addRequirement('nonFunctional')}
                            placeholder="Add non-functional requirement..."
                            className="flex-1 px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <button
                            onClick={() => addRequirement('nonFunctional')}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Architecture Design */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                        <h3 className="font-bold text-gray-700">Architecture High-Level Design</h3>
                        <span className="text-xs text-gray-500">(Client/Server stack, Database schema)</span>
                    </div>

                    <textarea
                        value={techSpec.architecture}
                        onChange={(e) => {
                            setTechSpec({ ...techSpec, architecture: e.target.value });
                            setIsSaved(false);
                        }}
                        placeholder="Describe the architecture (e.g., React frontend, Node.js backend, PostgreSQL database...)"
                        className="w-full px-4 py-3 border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[120px] font-mono text-sm"
                    />
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-4 pt-4">
                    <button
                        onClick={saveTechSpec}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                        Save Technical Specification
                    </button>

                    {isSaved && (
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Saved
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
