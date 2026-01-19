'use client';

import React from 'react';

export default function ProjectFileManager({ projectId, files = [], onUpload, onDelete, isUploading }) {

    // Helper to format file size
    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Helper to get icon based on file type
    const getFileIcon = (url) => {
        const ext = url.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
        if (['pdf'].includes(ext)) return '📄';
        if (['doc', 'docx'].includes(ext)) return '📝';
        if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
        return '📎';
    };

    return (
        <div>
            {/* Header */}
            <div className="p-6 border-b border-[var(--glass-border)] bg-[var(--card-bg)] flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xl shadow-inner">
                        📂
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--foreground)]">Project Files</h3>
                        <p className="text-sm text-[var(--text-muted)]">
                            {files.length} {files.length === 1 ? 'file' : 'files'} uploaded
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={onUpload}
                        disabled={isUploading}
                    />
                    <label
                        htmlFor="file-upload"
                        className={`
                            glass-button px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer
                            ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
                        `}
                    >
                        {isUploading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-blue-700 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 text-blue-700 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Upload File
                            </>
                        )}
                    </label>
                </div>
            </div>

            {/* File List */}
            <div className="p-6 bg-[var(--background)]/50 min-h-[150px]">
                {files.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl bg-black/5 dark:bg-[var(--card-bg)]/50">
                        <svg className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-[var(--text-muted)] font-medium">No files uploaded yet</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Upload documents, images, or sketches</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {files.map((file) => (
                            <div
                                key={file.publicId || file.url} // Fallback to URL if publicId missing
                                className="group relative bg-[var(--card-bg)] border border-black/10 dark:border-[var(--glass-border)] rounded-xl p-4 transition-all hover:border-blue-500/30 hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--input-bg)] flex items-center justify-center text-xl flex-shrink-0">
                                        {getFileIcon(file.url)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <a
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-[var(--foreground)] truncate block hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                                            title={file.name}
                                        >
                                            {file.name}
                                        </a>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                                            <span>{formatSize(file.size)}</span>
                                            <span>•</span>
                                            <span>{new Date(file.createdAt || Date.now()).toLocaleDateString()}</span>
                                        </div>
                                        {file.uploadedBy && (
                                            <div className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                                                by {file.uploadedBy}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => onDelete(file.publicId)}
                                        className="text-[var(--text-muted)] hover:text-red-400 p-1 rounded-md hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete File"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
