import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { QUESTION_BANK, CROSS_CUTTING_QUESTIONS, PHASE_TOOLS } from '@/data/socraticQuestions';

// System prompt for the Socratic Bot
const SYSTEM_PROMPT = `Role: You are a Socratic Design Thinking Coach.
Goal: Be a helpful, intelligent mentor. 

**CORE RULES:**
1. **Be Responsive:** Answer questions clearly and concisely.
2. **Be Conversational:** Give creative feedback on ideas.
3. **Selective Questioning:** Do NOT ask a guiding question in every response. 
   - Ask a question ONLY if:
     a) The user explicitly asks for guidance/questions.
     b) The conversation has stalled.
     c) It is the very first interaction of a new phase.
   - Otherwise, just provide the answer or feedback and let the user lead.
4. **Directness:** Cut the fluff. No "Hello" or generic pleasantries.
5. **No Formatting:** Do NOT use bold (**), italics (*), or markdown headers.

**INTERACTION STYLE:**
- **User asks a question:** Answer -> Stop. (Optional: Ask "Do you want to explore this further?" only if complex).
- **User shares idea:** Validate -> Critique. (No question needed unless stuck).
- **User asks for questions:** Provide a list of questions from the bank.`;

// Get phase-specific context with detailed guidance and questions
function getPhaseContext(phase) {
    const currentPhase = phase || 'Empathize';
    const tool = PHASE_TOOLS[currentPhase] || 'General Design Thinking Tools';

    // Get questions for this phase
    const phaseQuestions = QUESTION_BANK[currentPhase] || [];

    // Mix in some cross-cutting questions (randomly select 2)
    const randomCrossCutting = CROSS_CUTTING_QUESTIONS
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

    // Combine and shuffle to give variety
    const availableQuestions = [...phaseQuestions, ...randomCrossCutting]
        .sort(() => 0.5 - Math.random())
        .slice(0, 5); // Provide top 5 random relevant questions to the AI context

    return `CURRENT PHASE: ${currentPhase.toUpperCase()}
CURRENT TOOL: ${tool}

AVAILABLE QUESTIONS (Choose one that fits best):
${availableQuestions.map(q => `- ${q}`).join('\n')}

INSTRUCTION: Use one of the questions above or a variation of it to guide the user.`;
}

export async function POST(request) {
    try {
        const { message, phase, conversationHistory } = await request.json();

        // Validate input
        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Check for API key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY not found in environment variables');
            return NextResponse.json(
                { error: 'AI service not configured. Please add GEMINI_API_KEY to .env.local' },
                { status: 500 }
            );
        }

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Build the conversation context
        const phaseContext = getPhaseContext(phase);

        // Format conversation history for context (last 10 messages)
        let historyContext = '';
        if (conversationHistory && conversationHistory.length > 0) {
            const recentHistory = conversationHistory.slice(-10);
            historyContext = '\n\nRecent conversation:\n' + recentHistory.map(msg =>
                `${msg.sender}: ${msg.text}`
            ).join('\n');
        }

        // Build the full prompt
        const fullPrompt = `${SYSTEM_PROMPT}

${phaseContext}
${historyContext}

User's message: ${message}

Respond as Socratic Bot:`;

        // Call Gemini API
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const reply = response.text();

        return NextResponse.json({ reply });

    } catch (error) {
        console.error('Chat API error:', error.message);

        // Handle specific Gemini errors
        if (error.message?.includes('API_KEY')) {
            return NextResponse.json(
                { error: 'Invalid API key. Please check your GEMINI_API_KEY in .env' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: `Failed to generate response: ${error.message}` },
            { status: 500 }
        );
    }
}
