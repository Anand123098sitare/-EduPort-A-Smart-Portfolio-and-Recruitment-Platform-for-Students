document.addEventListener('DOMContentLoaded', function() {
    // --- Helper function for notifications ---
    // (You can move this to a shared 'utils.js' file later if you want)
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        setTimeout(() => {
            notification.classList.remove('show');
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
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    // --- Form submission for Registration ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const signUpBtn = this.querySelector('button[type="submit"]');
            const buttonInner = signUpBtn.querySelector('span');

            // --- Frontend Validation ---
            if (password !== confirmPassword) {
                showNotification('Passwords do not match!', 'error');
                return; // Stop the function
            }

            // Provide visual feedback
            if(buttonInner) buttonInner.textContent = 'Signing Up...';
            signUpBtn.disabled = true;

            try {
                // Send the data to the backend's POST /register route
                const response = await fetch('http://localhost:3000/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        password
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    showNotification(data.message, 'success');
                    // Redirect to login page after a short delay
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    showNotification(`Error: ${data.message}`, 'error');
                }
            } catch (error) {
                console.error('Failed to connect to the server:', error);
                showNotification('Could not connect to the server.', 'error');
            } finally {
                // Reset the button
                if(buttonInner) buttonInner.textContent = 'Sign Up';
                signUpBtn.disabled = false;
            }
        });
    }
    
    // You can add social login handlers here as well if needed
    const googleBtn = document.querySelector('.social-btn.google');
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            window.location.href = 'http://localhost:3000/auth/google';
        });
    }
});

// Add styles for notification (can also be moved to your main CSS file)
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
        background-color: #333; /* Default color */
    }
    .notification.show {
        transform: translateX(0);
    }
    .notification.success {
        background-color: #2ecc71;
    }
    .notification.error {
        background-color: #e74c3c;
    }
    .notification.info {
        background-color: #3498db;
    }
`;
document.head.appendChild(style);
