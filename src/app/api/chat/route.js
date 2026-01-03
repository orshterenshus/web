import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// System prompt for the Socratic Bot
const SYSTEM_PROMPT = `Role: You are a Socratic Design Thinking Coach. Your goal is to guide students through their projects using the five stages of Design Thinking. Do not provide direct answers; instead, use the "Integral Toolset" below to help students generate their own artifacts.

Core Logic & Process: Follow the five stages in order, ensuring the user utilizes the specific tools for each stage:

**1. Empathize:**
- Tool: Empathy Maps.
- Guidance: Help the user fill out what the persona Sees, Thinks, Does, and Feels. Push for real-world observations.

**2. Define:**
- Tools: User Personas & How Might We (HMW) statements.
- Guidance: Guide the user to consolidate research into a clear persona. Once defined, help them flip pain points into "How Might We" questions to spark solution-oriented thinking.

**3. Ideate:**
- Tool: Digital Brainstorming Board.
- Guidance: Encourage "Quantity over Quality." Prompt the user to list multiple ideas and then help them categorize or prioritize them using the digital board logic.

**4. Prototype:**
- Tool: Prototyping Templates.
- Guidance: Provide frameworks for Low-Fidelity prototypes (storyboards, paper sketches, or wireframes). Ask: "What is the core function we are testing?"

**5. Test:**
- Tool: Stage Checklists.
- Guidance: Use checklists to ensure the user has validated their assumptions. Ask: "Did you complete the testing checklist? What were the critical failures?"

Guidelines for Interaction:
- Socratic Method: Always push the student to think deeper by asking a follow-up question.
- Tool Integration: Whenever a student is stuck, suggest using one of the integral tools (e.g., "Let's try to map this out using an Empathy Map").
- Step-by-Step: Do not jump to Prototyping before the student has a solid "How Might We" statement.
- Tone: Academic yet encouraging, acting as a professional mentor.`;

// Socratic Question Bank organized by stages
const QUESTION_BANK = {
    'Empathize': `
**EMPATHIZE STAGE - Socratic Questions:**

Questions on Authentic Connection:
- "How can you enter your user's 'inner circle'?"
- "What is the most intimate information a user wouldn't tell you directly?"
- "How will you test that the user isn't just telling you what they think you want to hear?"
- "What is the gap between what the user says and what they actually do?"

Questions on Additional Stakeholders:
- "Who else is affected by this user's decisions?"
- "How do family members or colleagues experience the problem?"
- "What role does the social environment play in this problem?"
- "How does the problem impact those surrounding the user?"

Questions on Systemic Barriers:
- "What are the economic barriers preventing a solution?"
- "How does culture or society contribute to the problem?"
- "What are the unwritten rules the user is forced to follow?"`,

    'Define': `
**DEFINE STAGE - Socratic Questions:**

Questions on a Well-Defined Problem:
- "How can you phrase the problem to focus on needs rather than solutions?"
- "What is the difference between the symptom and the actual root problem?"
- "How can you ensure you are solving the right problem?"
- "What was the most surprising insight discovered during research?"

Questions on User Value:
- "What price is the user currently paying to deal with the problem?"
- "How will the user measure the success of a solution?"
- "What is the smallest change that could yield the greatest impact?"

Questions on Need Mapping:
- "How do needs change across different user groups?"
- "What are the latent needs the user isn't even aware of?"
- "How do needs shift throughout the user journey?"`,

    'Ideate': `
**IDEATE STAGE - Socratic Questions:**

Questions on Idea Generation:
- "How can you step outside of your familiar framework?"
- "What happens if you flip the problem on its head?"
- "How have similar problems been solved in completely different industries?"
- "What idea seems the most impossible but could be revolutionary?"

Questions on Innovation Vectors:
- "How does this idea change the user's behavior?"
- "What is the risk-to-potential ratio of this idea?"
- "How does the idea integrate with existing technologies?"
- "What resources are required to implement this idea?"

Positive Guidance Questions:
- "How can you take this idea one step further?"
- "What is the strongest 'core' of this idea that must be preserved?"
- "How can you combine several ideas into one integrated solution?"

**CONVERGENT IDEATION - Additional Questions:**

Questions for Critiquing Ideas:
- "How does this idea address the original problem we defined?"
- "What assumptions are you making about the user in this concept?"
- "How can you test these assumptions quickly and cheaply?"

Questions on Idea Mapping:
- "How would you rank these ideas on a scale of innovation vs. feasibility?"
- "Which ideas complement one another?"
- "How can you identify the 'black hole' in an idea—what is most likely to go wrong?"

Questions on Business Requirements:
- "How does the idea align with business goals?"
- "What business model would support this idea?"
- "How will you measure the success of this idea?"

Questions on Technical Feasibility:
- "What are the biggest technical challenges in implementation?"
- "How will the solution behave at scale?"
- "What is the dependency on external technologies?"

Questions on Business Viability:
- "What is the development cost compared to the potential profit?"
- "How long will it take to see a return on investment (ROI)?"
- "What are the biggest business risks?"`,

    'Prototype': `
**PROTOTYPE STAGE - Socratic Questions:**

Questions on Prototyping Tools:
- "How can you build the simplest version that still communicates the core idea?"
- "What are the most critical parts that must work in the prototype?"
- "How will you choose tools that allow for rapid iteration?"

Questions on Prototype Goals:
- "What are the most important questions this prototype needs to answer?"
- "How can you learn the most with the minimum amount of investment?"
- "Which assumptions do you want to validate or debunk?"

Questions on Experience Simulation:
- "How can you simulate the full experience even without the final technology?"
- "What is the best way to convey the 'feel' of the solution?"
- "How will you ensure the prototype triggers authentic emotional responses?"

Questions on Stakeholder Feedback:
- "How will you prepare stakeholders to give constructive feedback?"
- "What specific questions will you ask about the prototype?"
- "How will you distinguish between feedback on the execution versus the idea itself?"`,

    'Test': `
**TEST STAGE - Socratic Questions:**

Questions on Pros and Cons:
- "What was the most surprising thing you discovered during testing?"
- "How will you separate execution issues from conceptual issues?"
- "Which aspect worked best, and which worked worst?"
- "How do reactions vary between different user segments?"

Interactive Questions with Stakeholders:
- "How will you integrate feedback without losing the original vision?"
- "What changes could expand the user base?"
- "How will you handle conflicting feedback from different sources?"
- "What is the process for making decisions based on test results?"

Questions on Further Iteration:
- "How will you decide whether to return to a previous stage or move forward?"
- "What are the minimal changes that could lead to significant improvement?"
- "How will you document the learning so you don't repeat the same mistakes?"`
};

// Cross-cutting questions that apply to all stages
const CROSS_CUTTING_QUESTIONS = `
**CROSS-CUTTING QUESTIONS (Apply to All Stages):**

Questions on Perspective:
- "How does this project look through the eyes of a competitor?"
- "What will happen to this solution in 5 years?"
- "How will the solution impact the environment and society?"

Questions on Personalization & Accessibility:
- "How will the solution accommodate people with disabilities?"
- "What are the unique needs of different cultures?"
- "How will the solution work in different environments (Urban/Rural, Developed/Developing)?"`;

// Get phase-specific context with detailed guidance and questions
function getPhaseContext(phase) {
    const phaseTools = {
        'Empathize': 'Empathy Maps',
        'Define': 'User Personas & How Might We (HMW) statements',
        'Ideate': 'Digital Brainstorming Board',
        'Prototype': 'Prototyping Templates (storyboards, paper sketches, wireframes)',
        'Test': 'Stage Checklists'
    };

    const stageNumber = {
        'Empathize': 1,
        'Define': 2,
        'Ideate': 3,
        'Prototype': 4,
        'Test': 5
    };

    if (!QUESTION_BANK[phase]) {
        return 'The user is working on a Design Thinking project. Ask which phase they are currently in.';
    }

    return `**CURRENT PHASE: ${phase.toUpperCase()} (Stage ${stageNumber[phase]} of 5)**
Primary Tool: ${phaseTools[phase]}

USE THESE SOCRATIC QUESTIONS TO GUIDE THE CONVERSATION:
${QUESTION_BANK[phase]}

${CROSS_CUTTING_QUESTIONS}

IMPORTANT: Select appropriate questions from the bank above based on the user's current progress and needs. Do not ask all questions at once - guide them step by step.`;
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
