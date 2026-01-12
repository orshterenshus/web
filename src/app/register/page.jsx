'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        dob: '',
        role: 'student'
    });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        setIsLoading(true);

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ text: 'User registered successfully!', type: 'success' });
                setTimeout(() => {
                    router.push('/login');
                }, 1500);
            } else {
                setMessage({ text: data.error || 'Registration failed', type: 'error' });
                setIsLoading(false);
            }
        } catch (err) {
            setMessage({ text: 'An error occurred.', type: 'error' });
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
            </div>

            {/* Register Card */}
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] p-8 sm:p-10 transform transition-all hover:border-white/20">

                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-bold mb-3 tracking-tight text-white drop-shadow-sm">
                            Create Account
                        </h1>
                        <p className="text-slate-400 text-sm font-medium tracking-wide">
                            Join the innovation journey today
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="group">
                            <label htmlFor="username" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 ml-1 group-focus-within:text-blue-400 transition-colors">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                name="username"
                                className="w-full px-5 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                                placeholder="Enter your username"
                                required
                                value={formData.username}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="group">
                            <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 ml-1 group-focus-within:text-blue-400 transition-colors">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                className="w-full px-5 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                                placeholder="you@example.com"
                                required
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="group">
                            <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 ml-1 group-focus-within:text-blue-400 transition-colors">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                className="w-full px-5 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                                placeholder="••••••••"
                                required
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="group">
                            <label htmlFor="dob" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 ml-1 group-focus-within:text-blue-400 transition-colors">
                                Date of Birth
                            </label>
                            <input
                                id="dob"
                                type="date"
                                name="dob"
                                className="w-full px-5 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 [color-scheme:dark]"
                                required
                                value={formData.dob}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="flex items-center gap-3 py-1 group cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, role: prev.role === 'teacher' ? 'student' : 'teacher' }))}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.role === 'teacher' ? 'bg-blue-500 border-blue-500' : 'border-slate-500 group-hover:border-slate-300'}`}>
                                {formData.role === 'teacher' && (
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                )}
                            </div>
                            <input
                                type="checkbox"
                                name="isTeacher"
                                className="hidden"
                                checked={formData.role === 'teacher'}
                                onChange={() => { }} // Handled by parent div
                            />
                            <span className="text-sm text-slate-300 group-hover:text-white transition-colors user-select-none">Sign up as Teacher</span>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:shadow-green-500/40 ${isLoading ? 'opacity-80 cursor-wait' : 'hover:brightness-110'}`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Account...
                                    </span>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer Actions */}
                    <div className="mt-8 text-center text-sm text-slate-400">
                        Already have an account? <Link href="/login" className="text-blue-400 font-medium hover:underline hover:text-white transition-colors">Sign In</Link>
                    </div>

                    {/* Feedback Messages */}
                    {message.text && (
                        <div className={`mt-6 p-4 rounded-xl border text-sm text-center animate-fadeIn ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-200' : 'bg-red-500/10 border-red-500/20 text-red-200'}`}>
                            {message.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
