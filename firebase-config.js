
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import { getAuth } from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import { getFirestore } from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { getAnalytics } from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDBUvtJEzeo1jMUoxCdpq5l2mKv_00Ny84",
  authDomain: "hishab-ddd87.firebaseapp.com",
  projectId: "hishab-ddd87",
  storageBucket: "hishab-ddd87.firebasestorage.app",
  messagingSenderId: "997175405326",
  appId: "1:997175405326:web:d488bb35d2f20e9a79055f",
  measurementId: "G-XNCJ00QM88"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

getAnalytics(app);
