'use client';

import { useState, useEffect } from 'react';
import ConfirmationModal from '../Shared/ConfirmationModal';

export default function UserInterviews({ projectId, data, onUpdate, activePersonaId, personaName, activeTab }) {
    const [interviews, setInterviews] = useState([]);
    const [activeInterviewId, setActiveInterviewId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    // Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [interviewToDelete, setInterviewToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Sync local interviews state with prop data
    useEffect(() => {
        if (data?.empathize?.interviews) {
            setInterviews(data.empathize.interviews);
        }
    }, [data]);

    // Select first interview for the active persona if none selected
    useEffect(() => {
        if (activePersonaId && interviews.length > 0) {
            const personaInterviews = interviews.filter(i => i.personaId === activePersonaId);
            if (!activeInterviewId && personaInterviews.length > 0) {
                setActiveInterviewId(personaInterviews[0].id);
            } else if (activeInterviewId) {
                // Check if current active interview belongs to active persona
                const current = interviews.find(i => i.id === activeInterviewId);
                if (current && current.personaId !== activePersonaId) {
                    setActiveInterviewId(personaInterviews.length > 0 ? personaInterviews[0].id : null);
                }
            }
        } else {
            setActiveInterviewId(null);
        }
    }, [activePersonaId, interviews]);

    const handleAddInterview = async () => {
        if (!activePersonaId) return;

        setIsCreating(true);
        const newInterview = {
            id: Date.now().toString(),
            personaId: activePersonaId,
            interviewee: 'New Interviewee',
            date: new Date().toISOString().split('T')[0],
            questions: [] // Array of { q: '', a: '' }
        };
        const updated = [...interviews, newInterview];

        await updateData(updated);

        setActiveInterviewId(newInterview.id);
        setIsCreating(false);
    };

    const handleUpdateInterview = (id, field, value) => {
        const updated = interviews.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );
        setInterviews(updated);
    };

    const handleAddQuestion = (interviewId) => {
        const interview = interviews.find(i => i.id === interviewId);
        if (!interview) return;

        const updatedQuestions = [...(interview.questions || []), { id: Date.now(), q: '', a: '' }];
        handleUpdateInterview(interviewId, 'questions', updatedQuestions);
        // We'll save on blur of the inputs
    };

    const handleUpdateQuestion = (interviewId, qIndex, field, value) => {
        const interview = interviews.find(i => i.id === interviewId);
        if (!interview) return;

        const updatedQuestions = [...(interview.questions || [])];
        updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], [field]: value };
        handleUpdateInterview(interviewId, 'questions', updatedQuestions);
    };

    const handleDeleteQuestion = (interviewId, qIndex) => {
        const interview = interviews.find(i => i.id === interviewId);
        if (!interview) return;

        const updatedQuestions = interview.questions.filter((_, idx) => idx !== qIndex);
        const updated = interviews.map(item =>
            item.id === interviewId ? { ...item, questions: updatedQuestions } : item
        );
        setInterviews(updated);
        updateData(updated); // Immediate save for delete
    }

    const handleBlur = () => {
        updateData(interviews);
    };

    const handleDeleteClick = (id) => {
        setInterviewToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDeleteInterview = async () => {
        if (!interviewToDelete) return;

        setIsDeleting(true);
        const updated = interviews.filter(i => i.id !== interviewToDelete);

        await updateData(updated);

        if (activeInterviewId === interviewToDelete) {
            // Find next interview for this persona
            const remaining = updated.filter(i => i.personaId === activePersonaId);
            setActiveInterviewId(remaining.length > 0 ? remaining[0].id : null);
        }

        setIsDeleting(false);
        setDeleteModalOpen(false);
        setInterviewToDelete(null);
    };

    const updateData = async (updatedInterviews) => {
        try {
            const response = await fetch(`/api/projects/${projectId}/stageData`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stage: 'empathize',
                    field: 'interviews',
                    value: updatedInterviews,
                    action: 'set'
                })
            });

            if (response.ok) {
                const result = await response.json();
                onUpdate(result.stageData);
            }
        } catch (error) {
            console.error('Failed to update interviews:', error);
        }
    };

    // Filter interviews for the active persona
    const filteredInterviews = interviews.filter(i => i.personaId === activePersonaId);
    const activeInterview = interviews.find(i => i.id === activeInterviewId);

    if (!activePersonaId) return null;

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTab === 'ai' ? 'bg-purple-100' : 'bg-orange-100'}`}>
                        <span className="text-xl">{activeTab === 'ai' ? '🤖' : '🎙️'}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">{personaName ? `${personaName} Interview` : (activeTab === 'ai' ? 'AI Interviews' : 'User Interviews')}</h3>
                        <p className="text-sm text-gray-500">{activeTab === 'ai' ? 'Simulate conversations with this AI persona' : 'Document Q&A sessions for this persona'}</p>
                    </div>
                </div>
                <button
                    onClick={handleAddInterview}
                    disabled={isCreating}
                    className={`px-4 py-2 text-white rounded-lg font-medium transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === 'ai' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'}`}
                >
                    <span>{isCreating ? '' : '+'}</span> {isCreating ? 'Creating...' : 'New Session'}
                </button>
            </div>

            <div className="flex flex-col md:flex-row min-h-[400px]">
                {/* Sidebar List */}
                <div className="w-full md:w-64 bg-slate-50 border-r border-gray-100 p-2 overflow-y-auto max-h-[600px]">
                    {filteredInterviews.length === 0 && (
                        <div className="text-center p-4 text-gray-400 text-sm">
                            No interviews for this persona yet.
                        </div>
                    )}
                    {filteredInterviews.map(interview => (
                        <div
                            key={interview.id}
                            onClick={() => setActiveInterviewId(interview.id)}
                            className={`p-3 rounded-lg cursor-pointer mb-2 transition-all ${activeInterviewId === interview.id
                                ? `bg-white shadow-md border-l-4 ${activeTab === 'ai' ? 'border-purple-500' : 'border-orange-500'}`
                                : 'hover:bg-gray-100 text-gray-600'
                                }`}
                        >
                            <h4 className="font-bold text-sm truncate">{interview.interviewee || 'Untitled'}</h4>
                            <p className="text-xs text-gray-400">{interview.date}</p>
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-6 bg-white overflow-y-auto max-h-[800px]">
                    {activeInterview ? (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-4 p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Interviewee</label>
                                    <input
                                        type="text"
                                        value={activeInterview.interviewee}
                                        onChange={(e) => handleUpdateInterview(activeInterview.id, 'interviewee', e.target.value)}
                                        onBlur={handleBlur}
                                        className="w-full text-lg font-bold text-gray-800 bg-transparent border-b border-orange-200 focus:border-orange-500 focus:ring-0 px-0 py-1"
                                        placeholder="Name or Pseudonym"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={activeInterview.date}
                                        onChange={(e) => handleUpdateInterview(activeInterview.id, 'date', e.target.value)}
                                        onBlur={handleBlur}
                                        className="text-sm text-gray-600 border border-orange-200 rounded-lg px-3 py-1.5 bg-white focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Questions & Answers</h4>
                                </div>

                                {(!activeInterview.questions || activeInterview.questions.length === 0) && (
                                    <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                                        <p className="text-gray-400 text-sm mb-3">No questions recorded yet.</p>
                                        <button
                                            onClick={() => handleAddQuestion(activeInterview.id)}
                                            className="text-orange-500 hover:text-orange-600 text-sm font-medium"
                                        >
                                            + Add First Question
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {activeInterview.questions?.map((qa, idx) => (
                                        <div key={idx} className="group relative bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-orange-200 transition-colors">
                                            <div className="mb-3">
                                                <input
                                                    type="text"
                                                    value={qa.q}
                                                    onChange={(e) => handleUpdateQuestion(activeInterview.id, idx, 'q', e.target.value)}
                                                    onBlur={handleBlur}
                                                    placeholder="Ask a question..."
                                                    className="w-full bg-transparent font-bold text-gray-800 placeholder-gray-400 border-none p-0 focus:ring-0 text-sm"
                                                />
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="w-0.5 bg-orange-300 self-stretch rounded-full"></div>
                                                <textarea
                                                    value={qa.a}
                                                    onChange={(e) => handleUpdateQuestion(activeInterview.id, idx, 'a', e.target.value)}
                                                    onBlur={handleBlur}
                                                    placeholder="Record the answer..."
                                                    className="w-full bg-transparent text-gray-600 placeholder-gray-300 border-none p-0 focus:ring-0 text-sm resize-none h-auto min-h-[60px]"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleDeleteQuestion(activeInterview.id, idx)}
                                                className="absolute top-2 right-2 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Delete Question"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleAddQuestion(activeInterview.id)}
                                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 transition-all font-medium text-sm"
                                >
                                    + Add Another Question
                                </button>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-50">
                                <button
                                    onClick={() => handleDeleteClick(activeInterview.id)}
                                    className="text-red-400 text-xs hover:text-red-600 uppercase font-bold tracking-wider"
                                >
                                    Delete Interview
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-300 flex-col gap-2">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl grayscale opacity-50">🎙️</div>
                            <p>Select or create an interview session</p>
                        </div>
                    )}
                </div>
            </div>
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDeleteInterview}
                title="Delete Interview?"
                message="Are you sure you want to delete this interview session? This action cannot be undone."
                confirmText="Delete Interview"
                isDangerous={true}
                isLoading={isDeleting}
            />
        </div>
    );
}
