"use client";

import React, { useState, useRef } from 'react';

// Types (implicit in JS, but good for reference)
/*
type FeedbackCategory = "loved" | "critique" | "questions" | "ideas";
type FeedbackItem = {
    id: string;
    text: string;
    category: FeedbackCategory;
    createdAt: number;
};
*/

const FeedbackMatrix = ({ projectId, data, onUpdate, onExport }) => {
    // Initialize items from props or default to empty array
    const [items, setItems] = useState(data || []);
    const [isSaving, setIsSaving] = useState(false);
    const [draggedItem, setDraggedItem] = useState(null);
    const [inputs, setInputs] = useState({
        loved: '',
        critique: '',
        questions: '',
        ideas: ''
    });

    const categories = [
        {
            id: 'loved',
            title: '❤️ Loved',
            subtitle: 'What worked well? What should we keep?',
            color: 'bg-green-50 border-green-200',
            buttonColor: 'bg-green-600 hover:bg-green-700',
            textColor: 'text-green-800'
        },
        {
            id: 'critique',
            title: '⚠️ Challenges / Critique',
            subtitle: 'What was confusing? What are the pain points?',
            color: 'bg-red-50 border-red-200',
            buttonColor: 'bg-red-600 hover:bg-red-700',
            textColor: 'text-red-800'
        },
        {
            id: 'questions',
            title: '❓ Questions',
            subtitle: 'What did users ask? What was unclear?',
            color: 'bg-blue-50 border-blue-200',
            buttonColor: 'bg-blue-600 hover:bg-blue-700',
            textColor: 'text-blue-800'
        },
        {
            id: 'ideas',
            title: '💡 Ideas / Suggestions',
            subtitle: 'What new ideas emerged? How to improve?',
            color: 'bg-yellow-50 border-yellow-200',
            buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
            textColor: 'text-yellow-800'
        }
    ];

    // Save to DB
    const saveToDb = async (newItems) => {
        if (!projectId) return;
        setIsSaving(true);
        try {
            const response = await fetch(`/api/projects/${projectId}/stageData`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stage: 'test',
                    field: 'feedbackMatrix',
                    value: newItems
                })
            });

            if (response.ok && onUpdate) {
                const result = await response.json();
                onUpdate(result.stageData);
            }
        } catch (error) {
            console.error('Failed to save feedback:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAdd = (category) => {
        if (!inputs[category].trim()) return;

        const newItem = {
            id: Date.now().toString(),
            text: inputs[category].trim(),
            category: category,
            createdAt: Date.now()
        };

        const newItems = [...items, newItem];
        setItems(newItems);
        setInputs(prev => ({ ...prev, [category]: '' }));
        saveToDb(newItems);
    };

    const handleDelete = (id) => {
        const newItems = items.filter(item => item.id !== id);
        setItems(newItems);
        saveToDb(newItems);
    };

    const handleUpdate = (id, newText) => {
        const newItems = items.map(item => item.id === id ? { ...item, text: newText } : item);
        setItems(newItems);
        saveToDb(newItems);
    };

    const handleDragStart = (e, item) => {
        setDraggedItem(item);
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetCategory) => {
        e.preventDefault();
        const itemId = e.dataTransfer.getData('text/plain');

        if (itemId && draggedItem) {
            const newItems = items.map(item =>
                item.id === itemId ? { ...item, category: targetCategory } : item
            );
            setItems(newItems);
            saveToDb(newItems);
        }
        setDraggedItem(null);
    };

    const handleExport = () => {
        if (!onExport) {
            // Fallback to local download if no onExport provided
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `feedback-matrix-${Date.now()}.json`);
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            return;
        }

        const jsonContent = JSON.stringify(items, null, 2);
        const file = new File([jsonContent], `feedback-matrix-${Date.now()}.json`, { type: 'application/json' });
        onExport(file);
    };

    const handleImport = (e) => {
        const fileReader = new FileReader();
        fileReader.readAsText(e.target.files[0], "UTF-8");
        fileReader.onload = e => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (Array.isArray(parsed)) {
                    setItems(parsed);
                    saveToDb(parsed);
                }
            } catch (err) {
                console.error("Invalid JSON file");
                alert("Failed to import: Invalid JSON file");
            }
        };
        // Reset input
        e.target.value = null;
    };

    // Helper to calculate summary
    const getSummary = () => {
        const summary = { loved: 0, critique: 0, questions: 0, ideas: 0 };
        items.forEach(item => {
            if (summary[item.category] !== undefined) summary[item.category]++;
        });
        return summary;
    };

    const summary = getSummary();

    return (
        <div className="w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden text-gray-800">
            {/* Header */}
            <div className="bg-gray-50 p-6 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Feedback Capture Matrix</h2>
                    <p className="text-sm text-gray-500">Organize user testing feedback into four quadrants. {isSaving && <span className="text-blue-500 text-xs ml-2 animate-pulse">Saving...</span>}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        {onExport ? 'Save to Cloud' : 'Export JSON'}
                    </button>
                    <label className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Import JSON
                        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                    </label>
                </div>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 h-auto md:h-[600px] divide-y md:divide-y-0 md:divide-x divide-gray-200">
                {categories.map((cat, idx) => {
                    // Add bottom border for top items on desktop to complete the grid
                    const borderClass = idx < 2 ? 'md:border-b border-gray-200' : '';

                    return (
                        <div
                            key={cat.id}
                            className={`flex flex-col h-[300px] md:h-auto ${borderClass} bg-white`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, cat.id)}
                        >
                            {/* Quadrant Header */}
                            <div className={`p-4 border-b border-gray-100 flex justify-between items-start ${cat.color.replace('border-', '')} bg-opacity-20`}>
                                <div>
                                    <h3 className={`font-bold flex items-center gap-2 ${cat.textColor}`}>
                                        {cat.title}
                                        <span className="bg-white bg-opacity-60 px-2 py-0.5 rounded-full text-xs border border-gray-200 md:hidden">
                                            {summary[cat.id]}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">{cat.subtitle}</p>
                                </div>
                                <span className="hidden md:block bg-gray-100 px-2 py-1 rounded-full text-xs font-bold text-gray-500">
                                    {summary[cat.id]}
                                </span>
                            </div>

                            {/* Drop Area / List */}
                            <div className="flex-1 p-4 overflow-y-auto bg-gray-50/30 space-y-3">
                                {items.filter(i => i.category === cat.id).map(item => (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, item)}
                                        className="group bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-move relative"
                                    >
                                        <div
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => handleUpdate(item.id, e.target.innerText)}
                                            onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking text
                                            className="text-sm text-gray-700 outline-none min-h-[1.2em] cursor-text"
                                        >
                                            {item.text}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all bg-white rounded shadow-sm"
                                            title="Delete"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                                {items.filter(i => i.category === cat.id).length === 0 && (
                                    <div className="h-full flex items-center justify-center text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                                        Drop here or add item
                                    </div>
                                )}
                            </div>

                            {/* Add Input */}
                            <div className="p-3 border-t border-gray-100 bg-white">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inputs[cat.id]}
                                        onChange={(e) => setInputs(prev => ({ ...prev, [cat.id]: e.target.value }))}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdd(cat.id)}
                                        placeholder="Add a note..."
                                        className="flex-1 text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                    <button
                                        onClick={() => handleAdd(cat.id)}
                                        className={`px-3 py-2 rounded-md text-white transition-colors ${cat.buttonColor}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Summary */}
            <div className="bg-gray-50 border-t border-gray-200 p-3 text-xs text-gray-500 flex justify-between items-center">
                <div className="flex gap-4">
                    <span>Total Notes: <strong>{items.length}</strong></span>
                    {summary.critique > 3 && (
                        <span className="text-red-600 font-medium">⚠️ {summary.critique} Critiques - Review ASAP</span>
                    )}
                </div>
                <div>
                    Drag via card edges. Click text to edit.
                </div>
            </div>
        </div>
    );
};

export default FeedbackMatrix;
