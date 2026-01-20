
'use client';

import { useState, useEffect } from 'react';

export default function ShareModal({ isOpen, onClose, onShare, projectId }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            setSelectedUser(null);
        }
    }, [isOpen]);

    useEffect(() => {
        const searchUsers = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (error) {
                console.error('Failed to search users', error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleShare = () => {
        if (selectedUser) {
            onShare(selectedUser.username);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[var(--popover-bg)] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[var(--glass-border)] transition-colors">
                <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">Share Project</h2>

                <div className="mb-4 relative">
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Search User</label>
                    <input
                        type="text"
                        value={selectedUser ? selectedUser.username : query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedUser(null); // Clear selection on edit
                        }}
                        placeholder="Type username..."
                        className="w-full p-2 bg-[var(--input-bg)] border border-[var(--border-strong)] rounded text-[var(--foreground)] focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                    />

                    {/* Dropdown Results */}
                    {results.length > 0 && !selectedUser && (
                        <div className="absolute z-10 w-full bg-[var(--popover-bg)] border border-[var(--border-subtle)] mt-1 rounded shadow-lg max-h-40 overflow-y-auto">
                            {results.map(user => (
                                <div
                                    key={user._id}
                                    className="p-2 hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors"
                                    onClick={() => {
                                        setSelectedUser(user);
                                        setResults([]);
                                    }}
                                >
                                    <p className="font-medium text-[var(--text-main)]">{user.username}</p>
                                    <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={!selectedUser}
                        className={`px-4 py-2 rounded text-white shadow-lg transition-all ${selectedUser ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-gray-400 cursor-not-allowed'
                            }`}
                    >
                        Share
                    </button>
                </div>
            </div>
        </div>
    );
}
