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
            interview: 'New Interview',
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
        <div className="glass-panel rounded-xl shadow-lg overflow-hidden mb-8 border border-[var(--border-subtle)]">
            <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${activeTab === 'ai' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 border-purple-300 dark:border-purple-500/30' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 border-orange-300 dark:border-orange-500/30'}`}>
                        <span className="text-xl">{activeTab === 'ai' ? '🤖' : '🎙️'}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[var(--text-main)]">{personaName ? `${personaName} Interview` : (activeTab === 'ai' ? 'AI Interviews' : 'User Interviews')}</h3>
                        <p className="text-sm text-[var(--text-muted)]">{activeTab === 'ai' ? 'Simulate conversations with this AI persona' : 'Document Q&A sessions for this persona'}</p>
                    </div>
                </div>
                <button
                    onClick={handleAddInterview}
                    disabled={isCreating}
                    className={`px-4 py-2 text-white rounded-lg font-medium transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === 'ai' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20'}`}
                >
                    <span>{isCreating ? '' : '+'}</span> {isCreating ? 'Creating...' : 'New Session'}
                </button>
            </div>

            <div className="flex flex-col md:flex-row min-h-[400px]">
                {/* Sidebar List */}
                <div className="w-full md:w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] p-2 overflow-y-auto max-h-[600px] custom-scrollbar">
                    {filteredInterviews.length === 0 && (
                        <div className="text-center p-4 text-slate-500 text-sm">
                            No interviews for this persona yet.
                        </div>
                    )}
                    {filteredInterviews.map(interview => (
                        <div
                            key={interview.id}
                            onClick={() => setActiveInterviewId(interview.id)}
                            className={`p-3 rounded-lg cursor-pointer mb-2 transition-all ${activeInterviewId === interview.id
                                ? `bg-[var(--bg-tertiary)] shadow-md border-l-4 ${activeTab === 'ai' ? 'border-purple-500' : 'border-orange-500'} text-[var(--text-main)]`
                                : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                                }`}
                        >
                            <h4 className="font-bold text-sm truncate">{interview.interview || interview.interviewee || 'Untitled'}</h4>
                            <p className="text-xs text-slate-500">{interview.date}</p>
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-6 bg-transparent overflow-y-auto max-h-[800px] custom-scrollbar">
                    {activeInterview ? (
                        <div className="space-y-6">
                            <div className={`flex flex-col md:flex-row gap-4 p-4 rounded-xl border ${activeTab === 'ai' ? 'bg-purple-500/5 border-purple-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
                                <div className="flex-1">
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${activeTab === 'ai' ? '!text-purple-700 dark:text-purple-400' : '!text-orange-700 dark:text-orange-400'}`}>Interview</label>
                                    <input
                                        type="text"
                                        value={activeInterview.interview || activeInterview.interviewee || ''}
                                        onChange={(e) => handleUpdateInterview(activeInterview.id, 'interview', e.target.value)}
                                        onBlur={handleBlur}
                                        className={`w-full text-lg font-bold text-[var(--text-main)] bg-[var(--input-bg)] border rounded-lg px-3 py-2 focus:ring-2 transition-all ${activeTab === 'ai' ? 'border-purple-300 focus:border-purple-500 focus:ring-purple-200' : 'border-orange-300 focus:border-orange-500 focus:ring-orange-200'}`}
                                        placeholder="Name or Pseudonym"
                                    />
                                </div>
                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${activeTab === 'ai' ? '!text-purple-700 dark:text-purple-400' : '!text-orange-700 dark:text-orange-400'}`}>Date</label>
                                    <input
                                        type="date"
                                        value={activeInterview.date}
                                        onChange={(e) => handleUpdateInterview(activeInterview.id, 'date', e.target.value)}
                                        onBlur={handleBlur}
                                        className={`text-sm font-medium text-[var(--text-main)] border rounded-lg px-3 py-2 bg-[var(--input-bg)] focus:ring-2 shadow-sm ${activeTab === 'ai' ? 'border-purple-300 focus:border-purple-500 focus:ring-purple-200' : 'border-orange-300 focus:border-orange-500 focus:ring-orange-200'}`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold !text-orange-700 dark:text-slate-300 uppercase tracking-wider">Questions & Answers</h4>
                                </div>

                                {(!activeInterview.questions || activeInterview.questions.length === 0) && (
                                    <div className="text-center py-8 border-2 border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-secondary)]">
                                        <p className="text-[var(--text-muted)] dark:text-slate-500 text-sm mb-3">No questions recorded yet.</p>
                                        <button
                                            onClick={() => handleAddQuestion(activeInterview.id)}
                                            className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium"
                                        >
                                            + Add First Question
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {activeInterview.questions?.map((qa, idx) => (
                                        <div key={idx} className="group relative bg-[var(--bg-tertiary)] rounded-xl p-4 border border-[var(--border-subtle)] hover:border-[var(--border-interactive)] transition-colors">
                                            <div className="mb-3">
                                                <input
                                                    type="text"
                                                    value={qa.q}
                                                    onChange={(e) => handleUpdateQuestion(activeInterview.id, idx, 'q', e.target.value)}
                                                    onBlur={handleBlur}
                                                    placeholder="Ask a question..."
                                                    className="w-full bg-transparent font-bold text-[var(--text-main)] placeholder-[var(--text-muted)] border-none p-0 focus:ring-0 text-sm"
                                                />
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="w-0.5 bg-orange-500/50 self-stretch rounded-full"></div>
                                                <textarea
                                                    value={qa.a}
                                                    onChange={(e) => handleUpdateQuestion(activeInterview.id, idx, 'a', e.target.value)}
                                                    onBlur={handleBlur}
                                                    placeholder="Record the answer..."
                                                    className="w-full bg-[var(--input-bg)] text-[var(--text-main)] placeholder-[var(--text-muted)] border border-[var(--border-strong)] rounded-lg p-3 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-400 text-sm resize-none h-auto min-h-[80px]"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleDeleteQuestion(activeInterview.id, idx)}
                                                className="absolute top-2 right-2 text-gray-500 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Delete Question"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleAddQuestion(activeInterview.id)}
                                    className="w-full py-3 border-2 border-dashed border-[var(--border-subtle)] rounded-xl text-[var(--text-muted)] hover:text-orange-400 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all font-medium text-sm"
                                >
                                    + Add Another Question
                                </button>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-[var(--border-subtle)]">
                                <button
                                    onClick={() => handleDeleteClick(activeInterview.id)}
                                    className="text-red-400/80 text-xs hover:text-red-400 uppercase font-bold tracking-wider"
                                >
                                    Delete Interview
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 flex-col gap-2">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-2xl grayscale opacity-50">🎙️</div>
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
