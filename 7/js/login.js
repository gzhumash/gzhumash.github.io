// Logic for the login page
import { auth } from './firebase.js';
import { friendlyError, showMessage } from './auth.js';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';

// go back to the page the user was trying to open or exercises by default
const next = new URLSearchParams(window.location.search).get('next');
const AFTER_LOGIN_PAGE = next && !next.includes('/') && !next.includes(':') ? next : 'exercises.html';

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginMessage = document.getElementById('login-message');
const signupMessage = document.getElementById('signup-message');
const title = document.getElementById('auth-title');
const intro = document.getElementById('auth-intro');
const switchText = document.getElementById('switch-text');
const switchButton = document.getElementById('switch-button');

let showingSignup = false;

// skip this page if already logged in
onAuthStateChanged(auth, user => {
    if (user) {
        window.location.href = AFTER_LOGIN_PAGE;
    }
});

/* --------------------- TOGGLE --------------------- */

// switches between login and signup forms
function toggleForms() {
    showingSignup = !showingSignup;
    loginForm.classList.toggle('is-hidden', showingSignup);
    signupForm.classList.toggle('is-hidden', !showingSignup);
    showMessage(loginMessage, '');
    showMessage(signupMessage, '');

    if (showingSignup) {
        title.textContent = 'Sign Up';
        intro.textContent = 'Create an account to access the whole site.';
        switchText.textContent = 'Already have an account?';
        switchButton.textContent = 'Log in';
        document.getElementById('signup-email').focus();
    } else {
        title.textContent = 'Log In';
        intro.textContent = 'Log in to access the whole site.';
        switchText.textContent = "Don't have an account?";
        switchButton.textContent = 'Sign up';
        document.getElementById('login-email').focus();
    }
}

switchButton.addEventListener('click', toggleForms);

/* --------------------- SUBMIT --------------------- */

// disables a form's button while working
function setWorking(form, working) {
    form.querySelector('button[type="submit"]').disabled = working;
}

loginForm.addEventListener('submit', async event => {
    event.preventDefault(); // stops the form from reloading the page
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showMessage(loginMessage, 'Please enter your email and password.', 'error');
        return;
    }

    setWorking(loginForm, true);
    showMessage(loginMessage, 'Logging in...');
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage(loginMessage, 'Logged in successfully!', 'success');
    } catch (error) {
        showMessage(loginMessage, friendlyError(error), 'error');
        setWorking(loginForm, false);
    }
});

signupForm.addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;

    if (!email || !password) {
        showMessage(signupMessage, 'Please enter your email and password.', 'error');
        return;
    }

    if (password !== confirm) {
        showMessage(signupMessage, 'Passwords do not match.', 'error');
        return;
    }

    setWorking(signupForm, true);
    showMessage(signupMessage, 'Creating account...');
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        showMessage(signupMessage, 'Account created!', 'success');
    } catch (error) {
        showMessage(signupMessage, friendlyError(error), 'error');
        setWorking(signupForm, false);
    }
});