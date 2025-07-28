// Wait for the entire HTML document to be fully loaded and parsed
document.addEventListener('DOMContentLoaded', function() {

    /**
     * A helper function to create and display notifications on the screen.
     * @param {string} message - The message to display.
     * @param {string} type - The type of notification ('success', 'error', 'info').
     */
    function showNotification(message, type = 'info') {
        // Create the notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Append to the body
        document.body.appendChild(notification);

        // Add 'show' class to trigger CSS transition for fade-in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // After 3 seconds, remove the 'show' class to fade out
        setTimeout(() => {
            notification.classList.remove('show');
            // Remove the element from the DOM after the fade-out transition completes
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // --- Toggle password visibility ---
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.querySelector('#password');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            // Toggle the eye icon class
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    // --- Form submission for Email/Password Login ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            // CRITICAL: Prevents the browser's default form submission (which causes the 404)
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const loginBtn = this.querySelector('button[type="submit"]');
            const buttonInner = loginBtn.querySelector('span');

            // Provide visual feedback that something is happening
            if(buttonInner) buttonInner.textContent = 'Signing In...';
            loginBtn.disabled = true;

            try {
                // Send the data to the backend's POST /login route
                const response = await fetch('http://localhost:3000/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        password
                    }),
                });

                // Get the response from the server as JSON
                const data = await response.json();

                if (response.ok) {
                    // This means the server responded with a 2xx status code (e.g., 200 OK)
                    showNotification('Login successful!', 'success');
                    // In a real application, you would save the token and redirect
                    localStorage.setItem('token', data.token);
                    // For now, we'll just log it. Uncomment the line below to redirect.
                    // window.location.href = '/dashboard.html';
                    console.log('Received Token:', data.token);
                } else {
                    // This means the server responded with a 4xx or 5xx error
                    showNotification(`Error: ${data.message}`, 'error');
                }
            } catch (error) {
                // This catches network errors or if the server is down
                console.error('Failed to connect to the server:', error);
                showNotification('Could not connect to the server.', 'error');
            } finally {
                // This block runs whether the request succeeded or failed
                // Reset the button to its original state
                if(buttonInner) buttonInner.textContent = 'Sign In';
                loginBtn.disabled = false;
            }
        });
    }

    // --- Social Login Button Handlers ---
    const googleBtn = document.querySelector('.social-btn.google');
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            // Redirect the user to the backend's Google auth route, which will then redirect to Google
            window.location.href = 'http://localhost:3000/auth/google';
        });
    }

    const facebookBtn = document.querySelector('.social-btn.facebook');
    if (facebookBtn) {
        facebookBtn.addEventListener('click', () => {
            showNotification('Facebook login not yet implemented.', 'info');
            // When implemented, it would be: window.location.href = 'http://localhost:3000/auth/facebook';
        });
    }

    const twitterBtn = document.querySelector('.social-btn.twitter');
    if (twitterBtn) {
        twitterBtn.addEventListener('click', () => {
            showNotification('Twitter login not yet implemented.', 'info');
            // When implemented, it would be: window.location.href = 'http://localhost:3000/auth/twitter';
        });
    }
});


// Add styles for notification
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        transform: translateX(150%);
        transition: transform 0.3s ease;
        z-index: 1000;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification.success {
        background-color: var(--success-color);
    }
    
    .notification.error {
        background-color: var(--error-color);
    }
    
    .notification.info {
        background-color: var(--primary-color);
    }
    
    .spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;

document.head.appendChild(style);
