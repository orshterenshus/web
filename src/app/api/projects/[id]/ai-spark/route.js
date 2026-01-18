import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const techniques = {
    scamper: 'SCAMPER technique (Substitute, Combine, Adapt, Modify, Put to another use, Eliminate, Reverse)',
    reversal: 'Reversal technique - think opposite of conventional approaches',
    exaggeration: 'Exaggeration technique - amplify features to extreme levels',
    random: 'Random Word Association - connect unrelated concepts',
    analogy: 'Analogy technique - draw inspiration from different fields',
    provocation: 'Provocation technique - make bold statements to break patterns'
};

export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { user, pov, technique, mode } = body;

        if (!user) {
            return Response.json({ error: 'User required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        let prompt;
        if (mode === 'cross-domain') {
            prompt = `You are a visionary Product Architect specializing in cross-industry innovation.
Task: Solve this problem by applying principles from unrelated industries (e.g., how would aviation safety protocols apply to this plant app?).

POV: ${pov?.personaName || 'User'} needs a way to ${pov?.userNeed || 'solve a problem'} because ${pov?.insight || 'of certain reasons'}.

Generate 3-5 radical ideas. For each idea, explicitly state the Source Domain.

Format:
{
  "ideas": [
    {
      "text": "Idea description",
      "technique": "Cross-Domain: [Industry Name]",
      "reasoning": "how principles from [Industry] apply here"
    }
  ]
}
Return ONLY valid JSON.`;
        } else {
            const techniqueDesc = technique ? techniques[technique] : 'various lateral thinking techniques';
            prompt = `You are a creative ideation assistant for design thinking. Generate 3-5 innovative ideas to solve this problem:
            
POV: ${pov?.personaName || 'User'} needs a way to ${pov?.userNeed || 'solve a problem'} because ${pov?.insight || 'of certain reasons'}.

Use ${techniqueDesc} to generate creative, unexpected solutions.

For each idea, provide:
1. text: A concise description of the idea (1-2 sentences)
2. technique: "${technique || 'mixed'}"
3. reasoning: Brief explanation of how this idea addresses the POV (optional)

Return a JSON object with an "ideas" array containing these objects.
Example: {"ideas": [{"text": "...", "technique": "scamper", "reasoning": "..."}, ...]}

Be creative and think outside conventional solutions. Return ONLY valid JSON.`;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        let ideasResponse;
        try {
            ideasResponse = JSON.parse(text);
        } catch (parseError) {
            // Fallback ideas
            ideasResponse = {
                ideas: [
                    {
                        text: `Create a mobile app that helps ${pov?.personaName || 'users'} with ${pov?.userNeed || 'their needs'}`,
                        technique: technique || 'mixed',
                        reasoning: 'Addresses accessibility and convenience'
                    },
                    {
                        text: `Gamify the process to make it more engaging for ${pov?.personaName || 'users'}`,
                        technique: technique || 'mixed',
                        reasoning: 'Increases user engagement and motivation'
                    }
                ]
            };
        }

        return Response.json(ideasResponse);

    } catch (error) {
        console.error('Error generating AI ideas:', error);
        return Response.json({ error: 'Failed to generate ideas' }, { status: 500 });
    }
}
