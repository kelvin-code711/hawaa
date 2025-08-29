/* quiz-cta.js — robust, class-disabled, auto-advance, with email step */

console.log("🚀 Quiz CTA script loading...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("📋 DOM loaded, initializing quiz...");

  // Elements
  const startQuizBtn = document.getElementById("startQuizBtn");
  const quizModal   = document.getElementById("airQualityQuizModal");
  const closeBtn    = document.querySelector(".quiz-close");
  const navOverlay  = document.querySelector(".quiz-modal-overlay");
  const progressBar = document.querySelector(".quiz-progress-bar");

  if (!quizModal) {
    console.error("❌ Required quiz modal (#airQualityQuizModal) missing.");
    return;
  }

  // State
  let currentQuestion = 1; // 1..N
  const totalQuestions = document.querySelectorAll(".quiz-question").length; // includes email step if present
  let answers = {};

  // ---------- Helpers ----------
  function isValidEmail(str) {
    // simple but effective enough for UI gating
    return /\S+@\S+\.\S+/.test(String(str || "").trim());
  }

  // class-based disabling so buttons stay visible
  function setBtnDisabled(btn, disabled) {
    if (!btn) return;
    btn.classList.toggle("is-disabled", !!disabled);
    btn.setAttribute("aria-disabled", disabled ? "true" : "false");
  }
  function isBtnDisabled(btn) {
    return btn?.classList.contains("is-disabled");
  }

  // Normalize any native [disabled] → class .is-disabled (keeps them visible)
  function normalizeDisabledAttributes() {
    document.querySelectorAll(".quiz-btn[disabled]").forEach((btn) => {
      btn.removeAttribute("disabled");
      setBtnDisabled(btn, true);
    });
  }

  function updateProgressBar() {
    if (!progressBar) return;
    const pct = ((currentQuestion - 1) / totalQuestions) * 100;
    progressBar.style.width = `${pct}%`;
  }

  function syncQuestionUI(n) {
    const qEl = document.querySelector(`[data-question="${n}"]`);
    if (!qEl) return;

    // Prev button: disabled only on Q1
    const prevBtn = qEl.querySelector(".quiz-btn-secondary");
    setBtnDisabled(prevBtn, n === 1);

    // Primary (Next / See results) button:
    const primaryBtn = qEl.querySelector(".quiz-btn-primary");
    if (!primaryBtn) return;

    if (n >= 1 && n <= 5) {
      setBtnDisabled(primaryBtn, answers[n] == null);
    } else if (n === 6) {
      const email = document.getElementById("quizEmailInput")?.value || "";
      setBtnDisabled(primaryBtn, !isValidEmail(email));
    } else {
      // If you ever add more screens, default to enabled
      setBtnDisabled(primaryBtn, false);
    }
  }

  function showQuestion(n) {
    document.querySelectorAll(".quiz-question").forEach(q => q.classList.remove("active"));
    const qEl = document.querySelector(`[data-question="${n}"]`);
    if (qEl) {
      currentQuestion = n;                 // 🔧 keep state in sync
      qEl.classList.add("active");
      updateProgressBar();
      syncQuestionUI(n);                   // 🔧 buttons state per screen
    }
  }

  function resetQuiz() {
    currentQuestion = 1;
    answers = {};

    // clear selections
    document.querySelectorAll(".quiz-option").forEach(opt => opt.classList.remove("selected"));

    // reset all primary buttons except restart
    document.querySelectorAll(".quiz-btn-primary").forEach(btn => {
      if (btn.id !== "restartBtn") setBtnDisabled(btn, true);
    });

    // email
    const emailInput = document.getElementById("quizEmailInput");
    if (emailInput) emailInput.value = "";

    // hide results
    document.getElementById("quizResults")?.classList.remove("active");

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
    document.querySelectorAll(".quiz-question").forEach(q => q.classList.remove("active"));

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
  }

  // ---------- Navigation ----------
  function goToNextQuestion() {
    const nextIndex = currentQuestion + 1;
    if (nextIndex <= totalQuestions && document.querySelector(`[data-question="${nextIndex}"]`)) {
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
  normalizeDisabledAttributes(); // 🔧 make disabled buttons visible from your HTML

  if (startQuizBtn) {
    startQuizBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openQuizModal();
    });
  } else {
    // If modal is opened via other UI, at least prep it
    resetQuiz();
  }

  closeBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    closeQuizModal();
  });

  navOverlay?.addEventListener("click", (e) => {
    if (e.target === navOverlay) closeQuizModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && quizModal.classList.contains("active")) closeQuizModal();
  });

  // Option select → record answer, enable Next, auto-advance
  document.querySelectorAll(".quiz-option").forEach((option) => {
    option.addEventListener("click", () => {
      const qEl = option.closest(".quiz-question");
      if (!qEl) return;

      // mark selected
      qEl.querySelectorAll(".quiz-option").forEach(o => o.classList.remove("selected"));
      option.classList.add("selected");

      const qNum = parseInt(qEl.dataset.question, 10);
      answers[qNum] = option.dataset.value;

      // enable primary button for this screen
      const nextBtn = qEl.querySelector(".quiz-btn-primary");
      setBtnDisabled(nextBtn, false);

      // make sure our state matches whatever is visible, then advance
      currentQuestion = qNum;

      setTimeout(() => {
        if (currentQuestion < totalQuestions) {
          showQuestion(currentQuestion + 1);
        } else {
          showAirQualityResults();
        }
      }, 120);
    });
  });

  // Email input (Q6)
  function handleEmailEnable() {
    const emailInput = document.getElementById("quizEmailInput");
    const nextBtn    = document.getElementById("nextBtn6");
    if (!emailInput || !nextBtn) return;
    setBtnDisabled(nextBtn, !isValidEmail(emailInput.value));
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
      if (isBtnDisabled(btn)) return; // visible but inert

      const qEl = btn.closest(".quiz-question");
      if (!qEl) {
        // If pressed from results CTA etc.
        return;
      }

      const qNum = parseInt(qEl.dataset.question, 10);
      if (qNum >= 1 && qNum <= 5 && answers[qNum] == null) return; // require answer
      if (qNum === 6) {
        const ok = isValidEmail(document.getElementById("quizEmailInput")?.value);
        if (!ok) return;
      }

      if (qNum >= totalQuestions) {
        showAirQualityResults();
      } else {
        goToNextQuestion();
      }
    });
  });

  // Previous buttons
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

  // Expose for integrations
  window.showAirQualityResults = showAirQualityResults;
  window.getQuizAnswers       = () => ({ ...answers });
  window.calculateQuizScore   = calculateScore;

  console.log("✅ Quiz initialization complete!");
});

// Fallback init if script appended late
if (document.readyState !== "loading") {
  document.dispatchEvent(new Event("DOMContentLoaded"));
}
