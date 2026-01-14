'use client';

import { useState } from 'react';

export default function PersonaContextWidget({ persona }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!persona) return null;

    return (
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-lg border-b-4 border-purple-400 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between py-3">
                    {!isCollapsed && (
                        <div className="flex items-center gap-4 flex-1">
                            {/* Persona Image */}
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full border-3 border-white shadow-lg overflow-hidden bg-white">
                                    {persona.image ? (
                                        <img
                                            src={persona.image}
                                            alt={persona.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-indigo-500 text-white text-xl font-bold">
                                            {persona.name?.charAt(0) || 'P'}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"></div>
                            </div>

                            {/* Persona Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-lg font-bold truncate">
                                        {persona.name}
                                    </h3>
                                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                        Target Persona
                                    </span>
                                </div>
                                <p className="text-sm text-purple-100 truncate mt-0.5">
                                    <span className="font-semibold">Pain Point:</span> {persona.painPoint || 'Not specified'}
                                </p>
                            </div>

                            {/* Quick Stats */}
                            {persona.demographics && (
                                <div className="hidden md:flex items-center gap-4 text-xs">
                                    {persona.demographics.age && (
                                        <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                                            <span className="text-purple-200">Age:</span>{' '}
                                            <span className="font-bold">{persona.demographics.age}</span>
                                        </div>
                                    )}
                                    {persona.demographics.occupation && (
                                        <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                                            <span className="text-purple-200">Role:</span>{' '}
                                            <span className="font-bold">{persona.demographics.occupation}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Collapse/Expand Button */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="ml-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                        aria-label={isCollapsed ? 'Expand persona' : 'Collapse persona'}
                    >
                        {isCollapsed ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Collapsed State */}
                {isCollapsed && (
                    <div className="flex items-center justify-center pb-2">
                        <span className="text-xs text-purple-200">
                            Designing for: <span className="font-bold text-white">{persona.name}</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
