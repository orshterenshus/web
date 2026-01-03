
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
            }
        } catch (err) {
            setMessage({ text: 'An error occurred.', type: 'error' });
        }
    };

    return (
        <div className="font-sans bg-gray-100 flex items-center justify-center h-screen m-0 text-gray-800">
            <div className="bg-white p-5 rounded-lg shadow-lg w-80">
                <h1 className="font-bold text-4xl mb-5 text-gray-800">Register</h1>
                <form onSubmit={handleSubmit} className="text-left justify-center">

                    <label htmlFor="username">Username:</label>
                    <input className="w-full p-2.5 my-2.5 border border-gray-300 rounded-md box-border text-gray-800"
                        type="text" name="username" required value={formData.username} onChange={handleChange} />

                    <label htmlFor="email">Email:</label>
                    <input className="w-full p-2.5 my-2.5 border border-gray-300 rounded-md box-border text-gray-800"
                        type="email" name="email" required value={formData.email} onChange={handleChange} />

                    <label htmlFor="password">Password:</label>
                    <input className="w-full p-2.5 my-2.5 border border-gray-300 rounded-md box-border text-gray-800"
                        type="password" name="password" required value={formData.password} onChange={handleChange} />

                    <label htmlFor="dob">Date of Birth:</label>
                    <input className="w-full p-2.5 my-2.5 border border-gray-300 rounded-md box-border text-gray-800"
                        type="date" name="dob" required value={formData.dob} onChange={handleChange} />

                    <div className="flex items-center my-2.5">
                        <label htmlFor="isTeacher" className="mr-2">Sign up as Teacher?</label>
                        <input
                            type="checkbox"
                            name="isTeacher"
                            checked={formData.role === 'teacher'}
                            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.checked ? 'teacher' : 'student' }))}
                        />
                    </div>

                    <button type="submit" className="w-full p-3 bg-green-500 text-white rounded hover:bg-green-600 mt-2">
                        Register
                    </button>

                    <Link href="/login" className="block text-center w-full p-3 mt-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                        Back to Login
                    </Link>
                </form>
                {message.text && (
                    <div className={`mt-2 text-center text-sm ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
}
