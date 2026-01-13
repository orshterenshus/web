
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
    // Using Mixed type to allow flexible nested updates
    stageData: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            empathize: {
                empathyMap: { says: [], thinks: [], does: [], feels: [] },
                checklist: {
                    conductedInterviews: false,
                    documentedObservations: false,
                    completedEmpathyMap: false,
                    identifiedPainPoints: false,
                    researchedContext: false
                }
            },
            define: {
                checklist: {
                    createdPersona: false,
                    definedProblem: false,
                    createdHMW: false,
                    identifiedNeeds: false,
                    synthesizedInsights: false
                }
            },
            ideate: {
                checklist: {
                    brainstormed: false,
                    prioritizedIdeas: false,
                    selectedTopIdea: false,
                    sketchedConcepts: false,
                    exploredAlternatives: false
                }
            },
            prototype: {
                checklist: {
                    builtPrototype: false,
                    definedTestGoals: false,
                    createdUserFlow: false,
                    preparedMaterials: false,
                    identifiedAssumptions: false
                }
            },
            test: {
                checklist: {
                    conductedTests: false,
                    gatheredFeedback: false,
                    documentedLearnings: false,
                    iteratedPrototype: false,
                    validatedSolution: false
                }
            }
        }
    },

    // Uploaded files stored in Cloudinary
    files: [{
        name: { type: String, required: true },
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        fileType: { type: String, enum: ['image', 'pdf', 'text', 'other'], default: 'other' },
        size: { type: Number },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: String }
    }],

    // DEFINE PHASE - Structured data
    define: {
        persona: {
            name: String,
            image: String,
            painPoint: String,
            demographics: mongoose.Schema.Types.Mixed
        },
        pov: {
            personaName: String,
            userNeed: String,
            insight: String,
            createdAt: Date
        },
        hmwQuestions: [String],
        selectedHmw: String,
        constraints: {
            technical: [String],
            business: [String],
            kpis: [{
                metric: String,
                target: String
            }]
        },
        validationFlags: [{
            _id: false,
            flagType: { type: String, enum: ['success', 'warning', 'critical'], default: 'success' },
            severity: { type: String, default: 'low' },
            message: { type: String }
        }]
    },

    // IDEATE PHASE - Structured data
    ideate: {
        ideas: [{
            id: String,
            text: String,
            color: mongoose.Schema.Types.Mixed,
            position: {
                x: Number,
                y: Number
            },
            createdBy: String,
            createdAt: Date,
            combined: Boolean,
            originalIdeas: [String]
        }],
        aiSuggestions: [{
            technique: String,
            text: String,
            reasoning: String,
            createdAt: Date
        }],
        prioritization: {
            matrix: mongoose.Schema.Types.Mixed,
            votes: mongoose.Schema.Types.Mixed,
            winningConcept: mongoose.Schema.Types.Mixed
        },
        techSpec: {
            functionalRequirements: [String],
            nonFunctionalRequirements: [String],
            architecture: String,
            generatedAt: Date
        }
    }
});

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
