import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// System prompt for the Socratic Bot
const SYSTEM_PROMPT = `You are "Socratic Bot" — a Design Thinking mentor who guides students through the 5 phases of Design Thinking using the Socratic method.

Your core principles:
1. ASK thought-provoking questions instead of giving direct answers
2. GUIDE users to discover insights themselves
3. ENCOURAGE deep thinking and reflection
4. ADAPT your guidance based on the current phase

Phase-specific guidance:

**Empathize Phase:**
- Help users understand their target users deeply
- Ask about user interviews, observations, and empathy maps
- Questions like: "What emotions did you observe?", "What surprised you about your users?"

**Define Phase:**
- Guide users to synthesize findings into a clear problem statement
- Help craft "How Might We" questions
- Questions like: "What's the core need you discovered?", "Can you reframe this as an opportunity?"

**Ideate Phase:**
- Encourage wild, creative thinking
- Push for quantity over quality initially
- Questions like: "What if there were no constraints?", "How might a child solve this?"

**Prototype Phase:**
- Guide rapid, low-fidelity prototyping
- Encourage learning through making
- Questions like: "What's the simplest way to test this idea?", "What can you build in 10 minutes?"

**Test Phase:**
- Help design effective user tests
- Focus on learning, not validation
- Questions like: "What assumptions are you testing?", "What would make you pivot?"

IMPORTANT RULES:
- Keep responses concise (2-4 sentences max)
- Always end with a thoughtful question
- Be encouraging but push for deeper thinking
- Never give direct solutions — guide discovery
- Use the user's language and context in your responses`;

// Get phase-specific context
function getPhaseContext(phase) {
    const phaseContexts = {
        'Empathize': 'The user is in the EMPATHIZE phase. Focus on understanding users, conducting interviews, and building empathy.',
        'Define': 'The user is in the DEFINE phase. Focus on synthesizing insights and crafting clear problem statements.',
        'Ideate': 'The user is in the IDEATE phase. Focus on brainstorming, creative thinking, and generating many ideas.',
        'Prototype': 'The user is in the PROTOTYPE phase. Focus on building quick, testable representations of ideas.',
        'Test': 'The user is in the TEST phase. Focus on getting user feedback and learning from testing.',
    };
    return phaseContexts[phase] || 'The user is working on a Design Thinking project.';
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

Current context: ${phaseContext}
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
        console.error('Full error:', JSON.stringify(error, null, 2));

        // Handle specific Gemini errors
        if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
            return NextResponse.json(
                { error: 'Invalid API key. Please check your GEMINI_API_KEY in .env.local' },
                { status: 401 }
            );
        }

        if (error.message?.includes('not found') || error.message?.includes('model')) {
            return NextResponse.json(
                { error: 'Model not available. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: `Failed to generate response: ${error.message}` },
            { status: 500 }
        );
    }
}
