'use client';

import { forwardRef } from 'react';

// Phase configuration for styling
const PHASE_CONFIG = {
    'Empathize': { emoji: '💜', color: 'purple', borderColor: 'border-purple-200', bg: 'bg-purple-50', titleColor: 'text-purple-700' },
    'Define': { emoji: '🎯', color: 'blue', borderColor: 'border-blue-200', bg: 'bg-blue-50', titleColor: 'text-blue-700' },
    'Ideate': { emoji: '💡', color: 'yellow', borderColor: 'border-yellow-200', bg: 'bg-yellow-50', titleColor: 'text-yellow-700' },
    'Prototype': { emoji: '🛠️', color: 'green', borderColor: 'border-green-200', bg: 'bg-green-50', titleColor: 'text-green-700' },
    'Test': { emoji: '🧪', color: 'indigo', borderColor: 'border-indigo-200', bg: 'bg-indigo-50', titleColor: 'text-indigo-700' }
};

// Checklist items for each phase
const CHECKLIST_CONFIG = {
    empathize: [
        { key: 'conductedInterviews', label: 'Conducted interviews' },
        { key: 'documentedObservations', label: 'Observations' },
        { key: 'createdPersona', label: 'Initial Persona' }, // Updated to match page.jsx config if needed, but keeping existing keys for safety
        { key: 'identifiedPainPoints', label: 'Pain points' },
        { key: 'researchedContext', label: 'Context research' }
    ],
    define: [
        { key: 'createdPersona', label: 'Full User Persona' },
        { key: 'definedProblem', label: 'Problem statement' },
        { key: 'createdHMW', label: 'HMW questions' },
        { key: 'identifiedNeeds', label: 'User needs' },
        { key: 'synthesizedInsights', label: 'Insights' }
    ],
    ideate: [
        { key: 'brainstormed', label: 'Brainstormed' },
        { key: 'prioritizedIdeas', label: 'Prioritized' },
        { key: 'selectedTopIdea', label: 'Top idea' },
        { key: 'sketchedConcepts', label: 'Sketched' },
        { key: 'exploredAlternatives', label: 'Alternatives' }
    ],
    prototype: [
        { key: 'builtPrototype', label: 'Prototype' },
        { key: 'definedTestGoals', label: 'Test goals' },
        { key: 'createdUserFlow', label: 'User flow' },
        { key: 'preparedMaterials', label: 'Materials' },
        { key: 'identifiedAssumptions', label: 'Assumptions' }
    ],
    test: [
        { key: 'conductedTests', label: 'User tests' },
        { key: 'gatheredFeedback', label: 'Feedback' },
        { key: 'documentedLearnings', label: 'Learnings' },
        { key: 'iteratedPrototype', label: 'Iteration' },
        { key: 'validatedSolution', label: 'Validation' }
    ]
};

const ProjectPDFExport = forwardRef(({ projectName, currentPhase, stageData, defineData, ideateData, messages, createdBy, createdAt }, ref) => {

    // Helpers
    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getPhaseStats = (phaseKey) => {
        const checklist = stageData?.[phaseKey]?.checklist || {};
        const items = CHECKLIST_CONFIG[phaseKey] || [];
        const completed = items.filter(item => checklist[item.key]).length;
        return { completed, total: items.length, percent: Math.round((completed / Math.max(items.length, 1)) * 100) };
    };

    // Data Extraction
    const empathyMap = stageData?.empathize?.empathyMap || { says: [], thinks: [], does: [], feels: [] };

    const persona = defineData?.persona;
    const pov = defineData?.pov;
    const hmw = defineData?.selectedHmw;
    const constraints = defineData?.constraints || [];

    const ideas = ideateData?.ideas || [];
    const matrix = ideateData?.matrix || {};
    const winningConcept = ideateData?.winningConcept;
    const techSpec = ideateData?.techSpec;

    const feedbackMatrix = stageData?.test?.feedbackMatrix || [];

    // Helper for Matrix Rendering
    const getMatrixIdeas = (category) => {
        // Handle flat or structured
        if (Array.isArray(matrix)) {
            // If it's flat array of ideas with quadrant property
            return matrix.filter(i => i.quadrant === category);
        } else {
            // If structured object
            const map = {
                'high-high': matrix.majorProjects,
                'high-low': matrix.quickWins,
                'low-low': matrix.fillIns,
                'low-high': matrix.thanklessTasks
            };
            return map[category] || [];
        }
    };

    const renderChecklist = (phaseName) => {
        const phaseKey = phaseName.toLowerCase();
        const config = PHASE_CONFIG[phaseName];
        const stats = getPhaseStats(phaseKey);
        const checklist = stageData?.[phaseKey]?.checklist || {};
        const items = CHECKLIST_CONFIG[phaseKey] || [];

        return (
            <div className="mb-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                    <h4 className={`text-sm font-bold ${config.titleColor} uppercase tracking-wider`}>Phase Status</h4>
                    <span className="text-xs font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                        {stats.completed}/{stats.total} Complete ({stats.percent}%)
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {items.map(item => (
                        <div key={item.key} className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${checklist[item.key] ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'}`}>
                                {checklist[item.key] && <span className="text-white text-[10px] leading-none">✓</span>}
                            </div>
                            <span className={`text-xs ${checklist[item.key] ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div ref={ref} className="bg-white p-8 font-sans text-slate-800 max-w-[210mm] mx-auto min-h-[297mm]">

            {/* --- HEADER --- */}
            <header className="border-b-4 border-blue-600 pb-6 mb-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{projectName}</h1>
                        <p className="text-slate-500">
                            Design Thinking Project Report • {formatDate(createdAt)}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full inline-block mb-1">
                            Current Project Phase
                        </div>
                        <div className="text-2xl font-bold text-blue-700 flex items-center justify-end gap-2">
                            {currentPhase} {PHASE_CONFIG[currentPhase]?.emoji}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Created by {createdBy}</p>
                    </div>
                </div>
            </header>

            {/* --- PHASE 1: EMPATHIZE --- */}
            <section className="mb-10 break-inside-avoid">
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3 border-b-2 border-purple-100 pb-2">
                    <span className="bg-purple-100 p-2 rounded-lg text-xl">💜</span> Empathize
                </h2>

                {renderChecklist('Empathize')}

                {/* Empathy Map */}
                <div className="mt-6">
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Empathy Map Insights</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { key: 'says', label: 'Says', icon: '💬', color: 'bg-blue-50 border-blue-200' },
                            { key: 'thinks', label: 'Thinks', icon: '💭', color: 'bg-purple-50 border-purple-200' },
                            { key: 'does', label: 'Does', icon: '⚡', color: 'bg-green-50 border-green-200' },
                            { key: 'feels', label: 'Feels', icon: '❤️', color: 'bg-pink-50 border-pink-200' }
                        ].map(quadrant => (
                            <div key={quadrant.key} className={`border rounded-xl p-4 ${quadrant.color}`}>
                                <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    {quadrant.icon} {quadrant.label}
                                </h4>
                                <ul className="space-y-1 list-disc list-inside">
                                    {empathyMap[quadrant.key]?.length > 0 ? (
                                        empathyMap[quadrant.key].map((item, idx) => (
                                            <li key={idx} className="text-xs text-slate-700 leading-relaxed">
                                                {typeof item === 'object' ? item.text : item}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-xs text-slate-400 italic list-none">No insights recorded.</li>
                                    )}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- PHASE 2: DEFINE --- */}
            <section className="mb-10 break-inside-avoid">
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3 border-b-2 border-blue-100 pb-2">
                    <span className="bg-blue-100 p-2 rounded-lg text-xl">🎯</span> Define
                </h2>

                {renderChecklist('Define')}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Persona Card */}
                    {persona && (
                        <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    👤 Target Persona: {persona.name}
                                </h3>
                                <p className="text-blue-100 text-xs mt-1">{persona.demographics?.occupation}, {persona.demographics?.age} years old</p>
                            </div>
                            <div className="p-4 space-y-3 flex-1">
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Pain Point</span>
                                    <p className="text-sm text-slate-800 font-medium">{persona.painPoint || 'Not specified'}</p>
                                </div>
                                {persona.bio && (
                                    <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase">Bio</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">{persona.bio}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* POV & HMW */}
                    <div className="space-y-4">
                        {pov && (
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Point of View (POV) Statement</h3>
                                <p className="text-sm font-medium text-slate-800 italic">"{typeof pov === 'string' ? pov : pov.statement || 'No POV defined yet.'}"</p>
                            </div>
                        )}
                        {hmw && (
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                                <h3 className="text-xs font-bold text-yellow-700 uppercase mb-2">How Might We?</h3>
                                <p className="text-lg font-bold text-slate-800">"{hmw}"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Constraints */}
                {constraints && constraints.length > 0 && (
                    <div className="mt-6 border border-slate-200 rounded-xl p-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Project Constraints</h3>
                        <div className="flex flex-wrap gap-2">
                            {constraints.map((c, i) => (
                                <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
                                    {c}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            <div className="page-break" />

            {/* --- PHASE 3: IDEATE --- */}
            <section className="mb-10">
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3 border-b-2 border-yellow-100 pb-2">
                    <span className="bg-yellow-100 p-2 rounded-lg text-xl">💡</span> Ideate
                </h2>

                {renderChecklist('Ideate')}

                {/* Ideas Summary */}
                {ideas.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-sm font-bold text-slate-500 uppercase">Brainstorming Session</h3>
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{ideas.length} Ideas Generated</span>
                        </div>
                    </div>
                )}

                {/* Winning Concept */}
                {winningConcept && (
                    <div className="mb-8 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="bg-yellow-400 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md">
                                🏆
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">Winning Concept</h3>
                                <p className="text-slate-700 text-lg leading-relaxed">
                                    {typeof winningConcept === 'string' ? winningConcept : winningConcept.text}
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded font-bold">Selected Solution</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tech Specs */}
                {techSpec && (winningConcept) && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden mt-6 break-inside-avoid">
                        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                🏗️ Technical Specifications
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Functional Requirements</h4>
                                <ul className="list-disc list-outside ml-4 space-y-1">
                                    {techSpec.functionalRequirements?.map((req, i) => (
                                        <li key={i} className="text-xs text-slate-600">{req}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Non-Functional Requirements</h4>
                                <ul className="list-disc list-outside ml-4 space-y-1">
                                    {techSpec.nonFunctionalRequirements?.map((req, i) => (
                                        <li key={i} className="text-xs text-slate-600">{req}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {techSpec.techStack && (
                            <div className="bg-slate-50 p-4 border-t border-slate-200">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Proposed Tech Stack</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white p-3 rounded border border-slate-200">
                                        <span className="block text-[10px] text-slate-400 uppercase">Frontend</span>
                                        <span className="font-mono text-xs font-bold text-slate-700">{techSpec.techStack.frontend || 'TBD'}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded border border-slate-200">
                                        <span className="block text-[10px] text-slate-400 uppercase">Backend</span>
                                        <span className="font-mono text-xs font-bold text-slate-700">{techSpec.techStack.backend || 'TBD'}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded border border-slate-200">
                                        <span className="block text-[10px] text-slate-400 uppercase">Database</span>
                                        <span className="font-mono text-xs font-bold text-slate-700">{techSpec.techStack.database || 'TBD'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* --- PHASE 4: PROTOTYPE --- */}
            <section className="mb-10 break-inside-avoid">
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3 border-b-2 border-green-100 pb-2">
                    <span className="bg-green-100 p-2 rounded-lg text-xl">🛠️</span> Prototype
                </h2>

                {renderChecklist('Prototype')}

                <div className="text-sm text-slate-500 italic bg-green-50 p-4 rounded-lg border border-green-100">
                    Prototype artifacts are stored in the project files.
                </div>
            </section>

            {/* --- PHASE 5: TEST --- */}
            <section className="mb-10 break-inside-avoid">
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3 border-b-2 border-indigo-100 pb-2">
                    <span className="bg-indigo-100 p-2 rounded-lg text-xl">🧪</span> Test
                </h2>

                {renderChecklist('Test')}

                {feedbackMatrix && feedbackMatrix.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">User Feedback</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: 'loved', label: 'Loved', icon: '❤️', border: 'border-green-200', bg: 'bg-green-50' },
                                { id: 'questions', label: 'Questions', icon: '❓', border: 'border-blue-200', bg: 'bg-blue-50' },
                                { id: 'idea', label: 'Ideas', icon: '💡', border: 'border-yellow-200', bg: 'bg-yellow-50' },
                                { id: 'critique', label: 'Critique', icon: '⚠️', border: 'border-red-200', bg: 'bg-red-50' }
                            ].map(cat => {
                                const items = feedbackMatrix.filter(f => f.category === cat.id || (cat.id === 'idea' ? f.category === 'ideas' : false));
                                return (
                                    <div key={cat.id} className={`border ${cat.border} ${cat.bg} rounded-xl p-4 min-h-[120px]`}>
                                        <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                                            {cat.icon} {cat.label} <span className="text-xs opacity-50">({items.length})</span>
                                        </h4>
                                        <ul className="space-y-1.5">
                                            {items.map((item, idx) => (
                                                <li key={idx} className="text-xs bg-white/50 p-1.5 rounded border border-black/5 text-slate-700">
                                                    {item.text}
                                                </li>
                                            ))}
                                            {items.length === 0 && <li className="text-xs text-slate-400 italic">No feedback.</li>}
                                        </ul>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </section>

            {/* --- FOOTER --- */}
            <footer className="mt-12 pt-6 border-t border-slate-200 flex justify-between text-xs text-slate-400">
                <div>
                    Generated by Design Thinking Bot
                </div>
                <div>
                    {messages?.length || 0} Chat Messages • {new Date().getFullYear()}
                </div>
            </footer>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 20mm;
                    }
                    .page-break {
                        page-break-after: always;
                    }
                }
            `}</style>
        </div>
    );
});

ProjectPDFExport.displayName = 'ProjectPDFExport';

export default ProjectPDFExport;
