import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCutsdGljafgrvcICQgVmjDs1PB9a_TEIU",
  authDomain: "ffc-op.firebaseapp.com",
  projectId: "ffc-op",
  storageBucket: "ffc-op.firebasestorage.app",
  messagingSenderId: "177012291316",
  appId: "1:177012291316:web:249a2690807cdb1e0d50a1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
