import dbConnect from '@/utils/db';
import Project from '@/models/Project';

// Save technical specification
export async function POST(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { user, techSpec } = body;

        if (!user || !techSpec) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        const project = await Project.findById(id);
        if (!project) {
            return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        // Verify user has access
        if (project.createdBy !== user && !project.sharedWith.some(s => s.user === user)) {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Update ideate phase data
        project.ideate = project.ideate || {};
        project.ideate.techSpec = {
            ...techSpec,
            generatedAt: new Date()
        };

        await project.save();

        return Response.json({ success: true, ideate: project.ideate });

    } catch (error) {
        console.error('Error saving tech spec:', error);
        return Response.json({ error: 'Failed to save technical specification' }, { status: 500 });
    }
}
