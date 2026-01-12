
import dbConnect from '@/utils/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');

        console.log('----------------------------------------');
        console.log('🔍 Fetching users with role filter:', role || 'none');

        let query = {};
        if (role === 'student') {
            // Include users with role='student' OR users with no role set (legacy users)
            query = { $or: [{ role: 'student' }, { role: { $exists: false } }, { role: null }] };
        } else if (role) {
            query = { role };
        }
        console.log('   Query:', JSON.stringify(query));

        const users = await User.find(query).select('-password'); // Exclude passwords
        console.log('   Found users:', users.length);

        // Debug: if searching for students and none found, check all users' roles
        if (role === 'student' && users.length === 0) {
            const allUsers = await User.find({}).select('username role');
            console.log('   ⚠️ No students found. All users roles:');
            allUsers.forEach(u => console.log(`      - ${u.username}: role="${u.role}"`));
        }
        console.log('----------------------------------------');

        return NextResponse.json(users);
    } catch (error) {
        console.error('❌ Error fetching users:', error);
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
