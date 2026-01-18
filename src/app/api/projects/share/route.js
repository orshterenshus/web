
import dbConnect from '@/utils/db';
import Project from '@/models/Project';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        await dbConnect();
        const { projectId, username } = await request.json();

        if (!projectId || !username) {
            return NextResponse.json({ error: 'Missing projectId or username' }, { status: 400 });
        }

        // Verify user exists first
        const userExists = await User.findOne({ username });
        if (!userExists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const project = await Project.findByIdAndUpdate(
            projectId,
            { $addToSet: { sharedWith: { user: username, permission: 'Basic' } } },
            { new: true }
        );

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Project shared successfully', project }, { status: 200 });
    } catch (error) {
        console.error('Share project error:', error);
        return NextResponse.json({ error: 'Failed to share project' }, { status: 500 });
    }
}
