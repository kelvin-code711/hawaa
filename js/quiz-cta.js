/* quiz-cta.js — fully updated, single-script version (no external deps) */

console.log("🚀 Quiz CTA script loading...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("📋 DOM loaded, initializing quiz...");

  // Elements
  const startQuizBtn = document.getElementById("startQuizBtn");
  const quizModal = document.getElementById("airQualityQuizModal");
  const closeBtn = document.querySelector(".quiz-close");
  const navOverlay = document.querySelector(".quiz-modal-overlay");
  const progressBar = document.querySelector(".quiz-progress-bar");

  if (!startQuizBtn || !quizModal) {
    console.error("❌ Required quiz elements missing.", {
      startQuizBtn: !!startQuizBtn,
      quizModal: !!quizModal,
    });
    return;
  }

  // State
  let currentQuestion = 1;     // 1..6 (Q1-5 + Email)
  const totalQuestions = 6;
  let answers = {};

  // Core helpers
  function updateProgressBar() {
    if (!progressBar) return;
    const pct = ((currentQuestion - 1) / totalQuestions) * 100;
    progressBar.style.width = `${pct}%`;
  }

  function showQuestion(n) {
    document.querySelectorAll(".quiz-question").forEach(q => q.classList.remove("active"));
    const qEl = document.querySelector(`[data-question="${n}"]`);
    qEl && qEl.classList.add("active");
    updateProgressBar();
  }

  function resetQuiz() {
    currentQuestion = 1;
    answers = {};

    // clear selections
    document.querySelectorAll(".quiz-option").forEach(opt => opt.classList.remove("selected"));

    // reset buttons (keep restartBtn usable)
    document.querySelectorAll(".quiz-btn-primary").forEach(btn => {
      if (btn.id !== "restartBtn") btn.disabled = true;
    });

    // clear email
    const emailInput = document.getElementById("quizEmailInput");
    if (emailInput) emailInput.value = "";

    // hide results
    const resultsEl = document.getElementById("quizResults");
    resultsEl && resultsEl.classList.remove("active");

    showQuestion(1);
  }

  function openQuizModal() {
    quizModal.classList.add("active");
    document.body.style.overflow = "hidden";
    resetQuiz();
  }

  function closeQuizModal() {
    quizModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  // Scoring
  function calculateScore() {
    const scoreMap = {
      1: { daily: 0, weekly: 1, rarely: 2 },
      2: { yes: 2, some: 1, no: 0 },
      3: { yes: 2, no: 0 },
      4: { frequently: 2, occasionally: 1, rarely: 0 },
      5: { good: 0, fair: 1, poor: 2 },
    };
    let total = 0;
    for (let q = 1; q <= 5; q++) {
      const a = answers[q];
      if (a != null && scoreMap[q] && scoreMap[q][a] != null) total += scoreMap[q][a];
    }
    return total;
  }

  function showAirQualityResults() {
    const score = calculateScore();

    // hide questions
    document.querySelectorAll(".quiz-question").forEach(q => q.classList.remove("active"));

    // fill results
    const resultsSection = document.getElementById("quizResults");
    const titleEl = document.getElementById("pollutionResultTitle");
    const descEl = document.getElementById("pollutionResultDescription");
    const recommendationEl = document.getElementById("quizRecommendation");

    if (!resultsSection) {
      console.error("❌ Missing #quizResults container.");
      return;
    }

    let title, description, recommendation;
    if (score <= 3) {
      title = "Good Air Quality Environment 🌿";
      description = "Your home has relatively clean air with minimal pollution sources.";
      recommendation = `
        <h4>Maintenance Mode Recommended</h4>
        <p>A basic air purifier for general maintenance and seasonal allergens would be perfect for your space.</p>
        <a href="/products/basic" class="quiz-btn quiz-btn-primary" style="margin-top:16px;">View Basic Models</a>
      `;
    } else if (score <= 6) {
      title = "Moderate Air Quality Concerns 🟡";
      description = "Your home has some air quality challenges that could benefit from purification.";
      recommendation = `
        <h4>Standard Purification Recommended</h4>
        <p>A mid-range air purifier with HEPA filtration would significantly improve your indoor air quality.</p>
        <a href="/products/standard" class="quiz-btn quiz-btn-primary" style="margin-top:16px;">View Standard Models</a>
      `;
    } else {
      title = "High Air Quality Concerns 🔴";
      description = "Your home has multiple factors contributing to poor indoor air quality.";
      recommendation = `
        <h4>Advanced Purification Recommended</h4>
        <p>A premium air purifier with advanced HEPA and carbon filtration is essential for your environment.</p>
        <a href="/products/premium" class="quiz-btn quiz-btn-primary" style="margin-top:16px;">View Premium Models</a>
      `;
    }

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = description;
    if (recommendationEl) recommendationEl.innerHTML = recommendation;

    resultsSection.classList.add("active");
    progressBar && (progressBar.style.width = "100%");
  }

  // Navigation
  function goToNextQuestion() {
    if (currentQuestion < totalQuestions) {
      currentQuestion++;
      showQuestion(currentQuestion);
    } else {
      showAirQualityResults();
    }
  }

  function goToPreviousQuestion() {
    if (currentQuestion > 1) {
      currentQuestion--;
      showQuestion(currentQuestion);

      // re-enable next if already answered
      const currentEl = document.querySelector(`[data-question="${currentQuestion}"]`);
      const nextBtn = currentEl?.querySelector(".quiz-btn-primary");
      if (nextBtn) {
        if (currentQuestion === 6) {
          const email = document.getElementById("quizEmailInput")?.value?.trim() || "";
          nextBtn.disabled = !(email.includes("@") && email.length > 5);
        } else {
          nextBtn.disabled = answers[currentQuestion] == null;
        }
      }
    }
  }

  // Listeners
  startQuizBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openQuizModal();
  });

  closeBtn && closeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    closeQuizModal();
  });

  navOverlay && navOverlay.addEventListener("click", (e) => {
    if (e.target === navOverlay) closeQuizModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && quizModal.classList.contains("active")) closeQuizModal();
  });

  // Options
  document.querySelectorAll(".quiz-option").forEach((option) => {
    option.addEventListener("click", () => {
      const qEl = option.closest(".quiz-question");
      if (!qEl) return;

      // select/deselect
      qEl.querySelectorAll(".quiz-option").forEach(o => o.classList.remove("selected"));
      option.classList.add("selected");

      const qNum = parseInt(qEl.dataset.question, 10);
      answers[qNum] = option.dataset.value;

      // enable next
      const nextBtn = qEl.querySelector(".quiz-btn-primary");
      if (nextBtn) nextBtn.disabled = false;
    });
  });

  // Email validation (Q6)
  function handleEmailEnable() {
    const emailInput = document.getElementById("quizEmailInput");
    const nextBtn = document.getElementById("nextBtn6");
    if (!emailInput || !nextBtn) return;
    const email = emailInput.value.trim();
    nextBtn.disabled = !(email.includes("@") && email.length > 5);
  }

  const emailInput = document.getElementById("quizEmailInput");
  if (emailInput) {
    emailInput.addEventListener("input", handleEmailEnable);
    emailInput.addEventListener("keyup", handleEmailEnable);
  }

  // Next buttons
  document.querySelectorAll(".quiz-btn-primary").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      if (btn.id === "restartBtn") {
        resetQuiz();
        return;
      }

      const qEl = btn.closest(".quiz-question");
      if (!qEl) return;

      const qNum = parseInt(qEl.dataset.question, 10);
      if (qNum === 6) {
        showAirQualityResults();
      } else {
        goToNextQuestion();
      }
    });
  });

  // Previous / Restart buttons
  document.querySelectorAll(".quiz-btn-secondary").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (btn.id === "restartBtn") {
        resetQuiz();
      } else {
        goToPreviousQuestion();
      }
    });
  });

  // Expose for integrations if needed
  window.showAirQualityResults = showAirQualityResults;
  window.getQuizAnswers = () => ({ ...answers });
  window.calculateQuizScore = calculateScore;

  console.log("✅ Quiz initialization complete!");
});

// Fallback init if DOM already loaded and script appended late
if (document.readyState !== "loading") {
  // trigger DOMContentLoaded handler above
  const ev = new Event("DOMContentLoaded");
  document.dispatchEvent(ev);
}
