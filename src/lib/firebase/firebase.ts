// src/lib/firebase/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBVj-sJBiFB3UWBRNAe44TC65fYZP3WwXg",
  authDomain: "videre-saas-26178.firebaseapp.com",
  projectId: "videre-saas-26178",
  storageBucket: "videre-saas-26178.appspot.com",
  messagingSenderId: "735837200367",
  appId: "1:735837200367:web:66a0389f3c00dc4a5d201a",
  measurementId: "G-NRG2QF54HW"
};


// Inicializar Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);


export { app, auth, firestore, storage };
