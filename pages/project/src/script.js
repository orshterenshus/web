// Manage Current Phase State
const phases = {
    'empathize': { title: 'Phase 1: Empathize', desc: 'Focus on understanding users, their needs, and their pain points.' },
    'define': { title: 'Phase 2: Define', desc: 'Synthesize research insights into a clear problem definition.' },
    'ideate': { title: 'Phase 3: Ideate', desc: 'Brainstorm as many solution ideas as possible without judgment.' },
    'prototype': { title: 'Phase 4: Prototype', desc: 'Build simple and fast versions of your ideas.' },
    'test': { title: 'Phase 5: Test', desc: 'Test your solutions with real users.' }
};

function changePhase(phaseKey) {
    // Check if phase exists in object
    if (!phases[phaseKey]) return;

    // Update title and description
    document.getElementById('current-phase-title').innerText = phases[phaseKey].title;
    document.getElementById('phase-desc').innerText = phases[phaseKey].desc;
    
    // Visual update of the progress bar (reset all steps)
    const steps = document.querySelectorAll('.phase-step div');
    steps.forEach(div => {
        div.classList.remove('bg-blue-600', 'text-white');
        div.classList.add('bg-white', 'text-gray-500', 'border-2');
    });
    
    // Highlight active phase in the stepper
    // Find the specific button based on its onclick attribute
    const activeStep = document.querySelector(`.phase-step[onclick="changePhase('${phaseKey}')"] div`);
    if (activeStep) {
        activeStep.classList.remove('bg-white', 'text-gray-500');
        activeStep.classList.add('bg-blue-600', 'text-white');
    }
}

// --- NEW FUNCTION: Load project data from URL parameters ---
function loadProjectFromURL() {
    // Extract parameters from the address bar
    const params = new URLSearchParams(window.location.search);
    const projectName = params.get('name');
    const projectPhase = params.get('phase');

    if (projectName) {
        // Update browser tab title
        document.title = `${projectName} - Workspace`;

        // --- Update the visible Header ---
        // Find the H2 element and change its text to include the project name
        const headerElement = document.getElementById('project-header');
        if (headerElement) {
            headerElement.innerText = `Project Progress: ${projectName}`;
        }
        
        // Update bot welcome message
        setTimeout(() => {
            addBotMessage(`Welcome to the workspace for: **${projectName}**. We are currently in the ${projectPhase} phase.`);
        }, 500);
    }

    if (projectPhase) {
        // Convert phase to lowercase to match keys in the 'phases' object
        // (e.g., Define -> define)
        changePhase(projectPhase.toLowerCase());
    }
}

// Manage File Upload (Upload & Watch)
function handleFiles(files) {
    const list = document.getElementById('file-list');
    Array.from(files).forEach(file => {
        const li = document.createElement('li');
        li.className = 'col-span-1 bg-white border rounded-lg shadow-sm p-4 flex items-center justify-between animate-pulse'; 
        setTimeout(() => li.classList.remove('animate-pulse'), 500);

        li.innerHTML = `
            <div class="flex items-center">
                <div class="bg-green-100 p-2 rounded">
                    <span class="text-green-600 font-bold text-xs">${file.name.split('.').pop().toUpperCase()}</span>
                </div>
                <div class="ml-3 overflow-hidden">
                    <p class="text-sm font-medium text-gray-900 truncate" title="${file.name}">${file.name}</p>
                    <p class="text-xs text-gray-500">Uploaded just now</p>
                </div>
            </div>
            <button class="text-gray-400 hover:text-red-500" onclick="this.parentElement.remove()">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        `;
        list.appendChild(li);
    });
    // Reset input to allow re-uploading the same file if deleted
    document.getElementById('file-upload').value = ''; 
}

// Chat Management
function sendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    const messages = document.getElementById('chat-messages');
    const userMsg = document.createElement('div');
    userMsg.className = 'flex items-start flex-row-reverse';
    userMsg.innerHTML = `
        <div class="flex-shrink-0 h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold">You</div>
        <div class="mr-3 bg-blue-600 text-white p-3 rounded-lg shadow-sm text-sm">
            ${text}
        </div>
    `;
    messages.appendChild(userMsg);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    setTimeout(() => {
        addBotMessage("Excellent question. How do you think this data affects your problem definition?"); 
    }, 1000);
}

function addBotMessage(text) {
    const messages = document.getElementById('chat-messages');
    const botMsg = document.createElement('div');
    botMsg.className = 'flex items-start';
    
    // Support simple bold formatting (**text**)
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    botMsg.innerHTML = `
        <div class="flex-shrink-0 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">Bot</div>
        <div class="ml-3 bg-white p-3 rounded-lg shadow-sm text-sm text-gray-700 border border-gray-100">
            ${formattedText}
        </div>
    `;
    messages.appendChild(botMsg);
    messages.scrollTop = messages.scrollHeight;
}

function shareProject() {
    alert("Project link copied to clipboard!");
}

// Execute function on page load
document.addEventListener('DOMContentLoaded', loadProjectFromURL);