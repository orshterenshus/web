'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function POVBuilder({ onPOVComplete, initialData, projectId, currentUser, availablePersonas, onPersonaSelect, persona }) {
    const { theme } = useTheme();
    const [step, setStep] = useState(1);
    const [pov, setPov] = useState({
        personaName: initialData?.pov?.personaName || persona?.name || '',
        userNeed: initialData?.pov?.userNeed || '',
        insight: initialData?.pov?.insight || ''
    });
    const [hmwQuestions, setHmwQuestions] = useState(initialData?.hmwQuestions || []);
    const [selectedHmw, setSelectedHmw] = useState(initialData?.selectedHmw || null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAnalyzingPersona, setIsAnalyzingPersona] = useState(false); // New state for AI analysis
    const [isSaved, setIsSaved] = useState(false);
    const [error, setError] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    // Cache for AI responses: { personaName: { userNeed: '', insight: '' } }
    const povCache = useRef({});

    const isComplete = pov.personaName && pov.userNeed && pov.insight;
    const currentPersona = availablePersonas?.find(p => p.name === pov.personaName);

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

    const handleSelectPersona = async (p) => {
        setIsDropdownOpen(false);
        if (isAnalyzingPersona || pov.personaName === p.name) return;

        // Update Local State
        setPov(prev => ({ ...prev, personaName: p.name }));

        // Update Parent State (Sync Widget)
        if (onPersonaSelect) {
            onPersonaSelect(p);
        }

        // Check Cache first
        if (povCache.current[p.name]) {
            console.log('Cache hit for', p.name);
            setPov(prev => ({
                ...prev,
                userNeed: povCache.current[p.name].userNeed,
                insight: povCache.current[p.name].insight
            }));
            return;
        }

        // AI Analysis
        setIsAnalyzingPersona(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/generate-pov`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ persona: p })
            });
            if (res.ok) {
                const aiData = await res.json();
                // Update State
                setPov(prev => ({
                    ...prev,
                    personaName: p.name,
                    userNeed: aiData.userNeed,
                    insight: aiData.insight
                }));
                // Update Cache
                povCache.current[p.name] = {
                    userNeed: aiData.userNeed,
                    insight: aiData.insight
                };
            }
        } catch (err) {
            console.error('Auto-fill failed', err);
        } finally {
            setIsAnalyzingPersona(false);
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
        <div className="glass-panel rounded-xl shadow-lg border border-gray-200 dark:border-white/10 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600/50 to-indigo-600/50 px-6 py-4 border-b border-blue-200 dark:border-white/10 backdrop-blur-md">
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
                <div className="glass-panel rounded-xl p-8 border border-[var(--border-subtle)] shadow-sm relative overflow-hidden bg-[var(--card-bg)]">

                    {/* Compact Persona Selector for Large Lists */}
                    <div className="mb-10 max-w-md relative z-10" ref={dropdownRef}>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Target User (Who are we solving for?)</label>
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full flex items-center justify-between bg-[var(--input-bg)] border border-[var(--border-strong)] hover:border-blue-400 rounded-lg px-4 py-3 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <span className="flex items-center gap-3 font-semibold text-[var(--foreground)]">
                                    {currentPersona ? (
                                        <>
                                            <span className="w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-500/30">
                                                {currentPersona.image ? <img src={currentPersona.image} className="w-full h-full rounded-full object-cover" /> : currentPersona.name.charAt(0)}
                                            </span>
                                            {currentPersona.name}
                                        </>
                                    ) : (
                                        <span className={pov.personaName ? "text-[var(--foreground)]" : "text-[var(--text-muted)]"}>
                                            {pov.personaName || 'Select a Persona...'}
                                        </span>
                                    )}
                                </span>
                                <svg className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--popover-bg)] border border-[var(--border-strong)] rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto custom-scrollbar ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-1">
                                        {availablePersonas?.map((p, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSelectPersona(p)}
                                                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 hover:bg-[var(--bg-tertiary)] transition-colors ${pov.personaName === p.name ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200' : 'text-[var(--foreground)]'}`}
                                            >
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 flex-shrink-0">
                                                    {p.image ? <img src={p.image} className="w-full h-full rounded-full object-cover" /> : p.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm">{p.name}</div>
                                                    <div className="text-[11px] text-[var(--text-muted)] truncate">{p.demographics}</div>
                                                </div>
                                            </button>
                                        ))}
                                        {(!availablePersonas || availablePersonas.length === 0) && (
                                            <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                                                No personas found. Create one in the Empathize phase.
                                            </div>
                                        )}
                                        <div className="h-px bg-[var(--border-subtle)] my-1"></div>
                                        <button
                                            onClick={() => {
                                                setPov(prev => ({ ...prev, personaName: '', userNeed: '', insight: '' }));
                                                setIsDropdownOpen(false);
                                                if (onPersonaSelect) onPersonaSelect(null);
                                            }}
                                            className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                        >
                                            + Manual Entry
                                        </button>
                                    </div>
                                </div>
                            )}
                            {isAnalyzingPersona && (
                                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Clean Stacked Layout for Readability */}
                    <div className="flex flex-col gap-6 relative z-10">
                        {/* User & Need */}
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <div className="flex-shrink-0 text-xl text-[var(--text-main)] font-medium pt-2 md:pt-0">
                                {currentPersona ? (
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{currentPersona.name}</span>
                                ) : (
                                    <span className="text-[var(--text-muted)]">User</span>
                                )}
                                <span className="mx-2">needs a way to</span>
                            </div>
                            <div className="flex-grow w-full md:w-auto relative group">
                                <input
                                    type="text"
                                    value={pov.userNeed}
                                    onChange={(e) => setPov(prev => ({ ...prev, userNeed: e.target.value }))}
                                    className={`w-full bg-[var(--input-bg)] border border-[var(--border-strong)] rounded-lg px-4 py-3 text-lg font-medium text-[var(--foreground)] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-[var(--text-muted)] shadow-sm ${isAnalyzingPersona ? 'opacity-50' : ''}`}
                                    placeholder="accomplish a specific goal..."
                                    disabled={isAnalyzingPersona}
                                />
                                {isAnalyzingPersona && <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-indigo-600 bg-white/60 dark:bg-black/60 backdrop-blur-[1px] rounded-lg">Generating Need...</span>}
                            </div>
                        </div>

                        {/* Insight */}
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <div className="flex-shrink-0 text-xl text-[var(--text-main)] font-medium pt-2 md:pt-0">
                                <span className="mr-2">because</span>
                            </div>
                            <div className="flex-grow w-full md:w-auto relative group">
                                <textarea
                                    rows={1}
                                    value={pov.insight}
                                    onChange={(e) => setPov(prev => ({ ...prev, insight: e.target.value }))}
                                    className={`w-full bg-[var(--input-bg)] border border-[var(--border-strong)] rounded-lg px-4 py-3 text-lg font-medium text-[var(--foreground)] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder-[var(--text-muted)] shadow-sm resize-none ${isAnalyzingPersona ? 'opacity-50' : ''}`}
                                    placeholder="of a surprising insight or root cause..."
                                    disabled={isAnalyzingPersona}
                                    style={{ minHeight: '54px' }}
                                />
                                {isAnalyzingPersona && <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-purple-600 bg-white/60 dark:bg-black/60 backdrop-blur-[1px] rounded-lg">Generating Insight...</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={generateHMWQuestions}
                        disabled={!isComplete || isGenerating}
                        className={`flex-1 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${isComplete && !isGenerating
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl hover:shadow-blue-500/20'
                            : 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-white/5'
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
                        <div className="flex items-center gap-2 text-[var(--text-success-strong)] font-medium bg-[var(--bg-success-subtle)] px-3 py-1.5 rounded-lg border border-[var(--border-success-subtle)]">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Saved
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                )}

                {/* HMW Questions Display */}
                {hmwQuestions.length > 0 && (
                    <div className="mt-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent flex-1"></div>
                            <h3 className={`text-lg font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                <svg className="w-5 h-5 text-indigo-700 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                How Might We Questions
                            </h3>
                            <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent flex-1"></div>
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
                                            ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-600 dark:border-indigo-500 shadow-md ring-1 ring-transparent dark:ring-indigo-500/30'
                                            : theme === 'dark'
                                                ? 'bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10'
                                                : 'bg-white border border-slate-300 text-black hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                                            ${selectedHmw === question
                                                ? 'bg-indigo-600 text-white'
                                                : theme === 'dark'
                                                    ? 'bg-white/10 text-slate-300 border-transparent'
                                                    : 'bg-slate-100 text-black border-slate-300 border'
                                            }`}
                                        >
                                            {selectedHmw === question ? '✓' : index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-lg leading-relaxed ${selectedHmw === question
                                                ? 'font-bold text-indigo-900 dark:text-indigo-100'
                                                : theme === 'dark' ? 'font-medium text-slate-200' : 'font-medium text-black'
                                                }`}>
                                                {question}
                                            </p>
                                            {selectedHmw === question && (
                                                <span className="inline-block mt-2 text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wide bg-indigo-100 dark:bg-indigo-500/20 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-500/30">
                                                    Selected Goal
                                                </span>
                                            )}
                                        </div>
                                        {/* Selection Radio Circle */}
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                            ${selectedHmw === question ? 'border-indigo-500 bg-indigo-600' : 'border-slate-600 group-hover:border-indigo-400'}`}
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
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                                <p className="text-blue-700 dark:text-blue-200 font-medium text-sm">
                                    Complete the POV statement to unlock AI-generated "How Might We" questions
                                </p>
                                <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
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
