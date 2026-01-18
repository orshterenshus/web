// Socratic Question Bank organized by stages
export const QUESTION_BANK = {
    'Empathize': [
        // Questions on Authentic Connection
        "How can you enter your user's 'inner circle'?",
        "What is the most intimate information a user wouldn't tell you directly?",
        "How will you test that the user isn't just telling you what they think you want to hear?",
        "What is the gap between what the user says and what they actually do?",

        // Questions on Additional Stakeholders
        "Who else is affected by this user's decisions?",
        "How do family members or colleagues experience the problem?",
        "What role does the social environment play in this problem?",
        "How does the problem impact those surrounding the user?",

        // Questions on Systemic Barriers
        "What are the economic barriers preventing a solution?",
        "How does culture or society contribute to the problem?",
        "What are the unwritten rules the user is forced to follow?"
    ],

    'Define': [
        // Questions on a Well-Defined Problem
        "How can you phrase the problem to focus on needs rather than solutions?",
        "What is the difference between the symptom and the actual root problem?",
        "How can you ensure you are solving the right problem?",
        "What was the most surprising insight discovered during research?",

        // Questions on User Value
        "What price is the user currently paying to deal with the problem?",
        "How will the user measure the success of a solution?",
        "What is the smallest change that could yield the greatest impact?",

        // Questions on Need Mapping
        "How do needs change across different user groups?",
        "What are the latent needs the user isn't even aware of?",
        "How do needs shift throughout the user journey?"
    ],

    'Ideate': [
        // Questions on Idea Generation
        "How can you step outside of your familiar framework?",
        "What happens if you flip the problem on its head?",
        "How have similar problems been solved in completely different industries?",
        "What idea seems the most impossible but could be revolutionary?",

        // Questions on Innovation Vectors
        "How does this idea change the user's behavior?",
        "What is the risk-to-potential ratio of this idea?",
        "How does the idea integrate with existing technologies?",
        "What resources are required to implement this idea?",

        // Positive Guidance Questions
        "How can you take this idea one step further?",
        "What is the strongest 'core' of this idea that must be preserved?",
        "How can you combine several ideas into one integrated solution?",

        // Questions for Critiquing Ideas
        "How does this idea address the original problem we defined?",
        "What assumptions are you making about the user in this concept?",
        "How can you test these assumptions quickly and cheaply?",

        // Questions on Idea Mapping
        "How would you rank these ideas on a scale of innovation vs. feasibility?",
        "Which ideas complement one another?",
        "How can you identify the 'black hole' in an idea—what is most likely to go wrong?",

        // Questions on Business Requirements
        "How does the idea align with business goals?",
        "What business model would support this idea?",
        "How will you measure the success of this idea?"
    ],

    'Prototype': [
        // Questions on Prototyping Tools
        "How can you build the simplest version that still communicates the core idea?",
        "What are the most critical parts that must work in the prototype?",
        "How will you choose tools that allow for rapid iteration?",

        // Questions on Prototype Goals
        "What are the most important questions this prototype needs to answer?",
        "How can you learn the most with the minimum amount of investment?",
        "Which assumptions do you want to validate or debunk?",

        // Questions on Experience Simulation
        "How can you simulate the full experience even without the final technology?",
        "What is the best way to convey the 'feel' of the solution?",
        "How will you ensure the prototype triggers authentic emotional responses?",

        // Questions on Stakeholder Feedback
        "How will you prepare stakeholders to give constructive feedback?",
        "What specific questions will you ask about the prototype?",
        "How will you distinguish between feedback on the execution versus the idea itself?"
    ],

    'Test': [
        // Questions on Pros and Cons
        "What was the most surprising thing you discovered during testing?",
        "How will you separate execution issues from conceptual issues?",
        "Which aspect worked best, and which worked worst?",
        "How do reactions vary between different user segments?",

        // Interactive Questions with Stakeholders
        "How will you integrate feedback without losing the original vision?",
        "What changes could expand the user base?",
        "How will you handle conflicting feedback from different sources?",
        "What is the process for making decisions based on test results?",

        // Questions on Further Iteration
        "How will you decide whether to return to a previous stage or move forward?",
        "What are the minimal changes that could lead to significant improvement?",
        "How will you document the learning so you don't repeat the same mistakes?"
    ]
};

// Cross-cutting questions that apply to all stages
export const CROSS_CUTTING_QUESTIONS = [
    // Questions on Perspective
    "How does this project look through the eyes of a competitor?",
    "What will happen to this solution in 5 years?",
    "How will the solution impact the environment and society?",

    // Questions on Personalization & Accessibility
    "How will the solution accommodate people with disabilities?",
    "What are the unique needs of different cultures?",
    "How will the solution work in different environments (Urban/Rural, Developed/Developing)?"
];

export const PHASE_TOOLS = {
    'Empathize': 'Empathy Maps',
    'Define': 'User Personas & How Might We (HMW) statements',
    'Ideate': 'Digital Brainstorming Board',
    'Prototype': 'Prototyping Templates (storyboards, paper sketches, wireframes)',
    'Test': 'Stage Checklists'
};
