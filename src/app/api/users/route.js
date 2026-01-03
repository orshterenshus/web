
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');

        const query = role ? { role } : {};
        const users = await User.find(query).select('-password'); // Exclude passwords

        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Check if user exists
        const userExists = await User.findOne({
            $or: [{ email: body.email }, { username: body.username }]
        });

        if (userExists) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const user = await User.create(body);
        return NextResponse.json({ message: 'User created', user }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
    }
}
