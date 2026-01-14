import dbConnect from '@/utils/db';
import Project from '@/models/Project';

// Save prioritization matrix and winning concept
export async function POST(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { user, matrix, votes, winningConcept } = body;

        if (!user) {
            return Response.json({ error: 'User required' }, { status: 400 });
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
        project.ideate.prioritization = {
            matrix: matrix || [],
            votes: votes || {},
            winningConcept: winningConcept || null
        };

        await project.save();

        return Response.json({ success: true, ideate: project.ideate });

    } catch (error) {
        console.error('Error saving prioritization:', error);
        return Response.json({ error: 'Failed to save prioritization' }, { status: 500 });
    }
}
