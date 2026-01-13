import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { user, winningConcept, pov, constraints, action } = body;

        if (!user || !winningConcept) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        let prompt;
        if (action === 'architecture') {
            prompt = `Act as a CTO. Recommend the best tech stack and data flow for this solution, considering the constraints.

Winning Concept: ${winningConcept.text}
Constraints: ${constraints?.technical?.join(', ') || 'None'}

Return JSON structure:
{
  "techStack": {
    "frontend": "e.g., React, Tailwind",
    "backend": "e.g., Node.js, Python",
    "database": "e.g., PostgreSQL",
    "infrastructure": "e.g., AWS, Vercel"
  },
  "architectureDiagram": "Description of data flow and system components..."
}`;
        } else {
            // Default: Requirements
            prompt = `You are a technical requirements engineer. Generate specific requirements for:
Winning Concept: ${winningConcept.text}
POV: ${pov?.personaName} needs ${pov?.userNeed}.

Generate:
1. Functional Requirements (5 items)
2. Non-Functional Requirements (5 items)

Return JSON:
{
  "techSpec": {
    "functionalRequirements": ["req1", ...],
    "nonFunctionalRequirements": ["req1", ...]
  }
}`;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        let techSpecResponse;
        try {
            techSpecResponse = JSON.parse(text);
        } catch (parseError) {
            // Fallback tech spec
            techSpecResponse = {
                techSpec: {
                    functionalRequirements: [
                        `System must allow users to ${pov?.userNeed || 'complete their tasks'}`,
                        'User authentication and authorization',
                        'Data persistence and retrieval',
                        'Real-time updates and notifications',
                        'Search and filter functionality'
                    ],
                    nonFunctionalRequirements: [
                        'Response time: < 2 seconds for all operations',
                        'System availability: 99.9% uptime',
                        'Data encryption at rest and in transit',
                        'GDPR compliance for user data',
                        'Mobile-responsive design'
                    ],
                    architecture: 'React/Next.js frontend, Node.js backend with Express, PostgreSQL database for structured data, Redis for caching, deployed on cloud infrastructure (AWS/Vercel). RESTful API design with JWT authentication.'
                }
            };
        }

        return Response.json(techSpecResponse);

    } catch (error) {
        console.error('Error generating tech spec:', error);
        return Response.json({ error: 'Failed to generate technical specification' }, { status: 500 });
    }
}
