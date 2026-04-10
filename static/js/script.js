// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDNNOVjdJ58vWoCaq9oKOykf0FTVgKerQ4",
  authDomain: "clicktothetop.firebaseapp.com",
  projectId: "clicktothetop",
  storageBucket: "clicktothetop.firebasestorage.app",
  messagingSenderId: "656511885543",
  appId: "1:656511885543:web:e1ae0ac9a0eacc96204242",
  measurementId: "G-48VR5J7658"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);