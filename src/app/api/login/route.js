
import dbConnect from '@/utils/db';
import User from '@/models/User';
import { log } from 'console';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        console.log('Env Check:', process.env.MONGODB_URI ? 'Defined' : 'Undefined');
        await dbConnect();
        const { username, password } = await request.json();

        // In a real app, you should hash passwords!
        // For now, we compare plain text as per migration request

        console.log('------------------------------------------------');
        console.log('🔍 Login Attempt:');
        console.log(`   Username/Email: "${username}"`);
        console.log(`   Password Input: "${password}"`);

        // Debug: Check if user exists ignoring password
        const debugUser = await User.findOne({ $or: [{ username: username }, { email: username }] });
        if (debugUser) {
            console.log(`   ✅ User found in DB: ${debugUser.username}`);
            console.log(`   🔑 DB Password: "${debugUser.password}"`);
            console.log(`   ❓ Match? ${debugUser.password === password}`);
        } else {
            console.log('   ❌ User NOT found in DB by username/email');
            const allUsers = await User.find({});
            console.log(`   ℹ️ Total users in DB: ${allUsers.length}`);
            if (allUsers.length > 0) console.log('   Sample user:', allUsers[0].username);
        }
        console.log('------------------------------------------------');

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
        console.error('Login API Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
