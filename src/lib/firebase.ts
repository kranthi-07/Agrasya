import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore, Firestore } from "firebase/firestore";
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
let app: FirebaseApp;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Use initializeFirestore with auto-detect long polling to bypass local network/VPN websocket issues
  db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
} else {
  app = getApp();
  db = getFirestore(app);
}

const auth = getAuth(app);

export { app, db, auth };
