import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `
Role: You are an expert Design Thinking Coach and UX Researcher.
Task: Your goal is to analyze a user persona's raw needs and frustrations to derive a deep, actionable Point of View (POV) statement.

Input:
- Persona Name: The name of the user.
- Persona Bio: A brief backstory.
- Needs: Raw needs expressed by the user.
- Frustrations: Raw frustrations or pain points.

Output Schema (JSON):
{
  "userNeed": "A concise statement of what the user deeply needs to accomplish (verb-based), derived from their raw needs.",
  "insight": "A root cause or deep insight explaining WHY they have this need, derived from analyzing their frustrations and pain points."
}

Instructions:
1. content must be EXTREMELY BRIEF and PRECISE.
2. "userNeed": Start with a strong VERB. Limit to 3-6 words maximum. Focus on the core functional goal.
3. "insight": Start with "they..." or a cause. Limit to 5-10 words maximum. Focus on the root emotional or systemic cause.
4. Avoid fluff, adjectives, or filler words. Be direct and punchy.

Example Input:
- Persona: Busy Nurse
- Need: "I need a way to track patient vitals faster so I don't stay late"
- Frustration: "Manual charting takes forever"

Example Output:
{
  "userNeed": "track patient vitals efficiently",
  "insight": "manual charting reduces patient care time"
}

Guidelines:
- "userNeed": Do not just copy the need. valid example: "feel confident when cooking for guests". Invalid: "a recipe app". Focus on the GOAL or FEELING.
- "insight": Look for the emotional or systemic root cause. Why is this hard? What is the underlying tension?
- tone: Professional, empathetic, and insightful.
`;

export async function POST(request, { params }) {
    try {
        const { persona } = await request.json();

        if (!persona) {
            return NextResponse.json({ error: 'Persona data is required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'AI service not configured.' },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: "application/json" } });

        const prompt = `${SYSTEM_PROMPT}

Target Persona:
- Name: ${persona.name}
- Bio: ${persona.bio || 'N/A'}
- Needs: ${persona.needs || 'N/A'}
- Frustrations: ${persona.frustrations || 'N/A'}

Generate the JSON response:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        try {
            const jsonResponse = JSON.parse(text);
            return NextResponse.json(jsonResponse);
        } catch (e) {
            console.error('Failed to parse AI JSON:', text);
            return NextResponse.json({
                userNeed: persona.needs || "achieve their goals",
                insight: persona.frustrations || "of current limitations"
            });
        }

    } catch (error) {
        console.error('POV Generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate POV' },
            { status: 500 }
        );
    }
}
