// Profile Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const profileForm = document.getElementById('profile-form');
    const profileImageInput = document.getElementById('profile-image-input');
    const profileImagePreview = document.getElementById('profile-image-preview');
    const profileImageWrapper = document.querySelector('.profile-image-wrapper');
    const bioTextarea = document.getElementById('bio');
    const charCount = document.querySelector('.char-count');
    const resumeUploadArea = document.getElementById('resume-upload-area');
    const resumeInput = document.getElementById('resume-input');
    const resumePreview = document.getElementById('resume-preview');
    const removeResumeBtn = document.getElementById('remove-resume-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const saveBtn = document.getElementById('save-btn');

    // State variables
    let selectedProfileImage = null;
    let selectedResumeFile = null;
    let currentUserData = {};

    // Initialize page
    init();

    function init() {
        loadUserProfile();
        setupEventListeners();
        setupFormValidation();
    }

    // Load existing user profile data
    async function loadUserProfile() {
        // Show loading state
        showLoadingState(true);
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            const response = await fetch('http://localhost:3000/api/users/me', {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                currentUserData = userData;
                populateForm(userData);
                showNotification('Profile loaded successfully', 'success');
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            } else {
                console.error('Failed to load profile data');
                showNotification('Failed to load profile data', 'error');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            showNotification('Error loading profile data', 'error');
        } finally {
            // Hide loading state
            showLoadingState(false);
        }
    }

    // Show/hide loading state
    function showLoadingState(isLoading) {
        const formElements = profileForm.querySelectorAll('input, textarea, button');
        
        if (isLoading) {
            // Show loading in form fields
            document.getElementById('full-name').placeholder = 'Loading...';
            document.getElementById('username').placeholder = 'Loading...';
            
            // Disable form elements
            formElements.forEach(element => {
                element.disabled = true;
            });
            
            // Show loading in save button
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        } else {
            // Reset placeholders
            document.getElementById('full-name').placeholder = 'Enter your full name';
            document.getElementById('username').placeholder = 'Choose a unique username';
            
            // Enable form elements
            formElements.forEach(element => {
                element.disabled = false;
            });
            
            // Reset save button
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        }
    }

    // Populate form with existing data
    function populateForm(userData) {
        // Basic information - use Google Auth data as fallback
        document.getElementById('full-name').value = userData.fullName || userData.name || '';
        document.getElementById('username').value = userData.username || '';
        document.getElementById('bio').value = userData.bio || '';

        // Social links
        const socialLinks = userData.socialLinks || {};
        document.getElementById('linkedin').value = socialLinks.linkedin || '';
        document.getElementById('github').value = socialLinks.github || '';
        document.getElementById('portfolio').value = socialLinks.portfolio || '';
        document.getElementById('twitter').value = socialLinks.twitter || '';

        // Profile image - use existing or generate from name/email
        if (userData.profileImage || userData.profilePictureUrl) {
            const imageUrl = userData.profileImage || userData.profilePictureUrl;
            const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `http://localhost:3000${imageUrl}`;
            profileImagePreview.src = fullImageUrl;
            
            // Handle image load errors
            profileImagePreview.onerror = () => {
                const initial = (userData.name || userData.email || 'P').charAt(0).toUpperCase();
                profileImagePreview.src = `https://placehold.co/150x150/667eea/ffffff?text=${initial}`;
            };
        } else {
            // Generate placeholder with user's initial
            const initial = (userData.name || userData.email || 'P').charAt(0).toUpperCase();
            profileImagePreview.src = `https://placehold.co/150x150/667eea/ffffff?text=${initial}`;
        }

        // Update character count for bio
        updateCharCount();
    }

    // Setup event listeners
    function setupEventListeners() {
        // Profile image upload
        profileImageWrapper.addEventListener('click', () => {
            profileImageInput.click();
        });

        profileImageInput.addEventListener('change', handleProfileImageSelect);

        // Bio character count
        bioTextarea.addEventListener('input', updateCharCount);

        // Resume upload
        resumeUploadArea.addEventListener('click', () => {
            resumeInput.click();
        });

        resumeInput.addEventListener('change', handleResumeSelect);

        // Drag and drop for resume
        resumeUploadArea.addEventListener('dragover', handleDragOver);
        resumeUploadArea.addEventListener('dragleave', handleDragLeave);
        resumeUploadArea.addEventListener('drop', handleDrop);

        // Remove resume
        removeResumeBtn.addEventListener('click', removeResume);

        // Form actions
        cancelBtn.addEventListener('click', handleCancel);
        profileForm.addEventListener('submit', handleFormSubmit);

        // Real-time validation
        const inputs = profileForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearFieldError);
        });
    }

    // Handle profile image selection
    function handleProfileImageSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
            showNotification('Please select a valid image file (JPG, JPEG, or PNG)', 'error');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Image file size must be less than 5MB', 'error');
            return;
        }

        selectedProfileImage = file;

        // Preview image
        const reader = new FileReader();
        reader.onload = function(e) {
            profileImagePreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Handle resume file selection
    function handleResumeSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        processResumeFile(file);
    }

    // Process resume file
    function processResumeFile(file) {
        // Validate file type
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            showNotification('Please select a valid resume file (PDF, DOC, or DOCX)', 'error');
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            showNotification('Resume file size must be less than 10MB', 'error');
            return;
        }

        selectedResumeFile = file;
        showResumePreview(file);
    }

    // Show resume preview
    function showResumePreview(file) {
        const fileName = document.getElementById('resume-file-name');
        const fileSize = document.getElementById('resume-file-size');

        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);

        resumeUploadArea.style.display = 'none';
        resumePreview.style.display = 'block';
    }

    // Remove resume file
    function removeResume() {
        selectedResumeFile = null;
        resumeInput.value = '';
        resumeUploadArea.style.display = 'block';
        resumePreview.style.display = 'none';
    }

    // Drag and drop handlers
    function handleDragOver(event) {
        event.preventDefault();
        resumeUploadArea.classList.add('dragover');
    }

    function handleDragLeave(event) {
        event.preventDefault();
        resumeUploadArea.classList.remove('dragover');
    }

    function handleDrop(event) {
        event.preventDefault();
        resumeUploadArea.classList.remove('dragover');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            processResumeFile(files[0]);
        }
    }

    // Update character count for bio
    function updateCharCount() {
        const currentLength = bioTextarea.value.length;
        const maxLength = 500;
        charCount.textContent = `${currentLength} / ${maxLength} characters`;
        
        if (currentLength > maxLength) {
            charCount.style.color = 'var(--error)';
            bioTextarea.value = bioTextarea.value.substring(0, maxLength);
            charCount.textContent = `${maxLength} / ${maxLength} characters`;
        } else {
            charCount.style.color = 'var(--text-light)';
        }
    }

    // Form validation
    function setupFormValidation() {
        const requiredFields = ['full-name', 'username'];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.setAttribute('required', 'true');
            }
        });
    }

    // Validate individual field
    function validateField(event) {
        const field = event.target;
        const value = field.value.trim();
        
        clearFieldError(field);

        if (field.hasAttribute('required') && !value) {
            showFieldError(field, 'This field is required');
            return false;
        }

        // Specific validations
        switch (field.id) {
            case 'username':
                if (value && !/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
                    showFieldError(field, 'Username must be 3-20 characters and contain only letters, numbers, and underscores');
                    return false;
                }
                break;
            
            case 'linkedin':
            case 'github':
            case 'portfolio':
            case 'twitter':
                if (value && !isValidUrl(value)) {
                    showFieldError(field, 'Please enter a valid URL');
                    return false;
                }
                break;
        }

        return true;
    }

    // Show field error
    function showFieldError(field, message) {
        clearFieldError(field);
        
        field.style.borderColor = 'var(--error)';
        
        const errorElement = document.createElement('small');
        errorElement.className = 'field-error';
        errorElement.style.color = 'var(--error)';
        errorElement.style.marginTop = '0.25rem';
        errorElement.textContent = message;
        
        field.parentNode.appendChild(errorElement);
    }

    // Clear field error
    function clearFieldError(field) {
        if (typeof field === 'object' && field.target) {
            field = field.target;
        }
        
        field.style.borderColor = 'var(--border-color)';
        
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    // Validate entire form
    function validateForm() {
        const inputs = profileForm.querySelectorAll('input[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!validateField({ target: input })) {
                isValid = false;
            }
        });

        return isValid;
    }

    // Handle form submission
    async function handleFormSubmit(event) {
        event.preventDefault();

        if (!validateForm()) {
            showNotification('Please fix the errors in the form', 'error');
            return;
        }

        // Show loading state
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            const formData = new FormData();

            // Basic information
            formData.append('name', document.getElementById('full-name').value.trim()); // Keep 'name' for backward compatibility
            formData.append('fullName', document.getElementById('full-name').value.trim());
            formData.append('username', document.getElementById('username').value.trim());
            formData.append('bio', document.getElementById('bio').value.trim());

            // Social links
            const socialLinks = {
                linkedin: document.getElementById('linkedin').value.trim(),
                github: document.getElementById('github').value.trim(),
                portfolio: document.getElementById('portfolio').value.trim(),
                twitter: document.getElementById('twitter').value.trim()
            };
            formData.append('socialLinks', JSON.stringify(socialLinks));

            // Files
            if (selectedProfileImage) {
                formData.append('profileImage', selectedProfileImage);
            }
            if (selectedResumeFile) {
                formData.append('resume', selectedResumeFile);
            }

            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/users/me', {
                method: 'PUT',
                headers: {
                    'x-auth-token': token
                },
                body: formData
            });

            if (response.ok) {
                const updatedData = await response.json();
                currentUserData = updatedData;
                showNotification('Profile updated successfully!', 'success');
                
                // Redirect back to dashboard after a short delay
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            } else {
                const errorData = await response.json();
                showNotification(errorData.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification('Error updating profile. Please try again.', 'error');
        } finally {
            // Reset button state
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        }
    }

    // Handle cancel button
    function handleCancel() {
        if (hasUnsavedChanges()) {
            if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
                window.location.href = 'dashboard.html';
            }
        } else {
            window.location.href = 'dashboard.html';
        }
    }

    // Check for unsaved changes
    function hasUnsavedChanges() {
        const currentFormData = {
            fullName: document.getElementById('full-name').value.trim(),
            username: document.getElementById('username').value.trim(),
            bio: document.getElementById('bio').value.trim(),
            socialLinks: {
                linkedin: document.getElementById('linkedin').value.trim(),
                github: document.getElementById('github').value.trim(),
                portfolio: document.getElementById('portfolio').value.trim(),
                twitter: document.getElementById('twitter').value.trim()
            }
        };

        // Compare with original data
        return JSON.stringify(currentFormData) !== JSON.stringify({
            fullName: currentUserData.fullName || '',
            username: currentUserData.username || '',
            bio: currentUserData.bio || '',
            socialLinks: currentUserData.socialLinks || {}
        }) || selectedProfileImage || selectedResumeFile;
    }

    // Utility functions
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

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
        const messageElement = notification.querySelector('.notification-message');
        const iconElement = notification.querySelector('.notification-icon');

        // Set message
        messageElement.textContent = message;

        // Set type and icon
        notification.className = `notification ${type}`;
        
        switch (type) {
            case 'success':
                iconElement.className = 'notification-icon fas fa-check-circle';
                break;
            case 'error':
                iconElement.className = 'notification-icon fas fa-exclamation-circle';
                break;
            default:
                iconElement.className = 'notification-icon fas fa-info-circle';
        }

        // Show notification
        notification.style.display = 'block';
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 5000);
    }

    // Handle page unload warning
    window.addEventListener('beforeunload', function(event) {
        if (hasUnsavedChanges()) {
            event.preventDefault();
            event.returnValue = '';
        }
    });
});
