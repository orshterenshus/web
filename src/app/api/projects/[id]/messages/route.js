
import dbConnect from '@/utils/db';
import Project from '@/models/Project';
import { NextResponse } from 'next/server';

// GET: Fetch chat history for a project
export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const project = await Project.findById(id).select('chatHistory');

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json({ chatHistory: project.chatHistory || [] });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }
}

// POST: Add new message(s) to chat history
export async function POST(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();

        // Support both single message and array of messages
        const messages = Array.isArray(body.messages) ? body.messages : [body];

        // Validate messages
        for (const msg of messages) {
            if (!msg.sender || !msg.text) {
                return NextResponse.json(
                    { error: 'Each message must have sender and text' },
                    { status: 400 }
                );
            }
        }

        // Add timestamps if not provided
        const messagesWithTimestamp = messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp || new Date(),
        }));

        const project = await Project.findByIdAndUpdate(
            id,
            { $push: { chatHistory: { $each: messagesWithTimestamp } } },
            { new: true }
        );

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Messages added successfully',
            addedCount: messagesWithTimestamp.length,
        });
    } catch (error) {
        console.error('Error adding messages:', error);
        return NextResponse.json({ error: 'Failed to add messages' }, { status: 500 });
    }
}
