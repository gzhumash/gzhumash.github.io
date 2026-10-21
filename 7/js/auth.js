// login / logout logic shared between all pages
import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';

const loginButton = document.querySelector('.btn-login');
const navList = document.querySelector('.main-nav ul');

// pages anyone can see without logging in
const PUBLIC_PAGES = ['index.html', 'login.html'];
function currentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
}
const isPublicPage = PUBLIC_PAGES.includes(currentPage());

// add an account link to nav
const accountItem = document.createElement('li');
accountItem.innerHTML = '<a href="account.html">Account</a>'
accountItem.classList.add('is-hidden'); // hidden until a user logs in
navList.appendChild(accountItem);

if (window.location.pathname.endsWith('account.html')) {
    const accountLink = accountItem.querySelector('a');
    accountLink.classList.add('active');
    accountLink.setAttribute('aria-current', 'page');
}

// updates the header whenever a user logs in/out
onAuthStateChanged(auth, user => {
    if (user) {
        loginButton.textContent = 'Log Out';
        accountItem.classList.remove('is-hidden');
    } else if (!isPublicPage) {
        // send user to login and redirect them afterwards
        window.location.replace('login.html?next=' + encodeURIComponent(currentPage()));
    } else {
        loginButton.textContent = 'Log In';
        accountItem.classList.add('is-hidden');
    }
});

// logs out if logged in, otherwise shows login page
loginButton.addEventListener('click', async () => {
    if (!auth.currentUser) {
        window.location.href = 'login.html';
        return;
    }

    loginButton.disabled = true;

    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch {
        loginButton.disabled = false;
    }
});

// turns Firebase error codes into user-friendly messages
export function friendlyError(error) {
    const messages = {
        'auth/invalid-credential': 'Email or password is incorrect.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/missing-password': 'Please enter your password.',
        'auth/email-already-in-use': 'An account with this email already exists. Try logging in.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/too-many-requests': 'Too many attempts. Please wait a minute and try again.',
        'auth/network-request-failed': 'Network error. Check your connection and try again.',
        'auth/requires-recent-login': 'Please log out and log back in, then try again.'
    };
    return messages[error.code] || error.message;
}

// shows a message in a form's message area
export function showMessage(element, text, type) {
    element.textContent = text;
    element.classList.remove('is-error', 'is-success');
    if (type) {
        element.classList.add('is-' + type);
    }
}