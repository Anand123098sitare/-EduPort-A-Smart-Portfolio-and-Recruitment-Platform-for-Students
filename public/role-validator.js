// Role Validation Script for EduPort Dashboards
// This script ensures users can only access dashboards appropriate for their role

(function() {
    'use strict';
    
    // Configuration
    const ROLE_VALIDATION_CONFIG = {
        'student-dashboard.html': 'student',
        'teacher-dashboard.html': 'teacher'
    };
    
    // Get current page and required role
    const currentPage = window.location.pathname.split('/').pop();
    const requiredRole = ROLE_VALIDATION_CONFIG[currentPage];
    
    // If this page doesn't require role validation, exit
    if (!requiredRole) {
        return;
    }
    
    // Get authentication data
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    console.log('Role Validation:', {
        currentPage,
        requiredRole,
        userRole,
        hasToken: !!token
    });
    
    // Validation checks
    function validateAccess() {
        // Check 1: User must be logged in
        if (!token) {
            console.error('Access denied: No authentication token');
            redirectToError('No authentication token found. Please log in.');
            return false;
        }
        
        // Check 2: User must have a valid role
        if (!userRole || (userRole !== 'student' && userRole !== 'teacher')) {
            console.error('Access denied: Invalid or missing role:', userRole);
            redirectToError(`Invalid role: "${userRole}". Valid roles are "student" or "teacher".`);
            return false;
        }
        
        // Check 3: User role must match required role for this page
        if (userRole !== requiredRole) {
            console.error(`Access denied: Role mismatch. Required: ${requiredRole}, User: ${userRole}`);
            redirectToError(`Access denied. This page requires "${requiredRole}" role, but you are logged in as "${userRole}".`);
            return false;
        }
        
        console.log('Access granted:', { userRole, requiredRole });
        return true;
    }
    
    // Redirect to error page with details
    function redirectToError(reason) {
        // Store error details for the error page
        sessionStorage.setItem('accessError', JSON.stringify({
            reason,
            currentPage,
            requiredRole,
            userRole,
            timestamp: new Date().toISOString()
        }));
        
        // Redirect to error page
        window.location.href = 'role-error.html';
    }
    
    // Validate access immediately
    if (!validateAccess()) {
        return; // Exit if validation fails
    }
    
    // Additional security: Validate token with backend
    async function validateTokenWithBackend() {
        try {
            const response = await fetch('http://localhost:3000/api/users/me', {
                headers: { 'x-auth-token': token }
            });
            
            if (!response.ok) {
                console.error('Token validation failed:', response.status);
                redirectToError('Authentication token is invalid or expired. Please log in again.');
                return false;
            }
            
            const user = await response.json();
            
            // Double-check role matches backend
            if (user.role !== userRole) {
                console.error('Role mismatch with backend:', { frontend: userRole, backend: user.role });
                localStorage.setItem('userRole', user.role); // Update to match backend
                
                // Check if updated role is still valid for current page
                if (user.role !== requiredRole) {
                    redirectToError(`Role updated from backend. You are "${user.role}" but this page requires "${requiredRole}".`);
                    return false;
                }
            }
            
            console.log('Backend token validation successful');
            return true;
            
        } catch (error) {
            console.error('Backend validation error:', error);
            redirectToError('Unable to validate authentication with server. Please try again.');
            return false;
        }
    }
    
    // Run backend validation after page loads
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(validateTokenWithBackend, 1000); // Delay to allow page to load
    });
    
    // Export validation function for use by dashboard scripts
    window.EduPortRoleValidator = {
        validateAccess,
        validateTokenWithBackend,
        getCurrentRole: () => userRole,
        getRequiredRole: () => requiredRole,
        isValidAccess: () => validateAccess()
    };
    
})();
