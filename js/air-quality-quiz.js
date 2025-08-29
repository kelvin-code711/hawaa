
// Firebase 9 (modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Config
const firebaseConfig = {
  apiKey: "AIzaSyB4D531Uj4SGql8pkaXPKZvdHa5XFby2LU",
  authDomain: "hawaa-df1cc.firebaseapp.com",
  projectId: "hawaa-df1cc",
  storageBucket: "hawaa-df1cc.firebasestorage.app",
  messagingSenderId: "547302517440",
  appId: "1:547302517440:web:9ef37f89e74cac785f9b25"
};

// Init
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
console.log("✅ Firebase & Firestore initialized");

// Helper to save
async function saveQuizToFirestore() {
  try {
    const email = (document.getElementById("quizEmailInput")?.value || "").trim();

    // Use quiz globals exposed by your script
    const getQuizAnswers = window.getQuizAnswers || (() => ({}));
    const calculateQuizScore = window.calculateQuizScore || (() => 0);

    const answers = getQuizAnswers();
    const score   = calculateQuizScore();

    const docRef = await addDoc(collection(db, "hawaaQuiz"), {
      email,
      answers,
      score,
      submittedAt: serverTimestamp()
    });

    console.log("✅ Saved to Firestore:", docRef.id);
  } catch (err) {
    console.error("❌ Firestore write failed:", err);
  }
}

// Observe when results appear
function attachResultsObserver() {
  const resultsEl = document.getElementById("quizResults");
  if (!resultsEl) {
    console.warn("⚠️ #quizResults not found yet. Retrying in 300ms…");
    setTimeout(attachResultsObserver, 300);
    return;
  }

  // If already visible (edge case), save once.
  if (resultsEl.classList.contains("active")) {
    saveQuizToFirestore();
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "attributes" && m.attributeName === "class") {
        if (resultsEl.classList.contains("active")) {
          // Results just became visible → save
          saveQuizToFirestore();
        }
      }
    }
  });

  observer.observe(resultsEl, { attributes: true, attributeFilter: ["class"] });
  console.log("👀 Firestore observer attached to #quizResults");
}

// Wait for DOM then attach observer
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", attachResultsObserver);
} else {
  attachResultsObserver();
}
