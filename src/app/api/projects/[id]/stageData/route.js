import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import { NextResponse } from 'next/server';

// GET - Fetch stage data for a project
export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        console.log('========================================');
        console.log('📥 GET /api/projects/[id]/stageData');
        console.log('   Project ID:', id);

        const project = await Project.findById(id).lean();

        if (!project) {
            console.log('   ❌ Project not found');
            console.log('========================================');
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        console.log('   ✅ Project found:', project.name);
        console.log('   📍 Phase in DB:', project.phase);
        console.log('========================================');

        return NextResponse.json({
            stageData: project.stageData || {},
            phase: project.phase || 'Empathize'
        });
    } catch (error) {
        console.error('❌ Error fetching stage data:', error);
        return NextResponse.json({ error: 'Failed to fetch stage data' }, { status: 500 });
    }
}

// PUT - Update entire stage data for a phase
export async function PUT(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const { stage, data } = body;

        if (!stage || !data) {
            return NextResponse.json({ error: 'Stage and data are required' }, { status: 400 });
        }

        const updatePath = `stageData.${stage}`;

        const project = await Project.findByIdAndUpdate(
            id,
            { $set: { [updatePath]: data } },
            { new: true }
        ).lean();

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Stage data updated successfully',
            stageData: project.stageData || {}
        });
    } catch (error) {
        console.error('Error updating stage data:', error);
        return NextResponse.json({ error: 'Failed to update stage data' }, { status: 500 });
    }
}

// PATCH - Update specific field within stage data (for checklist items, etc.)
export async function PATCH(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const { stage, field, value, action } = body;

        console.log('PATCH stageData:', { id, stage, field, value, action });

        if (!stage || !field) {
            return NextResponse.json({ error: 'Stage and field are required' }, { status: 400 });
        }

        const fieldPath = `stageData.${stage}.${field}`;
        let updateQuery;

        if (action === 'push') {
            updateQuery = { $push: { [fieldPath]: value } };
        } else if (action === 'pull') {
            updateQuery = { $pull: { [fieldPath]: { id: value.id } } };
        } else {
            // Default: set the value directly using $set
            updateQuery = { $set: { [fieldPath]: value } };
        }

        console.log('Update query:', JSON.stringify(updateQuery));

        const project = await Project.findByIdAndUpdate(
            id,
            updateQuery,
            { new: true, upsert: false }
        ).lean();

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        console.log('Updated stageData:', JSON.stringify(project.stageData, null, 2));

        return NextResponse.json({
            message: 'Stage data updated successfully',
            stageData: project.stageData || {}
        });
    } catch (error) {
        console.error('Error patching stage data:', error);
        return NextResponse.json({ error: 'Failed to update stage data' }, { status: 500 });
    }
}
