'use client';

import { useState } from 'react';

// Checklist items for each stage
const STAGE_CHECKLISTS = {
    empathize: {
        title: 'Empathize Checklist',
        icon: '💜',
        items: [
            { key: 'conductedInterviews', label: 'Conducted at least 3 user interviews' },
            { key: 'documentedObservations', label: 'Documented observations and insights' },
            { key: 'completedEmpathyMap', label: 'Completed the Empathy Map' }
        ]
    },
    define: {
        title: 'Define Checklist',
        icon: '🎯',
        items: [
            { key: 'createdPersona', label: 'Created a User Persona' },
            { key: 'definedProblem', label: 'Defined the core problem statement' },
            { key: 'createdHMW', label: 'Created "How Might We" questions' }
        ]
    },
    ideate: {
        title: 'Ideate Checklist',
        icon: '💡',
        items: [
            { key: 'brainstormed', label: 'Brainstormed multiple ideas' },
            { key: 'prioritizedIdeas', label: 'Prioritized ideas (feasibility vs impact)' },
            { key: 'selectedTopIdea', label: 'Selected top idea(s) to prototype' }
        ]
    },
    prototype: {
        title: 'Prototype Checklist',
        icon: '🛠️',
        items: [
            { key: 'builtPrototype', label: 'Built a low-fidelity prototype' },
            { key: 'definedTestGoals', label: 'Defined testing goals and questions' }
        ]
    },
    test: {
        title: 'Test Checklist',
        icon: '🧪',
        items: [
            { key: 'conductedTests', label: 'Conducted user tests' },
            { key: 'gatheredFeedback', label: 'Gathered and analyzed feedback' },
            { key: 'documentedLearnings', label: 'Documented learnings and next steps' }
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
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">{checklistConfig.icon}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">{checklistConfig.title}</h3>
                        <p className="text-sm text-gray-500">{completedCount} of {totalCount} completed</p>
                    </div>
                </div>

                {/* Completion Badge */}
                {completedCount === totalCount && (
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <span>✓</span> Complete!
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
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
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${isChecked
                                    ? 'bg-purple-50 border border-purple-200'
                                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggle(item.key)}
                                disabled={isLoading}
                                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className={`flex-1 ${isChecked ? 'text-purple-700 line-through' : 'text-gray-700'}`}>
                                {item.label}
                            </span>
                            {isLoading && (
                                <span className="text-gray-400 text-sm">Saving...</span>
                            )}
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
