import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDangerous = false,
    isLoading = false
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={isLoading ? undefined : onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-center mb-6">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${isDangerous ? 'bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-500 dark:text-blue-400'}`}>
                            {isDangerous ? '🗑️' : '⚠️'}
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-center text-[var(--foreground)] mb-2">
                        {title}
                    </h3>

                    <p className="text-[var(--text-muted)] text-center mb-8">
                        {message}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 rounded-xl font-medium bg-[var(--input-bg)] text-[var(--text-muted)] hover:bg-[var(--card-border)] transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 px-4 py-3 rounded-xl font-medium text-white transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isDangerous
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30'
                                }`}
                        >
                            {isLoading && (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {isLoading ? (isDangerous ? 'Deleting...' : 'Processing...') : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
