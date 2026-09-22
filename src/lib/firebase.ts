import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDh4qG-EvJruBcevDUy3azc6mJOLTsAk1c",
  authDomain: "agrasya-kkr.firebaseapp.com",
  projectId: "agrasya-kkr",
  storageBucket: "agrasya-kkr.firebasestorage.app",
  messagingSenderId: "721730985497",
  appId: "1:721730985497:web:e42e874d8659c4f1051488",
  measurementId: "G-Q421XG4KLP"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
