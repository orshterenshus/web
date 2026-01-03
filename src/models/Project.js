
import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a project name'],
    },
    phase: {
        type: String,
        enum: ['Empathize', 'Define', 'Ideate', 'Prototype', 'Test'],
        default: 'Empathize',
    },
    createdBy: {
        type: String,
        required: true,
    },
    sharedWith: {
        type: [String],
        default: [],
    },
    chatHistory: [{
        sender: {
            type: String,
            enum: ['Bot', 'You'],
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        phase: {
            type: String,
            enum: ['Empathize', 'Define', 'Ideate', 'Prototype', 'Test'],
        },
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    sharedWith: [{
        user: { type: String, required: true },
        permission: { type: String, enum: ['Owner', 'Basic'], default: 'Basic' }
    }],
    messages: [{
        sender: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],

    // Stage-specific data for each Design Thinking phase
    stageData: {
        empathize: {
            empathyMap: {
                says: [{
                    id: String,
                    text: String,
                    createdAt: { type: Date, default: Date.now }
                }],
                thinks: [{
                    id: String,
                    text: String,
                    createdAt: { type: Date, default: Date.now }
                }],
                does: [{
                    id: String,
                    text: String,
                    createdAt: { type: Date, default: Date.now }
                }],
                feels: [{
                    id: String,
                    text: String,
                    createdAt: { type: Date, default: Date.now }
                }]
            },
            checklist: {
                conductedInterviews: { type: Boolean, default: false },
                documentedObservations: { type: Boolean, default: false },
                completedEmpathyMap: { type: Boolean, default: false }
            }
        },
        define: {
            checklist: {
                createdPersona: { type: Boolean, default: false },
                definedProblem: { type: Boolean, default: false },
                createdHMW: { type: Boolean, default: false }
            }
        },
        ideate: {
            checklist: {
                brainstormed: { type: Boolean, default: false },
                prioritizedIdeas: { type: Boolean, default: false },
                selectedTopIdea: { type: Boolean, default: false }
            }
        },
        prototype: {
            checklist: {
                builtPrototype: { type: Boolean, default: false },
                definedTestGoals: { type: Boolean, default: false }
            }
        },
        test: {
            checklist: {
                conductedTests: { type: Boolean, default: false },
                gatheredFeedback: { type: Boolean, default: false },
                documentedLearnings: { type: Boolean, default: false }
            }
        }
    }
});

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
