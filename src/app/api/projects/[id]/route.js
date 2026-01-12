import dbConnect from '@/utils/db';
import Project from '@/models/Project';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const requestingUser = searchParams.get('user');

        if (!requestingUser) {
            return NextResponse.json({ error: 'User query param required' }, { status: 400 });
        }

        const project = await Project.findById(id);

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Enforce ownership: only the user who created the project OR is in sharedWith may access it
        const isShared = project.sharedWith.some(share => share.user === requestingUser);
        if (project.createdBy !== requestingUser && !isShared) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json(project);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const { searchParams } = new URL(request.url);
        const requestingUser = searchParams.get('user');

        if (!requestingUser) {
            return NextResponse.json({ error: 'User query param required' }, { status: 400 });
        }

        const project = await Project.findById(id);

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Enforce ownership: Creator has full access
        // Shared users with 'Owner' permission have full access (except changing creator)
        // Shared users with 'Basic' permission can only add messages (handled logic below or assume frontend sends partial updates)

        const isCreator = project.createdBy === requestingUser;
        const sharedUser = project.sharedWith.find(s => s.user === requestingUser);
        const hasOwnerPermission = sharedUser && sharedUser.permission === 'Owner';
        const hasBasicPermission = sharedUser && sharedUser.permission === 'Basic';

        if (!isCreator && !sharedUser) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Handle specific updates like adding messages or sharing
        // If it's a basic user, ensure they aren't changing critical fields
        if (hasBasicPermission) {
            // Allow updating phase and messages only
            if (body.name || body.createdBy || body.sharedWith) {
                // For now, let's just restrict it conceptually, or filter the body.
                // Ideally we'd have specific endpoints or actions.
                // Simplification: Basic users can only append messages.
                // Re-reading requirements: "each project will store the history chat".
                // So we need to allow updating 'messages'.
            }
        }

        let updateQuery = {};

        if (body.message) {
            updateQuery.$push = { messages: body.message };
        }

        if (body.shareWithUser) {
            console.log('Sharing project:', id, 'with', body.shareWithUser);
            if (!isCreator && !hasOwnerPermission) {
                return NextResponse.json({ error: 'Only owners can share projects' }, { status: 403 });
            }
            // Check if already shared
            const currentShares = project.sharedWith || [];
            if (currentShares.some(s => s.user === body.shareWithUser.user)) {
                return NextResponse.json({ error: 'User already added' }, { status: 400 });
            }
            updateQuery.$push = { ...updateQuery.$push, sharedWith: body.shareWithUser };
        }

        if (body.phase) {
            console.log('Updating phase to:', body.phase);
            if (!updateQuery.$set) updateQuery.$set = {};
            updateQuery.$set.phase = body.phase;
        }

        // Apply other updates if creator/owner
        if (isCreator || hasOwnerPermission) {
            if (body.name) updateQuery.name = body.name;
        }

        if (Object.keys(updateQuery).length === 0) {
            // If body contains direct fields like 'messages' (replacing array) or others, process them?
            // The implementation plan suggested appending. 
            // Let's support standard $set for simplicity if not using special keys
            if (!body.message && !body.shareWithUser) {
                // Fallback for standard updates (like phase change from existing frontend)
                updateQuery = body;
            }
        }

        const updatedProject = await Project.findByIdAndUpdate(id, updateQuery, { new: true });
        return NextResponse.json(updatedProject);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }
}