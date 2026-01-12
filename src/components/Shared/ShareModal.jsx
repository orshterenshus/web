
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <h2 className="text-xl font-bold mb-4">Share Project</h2>

                <div className="mb-4 relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search User</label>
                    <input
                        type="text"
                        value={selectedUser ? selectedUser.username : query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedUser(null); // Clear selection on edit
                        }}
                        placeholder="Type username..."
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />

                    {/* Dropdown Results */}
                    {results.length > 0 && !selectedUser && (
                        <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded shadow-lg max-h-40 overflow-y-auto">
                            {results.map(user => (
                                <div
                                    key={user._id}
                                    className="p-2 hover:bg-blue-50 cursor-pointer"
                                    onClick={() => {
                                        setSelectedUser(user);
                                        setResults([]);
                                    }}
                                >
                                    <p className="font-medium text-gray-900">{user.username}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={!selectedUser}
                        className={`px-4 py-2 rounded text-white ${selectedUser ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                            }`}
                    >
                        Share
                    </button>
                </div>
            </div>
        </div>
    );
}
