import mongoose from 'mongoose';

const ideationSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        unique: true // One Ideation doc per Project
    },
    brainstorming: {
        notes: [{
            id: String, content: String, x: Number, y: Number, color: mongoose.Schema.Types.Mixed, rotation: Number
        }],
        isFinished: { type: Boolean, default: false }
    },
    matrix: {
        quickWins: [Object],
        majorProjects: [Object],
        fillIns: [Object],
        thanklessTasks: [Object],
        winningSolution: { id: String, content: String } // The selected winner
    },
    specs: {
        requirements: { functional: [String], nonFunctional: [String] },
        architecture: { frontend: String, backend: String, db: String, dataFlow: String }
    }
}, { timestamps: true });

export default mongoose.models.Ideation || mongoose.model('Ideation', ideationSchema);
