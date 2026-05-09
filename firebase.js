import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  getDocs, query, orderBy,
  doc, getDoc, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDb1iAIisFsR6hAXbRv6-QTMMpduO3elaM",
  authDomain: "mynew-c4ade.firebaseapp.com",
  projectId: "mynew-c4ade",
  storageBucket: "mynew-c4ade.firebasestorage.app",
  messagingSenderId: "310727422913",
  appId: "1:310727422913:web:233cd495157f4fb7cbb540",
  measurementId: "G-PNWJNDX9YN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export {
  db, collection, addDoc, serverTimestamp,
  getDocs, query, orderBy,
  doc, getDoc, setDoc, deleteDoc,
  auth, provider, signInWithPopup, signOut, onAuthStateChanged
};
