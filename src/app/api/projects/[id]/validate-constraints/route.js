import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { user, pov, constraints } = body;

        if (!user || !pov || !constraints) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Smart Validation Prompt
        const prompt = `Act as a Senior Technical Product Manager. 
Task: Analyze the feasibility of the User Need given the defined Constraints.

Input Data:
POV_Need: ${pov.userNeed}
POV_Insight: ${pov.insight}
Constraints_Tech: ${constraints.technical?.join(', ') || 'None'}
Constraints_Business: ${constraints.business?.join(', ') || 'None'}

Analysis Logic:
- Does the user need require expensive hardware while the budget is zero?
- Does the user need require constant connectivity while the constraint is 'Offline-first'?
- Is the timeline realistic for the complexity described?

Output Format (JSON): 
{ 
  "status": "PASS" | "WARNING" | "CRITICAL", 
  "message": "A short, specific explanation of the conflict or confirmation of alignment." 
}

Example of 'WARNING': "Conflict detected: The user need implies real-time cloud sync, but the Technical Constraint is set to Offline-only."`;

        // Smart Fallback System
        const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
        let validationResult;
        let lastError;

        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // Parse JSON
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    validationResult = JSON.parse(jsonMatch[0]);
                } else {
                    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    validationResult = JSON.parse(cleaned);
                }
                break; // Success
            } catch (err) {
                console.warn(`Model ${modelName} failed validation:`, err.message);
                lastError = err;
                continue;
            }
        }

        // Fallback if all AI failed
        if (!validationResult) {
            return Response.json({
                validationFlags: [{
                    flagType: 'warning',
                    severity: 'medium',
                    message: "AI Validation unavailable. Please review constraints manually."
                }]
            });
        }

        // Map AI result to Front-end format (ValidationFlags)
        const flags = [];
        if (validationResult.status !== 'PASS') {
            flags.push({
                flagType: validationResult.status === 'CRITICAL' ? 'critical' : 'warning',
                severity: validationResult.status === 'CRITICAL' ? 'high' : 'medium',
                message: validationResult.message
            });
        } else {
            flags.push({
                flagType: 'success',
                severity: 'low', // Green
                message: validationResult.message || "Constraints align well with User Needs."
            });
        }

        return Response.json({ validationFlags: flags });

    } catch (error) {
        console.error('Error in validation API:', error);
        return Response.json({ error: 'Validation failed' }, { status: 500 });
    }
}
