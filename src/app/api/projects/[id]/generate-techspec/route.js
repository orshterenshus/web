import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { user, winningConcept, pov, constraints } = body;

        if (!user || !winningConcept) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `You are a technical architect and requirements engineer. Generate a comprehensive technical specification for this solution:

**Winning Concept:** ${winningConcept.text}

**Problem Context (POV):** ${pov?.personaName || 'User'} needs a way to ${pov?.userNeed || 'solve a problem'} because ${pov?.insight || 'of certain reasons'}.

**Project Constraints:**
- Technical: ${constraints?.technical?.join(', ') || 'None specified'}
- Business: ${constraints?.business?.join(', ') || 'None specified'}
- KPIs: ${constraints?.kpis?.map(k => `${k.metric}: ${k.target}`).join(', ') || 'None specified'}

Generate a technical specification with:

1. **Functional Requirements** (5-8 items): What the system must do. Be specific and measurable.
2. **Non-Functional Requirements** (4-6 items): Security, performance, scalability, usability concerns. Consider constraints like budget, timeline, and technical limitations. Flag concerns like "Since this involves payments, suggest PCI-DSS compliance."
3. **Architecture Design** (paragraph): High-level architecture including client/server stack, database choices, key integrations.

Return a JSON object with this exact structure:
{
  "techSpec": {
    "functionalRequirements": ["string1", "string2", ...],
    "nonFunctionalRequirements": ["string1", "string2", ...],
    "architecture": "string describing architecture"
  }
}

Return ONLY valid JSON, no additional text or markdown.`;

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
