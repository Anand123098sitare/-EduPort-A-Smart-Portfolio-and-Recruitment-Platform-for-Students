document.addEventListener('DOMContentLoaded', () => {
    // --- Part 1: Handle Token on Page Load ---
    // This section checks if a token was passed in the URL from the Google login.
    // If so, it saves it to localStorage and cleans the URL.
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
        localStorage.setItem('token', tokenFromUrl);
        // Clean the URL to remove the token, so it's not visible to the user
        window.history.replaceState({}, document.title, "dashboard.html");
    }

    // --- Part 2: Verify Token and Protect the Page ---
    // This part now runs after the token from the URL has been handled.
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html'; // Redirect if no token is found
        return;
    }

    // --- Part 3: Element References ---
    const userProfileImg = document.querySelector('#user-profile img');
    const userProfileName = document.getElementById('profile-name');
    const userProfile = document.getElementById('user-profile');
    const profileMenu = document.getElementById('profile-menu');
    const logoutBtn = document.getElementById('logout-btn');
    const projectGrid = document.getElementById('project-grid');
    // Note: The modal and create project button elements from the previous guide are not in the current dashboard HTML.
    // If you add them back, you would declare their variables here.

    // --- Profile Menu Dropdown Logic ---
    if (userProfile && profileMenu) {
        userProfile.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from bubbling up to the window
            profileMenu.classList.toggle('show');
        });
    }

    window.addEventListener('click', () => {
        if (profileMenu && profileMenu.classList.contains('show')) {
            profileMenu.classList.remove('show');
        }
    });

    // --- Logout Logic ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    }
    
    // --- API Call to Fetch User Profile Data ---
    const loadUserProfile = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/users/me', {
                headers: { 'x-auth-token': token }
            });

            if (!res.ok) {
                // This will catch 401 Unauthorized errors if the token is bad
                throw new Error('Could not fetch user profile. Token might be invalid.');
            }
            
            const user = await res.json();
            
            // Update UI with user data
            if (userProfileImg && user.profilePictureUrl) {
                userProfileImg.src = user.profilePictureUrl;
            }
            if (userProfileName && user.name) {
                userProfileName.textContent = user.name;
            }

        } catch (error) {
            console.error(error);
            // If any error occurs (e.g., invalid token), clear the token and redirect to login
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    };

    // --- API Call to Fetch and Display Projects ---
    const fetchAndDisplayProjects = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/projects', {
                headers: { 'x-auth-token': token }
            });

            if (!res.ok) {
                throw new Error('Failed to fetch projects');
            }

            const projects = await res.json();
            projectGrid.innerHTML = ''; // Clear the grid before adding new projects
            
            if (projects.length === 0) {
                projectGrid.innerHTML = '<p style="color: var(--text-secondary);">You have not created any projects yet. Get started by creating one!</p>';
            } else {
                projects.forEach(project => {
                    const card = document.createElement('div');
                    card.className = 'project-card';
                    // We can add a placeholder image for projects that don't have one
                    card.innerHTML = `
                        <img class="project-card-image" src="https://placehold.co/600x400/e9ebee/333333?text=Project" alt="${project.title}">
                        <div class="project-card-content">
                            <h3>${project.title}</h3>
                            <p>${project.description.substring(0, 100)}...</p>
                        </div>
                    `;
                    projectGrid.appendChild(card);
                });
            }
        } catch (err) {
            console.error(err);
            projectGrid.innerHTML = '<p style="color: red;">Could not load projects. Please try again later.</p>';
        }
    };

    // --- Initial Load ---
    // We use Promise.all to run both API calls concurrently for faster loading
    Promise.all([
        loadUserProfile(),
        fetchAndDisplayProjects()
    ]);
});
