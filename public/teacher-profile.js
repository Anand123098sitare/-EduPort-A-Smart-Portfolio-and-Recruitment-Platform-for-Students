// Teacher Profile JavaScript - Built from scratch to match student profile exactly
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and role
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'teacher') {
        window.location.href = 'role-selection.html';
        return;
    }
    
    // Initialize profile page
    initializeProfile();
    loadUserProfile();
    loadAllProjects();
    setupEventListeners();
});

// Global variables
let currentCommentProjectId = null;

// Initialize profile page
function initializeProfile() {
    console.log('Initializing teacher profile page...');
    
    // Setup character counter for bio
    const bioTextarea = document.getElementById('bio');
    const charCount = document.querySelector('.char-count');
    
    if (bioTextarea && charCount) {
        bioTextarea.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = `${count} / 500 characters`;
            
            if (count > 500) {
                charCount.style.color = '#e74c3c';
            } else {
                charCount.style.color = '#666';
            }
        });
    }
}

// Load user profile data
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const user = await response.json();
            populateProfileForm(user);
        } else {
            showNotification('Failed to load profile data', 'error');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Error loading profile data', 'error');
    }
}

// Populate profile form with user data
function populateProfileForm(user) {
    // Basic info
    document.getElementById('full-name').value = user.name || '';
    document.getElementById('username').value = user.username || '';
    document.getElementById('bio').value = user.bio || '';
    
    // Update character count
    const bioLength = (user.bio || '').length;
    document.querySelector('.char-count').textContent = `${bioLength} / 500 characters`;
    
    // Social links
    document.getElementById('linkedin').value = user.linkedin || '';
    document.getElementById('github').value = user.github || '';
    document.getElementById('portfolio').value = user.portfolio || '';
    document.getElementById('twitter').value = user.twitter || '';
    
    // Profile image
    if (user.profileImage) {
        document.getElementById('profile-image-preview').src = user.profileImage;
    } else {
        document.getElementById('profile-image-preview').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Teacher')}&background=667eea&color=fff`;
    }
}

// Load all student projects for teacher to view
async function loadAllProjects() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/projects/community', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const projects = await response.json();
            displayProjects(projects);
        } else {
            showNotification('Failed to load projects', 'error');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        showNotification('Error loading projects', 'error');
    }
}

// Display projects in grid (same as student profile but with teacher voting/commenting)
function displayProjects(projects) {
    const projectsGrid = document.getElementById('projects-grid');
    
    if (projects.length === 0) {
        projectsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No Projects Found</h3>
                <p>No student projects available yet.</p>
            </div>
        `;
        return;
    }
    
    projectsGrid.innerHTML = projects.map(project => `
        <div class="project-card">
            <div class="project-image">
                <img src="${project.imageUrl || 'https://via.placeholder.com/300x200/667eea/ffffff?text=Project'}" alt="${project.title}" loading="lazy">
            </div>
            <div class="project-content">
                <div class="project-header">
                    <h3>${project.title}</h3>
                    <span class="tech-tag">${project.technology || 'Other'}</span>
                </div>
                <p class="project-description">${project.description}</p>
                <div class="project-author">
                    <span class="student-name" onclick="viewStudentProfile('${project.user?._id}', '${project.user?.name}')">
                        by ${project.user?.name || 'Student'}
                    </span>
                </div>
                <div class="project-links">
                    ${project.githubUrl ? `<a href="${project.githubUrl}" target="_blank" class="project-link"><i class="fab fa-github"></i> GitHub</a>` : ''}
                    ${project.liveUrl ? `<a href="${project.liveUrl}" target="_blank" class="project-link"><i class="fas fa-external-link-alt"></i> Live Demo</a>` : ''}
                </div>
                <div class="project-stats">
                    <span><i class="fas fa-thumbs-up"></i> ${project.upvotes || 0}</span>
                    <span><i class="fas fa-thumbs-down"></i> ${project.downvotes || 0}</span>
                    <span><i class="fas fa-comments"></i> ${project.comments?.length || 0}</span>
                </div>
                <div class="project-actions">
                    <button class="action-btn upvote ${project.upvotedBy?.includes(getCurrentUserId()) ? 'voted' : ''}" 
                            onclick="handleVote('${project._id}', 'upvote', this)" 
                            ${project.upvotedBy?.includes(getCurrentUserId()) ? 'disabled' : ''}>
                        <i class="fas fa-thumbs-up"></i>
                        Upvote
                    </button>
                    <button class="action-btn downvote ${project.downvotedBy?.includes(getCurrentUserId()) ? 'voted' : ''}" 
                            onclick="handleVote('${project._id}', 'downvote', this)"
                            ${project.downvotedBy?.includes(getCurrentUserId()) ? 'disabled' : ''}>
                        <i class="fas fa-thumbs-down"></i>
                        Downvote
                    </button>
                    <button class="action-btn comment" onclick="openCommentModal('${project._id}')">
                        <i class="fas fa-comment"></i>
                        Comment
                    </button>
                </div>
                ${project.comments && project.comments.length > 0 ? `
                    <div class="project-comments">
                        <h4>Comments:</h4>
                        ${project.comments.map(comment => `
                            <div class="comment">
                                <div class="comment-header">
                                    <strong>${comment.user?.name || 'Teacher'}</strong>
                                    <span class="comment-date">${new Date(comment.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p class="comment-text">${comment.text}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Get current user ID (helper function)
function getCurrentUserId() {
    // This would typically be decoded from the JWT token
    // For now, return null as we don't have user ID readily available
    return null;
}

// Handle voting on projects
async function handleVote(projectId, voteType, button) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/projects/${projectId}/${voteType}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showNotification(`${voteType === 'upvote' ? 'Upvoted' : 'Downvoted'} successfully!`, 'success');
            
            // Update button states
            const projectCard = button.closest('.project-card');
            const upvoteBtn = projectCard.querySelector('.upvote');
            const downvoteBtn = projectCard.querySelector('.downvote');
            
            if (voteType === 'upvote') {
                upvoteBtn.classList.add('voted');
                upvoteBtn.disabled = true;
                downvoteBtn.classList.remove('voted');
                downvoteBtn.disabled = false;
            } else {
                downvoteBtn.classList.add('voted');
                downvoteBtn.disabled = true;
                upvoteBtn.classList.remove('voted');
                upvoteBtn.disabled = false;
            }
            
            // Reload projects to show updated counts
            loadAllProjects();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Vote failed', 'error');
        }
    } catch (error) {
        console.error('Error voting:', error);
        showNotification('Error voting on project', 'error');
    }
}

// Open comment modal
function openCommentModal(projectId) {
    currentCommentProjectId = projectId;
    const modal = document.getElementById('comment-modal');
    const commentText = document.getElementById('comment-text');
    
    commentText.value = '';
    modal.style.display = 'flex';
    commentText.focus();
}

// Close comment modal
function closeCommentModal() {
    const modal = document.getElementById('comment-modal');
    modal.style.display = 'none';
    currentCommentProjectId = null;
}

// Submit comment
async function submitComment() {
    if (!currentCommentProjectId) return;
    
    const commentText = document.getElementById('comment-text');
    const comment = commentText.value.trim();
    
    if (!comment) {
        showNotification('Please enter a comment', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/projects/${currentCommentProjectId}/comments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: comment })
        });
        
        if (response.ok) {
            showNotification('Comment added successfully!', 'success');
            closeCommentModal();
            loadAllProjects(); // Reload to show new comment
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to add comment', 'error');
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        showNotification('Error adding comment', 'error');
    }
}

// View student profile (placeholder - could open in new tab or modal)
function viewStudentProfile(studentId, studentName) {
    showNotification(`Opening profile for ${studentName}...`, 'info');
    // In a full implementation, this would show the specific student's profile
    // For now, just show a notification
}

// Setup event listeners
function setupEventListeners() {
    // Profile form submission
    const profileForm = document.getElementById('profile-form');
    profileForm.addEventListener('submit', handleProfileSubmit);
    
    // Profile image upload
    const profileImageWrapper = document.querySelector('.profile-image-wrapper');
    const profileImageInput = document.getElementById('profile-image-input');
    
    profileImageWrapper.addEventListener('click', () => {
        profileImageInput.click();
    });
    
    profileImageInput.addEventListener('change', handleProfileImageUpload);
    
    // Resume upload
    const resumeUploadArea = document.getElementById('resume-upload-area');
    const resumeInput = document.getElementById('resume-input');
    
    resumeUploadArea.addEventListener('click', () => {
        resumeInput.click();
    });
    
    resumeInput.addEventListener('change', handleResumeUpload);
    
    // Drag and drop for resume
    resumeUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        resumeUploadArea.classList.add('drag-over');
    });
    
    resumeUploadArea.addEventListener('dragleave', () => {
        resumeUploadArea.classList.remove('drag-over');
    });
    
    resumeUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        resumeUploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleResumeFile(files[0]);
        }
    });
    
    // Cancel button
    document.getElementById('cancel-btn').addEventListener('click', () => {
        window.location.href = 'teacher-dashboard.html';
    });
    
    // Remove resume button
    document.getElementById('remove-resume-btn').addEventListener('click', removeResume);
    
    // Modal close on outside click
    document.getElementById('comment-modal').addEventListener('click', (e) => {
        if (e.target.id === 'comment-modal') {
            closeCommentModal();
        }
    });
}

// Handle profile form submission
async function handleProfileSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('full-name').value);
    formData.append('username', document.getElementById('username').value);
    formData.append('bio', document.getElementById('bio').value);
    formData.append('linkedin', document.getElementById('linkedin').value);
    formData.append('github', document.getElementById('github').value);
    formData.append('portfolio', document.getElementById('portfolio').value);
    formData.append('twitter', document.getElementById('twitter').value);
    
    // Add profile image if selected
    const profileImageInput = document.getElementById('profile-image-input');
    if (profileImageInput.files[0]) {
        formData.append('profileImage', profileImageInput.files[0]);
    }
    
    // Add resume if selected
    const resumeInput = document.getElementById('resume-input');
    if (resumeInput.files[0]) {
        formData.append('resume', resumeInput.files[0]);
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/users/update-profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (response.ok) {
            showNotification('Profile updated successfully!', 'success');
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Error updating profile', 'error');
    }
}

// Handle profile image upload
function handleProfileImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profile-image-preview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Handle resume upload
function handleResumeUpload(e) {
    const file = e.target.files[0];
    if (file) {
        handleResumeFile(file);
    }
}

// Handle resume file
function handleResumeFile(file) {
    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
        showNotification('Please upload a PDF, DOC, or DOCX file', 'error');
        return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('File size must be less than 10MB', 'error');
        return;
    }
    
    // Show file preview
    document.getElementById('resume-upload-area').style.display = 'none';
    document.getElementById('resume-preview').style.display = 'block';
    document.getElementById('resume-file-name').textContent = file.name;
    document.getElementById('resume-file-size').textContent = formatFileSize(file.size);
}

// Remove resume
function removeResume() {
    document.getElementById('resume-input').value = '';
    document.getElementById('resume-upload-area').style.display = 'block';
    document.getElementById('resume-preview').style.display = 'none';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const icon = notification.querySelector('.notification-icon');
    const messageEl = notification.querySelector('.notification-message');
    
    // Set icon based on type
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };
    
    icon.className = `notification-icon ${icons[type] || icons.info}`;
    messageEl.textContent = message;
    
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}
