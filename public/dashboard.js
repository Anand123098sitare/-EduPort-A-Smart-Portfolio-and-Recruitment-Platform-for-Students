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

// --- TEACHER-STUDENT INTERACTION FEATURES ---

// View student profile (for teachers)
function viewStudentProfile(studentId) {
    if (!studentId) {
        console.error('No student ID provided');
        return;
    }
    window.location.href = `/student-profile.html?studentId=${studentId}`;
}

// Toggle comment section visibility
function toggleComments(projectId) {
    const commentsContainer = document.getElementById(`comments-${projectId}`);
    const isVisible = commentsContainer.style.display !== 'none';
    
    if (isVisible) {
        commentsContainer.style.display = 'none';
    } else {
        commentsContainer.style.display = 'block';
        loadComments(projectId);
    }
}

// Load comments for a project
async function loadComments(projectId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/projects/${projectId}/comments`, {
            headers: {
                'x-auth-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load comments');
        }

        const comments = await response.json();
        displayComments(projectId, comments);
    } catch (error) {
        console.error('Failed to load comments:', error);
        const commentsList = document.getElementById(`comments-list-${projectId}`);
        commentsList.innerHTML = '<p class="error-text">Failed to load comments</p>';
    }
}

// Display comments in the comments list
function displayComments(projectId, comments) {
    const commentsList = document.getElementById(`comments-list-${projectId}`);
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
        return;
    }

    commentsList.innerHTML = comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <strong>${comment.user.name}</strong>
                <span class="comment-date">${new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="comment-text">${comment.text}</div>
        </div>
    `).join('');
}

// Add a new comment
async function addComment(projectId) {
    const commentInput = document.getElementById(`comment-input-${projectId}`);
    const commentText = commentInput.value.trim();
    
    if (!commentText) {
        showNotification('Please enter a comment', 'error');
        return;
    }

    if (commentText.length > 1000) {
        showNotification('Comment must be less than 1000 characters', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/projects/${projectId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ text: commentText })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add comment');
        }

        const newComment = await response.json();
        
        // Clear the input
        commentInput.value = '';
        
        // Reload comments to show the new one
        loadComments(projectId);
        
        // Update comment count in the toggle button
        const commentToggle = document.querySelector(`[onclick="toggleComments('${projectId}')"]`);
        const currentCount = parseInt(commentToggle.textContent.match(/\d+/)[0]) || 0;
        commentToggle.innerHTML = `<i class="fas fa-comment"></i> Comments (${currentCount + 1})`;
        
        // Update comment count in stats
        const statsCommentCount = document.querySelector(`[data-project-id="${projectId}"]`)?.closest('.project-card')?.querySelector('.stat-item i.fa-comments')?.parentElement;
        if (statsCommentCount) {
            statsCommentCount.innerHTML = `<i class="fas fa-comments"></i> ${currentCount + 1}`;
        }
        
        showNotification('Comment added successfully!', 'success');
    } catch (error) {
        console.error('Failed to add comment:', error);
        showNotification(error.message, 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
