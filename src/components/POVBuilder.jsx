'use client';

import { useState, useEffect } from 'react';

export default function POVBuilder({ projectId, persona, currentUser, initialData, onPOVComplete }) {
    const [pov, setPov] = useState({
        personaName: initialData?.pov?.personaName || persona?.name || '',
        userNeed: initialData?.pov?.userNeed || '',
        insight: initialData?.pov?.insight || ''
    });
    const [hmwQuestions, setHmwQuestions] = useState(initialData?.hmwQuestions || []);
    const [selectedHmw, setSelectedHmw] = useState(initialData?.selectedHmw || null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [error, setError] = useState(null);

    const isComplete = pov.personaName && pov.userNeed && pov.insight;

    const generateHMWQuestions = async () => {
        if (!isComplete) {
            setError('Please complete all POV fields first');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            console.log('Sending HMW Request:', { user: currentUser?.username, pov });
            const response = await fetch(`/api/projects/${projectId}/generate-hmw`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: currentUser?.username || 'anonymous',
                    pov
                })
            });

            if (response.ok) {
                const data = await response.json();
                setHmwQuestions(data.hmwQuestions || []);
                setSelectedHmw(null); // Reset selection
                setIsSaved(true);

                // Success - update parent
                if (onPOVComplete) {
                    onPOVComplete({ pov, hmwQuestions: data.hmwQuestions, selectedHmw: null });
                }
                // Persist to DB
                await savePOV({ pov, hmwQuestions: data.hmwQuestions, selectedHmw: null });
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to generate HMW questions. POV saved manually.');

                // Partial success - save POV locally/parent even if AI failed
                const fallbackData = { pov, hmwQuestions: [] };
                if (onPOVComplete) {
                    onPOVComplete(fallbackData);
                }
                // Persist fallback to DB
                await savePOV(fallbackData);
                setIsSaved(true);
            }
        } catch (err) {
            console.error('Error generating HMW questions:', err);
            setError('Connection error. POV saved manually.');

            // Fallback save
            const fallbackData = { pov, hmwQuestions: [] };
            if (onPOVComplete) {
                onPOVComplete(fallbackData);
            }
            await savePOV(fallbackData);
            setIsSaved(true);
        } finally {
            setIsGenerating(false);
        }
    };

    const savePOV = async (dataToSave) => {
        try {
            const payload = {
                user: currentUser?.username || 'anonymous',
                user: currentUser?.username || 'anonymous',
                pov: dataToSave?.pov || pov,
                hmwQuestions: dataToSave?.hmwQuestions || hmwQuestions,
                selectedHmw: dataToSave?.selectedHmw || selectedHmw
            };

            const response = await fetch(`/api/projects/${projectId}/pov`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setIsSaved(true);
            }
        } catch (err) {
            console.error('Error saving POV:', err);
        }
    };

    useEffect(() => {
        if (persona?.name && !pov.personaName) {
            setPov(prev => ({ ...prev, personaName: persona.name }));
        }
    }, [persona]);

    // Update state if initialData changes (e.g. after fetch)
    useEffect(() => {
        if (initialData) {
            if (initialData.pov) {
                setPov(prev => ({
                    ...prev,
                    personaName: initialData.pov.personaName || prev.personaName,
                    userNeed: initialData.pov.userNeed || prev.userNeed,
                    insight: initialData.pov.insight || prev.insight
                }));
            }
            if (initialData.hmwQuestions?.length > 0) {
                setHmwQuestions(initialData.hmwQuestions);
            }
            if (initialData.selectedHmw) {
                setSelectedHmw(initialData.selectedHmw);
            }
        }
    }, [initialData]);

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Point of View (POV) Builder
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                    Define the problem from your user's perspective
                </p>
            </div>

            <div className="p-6 space-y-6">
                {/* POV Mad-Libs Form */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
                    <p className="text-lg leading-relaxed text-gray-800">
                        <span className="inline-block">
                            <input
                                type="text"
                                value={pov.personaName}
                                onChange={(e) => setPov({ ...pov, personaName: e.target.value })}
                                className="inline-block px-3 py-1.5 bg-white border-2 border-blue-300 rounded-lg font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-w-[150px]"
                                placeholder="Persona Name"
                            />
                        </span>
                        {' '}needs a way to{' '}
                        <span className="inline-block">
                            <input
                                type="text"
                                value={pov.userNeed}
                                onChange={(e) => setPov({ ...pov, userNeed: e.target.value })}
                                className="inline-block px-3 py-1.5 bg-white border-2 border-indigo-300 rounded-lg font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all min-w-[200px]"
                                placeholder="accomplish something"
                            />
                        </span>
                        {' '}because{' '}
                        <span className="inline-block">
                            <input
                                type="text"
                                value={pov.insight}
                                onChange={(e) => setPov({ ...pov, insight: e.target.value })}
                                className="inline-block px-3 py-1.5 bg-white border-2 border-purple-300 rounded-lg font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-w-[200px]"
                                placeholder="root cause / insight"
                            />
                        </span>
                        .
                    </p>
                </div>

                {/* Action Button */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={generateHMWQuestions}
                        disabled={!isComplete || isGenerating}
                        className={`flex-1 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${isComplete && !isGenerating
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl'
                            : 'bg-gray-300 cursor-not-allowed'
                            }`}
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating HMW Questions...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Generate "How Might We" Questions
                            </>
                        )}
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

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {/* HMW Questions Display */}
                {hmwQuestions.length > 0 && (
                    <div className="mt-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                            <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                How Might We Questions
                            </h3>
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                        </div>

                        <div className="grid gap-3">
                            {hmwQuestions.map((question, index) => (
                                <div
                                    key={index}
                                    onClick={() => {
                                        setSelectedHmw(question);
                                        savePOV({ selectedHmw: question }); // Auto-save selection
                                        if (onPOVComplete) onPOVComplete({ pov, hmwQuestions, selectedHmw: question });
                                    }}
                                    className={`relative border-l-4 rounded-r-lg p-5 cursor-pointer transition-all duration-200 group
                                        ${selectedHmw === question
                                            ? 'bg-indigo-50 border-indigo-600 shadow-md ring-2 ring-indigo-200'
                                            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-indigo-300'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                                            ${selectedHmw === question
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-200 text-gray-600 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                                            }`}
                                        >
                                            {selectedHmw === question ? '✓' : index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-medium text-lg leading-relaxed ${selectedHmw === question ? 'text-indigo-900' : 'text-gray-700'}`}>
                                                {question}
                                            </p>
                                            {selectedHmw === question && (
                                                <span className="inline-block mt-2 text-xs font-bold text-indigo-600 uppercase tracking-wide bg-indigo-100 px-2 py-1 rounded">
                                                    Selected Goal
                                                </span>
                                            )}
                                        </div>
                                        {/* Selection Radio Circle */}
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                            ${selectedHmw === question ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'}`}
                                        >
                                            {selectedHmw === question && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Helper Text */}
                {!isComplete && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                                <p className="text-blue-800 font-medium text-sm">
                                    Complete the POV statement to unlock AI-generated "How Might We" questions
                                </p>
                                <p className="text-blue-600 text-xs mt-1">
                                    These questions will help frame your ideation session
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
