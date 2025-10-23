// Replace the placeholder values below with your Firebase project's config
// from Project Settings → Your apps → SDK setup and configuration.
export const firebaseConfig = {
  apiKey: "AIzaSyDVt6drnk3qsiL491n9p48irelYiKZi5Dc",
  authDomain: "ngo-s-2e1a8.firebaseapp.com",
  projectId: "ngo-s-2e1a8",
  storageBucket: "ngo-s-2e1a8.firebasestorage.app",
  messagingSenderId: "1053418965001",
  appId: "1:1053418965001:web:e56006f64ac244b3c550d8",
  measurementId: "G-6KLQ1EK42R"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
