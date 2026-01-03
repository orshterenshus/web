
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        await dbConnect();

        // Get current user from header (set by frontend)
        // Get current user from header (set by frontend)
        const currentUser = request.headers.get('x-current-user');

        if (!currentUser) {
            return NextResponse.json({ error: 'User identification required' }, { status: 400 });
        }

        const query = {
            $or: [
                { createdBy: currentUser },
                { 'sharedWith.user': currentUser }
            ]
        };

        const projects = await Project.find(query).sort({ createdAt: -1 });
        return NextResponse.json(projects);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();

        const project = await Project.create(body);

        return NextResponse.json({ message: 'Project created', project }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}
