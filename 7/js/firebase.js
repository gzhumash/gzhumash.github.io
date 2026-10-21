// Import needed functions from SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// The web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAlSFjXmsYHx4okW8vST5zemRddQQ1rDY4",
  authDomain: "muscle-map-6fb3a.firebaseapp.com",
  databaseURL: "https://muscle-map-6fb3a-default-rtdb.firebaseio.com",
  projectId: "muscle-map-6fb3a",
  storageBucket: "muscle-map-6fb3a.firebasestorage.app",
  messagingSenderId: "134590962278",
  appId: "1:134590962278:web:bc93d71112cb74132baba7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and db to all other files
export const auth = getAuth(app);
export const db = getFirestore(app);