import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { writeBatch, doc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const loginForm = document.getElementById('login-form');
const seedBtn = document.getElementById('seed-btn');
const status = document.getElementById('status');

// log in first, since the rules only allow writes from signed-in users
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = 'Logging in...';
    try {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        await signInWithEmailAndPassword(auth, email, password);
        status.textContent = 'Logged in. You can upload now.';
        seedBtn.disabled = false;
    } catch (error) {
        status.textContent = 'Login failed: ' + error.message;
    }
});

// read the local JSON and write each group as its own document
seedBtn.addEventListener('click', async () => {
    seedBtn.disabled = true;
    status.textContent = 'Uploading...';
    try {
        const response = await fetch('assets/exercises.json');
        const data = await response.json();

        // one batch = all-or-nothing write
        const batch = writeBatch(db);
        data.groups.forEach((group, index) => {
            // keep the original order, since Firestore doesn't preserve it
            batch.set(doc(db, 'groups', group.id), { ...group, order: index });
        });
        await batch.commit();

        status.textContent = `Done! Uploaded ${data.groups.length} groups.`;
    } catch (error) {
        status.textContent = 'Upload failed: ' + error.message;
        seedBtn.disabled = false;
    }
});
