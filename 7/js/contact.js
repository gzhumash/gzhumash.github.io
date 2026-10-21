// Logic for the contact page
import { auth, db } from './firebase.js';
import { showMessage } from './auth.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

const contactForm = document.getElementById('contact-form');
const contactMessage = document.getElementById('contact-message');
const submitButton = contactForm.querySelector('button[type="submit"]');
const emailInput = document.getElementById('email');

// fill in the email field automatically
onAuthStateChanged(auth, user => {
    if (user) {
        emailInput.value = user.email;
    }
});

// collects every field into one object
function readForm() {
    const goal = contactForm.querySelector('input[name="goal"]:checked');
    const focusBoxes = contactForm.querySelectorAll('input[name="focus"]:checked');

    return {
        firstName: document.getElementById('first-name').value.trim(),
        lastName: document.getElementById('last-name').value.trim(),
        email: emailInput.value,
        phone: document.getElementById('phone').value.trim(),
        experience: document.getElementById('experience').value,
        daysPerWeek: Number(document.getElementById('days').value),
        goal: goal ? goal.value : '',
        focusAreas: Array.from(focusBoxes, box => box.value),
        message: document.getElementById('message').value.trim()
    };
}

// returns an error message if any
function findMissing(data) {
    if (!data.firstName) return 'Please enter your first name.';
    if (!data.lastName) return 'Please enter your last name.';
    if (!data.experience) return 'Please choose your experience level.';
    if (!data.daysPerWeek) return 'Please choose how many days per week you can train.';
    if (!data.goal) return 'Please choose a primary goal.';
    return '';
}

contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        showMessage(contactMessage, 'Log in before submitting.', 'error');
        return;
    }

    const data = readForm();
    const missing = findMissing(data);
    if (missing) {
        showMessage(contactMessage, missing, 'error');
        return;
    }
    
    submitButton.disabled = true;
    showMessage(contactMessage, 'Submitting your information...');
    try {
        // save under users/{uid}/requests
        await addDoc(collection(db, 'users', user.uid, 'requests'), {
            ...data,
            createdAt: serverTimestamp()
        });
        contactForm.reset();
        emailInput.value = user.email; // reset clears it
        showMessage(contactMessage, "Thanks, " + data.firstName + "! I will get back to you at " + data.email + ".", 'success');
    } catch (error) {
        showMessage(contactMessage, "Couldn't send your request :( idk why", 'error');
        console.error(error);
    } finally {
        submitButton.disabled = false;
    }
});