
'use client';

import { useState, useEffect, useRef } from 'react';

export default function SharePopover({ projectId, triggerButton, onShareSuccess }) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sharedUsers, setSharedUsers] = useState(new Set());
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    useEffect(() => {
        if (isOpen) {
            // Reset state when opened
            // Maybe keep query? No, reset is better or keep. Let's keep if meaningful, but typically reset.
            // setQuery('');
            // setResults([]);
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

    const handleShare = async (username) => {
        if (sharedUsers.has(username)) return; // Already shared

        try {
            const res = await fetch('/api/projects/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: projectId,
                    username: username
                })
            });

            if (res.ok) {
                // Add to shared state
                setSharedUsers(prev => new Set(prev).add(username));
                if (onShareSuccess) onShareSuccess();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to share project');
            }
        } catch (error) {
            console.error('Error sharing project:', error);
            alert('An error occurred');
        }
    };

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <div onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(!isOpen);
            }}>
                {triggerButton}
            </div>

            {isOpen && (
                <div
                    className="absolute right-0 bottom-full mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search user..."
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 mb-2"
                        autoFocus
                    />

                    <div className="max-h-48 overflow-y-auto">
                        {loading && <p className="text-xs text-gray-500 p-2">Loading...</p>}

                        {!loading && query.length >= 2 && results.length === 0 && (
                            <p className="text-xs text-gray-500 p-2">No users found.</p>
                        )}

                        {results.map(user => {
                            const isShared = sharedUsers.has(user.username);
                            return (
                                <div
                                    key={user._id}
                                    className={`p-2 cursor-pointer rounded flex justify-between items-center group ${isShared ? 'bg-green-50' : 'hover:bg-blue-50'}`}
                                    onClick={() => handleShare(user.username)}
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{user.username}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                    {isShared ? (
                                        <span className="text-green-600 text-xs font-bold">Added</span>
                                    ) : (
                                        <span className="text-blue-600 text-xs font-bold opacity-0 group-hover:opacity-100">Add</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
