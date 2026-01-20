'use client';

import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function PersonaContextWidget({ persona }) {
    const { theme } = useTheme();
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!persona) return null;

    return (
        <div
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`cursor-pointer shadow-lg border-b-4 transition-all duration-300 group select-none relative z-40
                ${theme === 'dark'
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white border-purple-400/30 hover:border-purple-400/50'
                    : 'bg-white text-slate-800 border-purple-200 hover:border-purple-300 ring-1 ring-slate-200/50'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between">

                    {/* Left Side: Content */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className={`rounded-full border-2 shadow-sm overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'}
                                ${theme === 'dark' ? 'border-white/20 bg-white/10' : 'border-slate-100 bg-slate-50'}
                            `}>
                                {persona.image ? (
                                    <img src={persona.image} alt={persona.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-400'}`}>
                                        {persona.name?.charAt(0) || 'P'}
                                    </div>
                                )}
                            </div>
                            {!isCollapsed && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-indigo-600"></div>
                            )}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                                <h3 className={`font-bold transition-all duration-300 ${isCollapsed ? 'text-base' : 'text-lg'} ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    {persona.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                                        ${theme === 'dark' ? 'bg-white/20 text-white/90' : 'bg-purple-100 text-purple-700'}
                                    `}>
                                        Target Persona
                                    </span>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {!isCollapsed ? (
                                <div className={`flex flex-wrap items-center gap-x-6 gap-y-1 mt-1 text-sm animate-in fade-in slide-in-from-left-2 duration-300
                                    ${theme === 'dark' ? 'text-blue-100' : 'text-slate-500'}
                                `}>
                                    <p className="flex items-center gap-1.5 min-w-0">
                                        <span className="opacity-60 text-xs uppercase font-bold tracking-wide">Pain Point:</span>
                                        <span className={`font-medium truncate max-w-[300px] ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>{persona.painPoint || 'Not specified'}</span>
                                    </p>

                                    {persona.demographics && (
                                        <div className="hidden md:flex items-center gap-4 text-xs opacity-80">
                                            {persona.demographics.age && (
                                                <span className="flex items-center gap-1">
                                                    <span className="opacity-60">Age:</span> {persona.demographics.age}
                                                </span>
                                            )}
                                            {persona.demographics.occupation && (
                                                <span className="flex items-center gap-1">
                                                    <span className="opacity-60">Role:</span> {persona.demographics.occupation}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Collapsed Details */
                                <p className={`text-sm animate-in fade-in slide-in-from-left-2 duration-300 ${theme === 'dark' ? 'text-blue-200/80' : 'text-slate-400'}`}>
                                    Click to view details
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Toggle Arrow */}
                    <div className="ml-4 flex-shrink-0">
                        <div className={`p-2 rounded-full transition-all duration-300 ${isCollapsed ? 'rotate-180' : 'rotate-0'}
                            ${theme === 'dark' ? 'bg-white/10 group-hover:bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'}
                        `}>
                            <svg className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
