'use client';

import { useState } from 'react';

export default function AISpark({ projectId, pov, currentUser, onIdeaGenerated }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedIdeas, setGeneratedIdeas] = useState([]);
    const [selectedTechnique, setSelectedTechnique] = useState(null);
    const [showTechniques, setShowTechniques] = useState(false);
    const [sparkMode, setSparkMode] = useState('standard'); // 'standard' | 'cross-domain'

    const techniques = [
        {
            id: 'scamper',
            name: 'SCAMPER',
            icon: '🔄',
            description: 'Substitute, Combine, Adapt, Modify, Put to another use, Eliminate, Reverse',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            id: 'reversal',
            name: 'Reversal',
            icon: '🔁',
            description: 'Think opposite - What if we did the exact reverse?',
            color: 'from-purple-500 to-pink-500'
        },
        {
            id: 'exaggeration',
            name: 'Exaggeration',
            icon: '📈',
            description: 'Amplify features to extreme levels',
            color: 'from-orange-500 to-red-500'
        },
        {
            id: 'random',
            name: 'Random Word',
            icon: '🎲',
            description: 'Connect random concepts to spark creativity',
            color: 'from-green-500 to-emerald-500'
        },
        {
            id: 'analogy',
            name: 'Analogy',
            icon: '🔗',
            description: 'Draw inspiration from different fields',
            color: 'from-indigo-500 to-purple-500'
        },
        {
            id: 'provocation',
            name: 'Provocation',
            icon: '⚡',
            description: 'Make bold, provocative statements to break patterns',
            color: 'from-yellow-500 to-orange-500'
        }
    ];

    const generateIdea = async (technique = null) => {
        setIsGenerating(true);
        const techniqueToUse = technique || selectedTechnique;

        try {
            const response = await fetch(`/api/projects/${projectId}/ai-spark`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: currentUser.username,
                    pov,
                    user: currentUser.username,
                    pov,
                    technique: techniqueToUse,
                    mode: sparkMode
                })
            });

            if (response.ok) {
                const data = await response.json();
                const newIdeas = data.ideas || [];

                setGeneratedIdeas(prev => [...newIdeas, ...prev]);

                if (onIdeaGenerated && newIdeas.length > 0) {
                    newIdeas.forEach(idea => onIdeaGenerated(idea));
                }
            }
        } catch (err) {
            console.error('Error generating ideas:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToCanvas = (idea) => {
        if (onIdeaGenerated) {
            onIdeaGenerated(idea.text);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 px-6 py-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI Spark - Creative Assistant
                </h2>
                <p className="text-pink-100 text-sm mt-1">
                    Feeling stuck? Let AI help you break through creative blocks
                </p>
            </div>

            <div className="p-6 space-y-6">
                {/* Mode Selection */}
                <div className="flex justify-center mb-4">
                    <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
                        <button
                            onClick={() => setSparkMode('standard')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${sparkMode === 'standard'
                                ? 'bg-white text-purple-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Standard Spark
                        </button>
                        <button
                            onClick={() => setSparkMode('cross-domain')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${sparkMode === 'cross-domain'
                                ? 'bg-white text-purple-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Cross-Domain Mashup 🧬
                        </button>
                    </div>
                </div>

                {/* Quick Spark Button */}
                <div className="flex flex-col items-center gap-3">
                    <button
                        onClick={() => generateIdea(null)}
                        disabled={isGenerating}
                        className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        <div className="relative flex items-center justify-center gap-3">
                            {isGenerating ? (
                                <>
                                    <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating Ideas...
                                </>
                            ) : (
                                <>
                                    <span className="text-2xl">⚡</span>
                                    Stuck? Get AI Ideas!
                                    <span className="text-2xl">💡</span>
                                </>
                            )}
                        </div>
                    </button>

                    <button
                        onClick={() => setShowTechniques(!showTechniques)}
                        className="mt-3 text-sm text-purple-600 hover:text-purple-800 underline font-medium"
                    >
                        {showTechniques ? '▼ Hide' : '▶'} Choose Specific Technique
                    </button>
                </div>

                {/* Technique Selection */}
                {showTechniques && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {techniques.map(technique => (
                            <button
                                key={technique.id}
                                onClick={() => {
                                    setSelectedTechnique(technique.id);
                                    generateIdea(technique.id);
                                }}
                                disabled={isGenerating}
                                className={`group relative p-4 rounded-xl bg-gradient-to-br ${technique.color} text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden`}
                            >
                                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                <div className="relative">
                                    <div className="text-3xl mb-2">{technique.icon}</div>
                                    <h3 className="font-bold text-lg mb-1">{technique.name}</h3>
                                    <p className="text-xs text-white/90">{technique.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Generated Ideas */}
                {generatedIdeas.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent flex-1"></div>
                            <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                                <span className="text-2xl">✨</span>
                                AI-Generated Ideas
                            </h3>
                            <div className="h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent flex-1"></div>
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {generatedIdeas.map((idea, index) => (
                                <div
                                    key={index}
                                    className="group bg-gradient-to-r from-purple-50 via-pink-50 to-red-50 border-2 border-purple-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:border-purple-400"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                                            {index + 1}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-gray-800 font-medium flex-1">
                                                    {idea.text}
                                                </p>
                                                <button
                                                    onClick={() => copyToCanvas(idea)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 bg-purple-600 text-white text-xs rounded-full hover:bg-purple-700 flex items-center gap-1 whitespace-nowrap"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    Add to Canvas
                                                </button>
                                            </div>

                                            {idea.technique && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full font-medium">
                                                        {techniques.find(t => t.id === idea.technique)?.icon} {techniques.find(t => t.id === idea.technique)?.name}
                                                    </span>
                                                </div>
                                            )}

                                            {idea.reasoning && (
                                                <p className="text-xs text-gray-600 mt-2 italic">
                                                    💭 {idea.reasoning}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {generatedIdeas.length === 0 && !isGenerating && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-dashed border-purple-300 rounded-lg p-8 text-center">
                        <div className="text-6xl mb-4">🧠</div>
                        <p className="text-gray-600 font-medium mb-2">
                            No ideas generated yet
                        </p>
                        <p className="text-sm text-gray-500">
                            Click the "Stuck? Get AI Ideas!" button above to get started
                        </p>
                    </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-blue-800 font-medium text-sm">
                                How AI Spark Works
                            </p>
                            <p className="text-blue-600 text-xs mt-1">
                                AI analyzes your POV statement and uses lateral thinking techniques to generate creative ideas.
                                Each technique approaches the problem from a different angle to help you discover unexpected solutions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
