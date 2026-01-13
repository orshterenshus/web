import dbConnect from '@/utils/db';
import Project from '@/models/Project';

// Save brainstorming ideas
export async function POST(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { user, ideas } = body;

        if (!user || !ideas) {
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
        project.ideate.ideas = ideas;

        await project.save();

        return Response.json({ success: true, ideate: project.ideate });

    } catch (error) {
        console.error('Error saving ideas:', error);
        return Response.json({ error: 'Failed to save ideas' }, { status: 500 });
    }
}
