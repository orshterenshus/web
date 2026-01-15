'use client';

import { useState, useEffect } from 'react';

// Checklist items for each stage
const STAGE_CHECKLISTS = {
    empathize: {
        title: 'Empathize Checklist',
        icon: '💜',
        items: [
            { key: 'identifyTargetUsers', label: 'Identify Target Users' },
            { key: 'knowPhysicalEnv', label: 'Do I know the physical or digital environment where the "pain" occurs?' },
            { key: 'createdPersona', label: 'Created a User Persona' },
            { key: 'createAiPersona', label: 'Created an AI Persona' },
            { key: 'conductedInterviews', label: 'Conduct an interview' },
            { key: 'completedEmpathyMap', label: 'Complete the Empathy map' }
        ]
    },
    define: {
        title: 'Define Checklist',
        icon: '🎯',
        items: [
            { key: 'createdPersona', label: 'Created a User Persona' },
            { key: 'definedProblem', label: 'Defined the core problem statement' },
            { key: 'createdHMW', label: 'Created "How Might We" questions' },
            { key: 'identifiedNeeds', label: 'Identified user needs and goals' },
            { key: 'synthesizedInsights', label: 'Synthesized research into insights' }
        ]
    },
    ideate: {
        title: 'Ideate Checklist',
        icon: '💡',
        items: [
            { key: 'brainstormed', label: 'Brainstormed multiple ideas' },
            { key: 'prioritizedIdeas', label: 'Prioritized ideas (feasibility vs impact)' },
            { key: 'selectedTopIdea', label: 'Selected top idea(s) to prototype' },
            { key: 'sketchedConcepts', label: 'Sketched initial concepts' },
            { key: 'exploredAlternatives', label: 'Explored alternative solutions' }
        ]
    },
    prototype: {
        title: 'Prototype Checklist',
        icon: '🛠️',
        items: [
            { key: 'builtPrototype', label: 'Built a low-fidelity prototype' },
            { key: 'definedTestGoals', label: 'Defined testing goals and questions' },
            { key: 'createdUserFlow', label: 'Created user flow diagram' },
            { key: 'preparedMaterials', label: 'Prepared prototype materials' },
            { key: 'identifiedAssumptions', label: 'Identified key assumptions to test' }
        ]
    },
    test: {
        title: 'Test Checklist',
        icon: '🧪',
        items: [
            { key: 'conductedTests', label: 'Conducted user tests' },
            { key: 'gatheredFeedback', label: 'Gathered and analyzed feedback' },
            { key: 'documentedLearnings', label: 'Documented learnings and next steps' },
            { key: 'iteratedPrototype', label: 'Iterated on prototype based on feedback' },
            { key: 'validatedSolution', label: 'Validated solution with users' }
        ]
    }
};

export default function StageChecklist({ projectId, stage, data, onUpdate }) {
    const [isUpdating, setIsUpdating] = useState(null);

    const stageKey = stage.toLowerCase();
    const checklistConfig = STAGE_CHECKLISTS[stageKey];

    if (!checklistConfig) return null;

    // Safety: ensure data exists
    const checklistData = data?.[stageKey]?.checklist || {};

    // Helper to update checklist item with explicit value
    const updateChecklistItem = async (itemKey, newValue) => {
        try {
            const response = await fetch(`/api/projects/${projectId}/stageData`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stage: stageKey,
                    field: `checklist.${itemKey}`,
                    value: newValue
                })
            });

            if (response.ok) {
                const result = await response.json();
                onUpdate(result.stageData);
            }
        } catch (error) {
            console.error(`Failed to auto-update checklist ${itemKey}:`, error);
        }
    };

    // Check if an item is satisfied by data
    const isSystemVerified = (key) => {
        if (stageKey !== 'empathize' || !data?.empathize) return false;

        const { personas, aiPersonas, interviews, empathyMaps } = data.empathize;

        if (key === 'createdPersona') {
            return (personas?.length || 0) > 0;
        }

        if (key === 'createAiPersona') {
            return (aiPersonas?.length || 0) > 0;
        }

        if (key === 'conductedInterviews') {
            return (interviews?.length || 0) > 0;
        }

        if (key === 'completedEmpathyMap') {
            if (!empathyMaps) return false;
            return Object.values(empathyMaps).some(personaMap => {
                return Object.values(personaMap).some(typeMap =>
                    // typeMap is 'user' or 'ai' containing quadrants
                    typeMap && Object.values(typeMap).some(notes => Array.isArray(notes) && notes.length > 0)
                );
            });
        }

        return false;
    };

    // Auto-check logic for Empathize phase
    useEffect(() => {
        if (stageKey !== 'empathize') return;

        // check each auto-verifiable item
        const verifyAndSync = (key) => {
            const shouldBeChecked = isSystemVerified(key);
            const isChecked = checklistData[key] || false;

            if (shouldBeChecked !== isChecked) {
                updateChecklistItem(key, shouldBeChecked);
            }
        };

        verifyAndSync('createdPersona');
        verifyAndSync('createAiPersona');
        verifyAndSync('conductedInterviews');
        verifyAndSync('completedEmpathyMap');

    }, [data, stageKey, checklistData]); // Dependencies ensure we check whenever data updates

    const handleToggle = async (itemKey) => {
        setIsUpdating(itemKey);
        try {
            const currentValue = checklistData[itemKey] || false;

            const response = await fetch(`/api/projects/${projectId}/stageData`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stage: stageKey,
                    field: `checklist.${itemKey}`,
                    value: !currentValue
                    // No action needed, default is set
                })
            });

            if (response.ok) {
                const result = await response.json();
                onUpdate(result.stageData);
            }
        } catch (error) {
            console.error('Failed to update checklist:', error);
        } finally {
            setIsUpdating(null);
        }
    };

    const completedCount = checklistConfig.items.filter(item => checklistData[item.key]).length;
    const totalCount = checklistConfig.items.length;
    const progress = (completedCount / totalCount) * 100;

    return (
        <div className="glass-panel rounded-xl shadow-lg p-6 mb-6 border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                        <span className="text-xl">{checklistConfig.icon}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-200">{checklistConfig.title}</h3>
                        <p className="text-sm text-slate-400">{completedCount} of {totalCount} completed</p>
                    </div>
                </div>

                {/* Completion Badge */}
                {completedCount === totalCount && (
                    <div className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium flex items-center gap-1 border border-green-500/30">
                        <span>✓</span> Complete!
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
                {checklistConfig.items.map((item) => {
                    const isChecked = checklistData[item.key] || false;
                    const isLoading = isUpdating === item.key;

                    return (
                        <label
                            key={item.key}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${isChecked
                                ? 'bg-purple-500/10 border-purple-500/30'
                                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggle(item.key)}
                                disabled={isLoading || isSystemVerified(item.key)}
                                className="w-5 h-5 rounded border-slate-500 bg-white/5 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                            />
                            <span className={`flex-1 ${isChecked ? 'text-purple-300 line-through decoration-purple-500/50' : 'text-slate-300'}`}>
                                {item.label}
                            </span>
                            {isSystemVerified(item.key) && (
                                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-medium border border-purple-500/30">
                                    Auto-verified
                                </span>
                            )}
                            {isLoading && (
                                <span className="text-slate-500 text-sm">Saving...</span>
                            )}
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
