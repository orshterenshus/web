import dbConnect from '@/utils/db';
import Project from '@/models/Project';

// Save POV data
export async function POST(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const { user, pov, hmwQuestions } = body;

        if (!user || !pov) {
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

        // Update define phase data
        project.define = project.define || {};
        project.define.pov = {
            personaName: pov.personaName,
            userNeed: pov.userNeed,
            insight: pov.insight,
            createdAt: new Date()
        };

        if (hmwQuestions) {
            project.define.hmwQuestions = hmwQuestions;
        }

        if (body.selectedHmw) {
            project.define.selectedHmw = body.selectedHmw;
        }

        project.markModified('define');
        await project.save();

        return Response.json({ success: true, define: project.define });

    } catch (error) {
        console.error('Error saving POV:', error);
        return Response.json({ error: 'Failed to save POV' }, { status: 500 });
    }
}
