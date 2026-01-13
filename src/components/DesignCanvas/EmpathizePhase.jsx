'use client';

import { useState, useEffect } from 'react';
import PersonaTable from './PersonaTable';
import UserInterviews from './UserInterviews';
import EmpathyMap from './EmpathyMap';

export default function EmpathizePhase({ projectId, data, onUpdate }) {
    const [activePersonaId, setActivePersonaId] = useState(null);
    const [activeAiPersonaId, setActiveAiPersonaId] = useState(null);
    const [activeTab, setActiveTab] = useState('user'); // 'user' or 'ai'
    const [personas, setPersonas] = useState([]);
    const [aiPersonas, setAiPersonas] = useState([]);

    // Sync local personas state with prop data
    useEffect(() => {
        if (data?.empathize) {
            if (data.empathize.personas) {
                setPersonas(data.empathize.personas);
                if (data.empathize.personas.length > 0 && !activePersonaId) {
                    setActivePersonaId(data.empathize.personas[0].id);
                }
            }
            if (data.empathize.aiPersonas) {
                setAiPersonas(data.empathize.aiPersonas);
                if (data.empathize.aiPersonas.length > 0 && !activeAiPersonaId) {
                    setActiveAiPersonaId(data.empathize.aiPersonas[0].id);
                }
            }
        }
    }, [data, activePersonaId, activeAiPersonaId]);

    // Handle initial selection if not set
    useEffect(() => {
        if (personas.length > 0 && !activePersonaId) {
            setActivePersonaId(personas[0].id);
        }
    }, [personas]);

    return (
        <div className="space-y-8">
            <PersonaTable
                projectId={projectId}
                data={data}
                onUpdate={onUpdate}
                activePersonaId={activePersonaId}
                onPersonaSelect={setActivePersonaId}
                activeAiPersonaId={activeAiPersonaId}
                onAiPersonaSelect={setActiveAiPersonaId}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {(activeTab === 'user' ? activePersonaId : activeAiPersonaId) ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                    <div className="flex items-center gap-4 py-4">
                        <div className="h-px flex-1 bg-white/10"></div>
                        <span className="text-slate-500 font-mono text-xs uppercase tracking-widest">
                            Working on: <span className={`${activeTab === 'ai' ? 'text-purple-400' : 'text-blue-400'} font-bold`}>
                                {activeTab === 'user'
                                    ? (personas.find(p => p.id === activePersonaId)?.name || 'User Persona')
                                    : (aiPersonas.find(p => p.id === activeAiPersonaId)?.name || 'AI Persona')}
                            </span>
                        </span>
                        <div className="h-px flex-1 bg-white/10"></div>
                    </div>

                    <UserInterviews
                        projectId={projectId}
                        data={data}
                        onUpdate={onUpdate}
                        activePersonaId={activeTab === 'user' ? activePersonaId : activeAiPersonaId}
                        personaName={activeTab === 'user'
                            ? personas.find(p => p.id === activePersonaId)?.name
                            : aiPersonas.find(p => p.id === activeAiPersonaId)?.name}
                        activeTab={activeTab}
                    />

                    <EmpathyMap
                        projectId={projectId}
                        data={data}
                        onUpdate={onUpdate}
                        activePersonaId={activePersonaId}
                        activeAiPersonaId={activeAiPersonaId}
                        activePersonaName={personas.find(p => p.id === activePersonaId)?.name}
                        activeAiPersonaName={aiPersonas.find(p => p.id === activeAiPersonaId)?.name}
                        activeTab={activeTab}
                    />
                </div>
            ) : (
                <div className="text-center p-8 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <p className="text-slate-400">Create or select a persona above to start mapping insights.</p>
                </div>
            )}
        </div>
    );
}
