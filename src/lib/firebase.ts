import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCx3cvAA5dWfLQfIKYzG236yUHy07_D67A",
  authDomain: "spherex-5463b.firebaseapp.com",
  projectId: "spherex-5463b",
  storageBucket: "spherex-5463b.firebasestorage.app",
  messagingSenderId: "901345022172",
  appId: "1:901345022172:web:d5a5e3c5a7914caea52419",
  measurementId: "G-QBMTMJDDNX",
  databaseURL: "https://spherex-5463b-default-rtdb.firebaseio.com"
};

// Initialize Firebase app (singleton pattern for Next.js SSR/client)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// Analytics initialization (safe for Next.js client-side execution)
let analyticsPromise: Promise<Analytics | null> = Promise.resolve(null);
if (typeof window !== "undefined") {
  analyticsPromise = isSupported().then((supported) => (supported ? getAnalytics(app) : null));
}

export { app, auth, db, rtdb, analyticsPromise, firebaseConfig };
