// Reference to DOM elements
const projectsListContainer = document.getElementById('projectsList');
const createProjectForm = document.getElementById('createProjectForm');
const logoutBtn = document.getElementById('logoutBtn');
const manageUsersBtn = document.getElementById('manageUsersBtn');

let projects = [];

// Function to render projects
function renderProjects() {
    projectsListContainer.innerHTML = ''; // Clear existing list

    // TODO: In the future, fetch projects from the database here
    // const projects = await fetch('/api/projects').then(res => res.json());

    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'bg-gray-50 border border-gray-200 p-4 rounded hover:shadow-md transition cursor-pointer flex justify-between items-center';
        
        // TODO: Change this link to point to the actual project screen
        // Example: window.location.href = `/pages/project/index.html?id=${project.id}`;
        projectCard.onclick = () => {
            console.log(`Clicked project: ${project.name}`);
            alert(`Navigating to project: ${project.name} (Feature coming soon)`);
        };

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
        id: projects.length + 1, // Simple ID generation
        name: nameInput.value,
        phase: phaseInput.value
    };

    // TODO: In the future, send this data to the database
    // await fetch('/api/projects', { method: 'POST', body: JSON.stringify(newProject) ... });

    // Add to local array (Fake DB update)
    projects.push(newProject);

    // Save to LocalStorage so it persists on refresh
    localStorage.setItem('projects', JSON.stringify(projects));

    // Re-render the list
    renderProjects();

    // Reset form
    createProjectForm.reset();
    
    alert('Project created successfully! (Added to local session data)');
});

// Handle Logout
logoutBtn.addEventListener('click', () => {
    // Clear any session data if needed
    // localStorage.removeItem('currentUser'); // Example from login logic
    
    // Redirect to login screen
    window.location.href = '../login/src/login.html';
});

// Check for admin status and show Manage Users button
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

// Initial render
document.addEventListener('DOMContentLoaded', () => {
    // Try to load from LocalStorage first
    const storedProjects = localStorage.getItem('projects');

    if (storedProjects) {
        projects = JSON.parse(storedProjects);
        renderProjects();
    } else {
        // If not in LocalStorage, fetch from JSON file
        fetch('../../data/projects.json')
            .then(response => response.json())
            .then(data => {
                projects = data;
                // Save to LocalStorage for future updates
                localStorage.setItem('projects', JSON.stringify(projects));
                renderProjects();
            })
            .catch(error => {
                console.error('Error loading projects data:', error);
                projectsListContainer.innerHTML = '<p class="text-red-500">Error loading projects data. Please check console.</p>';
            });
    }
});
