document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupLink = document.getElementById('showSignup');
    const showLoginLink = document.getElementById('showLogin');

    // Admin credentials
    const ADMIN_PHONE = '03151251123';
    const ADMIN_PASSWORD = 'admin123';
    const ADMIN_REFERRAL = '000000';

    // API URL - will work both locally and when deployed
    const API_URL = window.location.origin;

    // Check if token exists and redirect to appropriate page
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (token && window.location.pathname === '/') {
        // Redirect admin to admin panel, regular users to dashboard
        if (user && user.phone === ADMIN_PHONE) {
            window.location.href = '/admin-panel.html';
        } else {
            window.location.href = '/dashboard.html';
        }
    }

    // Password visibility toggle
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            
            // Toggle password visibility
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                button.classList.remove('fa-eye-slash');
                button.classList.add('fa-eye');
            } else {
                passwordInput.type = 'password';
                button.classList.remove('fa-eye');
                button.classList.add('fa-eye-slash');
            }
        });
    });

    // Validation functions
    const validatePhoneNumber = (phone) => {
        const phoneRegex = /^[0-9]{11}$/;
        return phoneRegex.test(phone);
    };

    const validatePassword = (password) => {
        // Special case for admin password
        if (password === ADMIN_PASSWORD) return true;
        // Regular password validation
        const passwordRegex = /^[a-zA-Z0-9]{6,10}$/;
        return passwordRegex.test(password);
    };

    const validateReferralCode = (code) => {
        // Special case for admin referral
        if (code === ADMIN_REFERRAL) return true;
        // Regular referral code validation
        const referralRegex = /^[0-9]{6}$/;
        return referralRegex.test(code);
    };

    // Toggle between login and signup forms with fade effect
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.opacity = '0';
        setTimeout(() => {
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
            setTimeout(() => {
                signupForm.style.opacity = '1';
            }, 50);
        }, 300);
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.opacity = '0';
        setTimeout(() => {
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
            setTimeout(() => {
                loginForm.style.opacity = '1';
            }, 50);
        }, 300);
    });

    // Handle Login Form Submission
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = document.getElementById('loginPhone').value;
        const password = document.getElementById('loginPassword').value;

        if (!validatePhoneNumber(phone)) {
            alert('Please enter a valid 11-digit phone number');
            return;
        }

        if (!validatePassword(password)) {
            alert('Invalid password format');
            return;
        }

        try {
            console.log('Attempting login with:', { phone, password });
            const loginResponse = await fetch(`${API_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ phone, password }),
            });

            // Log the response for debugging
            console.log('Login response status:', loginResponse.status);
            
            // Try to parse the response as JSON
            let data;
            try {
                data = await loginResponse.json();
                console.log('Login response data:', data);
            } catch (jsonError) {
                console.error('Failed to parse JSON:', jsonError);
                throw new Error('Invalid server response');
            }

            if (!loginResponse.ok) {
                throw new Error(data.message || 'Invalid credentials');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on user type
            if (phone === ADMIN_PHONE) {
                window.location.href = '/admin-panel.html';
            } else {
                window.location.href = '/dashboard.html';
            }
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message || 'Login failed. Please check your credentials and try again.');
        }
    });

    // Handle Signup Form Submission
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const phone = document.getElementById('signupPhone').value;
            const password = document.getElementById('signupPassword').value;
            const referralCode = document.getElementById('referralCode').value;

            // Prevent using admin credentials
            if (phone === ADMIN_PHONE) {
                alert('This phone number is reserved for administrative use only');
                document.getElementById('signupPhone').value = '';
                document.getElementById('signupPhone').focus();
                return;
            }

            if (!validatePhoneNumber(phone)) {
                alert('Please enter a valid 11-digit phone number');
                return;
            }

            if (!validatePassword(password)) {
                alert('Password must be 6-10 characters long and contain only letters and numbers');
                return;
            }

            if (!validateReferralCode(referralCode)) {
                alert('Please enter a valid 6-digit referral code');
                return;
            }

            const response = await fetch(`${API_URL}/api/v1/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    phone,
                    password,
                    referralCode
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Account created successfully!');
                
                // Always set the new user's session after signup
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/dashboard.html';
            } else {
                throw new Error(data.message || 'Signup failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'An error occurred during signup. Please try again.');
            document.getElementById('signupForm').reset();
        }
    });

    // Format phone number input
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            // Remove any non-digit characters
            e.target.value = e.target.value.replace(/\D/g, '');
            // Limit to 11 digits
            if (e.target.value.length > 11) {
                e.target.value = e.target.value.slice(0, 11);
            }
        });
    });

    // Format referral code input
    const referralInput = document.getElementById('referralCode');
    if (referralInput) {
        referralInput.addEventListener('input', (e) => {
            // Remove any non-digit characters
            e.target.value = e.target.value.replace(/\D/g, '');
            // Limit to 6 digits
            if (e.target.value.length > 6) {
                e.target.value = e.target.value.slice(0, 6);
            }
        });
    }

    // Format password input
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            // Don't format admin password
            if (input.value === ADMIN_PASSWORD) return;
            // Remove special characters
            e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
            // Limit to 10 characters
            if (e.target.value.length > 10) {
                e.target.value = e.target.value.slice(0, 10);
            }
        });
    });
}); 