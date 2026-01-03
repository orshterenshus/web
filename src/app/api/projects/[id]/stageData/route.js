import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import { NextResponse } from 'next/server';

// GET - Fetch stage data for a project
export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params; // params is a Promise in Next.js 15

        const project = await Project.findById(id);

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json({
            stageData: project.stageData || {},
            phase: project.phase
        });
    } catch (error) {
        console.error('Error fetching stage data:', error);
        return NextResponse.json({ error: 'Failed to fetch stage data' }, { status: 500 });
    }
}

// PUT - Update stage data for a project
export async function PUT(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const { stage, data } = body;

        if (!stage || !data) {
            return NextResponse.json({ error: 'Stage and data are required' }, { status: 400 });
        }

        // Build the update path dynamically
        const updatePath = `stageData.${stage}`;

        const project = await Project.findByIdAndUpdate(
            id,
            { $set: { [updatePath]: data } },
            { new: true, upsert: true }
        );

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Stage data updated successfully',
            stageData: project.stageData
        });
    } catch (error) {
        console.error('Error updating stage data:', error);
        return NextResponse.json({ error: 'Failed to update stage data' }, { status: 500 });
    }
}

// PATCH - Update specific field within stage data (for checklist items, adding notes, etc.)
export async function PATCH(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const { stage, field, value, action } = body;

        if (!stage || !field) {
            return NextResponse.json({ error: 'Stage and field are required' }, { status: 400 });
        }

        let updateQuery;
        const fieldPath = `stageData.${stage}.${field}`;

        // Handle different actions
        let queryOptions = { new: true };
        let findQuery = { _id: id };

        if (action === 'push') {
            // Add item to array
            updateQuery = { $push: { [fieldPath]: value } };
        } else if (action === 'pull') {
            // Remove item from array by id
            updateQuery = { $pull: { [fieldPath]: { id: value.id } } };
        } else if (action === 'update_in_array') {
            // Update specific item in array (e.g., toggle checked)
            // Need to find the document AND the specific array element
            findQuery = { _id: id, [`${fieldPath}.id`]: value.id };
            updateQuery = { $set: { [`${fieldPath}.$.${value.fieldToUpdate}`]: value.newValue } };
        } else {
            // Default: set the value directly
            updateQuery = { $set: { [fieldPath]: value } };
        }

        const project = await Project.findOneAndUpdate(
            findQuery,
            updateQuery,
            queryOptions
        );

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Stage data updated successfully',
            stageData: project.stageData
        });
    } catch (error) {
        console.error('Error patching stage data:', error);
        return NextResponse.json({ error: 'Failed to update stage data' }, { status: 500 });
    }
}
