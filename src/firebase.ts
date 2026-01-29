import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// ⚠️ 본인의 Firebase 키값으로 교체 필수
const firebaseConfig = {
  apiKey: "AIzaSyAzX0Y0dGrXGU87TLds_Lahw4hMe_5osxA",
  authDomain: "ssafy-coffee-e7f3f.firebaseapp.com",
  projectId: "ssafy-coffee-e7f3f",
  storageBucket: "ssafy-coffee-e7f3f.firebasestorage.app",
  messagingSenderId: "1087159545249",
  appId: "1:1087159545249:web:978cb3c17bbf06d73e2fe0",
  measurementId: "G-YYBD4Y1DWG"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);