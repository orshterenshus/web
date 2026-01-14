'use client';

import { useState, useRef, useEffect } from 'react';

export default function PrioritizationMatrix({ projectId, ideas, currentUser, onWinningConcept, initialPrioritizedIdeas, initialVotes, initialWinningConcept, onMatrixUpdate }) {
    const [prioritizedIdeas, setPrioritizedIdeas] = useState([]);
    const [votes, setVotes] = useState({});
    const [winningConcept, setWinningConcept] = useState(null);
    const [draggedIdea, setDraggedIdea] = useState(null);
    const [showVoting, setShowVoting] = useState(false);

    // Initialize state from props
    useEffect(() => {
        if (initialPrioritizedIdeas) {
            // Defensive: Ensure we work with an array even if object is passed
            if (Array.isArray(initialPrioritizedIdeas)) {
                setPrioritizedIdeas(initialPrioritizedIdeas);
            } else if (typeof initialPrioritizedIdeas === 'object') {
                // Try to flatten if it matches the schema structure { quickWins: [], ... }
                const flat = [];
                Object.values(initialPrioritizedIdeas).forEach(val => {
                    if (Array.isArray(val)) flat.push(...val);
                });
                setPrioritizedIdeas(flat);
            }
        }
        if (initialVotes) setVotes(initialVotes);
        if (initialWinningConcept) {
            setWinningConcept(initialWinningConcept);
            // FIX: Do NOT call onWinningConcept here. It triggers parent handler -> scroll -> loop/jump.
        }
    }, [initialPrioritizedIdeas, initialVotes, initialWinningConcept]);

    const quadrants = [
        { id: 'high-low', name: 'Quick Wins', impact: 'high', effort: 'low', color: 'bg-green-100 border-green-400', emoji: '🎯' },
        { id: 'high-high', name: 'Major Projects', impact: 'high', effort: 'high', color: 'bg-blue-100 border-blue-400', emoji: '🚀' },
        { id: 'low-low', name: 'Fill-Ins', impact: 'low', effort: 'low', color: 'bg-yellow-100 border-yellow-400', emoji: '⚡' },
        { id: 'low-high', name: 'Thankless Tasks', impact: 'low', effort: 'high', color: 'bg-red-100 border-red-400', emoji: '⚠️' }
    ];

    const handleDragStart = (e, idea) => {
        setDraggedIdea(idea);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, quadrant) => {
        e.preventDefault();

        if (!draggedIdea) return;

        const newPrioritizedIdea = {
            ...draggedIdea,
            impact: quadrant.impact,
            effort: quadrant.effort,
            quadrant: quadrant.id
        };

        const newMatrix = [
            ...prioritizedIdeas.filter(i => i.id !== draggedIdea.id),
            newPrioritizedIdea
        ];

        setPrioritizedIdeas(newMatrix);
        setDraggedIdea(null);

        // Auto-save
        saveMatrix(winningConcept, newMatrix);

        // Notify parent if handler provided
        if (onMatrixUpdate) {
            // If parent expects structure, we should convert? 
            // For now pass flat, parent is flexible in current page.jsx implementation?
            // page.jsx currently sets matrixData to flat if we pass flat. 
            // BUT saveIdeationState sends it to API. API schema expects structured.
            // We should map to structure for parent.
            const structured = {
                quickWins: newMatrix.filter(i => i.quadrant === 'high-low'),
                majorProjects: newMatrix.filter(i => i.quadrant === 'high-high'),
                fillIns: newMatrix.filter(i => i.quadrant === 'low-low'),
                thanklessTasks: newMatrix.filter(i => i.quadrant === 'low-high')
            };
            onMatrixUpdate(structured);
        }
    };

    const getIdeasInQuadrant = (quadrantId) => {
        return prioritizedIdeas.filter(idea => idea.quadrant === quadrantId);
    };

    const getUnplacedIdeas = () => {
        // Defensive check: Ensure we have arrays to work with
        const safePlacedIdeas = Array.isArray(prioritizedIdeas) ? prioritizedIdeas : [];

        return ideas.filter(idea =>
            !safePlacedIdeas.find(p => p.id === idea.id)
        );
    };

    const voteForIdea = (ideaId) => {
        setVotes(prev => ({
            ...prev,
            [ideaId]: (prev[ideaId] || 0) + 1
        }));
    };

    const saveMatrix = async (currentWinner = winningConcept, currentMatrix = prioritizedIdeas) => {
        try {
            await fetch(`/api/projects/${projectId}/prioritize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: currentUser.username,
                    matrix: currentMatrix,
                    votes,
                    winningConcept: currentWinner
                })
            });
        } catch (err) {
            console.error('Error saving prioritization:', err);
        }
    };

    const selectWinner = (idea) => {
        setWinningConcept(idea);
        if (onWinningConcept) {
            onWinningConcept(idea);
        }
        // Auto-save the winner
        saveMatrix(idea);
    };

    const getTopVotedIdeas = () => {
        return prioritizedIdeas
            .map(idea => ({ ...idea, voteCount: votes[idea.id] || 0 }))
            .sort((a, b) => b.voteCount - a.voteCount)
            .slice(0, 5);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Impact vs. Effort Matrix
                        </h2>
                        <p className="text-indigo-100 text-sm mt-1">
                            {prioritizedIdeas.length} of {ideas.length} ideas prioritized
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowVoting(!showVoting)}
                            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/30 transition-colors"
                        >
                            {showVoting ? '📊 Hide Voting' : '🗳️ Start Voting'}
                        </button>
                        <button
                            onClick={() => saveMatrix()}
                            className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-bold hover:bg-indigo-50 transition-colors shadow-lg"
                        >
                            Save Matrix
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Unplaced Ideas */}
                {getUnplacedIdeas().length > 0 && (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                            Ideas to Prioritize ({getUnplacedIdeas().length})
                            <span className="text-xs text-gray-500 font-normal ml-2">Drag to matrix below</span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {getUnplacedIdeas().map(idea => (
                                <div
                                    key={idea.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, idea)}
                                    className="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg cursor-move hover:shadow-lg transition-all text-sm font-medium text-gray-700 hover:border-indigo-400"
                                >
                                    {idea.text}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Matrix Grid */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-gray-600 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                            High Impact
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4" style={{ minHeight: '400px' }}>
                        {/* Quick Wins - High Impact, Low Effort */}
                        <div
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, quadrants[0])}
                            className={`${quadrants[0].color} border-2 rounded-xl p-4 transition-all hover:shadow-lg min-h-[200px]`}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">{quadrants[0].emoji}</span>
                                <h3 className="font-bold text-gray-700">{quadrants[0].name}</h3>
                                <span className="text-xs bg-white/50 px-2 py-1 rounded-full">
                                    {getIdeasInQuadrant(quadrants[0].id).length}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {getIdeasInQuadrant(quadrants[0].id).map(idea => (
                                    <div
                                        key={idea.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, idea)}
                                        className="bg-white p-3 rounded-lg shadow-sm border border-green-300 group hover:shadow-md transition-all relative cursor-move"
                                    >
                                        <p className="text-sm font-medium text-gray-900">{idea.text}</p>

                                        <div className="flex items-center justify-between mt-2">
                                            {showVoting && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => voteForIdea(idea.id)}
                                                        className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                                    >
                                                        👍 Vote
                                                    </button>
                                                    <span className="text-xs text-gray-600">{votes[idea.id] || 0}</span>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => selectWinner(idea)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200 font-bold flex items-center gap-1"
                                                title="Mark as Winning Concept"
                                            >
                                                🏆 Winner
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Major Projects - High Impact, High Effort */}
                        <div
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, quadrants[1])}
                            className={`${quadrants[1].color} border-2 rounded-xl p-4 transition-all hover:shadow-lg min-h-[200px]`}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">{quadrants[1].emoji}</span>
                                <h3 className="font-bold text-gray-700">{quadrants[1].name}</h3>
                                <span className="text-xs bg-white/50 px-2 py-1 rounded-full">
                                    {getIdeasInQuadrant(quadrants[1].id).length}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {getIdeasInQuadrant(quadrants[1].id).map(idea => (
                                    <div
                                        key={idea.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, idea)}
                                        className="bg-white p-3 rounded-lg shadow-sm border border-blue-300 group hover:shadow-md transition-all cursor-move"
                                    >
                                        <p className="text-sm font-medium text-gray-900">{idea.text}</p>
                                        {showVoting && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={() => voteForIdea(idea.id)}
                                                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                >
                                                    👍 Vote
                                                </button>
                                                <span className="text-xs text-gray-600">{votes[idea.id] || 0} votes</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Fill-Ins - Low Impact, Low Effort */}
                        <div
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, quadrants[2])}
                            className={`${quadrants[2].color} border-2 rounded-xl p-4 transition-all hover:shadow-lg min-h-[200px]`}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">{quadrants[2].emoji}</span>
                                <h3 className="font-bold text-gray-700">{quadrants[2].name}</h3>
                                <span className="text-xs bg-white/50 px-2 py-1 rounded-full">
                                    {getIdeasInQuadrant(quadrants[2].id).length}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {getIdeasInQuadrant(quadrants[2].id).map(idea => (
                                    <div
                                        key={idea.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, idea)}
                                        className="bg-white p-3 rounded-lg shadow-sm border border-yellow-300 group hover:shadow-md transition-all cursor-move"
                                    >
                                        <p className="text-sm font-medium text-gray-900">{idea.text}</p>
                                        {showVoting && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={() => voteForIdea(idea.id)}
                                                    className="text-xs px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                                >
                                                    👍 Vote
                                                </button>
                                                <span className="text-xs text-gray-600">{votes[idea.id] || 0} votes</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Thankless Tasks - Low Impact, High Effort */}
                        <div
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, quadrants[3])}
                            className={`${quadrants[3].color} border-2 rounded-xl p-4 transition-all hover:shadow-lg min-h-[200px]`}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">{quadrants[3].emoji}</span>
                                <h3 className="font-bold text-gray-700">{quadrants[3].name}</h3>
                                <span className="text-xs bg-white/50 px-2 py-1 rounded-full">
                                    {getIdeasInQuadrant(quadrants[3].id).length}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {getIdeasInQuadrant(quadrants[3].id).map(idea => (
                                    <div
                                        key={idea.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, idea)}
                                        className="bg-white p-3 rounded-lg shadow-sm border border-red-300 group hover:shadow-md transition-all cursor-move"
                                    >
                                        <p className="text-sm font-medium text-gray-800">{idea.text}</p>
                                        {showVoting && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={() => voteForIdea(idea.id)}
                                                    className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                >
                                                    👍 Vote
                                                </button>
                                                <span className="text-xs text-gray-600">{votes[idea.id] || 0} votes</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-gray-600">Low Effort</div>
                        <div className="text-sm font-bold text-gray-600 flex items-center gap-2">
                            High Effort
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Top Voted */}
                {showVoting && Object.keys(votes).length > 0 && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
                        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Top Voted Ideas
                        </h3>
                        <div className="space-y-2">
                            {getTopVotedIdeas().map((idea, index) => (
                                <div
                                    key={idea.id}
                                    className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between group hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <p className="font-medium text-gray-800 flex-1">{idea.text}</p>
                                        <span className="text-sm text-gray-600 font-bold">{idea.voteCount} votes</span>
                                    </div>
                                    {!winningConcept && (
                                        <button
                                            onClick={() => selectWinner(idea)}
                                            className="ml-4 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                                        >
                                            🏆 Select as Winner
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Winning Concept */}
                {winningConcept && (
                    <div className="bg-gradient-to-r from-yellow-100 via-orange-100 to-red-100 border-4 border-yellow-400 rounded-xl p-6 shadow-2xl">
                        <div className="flex items-start gap-4">
                            <div className="text-5xl">🏆</div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Winning Concept Selected!</h3>
                                <p className="text-lg text-gray-700 mb-4">{winningConcept.text}</p>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-bold">
                                        {votes[winningConcept.id] || 0} votes
                                    </span>
                                    <span className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm font-medium">
                                        {quadrants.find(q => q.id === winningConcept.quadrant)?.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
