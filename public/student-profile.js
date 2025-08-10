// Student Profile Page JavaScript
let currentStudentId = null;
let currentUser = null;

// Initialize page when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    // Get student ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentStudentId = urlParams.get('studentId');
    
    if (!currentStudentId) {
        showError('No student ID provided');
        return;
    }

    // Check authentication and load profile
    checkAuth();
});

// Check if user is authenticated and is a teacher
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch('/api/users/me', {
            headers: {
                'x-auth-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Authentication failed');
        }

        currentUser = await response.json();
        
        // Check if user is a teacher
        if (currentUser.role !== 'teacher') {
            showError('Access denied. Only teachers can view student profiles.');
            return;
        }

        // Load student profile
        loadStudentProfile();
    } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    }
}

// Load student profile data
async function loadStudentProfile() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/students/${currentStudentId}/profile`, {
            headers: {
                'x-auth-token': token
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Student not found');
            } else if (response.status === 403) {
                throw new Error('Access denied');
            } else {
                throw new Error('Failed to load student profile');
            }
        }

        const student = await response.json();
        displayStudentProfile(student);
        loadStudentProjects();
    } catch (error) {
        console.error('Failed to load student profile:', error);
        showError(error.message);
    }
}

// Display student profile information
function displayStudentProfile(student) {
    // Hide loading, show content
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('profileContent').style.display = 'block';

    // Profile image
    const profileImage = document.getElementById('profileImage');
    if (student.profileImage) {
        profileImage.src = `/${student.profileImage}`;
    } else {
        profileImage.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'Student')}&background=667eea&color=fff&size=120`;
    }

    // Basic info
    document.getElementById('studentName').textContent = student.fullName || student.name || 'Unknown Student';
    document.getElementById('studentUsername').textContent = student.username ? `@${student.username}` : '@username';
    document.getElementById('studentEmail').textContent = student.email || 'No email provided';
    
    // Join date
    const joinDate = new Date(student.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('joinDate').textContent = `Joined: ${joinDate}`;

    // Bio
    const bioElement = document.getElementById('studentBio');
    if (student.bio && student.bio.trim()) {
        bioElement.textContent = student.bio;
    } else {
        bioElement.textContent = 'No bio available.';
        bioElement.style.fontStyle = 'italic';
        bioElement.style.color = 'var(--text-light)';
    }

    // Social links
    displaySocialLinks(student.socialLinks);

    // Resume
    displayResume(student.resumeUrl);
}

// Display social links
function displaySocialLinks(socialLinks) {
    const socialLinksContainer = document.getElementById('socialLinks');
    const socialLinksSection = document.getElementById('socialLinksSection');

    if (!socialLinks || Object.keys(socialLinks).length === 0) {
        socialLinksSection.style.display = 'none';
        return;
    }

    socialLinksSection.style.display = 'block';
    socialLinksContainer.innerHTML = '';

    const linkIcons = {
        linkedin: 'fab fa-linkedin',
        github: 'fab fa-github',
        portfolio: 'fas fa-globe',
        twitter: 'fab fa-twitter'
    };

    Object.entries(socialLinks).forEach(([platform, url]) => {
        if (url && url.trim()) {
            const linkElement = document.createElement('a');
            linkElement.href = url;
            linkElement.target = '_blank';
            linkElement.className = 'social-link';
            linkElement.innerHTML = `
                <i class="${linkIcons[platform] || 'fas fa-link'}"></i>
                <span>${platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
            `;
            socialLinksContainer.appendChild(linkElement);
        }
    });

    if (socialLinksContainer.children.length === 0) {
        socialLinksSection.style.display = 'none';
    }
}

// Display resume section
function displayResume(resumeUrl) {
    const resumeSection = document.getElementById('resumeSection');
    const resumeLink = document.getElementById('resumeLink');

    if (resumeUrl && resumeUrl.trim()) {
        resumeSection.style.display = 'block';
        resumeLink.href = `/${resumeUrl}`;
    } else {
        resumeSection.style.display = 'none';
    }
}

// Load student's projects
async function loadStudentProjects() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/projects', {
            headers: {
                'x-auth-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load projects');
        }

        const projects = await response.json();
        
        // Filter projects by this student
        const studentProjects = projects.filter(project => 
            project.user && project.user._id === currentStudentId
        );

        displayStudentProjects(studentProjects);
    } catch (error) {
        console.error('Failed to load student projects:', error);
        document.getElementById('studentProjects').innerHTML = 
            '<p class="loading-text" style="color: var(--error);">Failed to load projects</p>';
    }
}

// Display student's projects
function displayStudentProjects(projects) {
    const projectsContainer = document.getElementById('studentProjects');

    if (projects.length === 0) {
        projectsContainer.innerHTML = '<p class="loading-text">No projects found for this student.</p>';
        return;
    }

    projectsContainer.innerHTML = '';

    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';

        const projectName = project.projectName || project.title || 'Untitled Project';
        const projectDescription = project.projectDescription || project.description || 'No description available';
        const techUsed = project.techUsed || 'other';
        const screenshotUrl = project.screenshotUrl || `https://placehold.co/600x400/667eea/ffffff?text=${encodeURIComponent(projectName)}`;

        // Get tech display name
        const techDisplayName = getTechDisplayName(techUsed);

        projectCard.innerHTML = `
            <img class="project-card-image" src="${screenshotUrl}" alt="${projectName}" 
                 onerror="this.src='https://placehold.co/600x400/667eea/ffffff?text=Project+Screenshot'">
            <div class="project-card-content">
                <h4>${projectName}</h4>
                <p>${projectDescription.length > 100 ? projectDescription.substring(0, 100) + '...' : projectDescription}</p>
                <div class="project-tech">${techDisplayName}</div>
            </div>
        `;

        projectsContainer.appendChild(projectCard);
    });
}

// Helper function to get tech display name
function getTechDisplayName(techCode) {
    const techMap = {
        'web-development': 'Web Development',
        'android-development': 'Android Development',
        'ios-development': 'iOS Development',
        'ai-ml': 'AI/ML',
        'data-science': 'Data Science',
        'blockchain': 'Blockchain',
        'game-development': 'Game Development',
        'desktop-app': 'Desktop App',
        'devops': 'DevOps',
        'cybersecurity': 'Cybersecurity',
        'iot': 'IoT',
        'other': 'Other'
    };
    return techMap[techCode] || 'Other';
}

// Show error state
function showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('profileContent').style.display = 'none';
    document.getElementById('errorState').style.display = 'flex';
    document.getElementById('errorMessage').textContent = message;
}

// Navigation functions
function goBack() {
    window.history.back();
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
