'use client';

import { forwardRef } from 'react';

// Phase configuration for styling
const PHASE_CONFIG = {
    'Empathize': { emoji: '💜', color: 'purple', borderColor: 'border-purple-200', bg: 'bg-purple-50' },
    'Define': { emoji: '🎯', color: 'blue', borderColor: 'border-blue-200', bg: 'bg-blue-50' },
    'Ideate': { emoji: '💡', color: 'yellow', borderColor: 'border-yellow-200', bg: 'bg-yellow-50' },
    'Prototype': { emoji: '🛠️', color: 'green', borderColor: 'border-green-200', bg: 'bg-green-50' },
    'Test': { emoji: '🧪', color: 'indigo', borderColor: 'border-indigo-200', bg: 'bg-indigo-50' }
};

// Checklist items for each phase
const CHECKLIST_CONFIG = {
    empathize: [
        { key: 'conductedInterviews', label: 'Conducted interviews' },
        { key: 'documentedObservations', label: 'Observations' },
        { key: 'completedEmpathyMap', label: 'Empathy Map' },
        { key: 'identifiedPainPoints', label: 'Pain points' },
        { key: 'researchedContext', label: 'Context research' }
    ],
    define: [
        { key: 'createdPersona', label: 'User Persona' },
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

const ProjectPDFExport = forwardRef(({ projectName, currentPhase, stageData, messages, createdBy, createdAt }, ref) => {
    const phaseConfig = PHASE_CONFIG[currentPhase] || PHASE_CONFIG['Empathize'];
    const phases = ['Empathize', 'Define', 'Ideate', 'Prototype', 'Test'];
    const currentPhaseIndex = phases.indexOf(currentPhase) + 1;

    // Calculate overall progress
    const calculateOverallProgress = () => {
        let completed = 0;
        let total = 0;

        Object.keys(CHECKLIST_CONFIG).forEach(phaseKey => {
            const checklist = stageData?.[phaseKey]?.checklist || {};
            CHECKLIST_CONFIG[phaseKey].forEach(item => {
                total++;
                if (checklist[item.key]) completed++;
            });
        });

        return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    // Get phase checklist stats
    const getPhaseStats = (phaseKey) => {
        const checklist = stageData?.[phaseKey]?.checklist || {};
        const items = CHECKLIST_CONFIG[phaseKey] || [];
        const completed = items.filter(item => checklist[item.key]).length;
        return { completed, total: items.length };
    };

    const empathyMap = stageData?.empathize?.empathyMap || { says: [], thinks: [], does: [], feels: [] };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div ref={ref} className="bg-white p-6 font-sans text-slate-800" style={{ width: '210mm', height: '297mm', overflow: 'hidden' }}>
            {/* 1. Header Row (Compact) */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                        DB
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">{projectName}</h1>
                        <p className="text-xs text-slate-500">
                            Created by <strong>{createdBy}</strong> on {formatDate(createdAt)}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold">
                        <span>Phase: {currentPhase} {phaseConfig.emoji}</span>
                        <span className="w-px h-3 bg-slate-300"></span>
                        <span>Progress: {calculateOverallProgress()}%</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Design Thinking Report</p>
                </div>
            </div>

            {/* 2. Visual Progress Timeline (Compact) */}
            <div className="flex items-center justify-between px-4 mb-4 relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -z-10 -translate-y-1/2"></div>
                {phases.map((phase, idx) => {
                    const isComplete = idx < currentPhaseIndex - 1;
                    const isCurrent = phase === currentPhase;
                    return (
                        <div key={phase} className="flex flex-col items-center bg-white px-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${isComplete ? 'bg-green-500 text-white border-green-500' :
                                isCurrent ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-300 border-slate-200'
                                }`}>
                                {isComplete ? '✓' : idx + 1}
                            </div>
                            <span className={`text-[10px] font-bold mt-1 ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`}>{phase}</span>
                        </div>
                    )
                })}
            </div>

            {/* 3. Checklists Grid (Dense 3-column layout) */}
            <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="text-green-500">●</span> Project Checklists
                </h2>
                <div className="grid grid-cols-3 gap-2">
                    {phases.map(phase => {
                        const phaseKey = phase.toLowerCase();
                        const config = PHASE_CONFIG[phase];
                        const checklist = stageData?.[phaseKey]?.checklist || {};
                        const items = CHECKLIST_CONFIG[phaseKey] || [];
                        const stats = getPhaseStats(phaseKey);

                        return (
                            <div key={phase} className={`border ${config.borderColor} rounded-lg p-2 ${config.bg} bg-opacity-30`}>
                                <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-white/50">
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm">{config.emoji}</span>
                                        <h3 className="text-xs font-bold text-slate-700">{phase}</h3>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500">{stats.completed}/{stats.total}</span>
                                </div>
                                <div className="space-y-1">
                                    {items.map(item => (
                                        <div key={item.key} className="flex items-start gap-1.5">
                                            <div className={`w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0 mt-0.5 ${checklist[item.key] ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'
                                                }`}>
                                                {checklist[item.key] && <span className="text-white text-[8px] leading-none">✓</span>}
                                            </div>
                                            <span className={`text-[9px] leading-tight ${checklist[item.key] ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 4. Empathy Map (4-Quadrant) */}
            <div className="mb-4 flex-grow">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="text-purple-500">●</span> Empathy Map (User Insights)
                </h2>
                <div className="grid grid-cols-2 gap-2 h-full">
                    {[
                        { key: 'says', label: 'Says', icon: '💬', color: 'bg-blue-50 border-blue-100' },
                        { key: 'thinks', label: 'Thinks', icon: '💭', color: 'bg-purple-50 border-purple-100' },
                        { key: 'does', label: 'Does', icon: '⚡', color: 'bg-green-50 border-green-100' },
                        { key: 'feels', label: 'Feels', icon: '❤️', color: 'bg-pink-50 border-pink-100' }
                    ].map(quadrant => (
                        <div key={quadrant.key} className={`border rounded-xl p-3 ${quadrant.color} h-32`}>
                            <h3 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1.5 uppercase opacity-70">
                                {quadrant.icon} {quadrant.label}
                            </h3>
                            <ul className="space-y-1 overflow-hidden">
                                {empathyMap[quadrant.key]?.slice(0, 5).map((item, idx) => (
                                    <li key={idx} className="text-[10px] text-slate-700 flex items-start gap-1.5">
                                        <span className="text-slate-400 mt-0.5">•</span>
                                        <span className="line-clamp-1">{typeof item === 'object' ? item.text : item}</span>
                                    </li>
                                ))}
                                {(!empathyMap[quadrant.key] || empathyMap[quadrant.key].length === 0) && (
                                    <li className="text-[10px] text-slate-400 italic">No insights recorded</li>
                                )}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* 5. Compact Footer with Messages Summary */}
            <div className="mt-auto border-t border-slate-100 pt-2 flex justify-between items-center text-[10px] text-slate-400">
                <div className="flex gap-4">
                    <span><strong>{messages?.length || 0}</strong> Messages</span>
                    <span>PDF Generated by Design Thinking Bot</span>
                </div>
                <div>Page 1 of 1</div>
            </div>
        </div>
    );
});

ProjectPDFExport.displayName = 'ProjectPDFExport';

export default ProjectPDFExport;
