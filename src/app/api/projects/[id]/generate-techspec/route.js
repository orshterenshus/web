import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { user, winningConcept, pov, constraints, action, funcCount = 5, nonFuncCount = 3, userStack } = body;

    console.log('API /generate-techspec Received:', {
      user,
      hasWinningConcept: !!winningConcept,
      winningConceptText: winningConcept?.text,
      action,
      hasConstraints: !!constraints
    });

    if (!user || !winningConcept) {
      console.error('Missing required fields:', { user, winningConcept });
      return Response.json({ error: 'Missing required fields: user or winningConcept' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is missing');
      return Response.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });


    let prompt;
    if (action === 'architecture') {
      const solutionText = winningConcept.text || winningConcept;
      const constraintsText = constraints ? JSON.stringify(constraints) : 'None';

      prompt = `
Act as a Senior System Architect.
Task: Define the optimal Tech Stack & Data Flow for this specific solution: "${solutionText}".
Constraints: "${constraintsText}".

RULES:
1. **Be Specific:** Do not say "React or Angular". Choose ONE best fit (e.g., "Next.js").
2. **Context Aware:** - If it's a real-time app, suggest Node.js/Socket.io + Redis.
   - If it's a financial app, suggest Java/Go + PostgreSQL.
   - If it's a simple content site, suggest Gatsby/Jekyll + Headless CMS.
3. **Format:** JSON ONLY.

Output JSON Structure:
{
  "architecture": {
    "frontend": "Specific Framework (e.g., React Native)",
    "backend": "Specific Runtime/Lang (e.g., Python FastAPI)",
    "database": "Specific DB (e.g., PostgreSQL)",
    "description": "A concise, technical description of how data flows from client to server to DB and back. Mention protocols (REST/GraphQL/WebSocket) if relevant."
  }
}
`;
    } else {
      prompt = `
Act as a Senior System Analyst.
Task: Generate technical requirements for: "${winningConcept?.text || winningConcept}".
Quantity: Generate EXACTLY ${funcCount} Functional requirements and ${nonFuncCount} Non-Functional requirements.
CRITICAL: Ensure all ${parseInt(funcCount) + parseInt(nonFuncCount)} items are DISTINCT and non-repetitive. Do not duplicate ideas.
Context:
User Need: "${pov?.personaName || 'User'} needs to ${pov?.userNeed || 'solve a problem'} because ${pov?.insight || 'reason'}."
Constraints: "${constraints?.technical?.join(', ') || 'None'}; ${constraints?.business?.join(', ') || 'None'}"

Output Language: ENGLISH ONLY.

Style Guidelines:
1. **Functional:** Must start with "The system shall allow...". Keep strictly UNDER 15 words.
2. **Non-Functional:** Focus on Performance, Security, & Scalability. Allow up to 25 words for technical precision.

Output Structure (JSON) - MUST MATCH EXACTLY:
{
  "techSpec": {
    "functionalRequirements": [ 
       "Array of exactly ${funcCount} strings.",
       "Example: The system shall allow users to reset their password via email."
    ],
    "nonFunctionalRequirements": [ 
       "Array of exactly ${nonFuncCount} strings.",
       "Example: The system shall render the main dashboard in under 1.5 seconds."
    ]
  }
}
`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean markdown code blocks if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let techSpecResponse;
    try {
      techSpecResponse = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.log('Raw Text:', text);
      // Fallback tech spec structure if parsing fails
      techSpecResponse = {
        techSpec: {
          functionalRequirements: ["Could not parse generated requirements. Please try again."],
          nonFunctionalRequirements: ["Could not parse generated requirements."]
        },
        techStack: { frontend: "", backend: "", database: "", infrastructure: "" },
        architectureDiagram: "Error generating architecture."
      };
    }

    return Response.json(techSpecResponse);

  } catch (error) {
    console.error("AI Generation Error:", error);
    return Response.json({
      error: "AI generation failed",
      details: error.message || error.toString()
    }, { status: 500 });
  }
}
