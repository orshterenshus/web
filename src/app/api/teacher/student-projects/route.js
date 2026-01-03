
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const studentUsername = searchParams.get('student');

        if (!studentUsername) {
            return NextResponse.json({ error: 'Student username is required' }, { status: 400 });
        }

        // Fetch all projects created by this student
        const projects = await Project.find({ createdBy: studentUsername }).sort({ createdAt: -1 });

        return NextResponse.json({ projects });
    } catch (error) {
        console.error('Error fetching student projects:', error);
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}
