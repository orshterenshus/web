'use client';

import { useState, useEffect } from 'react';

export default function RealityBoard({ projectId, pov, currentUser, initialConstraints, initialValidationFlags, onConstraintsSaved }) {
    const [constraints, setConstraints] = useState({
        technical: initialConstraints?.technical || [],
        business: initialConstraints?.business || [],
        kpis: initialConstraints?.kpis || []
    });
    const [inputValues, setInputValues] = useState({
        technical: '',
        business: '',
        kpiMetric: '',
        kpiTarget: ''
    });

    // Update state if initialConstraints changes
    useEffect(() => {
        if (initialConstraints) {
            setConstraints({
                technical: initialConstraints.technical || [],
                business: initialConstraints.business || [],
                kpis: initialConstraints.kpis || []
            });
        }
    }, [initialConstraints]);

    const [validationFlags, setValidationFlags] = useState(initialValidationFlags || []);

    // Update state if initialValidationFlags changes
    useEffect(() => {
        if (initialValidationFlags) {
            setValidationFlags(initialValidationFlags);
        }
    }, [initialValidationFlags]);

    const [isValidating, setIsValidating] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const addConstraint = (type) => {
        const value = inputValues[type]?.trim();
        if (!value) return;

        setConstraints(prev => ({
            ...prev,
            [type]: [...prev[type], value]
        }));
        setInputValues(prev => ({ ...prev, [type]: '' }));
        setIsSaved(false);
    };

    const addKPI = () => {
        const metric = inputValues.kpiMetric?.trim();
        const target = inputValues.kpiTarget?.trim();
        if (!metric || !target) return;

        setConstraints(prev => ({
            ...prev,
            kpis: [...prev.kpis, { metric, target }]
        }));
        setInputValues(prev => ({ ...prev, kpiMetric: '', kpiTarget: '' }));
        setIsSaved(false);
    };

    const removeConstraint = (type, index) => {
        setConstraints(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
        setIsSaved(false);
    };

    const validateConstraints = async () => {
        if (!pov || !pov.userNeed) {
            setValidationFlags([{
                type: 'warning',
                message: 'Please complete the POV statement first to enable validation',
                severity: 'medium'
            }]);
            return;
        }

        setIsValidating(true);
        try {
            const response = await fetch(`/api/projects/${projectId}/validate-constraints`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: currentUser.username,
                    pov,
                    constraints
                })
            });

            if (response.ok) {
                const data = await response.json();
                setValidationFlags(data.validationFlags || []);
            }
        } catch (err) {
            console.error('Error validating constraints:', err);
            setValidationFlags([{
                type: 'error',
                message: 'Failed to validate constraints. Please try again.',
                severity: 'high'
            }]);
        } finally {
            setIsValidating(false);
        }
    };

    const saveConstraints = async () => {
        try {
            const response = await fetch(`/api/projects/${projectId}/constraints`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: currentUser?.username || 'anonymous',
                    constraints,
                    validationFlags
                })
            });

            if (response.ok) {
                setIsSaved(true);
                if (onConstraintsSaved) {
                    onConstraintsSaved(constraints);
                }
            } else {
                const errorData = await response.json();
                alert(`Save Failed: ${errorData.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Error saving constraints:', err);
            alert('Error saving constraints. Check console for details.');
        }
    };

    const hasConstraints = constraints.technical.length > 0 ||
        constraints.business.length > 0 ||
        constraints.kpis.length > 0;

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return 'border-red-500 bg-red-900/20 text-red-200';
            case 'medium': return 'border-yellow-500 bg-yellow-900/20 text-yellow-200';
            case 'low': return 'border-green-500 bg-green-900/20 text-green-200'; // PASS is now Green
            default: return 'border-slate-500 bg-slate-800/50 text-slate-300';
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'high': // CRITICAL / FAIL
                return (
                    <div className="w-6 h-6 flex items-center justify-center text-xl">🛑</div>
                );
            case 'medium': // WARNING
                return (
                    <div className="w-6 h-6 flex items-center justify-center text-xl">⚠️</div>
                );
            case 'low': // PASS
                return (
                    <div className="w-6 h-6 flex items-center justify-center text-xl">✅</div>
                );
            default:
                return (
                    <div className="w-6 h-6 flex items-center justify-center text-xl">ℹ️</div>
                );
        }
    };

    return (
        <div className="glass-panel rounded-xl shadow-lg border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600/30 to-red-600/30 px-6 py-4 border-b border-white/10 backdrop-blur-md">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Reality Board
                </h2>
                <p className="text-orange-200 text-sm mt-1">
                    Define project boundaries and success criteria
                </p>
            </div>

            <div className="p-6 space-y-6">
                {/* Technical Constraints */}
                <div className="space-y-3">
                    <label className="block">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span className="font-bold text-slate-200">Technical Constraints</span>
                            <span className="text-xs text-slate-500">(e.g., Mobile-only, Legacy DB, API limits)</span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValues.technical}
                                onChange={(e) => setInputValues({ ...inputValues, technical: e.target.value })}
                                onKeyPress={(e) => e.key === 'Enter' && addConstraint('technical')}
                                placeholder="Enter technical constraint..."
                                className="flex-1 px-4 py-2 bg-black/40 border-2 border-blue-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-slate-200 placeholder-slate-600 transition-all"
                            />
                            <button
                                onClick={() => addConstraint('technical')}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20"
                            >
                                Add
                            </button>
                        </div>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {constraints.technical.map((constraint, index) => (
                            <div
                                key={index}
                                className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1.5 rounded-full flex items-center gap-2 group hover:bg-blue-500/20 transition-colors"
                            >
                                <span className="text-sm font-medium">{constraint}</span>
                                <button
                                    onClick={() => removeConstraint('technical', index)}
                                    className="text-blue-400 hover:text-red-400 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Business Constraints */}
                <div className="space-y-3">
                    <label className="block">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-bold text-slate-200">Business Constraints</span>
                            <span className="text-xs text-slate-500">(e.g., Budget $10K, 3-month timeline)</span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValues.business}
                                onChange={(e) => setInputValues({ ...inputValues, business: e.target.value })}
                                onKeyPress={(e) => e.key === 'Enter' && addConstraint('business')}
                                placeholder="Enter business constraint..."
                                className="flex-1 px-4 py-2 bg-black/40 border-2 border-green-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 text-slate-200 placeholder-slate-600 transition-all"
                            />
                            <button
                                onClick={() => addConstraint('business')}
                                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-green-500/20"
                            >
                                Add
                            </button>
                        </div>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {constraints.business.map((constraint, index) => (
                            <div
                                key={index}
                                className="bg-green-500/10 text-green-300 border border-green-500/20 px-3 py-1.5 rounded-full flex items-center gap-2 group hover:bg-green-500/20 transition-colors"
                            >
                                <span className="text-sm font-medium">{constraint}</span>
                                <button
                                    onClick={() => removeConstraint('business', index)}
                                    className="text-green-400 hover:text-red-400 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Success Metrics (KPIs) */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                        <span className="font-bold text-slate-200">Success Metrics (KPIs)</span>
                        <span className="text-xs text-slate-500">(e.g., Load time &lt; 2s, Retention &gt; 40%)</span>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputValues.kpiMetric}
                            onChange={(e) => setInputValues({ ...inputValues, kpiMetric: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && document.getElementById('kpi-target').focus()}
                            placeholder="Metric name..."
                            className="flex-1 px-4 py-2 bg-black/40 border-2 border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 text-slate-200 placeholder-slate-600 transition-all"
                        />
                        <input
                            id="kpi-target"
                            type="text"
                            value={inputValues.kpiTarget}
                            onChange={(e) => setInputValues({ ...inputValues, kpiTarget: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && addKPI()}
                            placeholder="Target (e.g., < 2s or 90%)"
                            className="flex-1 px-4 py-2 bg-black/40 border-2 border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 text-slate-200 placeholder-slate-600 transition-all"
                        />
                        <button
                            onClick={addKPI}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-purple-500/20"
                        >
                            Add KPI
                        </button>
                    </div>
                    <div className="grid gap-2">
                        {constraints.kpis.map((kpi, index) => (
                            <div
                                key={index}
                                className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-4 py-2 rounded-lg flex items-center justify-between group hover:bg-purple-500/20 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-bold">{kpi.metric}</span>
                                    <span className="text-purple-500">→</span>
                                    <span className="font-medium text-white">{kpi.target}</span>
                                </div>
                                <button
                                    onClick={() => removeConstraint('kpis', index)}
                                    className="text-purple-400 hover:text-red-400 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                {hasConstraints && (
                    <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                        <button
                            onClick={validateConstraints}
                            disabled={isValidating}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl font-bold shadow-lg hover:shadow-orange-500/20 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isValidating ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Validating...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Validate Against POV
                                </>
                            )}
                        </button>

                        <button
                            onClick={saveConstraints}
                            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors shadow-lg"
                        >
                            Save
                        </button>

                        {isSaved && (
                            <div className="flex items-center gap-2 text-green-400 font-medium bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Saved
                            </div>
                        )}
                    </div>
                )}

                {/* Validation Results */}
                {validationFlags.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-white/10 mt-4">
                        <h3 className="font-bold text-slate-300 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Validation Results
                        </h3>
                        {validationFlags.map((flag, index) => (
                            <div key={index} className={`flex items-start gap-4 p-4 rounded-xl border-l-4 ${getSeverityColor(flag.severity)} shadow-sm`}>
                                {getSeverityIcon(flag.severity)}
                                <div>
                                    <p className="font-bold">{(flag.flagType || flag.type || 'INFO').toUpperCase()}</p>
                                    <p className="text-sm mt-1 opacity-90">{flag.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
