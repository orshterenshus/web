// Reference to DOM elements
const projectsListContainer = document.getElementById('projectsList');
const createProjectForm = document.getElementById('createProjectForm');
const logoutBtn = document.getElementById('logoutBtn');
const manageUsersBtn = document.getElementById('manageUsersBtn');

let projects = {};

// Function to render projects
function renderProjects() {
    projectsListContainer.innerHTML = ''; // Clear existing list

    Object.keys(projects).forEach(id => {
        const project = projects[id];
        const projectCard = document.createElement('div');
        projectCard.className = 'bg-gray-50 border border-gray-200 p-4 rounded hover:shadow-md transition cursor-pointer flex justify-between items-center';
        
        // --- CHANGE HERE: Redirect to workspace with URL parameters ---
        projectCard.onclick = () => {
            // Encode URI components to handle spaces and special characters safely
            const nameParam = encodeURIComponent(project.name);
            const phaseParam = encodeURIComponent(project.phase);
            
            // NOTE: Change 'index.html' to the actual filename of your workspace page
            window.location.href = `../project/src/index.html?name=${nameParam}&phase=${phaseParam}`;;
        };
        // -------------------------------------------------------------

        projectCard.innerHTML = `
            <div>
                <h3 class="font-bold text-lg text-gray-800">${project.name}</h3>
                <span class="text-sm text-gray-500">Phase: <span class="font-medium text-blue-600">${project.phase}</span></span>
            </div>
            <div class="text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </div>
        `;

        projectsListContainer.appendChild(projectCard);
    });
}

// Handle Create Project Form Submit
createProjectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('projectName');
    const phaseInput = document.getElementById('projectPhase');
    

    const newId = Object.keys(projects).length + 1; // Simple ID generation
    const newProject = {
        id: window.projects.length + 1,
        name: nameInput.value,
        phase: phaseInput.value
    };
    
    window.projects.push(newProject);

    // TODO: In the future, send this data to the database
    // await fetch('/api/projects', { method: 'POST', body: JSON.stringify(newProject) ... });

    // Add to local object (Fake DB update)
    projects[newId] = newProject;

    // Save to LocalStorage so it persists on refresh
    localStorage.setItem('projects', JSON.stringify(projects));

    // Re-render the list
    renderProjects();
    createProjectForm.reset();
    alert('Project created successfully!');
});

// Handle Logout
logoutBtn.addEventListener('click', () => {
    window.location.href = '../login/src/login.html';
});

// Admin check logic
try {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user && user.isAdmin) {
        manageUsersBtn.style.display = 'inline-block';
        manageUsersBtn.classList.remove('hidden');
        manageUsersBtn.onclick = () => {
            window.location.href = '../login/src/userManagement.html';
        };
    }
} catch (e) {
    console.error('Error checking admin status:', e);
}

// Initial render logic
document.addEventListener('DOMContentLoaded', () => {
    // Path to the JSON file (Relative to this HTML file)
    // Going up one level (..) then into data/projects.json
    const jsonPath = '/data/projects.json';

    fetch(jsonPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Success: Update state and render
            projects = data;
            renderProjects();
        })
        .catch(error => {
            console.error('Error loading projects.json:', error);
            projectsListContainer.innerHTML = `
                <div class="col-span-2 text-red-500 bg-red-50 p-4 rounded border border-red-200">
                    <p class="font-bold">Error loading data</p>
                    <p class="text-sm">Make sure you are running this on a local server (Live Server).</p>
                    <p class="text-xs mt-2 text-gray-600">Details: ${error.message}</p>
                </div>
            `;
        });
});