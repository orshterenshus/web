import dbConnect from '@/utils/db';
import Project from '@/models/Project';

// Save constraints and validation results
export async function POST(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const { user, constraints, validationFlags } = body;

        if (!user || !constraints) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        const project = await Project.findById(id);
        if (!project) {
            return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        // Verify user has access (Case-insensitive check)
        const normalize = (str) => (str || '').toLowerCase();

        console.log(`[Constraints Save] Checking Access: User='${user}' Owner='${project.createdBy}' Shared=${JSON.stringify(project.sharedWith)}`);

        const isOwner = normalize(project.createdBy) === normalize(user);
        const isShared = project.sharedWith.some(s => normalize(s.user) === normalize(user));

        if (!isOwner && !isShared) {
            console.warn(`[Constraints Save] ⛔ Unauthorized: '${user}' is not owner '${project.createdBy}'`);
            return Response.json({ error: `Unauthorized: User '${user}' does not match project owner.` }, { status: 403 });
        }

        // Update define phase data
        project.define = project.define || {};
        project.define.constraints = constraints;

        if (validationFlags) {
            project.define.validationFlags = validationFlags;
        }

        project.markModified('define');
        await project.save();

        return Response.json({ success: true, define: project.define });

    } catch (error) {
        console.error('Error saving constraints:', error);
        return Response.json({ error: `Save Error: ${error.message}` }, { status: 500 });
    }
}
