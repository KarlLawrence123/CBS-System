const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

// API URL
const API_URL = 'http://localhost:5000/api';

// Register form submission
document.querySelector('.register form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.querySelector('.register input[type="text"]').value;
    const email = document.querySelector('.register input[type="email"]').value;
    const password = document.querySelector('.register input[type="password"]').value;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Registration successful! Please log in.');
            document.querySelector('.container').classList.remove('active'); // Switch to login form
            // Do NOT set token or redirect
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error during registration');
    }
});

// Login form submission
document.querySelector('.login form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('.login input[type="email"]').value;
    const password = document.querySelector('.login input[type="password"]').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = '/index.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error during login');
    }
});

// Toggle between login and register forms
registerBtn.addEventListener('click', () => {
    container.classList.add('active');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
});