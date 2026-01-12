'use client';

import { forwardRef } from 'react';

// Phase configuration for styling
const PHASE_CONFIG = {
    'Empathize': { emoji: '💜', color: 'purple', gradient: 'from-purple-500 to-pink-500' },
    'Define': { emoji: '🎯', color: 'blue', gradient: 'from-blue-500 to-cyan-500' },
    'Ideate': { emoji: '💡', color: 'yellow', gradient: 'from-yellow-500 to-orange-500' },
    'Prototype': { emoji: '🛠️', color: 'green', gradient: 'from-green-500 to-emerald-500' },
    'Test': { emoji: '🧪', color: 'indigo', gradient: 'from-indigo-500 to-violet-500' }
};

// Checklist items for each phase
const CHECKLIST_CONFIG = {
    empathize: [
        { key: 'conductedInterviews', label: 'Conducted user interviews' },
        { key: 'documentedObservations', label: 'Documented observations' },
        { key: 'completedEmpathyMap', label: 'Completed Empathy Map' },
        { key: 'identifiedPainPoints', label: 'Identified pain points' },
        { key: 'researchedContext', label: 'Researched problem context' }
    ],
    define: [
        { key: 'createdPersona', label: 'Created User Persona' },
        { key: 'definedProblem', label: 'Defined problem statement' },
        { key: 'createdHMW', label: 'Created HMW questions' },
        { key: 'identifiedNeeds', label: 'Identified user needs' },
        { key: 'synthesizedInsights', label: 'Synthesized insights' }
    ],
    ideate: [
        { key: 'brainstormed', label: 'Brainstormed ideas' },
        { key: 'prioritizedIdeas', label: 'Prioritized ideas' },
        { key: 'selectedTopIdea', label: 'Selected top idea' },
        { key: 'sketchedConcepts', label: 'Sketched concepts' },
        { key: 'exploredAlternatives', label: 'Explored alternatives' }
    ],
    prototype: [
        { key: 'builtPrototype', label: 'Built prototype' },
        { key: 'definedTestGoals', label: 'Defined test goals' },
        { key: 'createdUserFlow', label: 'Created user flow' },
        { key: 'preparedMaterials', label: 'Prepared materials' },
        { key: 'identifiedAssumptions', label: 'Identified assumptions' }
    ],
    test: [
        { key: 'conductedTests', label: 'Conducted user tests' },
        { key: 'gatheredFeedback', label: 'Gathered feedback' },
        { key: 'documentedLearnings', label: 'Documented learnings' },
        { key: 'iteratedPrototype', label: 'Iterated on prototype' },
        { key: 'validatedSolution', label: 'Validated solution' }
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

    // Get empathy map data
    const empathyMap = stageData?.empathize?.empathyMap || { says: [], thinks: [], does: [], feels: [] };

    // Format date
    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Count messages
    const userMessages = messages?.filter(m => m.sender === 'You').length || 0;
    const botMessages = messages?.filter(m => m.sender === 'Bot').length || 0;

    return (
        <div ref={ref} className="bg-white p-8 min-h-screen" style={{ width: '210mm', minHeight: '297mm' }}>
            {/* Header */}
            <div className="relative mb-8 p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-200 text-sm font-medium mb-1">Design Thinking Project Report</p>
                            <h1 className="text-3xl font-bold">{projectName}</h1>
                        </div>
                        <div className="text-right">
                            <p className="text-blue-200 text-sm">Current Phase</p>
                            <div className="flex items-center gap-2 text-2xl font-bold">
                                <span>{phaseConfig.emoji}</span>
                                <span>{currentPhase}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-4">
                        <div className="bg-white/20 rounded-xl p-3">
                            <p className="text-xs text-blue-200">Created By</p>
                            <p className="font-semibold">{createdBy || 'Unknown'}</p>
                        </div>
                        <div className="bg-white/20 rounded-xl p-3">
                            <p className="text-xs text-blue-200">Created On</p>
                            <p className="font-semibold">{formatDate(createdAt)}</p>
                        </div>
                        <div className="bg-white/20 rounded-xl p-3">
                            <p className="text-xs text-blue-200">Overall Progress</p>
                            <p className="font-semibold">{calculateOverallProgress()}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Overview */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">📊</span>
                    Progress Overview
                </h2>

                <div className="bg-gray-50 rounded-xl p-6">
                    {/* Phase Timeline */}
                    <div className="flex items-center justify-between mb-6">
                        {phases.map((phase, idx) => {
                            const config = PHASE_CONFIG[phase];
                            const isComplete = idx < currentPhaseIndex - 1;
                            const isCurrent = phase === currentPhase;

                            return (
                                <div key={phase} className="flex flex-col items-center flex-1">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2 ${isComplete ? 'bg-green-500 text-white border-green-500' :
                                        isCurrent ? 'bg-blue-500 text-white border-blue-500' :
                                            'bg-gray-200 text-gray-400 border-gray-300'
                                        }`}>
                                        {isComplete ? '✓' : config.emoji}
                                    </div>
                                    <p className={`mt-2 text-sm font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-500'}`}>
                                        {phase}
                                    </p>
                                    {idx < 4 && (
                                        <div className={`absolute h-1 w-16 ${isComplete ? 'bg-green-500' : 'bg-gray-200'}`} style={{ marginLeft: '100px' }}></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-gray-600">Overall Completion</span>
                            <span className="font-bold text-gray-800">{calculateOverallProgress()}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all"
                                style={{ width: `${calculateOverallProgress()}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Phase Checklists */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">✅</span>
                    Phase Checklists
                </h2>

                <div className="grid grid-cols-1 gap-4">
                    {phases.map(phase => {
                        const phaseKey = phase.toLowerCase();
                        const config = PHASE_CONFIG[phase];
                        const stats = getPhaseStats(phaseKey);
                        const checklist = stageData?.[phaseKey]?.checklist || {};
                        const items = CHECKLIST_CONFIG[phaseKey] || [];

                        return (
                            <div key={phase} className="border rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{config.emoji}</span>
                                        <h3 className="font-bold text-gray-800">{phase}</h3>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${stats.completed === stats.total ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {stats.completed}/{stats.total} Complete
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {items.map(item => (
                                        <div key={item.key} className="flex items-center gap-2 text-sm">
                                            <span className={checklist[item.key] ? 'text-green-500' : 'text-gray-300'}>
                                                {checklist[item.key] ? '☑' : '☐'}
                                            </span>
                                            <span className={checklist[item.key] ? 'text-gray-700' : 'text-gray-400'}>
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

            {/* Empathy Map */}
            <div className="mb-8 page-break-before">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">💜</span>
                    Empathy Map
                </h2>

                <div className="grid grid-cols-2 gap-4">
                    {[
                        { key: 'says', label: 'Says', icon: '💬', color: 'blue' },
                        { key: 'thinks', label: 'Thinks', icon: '💭', color: 'purple' },
                        { key: 'does', label: 'Does', icon: '⚡', color: 'green' },
                        { key: 'feels', label: 'Feels', icon: '❤️', color: 'pink' }
                    ].map(quadrant => (
                        <div key={quadrant.key} className={`border rounded-xl p-4 bg-${quadrant.color}-50`}>
                            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <span>{quadrant.icon}</span>
                                {quadrant.label}
                            </h3>
                            <ul className="space-y-1">
                                {empathyMap[quadrant.key]?.length > 0 ? (
                                    empathyMap[quadrant.key].map((item, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                            <span className="text-gray-400">•</span>
                                            {item}
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-sm text-gray-400 italic">No items added yet</li>
                                )}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Conversation Summary */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">💬</span>
                    Conversation Summary
                </h2>

                <div className="bg-gray-50 rounded-xl p-6">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                            <p className="text-3xl font-bold text-blue-600">{messages?.length || 0}</p>
                            <p className="text-sm text-gray-500">Total Messages</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                            <p className="text-3xl font-bold text-green-600">{userMessages}</p>
                            <p className="text-sm text-gray-500">Your Messages</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                            <p className="text-3xl font-bold text-purple-600">{botMessages}</p>
                            <p className="text-sm text-gray-500">Bot Responses</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">DesignBot</span>
                        <span>•</span>
                        <span>Design Thinking Project Report</span>
                    </div>
                    <div>
                        Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>
        </div>
    );
});

ProjectPDFExport.displayName = 'ProjectPDFExport';

export default ProjectPDFExport;
