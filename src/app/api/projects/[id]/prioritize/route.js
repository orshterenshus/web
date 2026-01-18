import dbConnect from '@/utils/db';
import Project from '@/models/Project';
import Ideation from '@/models/Ideation';

// Helper to map flat matrix array to backend structure
const mapMatrixToStructure = (matrix) => {
    if (!Array.isArray(matrix)) return {};
    return {
        quickWins: matrix.filter(i => i.quadrant === 'high-low'),
        majorProjects: matrix.filter(i => i.quadrant === 'high-high'),
        fillIns: matrix.filter(i => i.quadrant === 'low-low'),
        thanklessTasks: matrix.filter(i => i.quadrant === 'low-high')
    };
};

// Save prioritization matrix and winning concept
export async function POST(request, { params }) {
    try {
        const { id } = await params;
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

        // Update ideate phase data - Using stageData schema field
        if (!project.stageData) project.stageData = {};
        if (!project.stageData.ideate) project.stageData.ideate = {};

        project.stageData.ideate.prioritization = {
            matrix: matrix || [],
            votes: votes || {},
            winningConcept: winningConcept || null
        };

        // Mark Mixed type as modified so Mongoose saves it
        project.markModified('stageData');

        await project.save();

        // SYNC FIX: Also update the Ideation model which page.jsx uses for loading
        const ideationMatrix = {
            ...mapMatrixToStructure(matrix),
            winningSolution: winningConcept
        };

        await Ideation.findOneAndUpdate(
            { projectId: id },
            {
                $set: {
                    'matrix.quickWins': ideationMatrix.quickWins,
                    'matrix.majorProjects': ideationMatrix.majorProjects,
                    'matrix.fillIns': ideationMatrix.fillIns,
                    'matrix.thanklessTasks': ideationMatrix.thanklessTasks,
                    'matrix.winningSolution': winningConcept
                }
            },
            { new: true, upsert: true }
        );

        return Response.json({ success: true, ideate: project.stageData.ideate });

    } catch (error) {
        console.error('Error saving prioritization:', error);
        return Response.json({ error: 'Failed to save prioritization' }, { status: 500 });
    }
}
