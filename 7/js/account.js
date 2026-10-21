// Logic for account page's change password stuff
import { auth } from './firebase.js';
import { friendlyError, showMessage } from './auth.js';
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';

const passwordForm = document.getElementById('password-form');
const passwordMessage = document.getElementById('password-message');
const submitButton = passwordForm.querySelector('button[type="submit"]');

// only logged in users can see this page
onAuthStateChanged(auth, user => {
    if (user) {
        document.getElementById('account-email').textContent = user.email;
    } else {
        window.location.replace('login.html?next=' + encodeURIComponent(window.location.pathname.split('/').pop()));
    }
});

passwordForm.addEventListener('submit', async event => {
    event.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!currentPassword || !newPassword) {
        showMessage(passwordMessage, 'Please fill in every field.', 'error');
        return;
    }
    if (newPassword !== confirmPassword) {
        showMessage(passwordMessage, 'New passwords do not match.', 'error');
        return;
    }
    if (newPassword === currentPassword) {
        showMessage(passwordMessage, 'New password must be different from your current one.', 'error');
        return;
    }

    submitButton.disabled = true;
    showMessage(passwordMessage, 'Updating your password...');
    try {
        const user = auth.currentUser;
        // Firebase requires a recent login before changing password
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        passwordForm.reset();
        showMessage(passwordMessage, 'Password changed successfully!', 'success');
    } catch (error) {
        showMessage(passwordMessage, friendlyError(error), 'error');
    } finally {
        submitButton.disabled = false;
    }

});