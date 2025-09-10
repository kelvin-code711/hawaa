/* quiz-cta.js — fixed-size modal, sticky nav, no auto-advance
   ✅ Robust retake: starting/retaking always shows Q1 with clean state
   ✅ Firebase untouched (no changes to your submit/storage code hooks)
*/

console.log("🚀 Quiz CTA script loading...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("📋 DOM loaded, initializing quiz...");

  // Elements
  const startQuizBtn = document.getElementById("startQuizBtn");
  const quizModal    = document.getElementById("airQualityQuizModal");
  const closeBtn     = document.querySelector(".quiz-close");
  const modalOverlay = document.querySelector(".quiz-modal-overlay");
  const progressBar  = document.querySelector(".quiz-progress-bar");
  const modalBody    = quizModal?.querySelector(".quiz-modal-body");
  
  // Navigation elements
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const resultsBtn = document.getElementById("resultsBtn");
  const restartBtn = document.getElementById("restartBtn");

  if (!quizModal) {
    console.error("❌ Required quiz modal (#airQualityQuizModal) missing.");
    return;
  }

  // State
  let currentQuestion = 1; // 1..N
  const totalQuestions = quizModal.querySelectorAll(".quiz-question").length; // includes email step
  let answers = {};

  // ---------- Helpers ----------
  const isValidEmail = (str) => /\S+@\S+\.\S+/.test(String(str || "").trim());

  const setBtnDisabled = (btn, disabled) => {
    if (!btn) return;
    btn.disabled = disabled;
    btn.classList.toggle("is-disabled", !!disabled);
    btn.setAttribute("aria-disabled", disabled ? "true" : "false");
  };

  const isBtnDisabled = (btn) => btn?.classList.contains("is-disabled");

  function updateProgressBar() {
    if (!progressBar) return;
    // progress shows completion of *previous* step
    const pct = ((currentQuestion - 1) / totalQuestions) * 100;
    progressBar.style.width = `${pct}%`;
  }

  function updateNavigation() {
    // Prev button: disabled only on Q1
    setBtnDisabled(prevBtn, currentQuestion === 1);
    
    // Next/Results buttons
    if (currentQuestion >= 1 && currentQuestion <= 5) {
      setBtnDisabled(nextBtn, answers[currentQuestion] == null);
      nextBtn.style.display = "flex";
      resultsBtn.style.display = "none";
      restartBtn.style.display = "none";
    } else if (currentQuestion === 6) {
      const email = document.getElementById("quizEmailInput")?.value || "";
      setBtnDisabled(nextBtn, !isValidEmail(email));
      nextBtn.style.display = "flex";
      resultsBtn.style.display = "none";
      restartBtn.style.display = "none";
    } else {
      // Results screen
      nextBtn.style.display = "none";
      resultsBtn.style.display = "none";
      restartBtn.style.display = "flex";
      setBtnDisabled(restartBtn, false);
    }
  }

  function showQuestion(n) {
    quizModal.querySelectorAll(".quiz-question").forEach(q => q.classList.remove("active"));
    const qEl = quizModal.querySelector(`[data-question="${n}"]`);
    if (qEl) {
      currentQuestion = n;
      qEl.classList.add("active");
      updateProgressBar();
      updateNavigation();
      // make sure the active question is visible if content is tall
      qEl.scrollIntoView({ block: "start", behavior: "instant" in window ? "instant" : "auto" });
    }
  }

  function hideResults() {
    const results = document.getElementById("quizResults");
    results?.classList.remove("active");
  }

  function clearSelections() {
    quizModal.querySelectorAll(".quiz-option.selected").forEach(opt => opt.classList.remove("selected"));
  }

  function clearEmail() {
    const emailInput = document.getElementById("quizEmailInput");
    if (emailInput) {
      emailInput.value = "";
    }
  }

  function resetProgress() {
    if (progressBar) progressBar.style.width = "0%";
  }

  function resetScroll() {
    if (modalBody) modalBody.scrollTop = 0;
  }

  // 🔁 Full, visual reset used by both Start and Retake
  function resetQuiz() {
    currentQuestion = 1;
    answers = {};

    hideResults();
    clearSelections();
    clearEmail();
    resetProgress();
    showQuestion(1);
    resetScroll();

    console.log("🔄 Quiz reset to a fresh state.");
  }

  function openQuizModal() {
    quizModal.classList.add("active");
    document.body.style.overflow = "hidden";
    resetQuiz(); // always start fresh on open
  }

  function closeQuizModal() {
    quizModal.classList.remove("active");
    document.body.style.overflow = "";
    // optional: also reset when closing so next open is clean
    resetQuiz();
  }

  // ---------- Scoring & Results ----------
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
      if (a != null && scoreMap[q]?.[a] != null) total += scoreMap[q][a];
    }
    return total;
  }

  function showAirQualityResults() {
    // hide questions
    quizModal.querySelectorAll(".quiz-question").forEach(q => q.classList.remove("active"));

    // fill results
    const resultsSection   = document.getElementById("quizResults");
    const titleEl          = document.getElementById("pollutionResultTitle");
    const descEl           = document.getElementById("pollutionResultDescription");
    const recommendationEl = document.getElementById("quizRecommendation");

    if (!resultsSection) {
      console.error("❌ Missing #quizResults container.");
      return;
    }

    const score = calculateScore();
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
    if (progressBar) progressBar.style.width = "100%";
    
    // Update navigation for results screen
    nextBtn.style.display = "none";
    resultsBtn.style.display = "none";
    restartBtn.style.display = "flex";
    setBtnDisabled(restartBtn, false);
    
    // Firebase integration - call your existing Firebase function here
    if (typeof submitQuizResults === 'function') {
      const email = document.getElementById("quizEmailInput")?.value || "";
      submitQuizResults(answers, email, score, title, recommendation);
    }
  }

  // ---------- Navigation ----------
  function goToNextQuestion() {
    const nextIndex = currentQuestion + 1;
    if (nextIndex <= totalQuestions && quizModal.querySelector(`[data-question="${nextIndex}"]`)) {
      showQuestion(nextIndex);
    } else {
      showAirQualityResults();
    }
  }

  function goToPreviousQuestion() {
    if (currentQuestion > 1) {
      showQuestion(currentQuestion - 1);
    }
  }

  // ---------- Event bindings ----------

  // Open / Close
  startQuizBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    openQuizModal();
  });

  closeBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    closeQuizModal();
  });

  modalOverlay?.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeQuizModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && quizModal.classList.contains("active")) closeQuizModal();
  });

  // Option select → record answer, enable Next (NO auto-advance)
  quizModal.querySelectorAll(".quiz-option").forEach((option) => {
    option.addEventListener("click", () => {
      const qEl = option.closest(".quiz-question");
      if (!qEl) return;

      // mark selected
      qEl.querySelectorAll(".quiz-option").forEach(o => o.classList.remove("selected"));
      option.classList.add("selected");

      const qNum = parseInt(qEl.dataset.question, 10);
      answers[qNum] = option.dataset.value;

      // enable next button
      updateNavigation();
    });
  });

  // Email input (Q6)
  const emailInput = document.getElementById("quizEmailInput");
  function handleEmailEnable() {
    updateNavigation();
  }
  if (emailInput) {
    emailInput.addEventListener("input", handleEmailEnable);
    emailInput.addEventListener("keyup", handleEmailEnable);
  }

  // Navigation buttons
  prevBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (isBtnDisabled(prevBtn)) return;
    goToPreviousQuestion();
  });

  nextBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (isBtnDisabled(nextBtn)) return;
    goToNextQuestion();
  });

  resultsBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (isBtnDisabled(resultsBtn)) return;
    showAirQualityResults();
  });

  restartBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    resetQuiz();
  });

  // Expose for integrations (unchanged)
  window.showAirQualityResults = showAirQualityResults;
  window.getQuizAnswers       = () => ({ ...answers });
  window.calculateQuizScore   = calculateScore;

  console.log("✅ Quiz initialization complete!");
});

// Fallback init if script appended late
if (document.readyState !== "loading") {
  document.dispatchEvent(new Event("DOMContentLoaded"));
}