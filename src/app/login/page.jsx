'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess('Login successful!');
                localStorage.setItem('currentUser', JSON.stringify(data.user));

                setTimeout(() => {
                    router.push('/project-management');
                }, 800);
            } else {
                setError(data.error || 'Invalid credentials');
                setIsLoading(false);
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0f172a] text-slate-200 font-sans selection:bg-purple-500/30">
            {/* Background Decorative Elements (The Cosmos) */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-indigo-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
                <div className="absolute top-[20%] left-[50%] w-[300px] h-[300px] bg-pink-600/20 rounded-full mix-blend-screen filter blur-[80px] animate-blob animation-delay-2000"></div>
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] p-8 sm:p-10 transform transition-all hover:border-white/20">

                    {/* Header */}
                    <div className="mb-10 text-center">
                        <h1 className="text-4xl font-bold mb-3 tracking-tight text-white drop-shadow-sm">
                            Welcome Back
                        </h1>
                        <p className="text-slate-400 text-sm font-medium tracking-wide">
                            Sign in to continue your journey
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="group">
                            <label htmlFor="username" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 ml-1 group-focus-within:text-blue-400 transition-colors">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                className="w-full px-5 py-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                                placeholder="Enter your username"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="group">
                            <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 ml-1 group-focus-within:text-blue-400 transition-colors">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                className="w-full px-5 py-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 background-animate hover:shadow-blue-500/40 ${isLoading ? 'opacity-80 cursor-wait' : 'hover:brightness-110'}`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer Actions */}
                    <div className="mt-8 flex flex-col gap-4 text-center">
                        <Link
                            href="/register"
                            className="text-sm text-slate-400 hover:text-white transition-colors duration-200"
                        >
                            Don't have an account? <span className="text-blue-400 font-medium hover:underline">Create one</span>
                        </Link>

                        <button
                            onClick={() => alert('Forgot password functionality to be implemented.')}
                            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    {/* Feedback Messages */}
                    {error && (
                        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center animate-fadeIn">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-200 text-sm text-center animate-fadeIn">
                            {success}
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center text-slate-600 text-xs">
                    &copy; {new Date().getFullYear()} AntiGravity Design. All rights reserved.
                </div>
            </div>
        </div>
    );
}
