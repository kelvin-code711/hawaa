// Firebase 9 (compat)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Your Firebase config:
const firebaseConfig = {
  apiKey: "AIzaSyB4D531Uj4SGql8pkaXPKZvdHa5XFby2LU",
  authDomain: "hawaa-df1cc.firebaseapp.com",
  projectId: "hawaa-df1cc",
  storageBucket: "hawaa-df1cc.firebasestorage.app",
  messagingSenderId: "547302517440",
  appId: "1:547302517440:web:9ef37f89e74cac785f9b25"
};

// Initialize Firebase + Firestore once:
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("✅ Firebase & Firestore initialized");

// Override the showAirQualityResults function to include Firebase saving
const originalShowResults = window.showAirQualityResults;
window.showAirQualityResults = async function() {
  // Call the original function
  originalShowResults();
  
  // Get the email and answers
  const emailInput = document.getElementById('quizEmailInput');
  const email = emailInput.value;
  const answers = {};
  document.querySelectorAll('.quiz-option.selected').forEach(opt => {
    const q = +opt.closest('.quiz-question').dataset.question;
    answers[q] = opt.dataset.value;
  });
  
  // Calculate total score
  const scoreMap = {
    1: { daily:0, weekly:1, rarely:2 },
    2: { yes:2, some:1, no:0 },
    3: { yes:2, no:0 },
    4: { frequently:2, occasionally:1, rarely:0 },
    5: { good:0, fair:1, poor:2 }
  };
  const totalScore = Object.entries(answers).reduce((sum, [q, val]) => {
    return sum + (scoreMap[q]?.[val] || 0);
  }, 0);

  try {
    const docRef = await addDoc(collection(db, 'hawaaQuiz'), {
      email: email,
      answers: answers,
      score: totalScore,
      submittedAt: serverTimestamp()
    });
    console.log("✅ Saved to Firestore:", docRef.id);
  } catch(err) {
    console.error("❌ Firestore write failed:", err);
  }
};