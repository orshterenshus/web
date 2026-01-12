'use client';

import { useState, useEffect } from 'react';
import PersonaTable from './PersonaTable';
import UserInterviews from './UserInterviews';
import EmpathyMap from './EmpathyMap';

export default function EmpathizePhase({ projectId, data, onUpdate }) {
    const [activePersonaId, setActivePersonaId] = useState(null);
    const [personas, setPersonas] = useState([]);

    // Sync local personas state with prop data
    useEffect(() => {
        if (data?.empathize?.personas) {
            setPersonas(data.empathize.personas);

            // If we have personas but no active selection, select the first one
            if (data.empathize.personas.length > 0 && !activePersonaId) {
                setActivePersonaId(data.empathize.personas[0].id);
            }
        }
    }, [data, activePersonaId]);

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
            />

            {activePersonaId ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                    <div className="flex items-center gap-4 py-4">
                        <div className="h-px flex-1 bg-white/10"></div>
                        <span className="text-slate-500 font-mono text-xs uppercase tracking-widest">
                            Working on: <span className="text-blue-400 font-bold">{personas.find(p => p.id === activePersonaId)?.name || 'Persona'}</span>
                        </span>
                        <div className="h-px flex-1 bg-white/10"></div>
                    </div>

                    <UserInterviews
                        projectId={projectId}
                        data={data}
                        onUpdate={onUpdate}
                        activePersonaId={activePersonaId}
                        personaName={personas.find(p => p.id === activePersonaId)?.name}
                    />

                    <EmpathyMap
                        projectId={projectId}
                        data={data}
                        onUpdate={onUpdate}
                        activePersonaId={activePersonaId}
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
