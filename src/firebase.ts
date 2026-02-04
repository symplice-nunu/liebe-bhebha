// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCB3KtcxO0TU32GfxF5Yp9YbjX0Qt5DOYw",
  authDomain: "liebe-bhebha.firebaseapp.com",
  projectId: "liebe-bhebha",
  storageBucket: "liebe-bhebha.firebasestorage.app",
  messagingSenderId: "874028434817",
  appId: "1:874028434817:web:1aecf98f674235b9419480"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);