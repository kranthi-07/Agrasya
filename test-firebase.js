const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, deleteDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyDh4qG-EvJruBcevDUy3azc6mJOLTsAk1c",
  authDomain: "agrasya-kkr.firebaseapp.com",
  projectId: "agrasya-kkr",
  storageBucket: "agrasya-kkr.firebasestorage.app",
  messagingSenderId: "721730985497",
  appId: "1:721730985497:web:e42e874d8659c4f1051488"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function wipeUsers() {
  try {
    console.log("Fetching users...");
    const snapshot = await getDocs(collection(db, "users"));
    console.log(`Found ${snapshot.size} users to delete.`);
    
    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref);
      console.log(`Deleted user doc: ${doc.id}`);
    }
    
    console.log("Done wiping users.");
  } catch (error) {
    console.error("Error wiping users:", error);
  }
}

wipeUsers();
