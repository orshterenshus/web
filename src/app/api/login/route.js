
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        await dbConnect();
        const { username, password } = await request.json();

        // In a real app, you should hash passwords!
        // For now, we compare plain text as per migration request
        const user = await User.findOne({
            $or: [{ username: username }, { email: username }],
            password: password
        });

        if (user) {
            return NextResponse.json({ message: 'Login successful', user });
        } else {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
