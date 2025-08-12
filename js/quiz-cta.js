// Quiz Modal Functionality
console.log("🚀 Quiz CTA script loading...");

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("📋 DOM loaded, initializing quiz...");
  
  // Elements - with detailed logging
  const startQuizBtn = document.getElementById('startQuizBtn');
  const quizModal = document.getElementById('airQualityQuizModal');
  const closeBtn = document.querySelector('.quiz-close');
  const navOverlay = document.querySelector('.quiz-modal-overlay');
  const progressBar = document.querySelector('.quiz-progress-bar');
  
  // Debug element selection
  console.log("🔍 Element check:", {
    startQuizBtn: !!startQuizBtn,
    quizModal: !!quizModal,
    closeBtn: !!closeBtn,
    navOverlay: !!navOverlay,
    progressBar: !!progressBar
  });
  
  if (!startQuizBtn) {
    console.error("❌ Start quiz button not found! Looking for ID: startQuizBtn");
    return;
  }
  
  if (!quizModal) {
    console.error("❌ Quiz modal not found! Looking for ID: airQualityQuizModal");
    return;
  }
  
  // Quiz state
  let currentQuestion = 1;
  const totalQuestions = 6; // 5 questions + email
  let answers = {};

  // Open modal
  function openQuizModal() {
    console.log("🎯 Opening quiz modal...");
    quizModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    resetQuiz();
  }

  // Close modal
  function closeQuizModal() {
    console.log("❌ Closing quiz modal...");
    quizModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Reset quiz to beginning
  function resetQuiz() {
    console.log("🔄 Resetting quiz...");
    currentQuestion = 1;
    answers = {};
    updateProgressBar();
    showQuestion(1);
    
    // Clear all selections
    document.querySelectorAll('.quiz-option').forEach(option => {
      option.classList.remove('selected');
    });
    
    // Reset email input
    const emailInput = document.getElementById('quizEmailInput');
    if (emailInput) emailInput.value = '';
    
    // Hide results
    const resultsEl = document.getElementById('quizResults');
    if (resultsEl) resultsEl.classList.remove('active');
    
    // Reset all next buttons to disabled
    document.querySelectorAll('.quiz-btn-primary').forEach(btn => {
      if (btn.id !== 'restartBtn') {
        btn.disabled = true;
      }
    });
  }

  // Update progress bar
  function updateProgressBar() {
    if (progressBar) {
      const progress = (currentQuestion - 1) / totalQuestions * 100;
      progressBar.style.width = `${progress}%`;
    }
  }

  // Show specific question
  function showQuestion(questionNumber) {
    console.log(`📝 Showing question ${questionNumber}`);
    
    // Hide all questions and results
    document.querySelectorAll('.quiz-question').forEach(q => {
      q.classList.remove('active');
    });
    const resultsEl = document.getElementById('quizResults');
    if (resultsEl) resultsEl.classList.remove('active');
    
    // Show target question
    const targetQuestion = document.querySelector(`[data-question="${questionNumber}"]`);
    if (targetQuestion) {
      targetQuestion.classList.add('active');
    } else {
      console.error(`❌ Question ${questionNumber} not found`);
    }
    
    updateProgressBar();
  }

  // Handle option selection
  function handleOptionSelect(option) {
    console.log("✅ Option selected:", option.dataset.value);
    
    const question = option.closest('.quiz-question');
    const questionNum = parseInt(question.dataset.question);
    const value = option.dataset.value;
    
    // Remove previous selection in this question
    question.querySelectorAll('.quiz-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    
    // Select current option
    option.classList.add('selected');
    
    // Store answer
    answers[questionNum] = value;
    
    // Enable next button
    const nextBtn = question.querySelector('.quiz-btn-primary');
    if (nextBtn) {
      nextBtn.disabled = false;
    }
    
    console.log("💾 Current answers:", answers);
  }

  // Handle email input
  function handleEmailInput() {
    const emailInput = document.getElementById('quizEmailInput');
    const nextBtn = document.getElementById('nextBtn6');
    
    if (emailInput && nextBtn) {
      const email = emailInput.value.trim();
      const isValidEmail = email.includes('@') && email.length > 5;
      nextBtn.disabled = !isValidEmail;
      console.log("📧 Email validation:", { email, isValid: isValidEmail });
    }
  }

  // Calculate air quality score
  function calculateScore() {
    const scoreMap = {
      1: { daily: 0, weekly: 1, rarely: 2 },
      2: { yes: 2, some: 1, no: 0 },
      3: { yes: 2, no: 0 },
      4: { frequently: 2, occasionally: 1, rarely: 0 },
      5: { good: 0, fair: 1, poor: 2 }
    };
    
    let totalScore = 0;
    for (let q = 1; q <= 5; q++) {
      const answer = answers[q];
      if (answer && scoreMap[q] && scoreMap[q][answer] !== undefined) {
        totalScore += scoreMap[q][answer];
      }
    }
    
    console.log("🎯 Calculated score:", totalScore, "from answers:", answers);
    return totalScore;
  }

  // Show results (will be overridden by Firebase script if present)
  function showAirQualityResults() {
    console.log("📊 Showing results...");
    
    const score = calculateScore();
    const emailInput = document.getElementById('quizEmailInput');
    const email = emailInput ? emailInput.value : '';
    
    // Hide current question
    document.querySelectorAll('.quiz-question').forEach(q => {
      q.classList.remove('active');
    });
    
    // Show results
    const resultsSection = document.getElementById('quizResults');
    const titleEl = document.getElementById('pollutionResultTitle');
    const descEl = document.getElementById('pollutionResultDescription');
    const recommendationEl = document.getElementById('quizRecommendation');
    
    if (!resultsSection) {
      console.error("❌ Results section not found!");
      return;
    }
    
    let title, description, recommendation;
    
    if (score <= 3) {
      title = "Good Air Quality Environment 🌿";
      description = "Your home has relatively clean air with minimal pollution sources.";
      recommendation = `
        <h4>Maintenance Mode Recommended</h4>
        <p>A basic air purifier for general maintenance and seasonal allergens would be perfect for your space.</p>
        <a href="/products/basic" class="quiz-btn quiz-btn-primary" style="margin-top: 16px;">View Basic Models</a>
      `;
    } else if (score <= 6) {
      title = "Moderate Air Quality Concerns 🟡";
      description = "Your home has some air quality challenges that could benefit from purification.";
      recommendation = `
        <h4>Standard Purification Recommended</h4>
        <p>A mid-range air purifier with HEPA filtration would significantly improve your indoor air quality.</p>
        <a href="/products/standard" class="quiz-btn quiz-btn-primary" style="margin-top: 16px;">View Standard Models</a>
      `;
    } else {
      title = "High Air Quality Concerns 🔴";
      description = "Your home has multiple factors contributing to poor indoor air quality.";
      recommendation = `
        <h4>Advanced Purification Recommended</h4>
        <p>A premium air purifier with advanced HEPA and carbon filtration is essential for your environment.</p>
        <a href="/products/premium" class="quiz-btn quiz-btn-primary" style="margin-top: 16px;">View Premium Models</a>
      `;
    }
    
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = description;
    if (recommendationEl) recommendationEl.innerHTML = recommendation;
    
    resultsSection.classList.add('active');
    
    // Update progress to 100%
    if (progressBar) {
      progressBar.style.width = '100%';
    }
    
    console.log('✅ Quiz Results:', { email, answers, score, title });
  }

  // Navigation functions
  function goToNextQuestion() {
    console.log(`➡️ Next: ${currentQuestion} → ${currentQuestion + 1}`);
    if (currentQuestion < totalQuestions) {
      currentQuestion++;
      showQuestion(currentQuestion);
    } else if (currentQuestion === totalQuestions) {
      showAirQualityResults();
    }
  }

  function goToPreviousQuestion() {
    console.log(`⬅️ Previous: ${currentQuestion} → ${currentQuestion - 1}`);
    if (currentQuestion > 1) {
      currentQuestion--;
      showQuestion(currentQuestion);
      
      // Re-enable next button if answer exists
      const prevAnswer = answers[currentQuestion];
      if (prevAnswer || currentQuestion === 6) {
        const currentQuestionEl = document.querySelector(`[data-question="${currentQuestion}"]`);
        const nextBtn = currentQuestionEl?.querySelector('.quiz-btn-primary');
        if (nextBtn) {
          nextBtn.disabled = false;
        }
      }
    }
  }

  // Event Listeners with detailed logging
  console.log("🎯 Setting up event listeners...");
  
  // Start quiz button
  startQuizBtn.addEventListener('click', function(e) {
    e.preventDefault();
    console.log("🔥 Start quiz button clicked!");
    openQuizModal();
  });
  console.log("✅ Start quiz listener attached");

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log("❌ Close button clicked!");
      closeQuizModal();
    });
    console.log("✅ Close button listener attached");
  }

  // Modal overlay click to close
  if (navOverlay) {
    navOverlay.addEventListener('click', function(e) {
      if (e.target === navOverlay) {
        console.log("🖱️ Overlay clicked, closing modal");
        closeQuizModal();
      }
    });
    console.log("✅ Overlay click listener attached");
  }

  // Option selection listeners
  const optionElements = document.querySelectorAll('.quiz-option');
  console.log(`🎯 Found ${optionElements.length} quiz options`);
  
  optionElements.forEach((option, index) => {
    option.addEventListener('click', function() {
      console.log(`🎯 Option ${index} clicked:`, this.dataset.value);
      handleOptionSelect(this);
    });
  });

  // Email input listener
  const emailInput = document.getElementById('quizEmailInput');
  if (emailInput) {
    emailInput.addEventListener('input', handleEmailInput);
    emailInput.addEventListener('keyup', handleEmailInput);
    console.log("✅ Email input listener attached");
  }

  // Next button listeners
  const nextButtons = document.querySelectorAll('.quiz-btn-primary');
  console.log(`🎯 Found ${nextButtons.length} next buttons`);
  
  nextButtons.forEach((btn, index) => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log(`➡️ Next button ${index} clicked, ID:`, this.id);
      
      const questionEl = this.closest('.quiz-question');
      if (questionEl) {
        const questionNum = parseInt(questionEl.dataset.question);
        console.log(`📝 In question ${questionNum}`);
        
        if (questionNum === 6) {
          // Email question - show results
          console.log("📧 Email question complete, showing results...");
          showAirQualityResults();
        } else {
          // Regular question - go to next
          goToNextQuestion();
        }
      } else if (this.id === 'restartBtn') {
        console.log("🔄 Restart button clicked");
        resetQuiz();
      }
    });
  });

  // Previous button listeners  
  const prevButtons = document.querySelectorAll('.quiz-btn-secondary');
  console.log(`🎯 Found ${prevButtons.length} previous buttons`);
  
  prevButtons.forEach((btn, index) => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log(`⬅️ Previous button ${index} clicked, ID:`, this.id);
      
      if (this.id === 'restartBtn') {
        console.log("🔄 Restart quiz");
        resetQuiz();
      } else {
        goToPreviousQuestion();
      }
    });
  });

  // Make functions globally available for Firebase integration
  window.showAirQualityResults = showAirQualityResults;
  window.getQuizAnswers = () => answers;
  window.calculateQuizScore = calculateScore;
  
  console.log("🌍 Global functions exposed for Firebase integration");

  // Escape key to close modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && quizModal?.classList.contains('active')) {
      console.log("⌨️ Escape key pressed, closing modal");
      closeQuizModal();
    }
  });

  console.log("✅ Quiz initialization complete!");
});

// Also try immediate attachment in case DOM is already loaded
if (document.readyState === 'loading') {
  console.log("📋 DOM still loading, waiting for DOMContentLoaded...");
} else {
  console.log("📋 DOM already loaded, attempting immediate initialization...");
  // Try immediate initialization as backup
  setTimeout(() => {
    const startBtn = document.getElementById('startQuizBtn');
    const modal = document.getElementById('airQualityQuizModal');
    
    if (startBtn && modal && !startBtn.onclick) {
      console.log("🔧 Backup initialization triggered");
      startBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log("🔥 Backup start quiz clicked!");
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    }
  }, 100);
}