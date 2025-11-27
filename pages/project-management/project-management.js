// Reference to DOM elements
const projectsListContainer = document.getElementById('projectsList');
const createProjectForm = document.getElementById('createProjectForm');
const logoutBtn = document.getElementById('logoutBtn');
const manageUsersBtn = document.getElementById('manageUsersBtn');

// Function to render projects
function renderProjects() {
    projectsListContainer.innerHTML = ''; // Clear existing list

    window.projects.forEach(project => {
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
    
    const newProject = {
        id: window.projects.length + 1,
        name: nameInput.value,
        phase: phaseInput.value
    };
    
    window.projects.push(newProject);
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
    if (typeof window.projects !== 'undefined') {
        renderProjects();
    } else {
        console.error('Projects data not loaded.');
        projectsListContainer.innerHTML = '<p class="text-red-500">Error loading projects data.</p>';
    }
});