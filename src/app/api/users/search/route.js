
import dbConnect from '@/utils/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');

        if (!query) {
            return NextResponse.json([]);
        }

        // Find users matching username or email, limit to 5
        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        })
            .select('username email') // Only return necessary fields
            .limit(5);

        return NextResponse.json(users);
    } catch (error) {
        console.error('Search users error:', error);
        return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
    }
}
