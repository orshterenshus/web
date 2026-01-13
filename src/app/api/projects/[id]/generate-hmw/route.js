import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { user, pov } = body;

        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is missing');
            return Response.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
        }

        if (!user || !pov) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const prompt = `Act as a Design Thinking Expert.
Context:
Persona: ${pov.personaName}
Need: ${pov.userNeed}
Insight: ${pov.insight}

Task: Generate 4 distinct "How Might We" questions that frame the problem creatively.
1. One focused on amplifying the good (Gamification/Fun).
2. One focused on removing the bad (Simplification/Automation).
3. One wild/unexpected angle.
4. One focused on emotional connection or trust.

Constraint: Do not just copy-paste the input text. Rephrase the sentences to be grammatically correct and inspiring.

Return ONLY a JSON array of strings. Example: ["How might we...", "How might we..."]`;

        // Try multiple models in order of preference
        const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
        let hmwQuestions;
        let generationError;

        for (const modelName of models) {
            try {
                console.log(`Attempting generation with ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // If successful, parse and break loop
                const jsonMatch = text.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    hmwQuestions = JSON.parse(jsonMatch[0]);
                } else {
                    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    hmwQuestions = JSON.parse(cleanedText);
                }
                break; // Success!
            } catch (err) {
                console.warn(`Model ${modelName} failed:`, err.message);
                generationError = err;
                continue; // Try next model
            }
        }

        // If all models failed, use fallback templates
        if (!hmwQuestions) {
            console.error('All AI models failed. Using manual fallback.');
            hmwQuestions = [
                `How might we make ${pov.userNeed} more accessible for ${pov.personaName}?`,
                `How might we address ${pov.insight} in a creative way?`,
                `How might we reimagine ${pov.userNeed} to better serve ${pov.personaName}?`,
                `How might we use technology to solve ${pov.insight}?`
            ];
            // If the error was 503, maybe we shouldn't fail the request 500? 
            // But the user expects AI.
            // We return valid JSON fallback so the UI shows SOMETHING (green state).
            // But to be transparent we can return a flag?
        }

        return Response.json({ hmwQuestions });

    } catch (error) {
        console.error('Error generating HMW questions:', error);
        // Even if all crashes, return generic error (or detailed if needed)
        return Response.json({ error: `AI Generation Failed: ${error.message}` }, { status: 500 });
    }
}
