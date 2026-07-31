// Local Questions JSON File
const LOCAL_QUESTIONS_URL = "questions.json";

// Active State
let currentQuizQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let favoritedQuestions = [];
let quizHistory = [];
let inProgressDrafts = [];

// DOM Elements
let el = {};

document.addEventListener("DOMContentLoaded", () => {
  // Bind DOM Elements
  el = {
    sidebar: document.getElementById("sidebar"),
    btnCloseSidebar: document.getElementById("btn-close-sidebar"),
    btnHamburger: document.getElementById("btn-hamburger"),
    sidebarOverlay: document.getElementById("sidebar-overlay"),
    btnNewQuiz: document.getElementById("btn-new-quiz"),
    menuQuiz: document.getElementById("menu-quiz"),
    menuFavorites: document.getElementById("menu-favorites"),
    favBadge: document.getElementById("fav-badge"),
    inprogressList: document.getElementById("inprogress-list"),
    historyList: document.getElementById("history-list"),

    viewQuiz: document.getElementById("view-quiz"),
    viewResults: document.getElementById("view-results"),
    viewFavorites: document.getElementById("view-favorites"),

    loadingSpinner: document.getElementById("loading-spinner"),
    quizCardContent: document.getElementById("quiz-card-content"),
    quizProgress: document.getElementById("quiz-progress"),
    questionNumber: document.getElementById("question-number"),
    questionCategory: document.getElementById("question-category"),
    btnStar: document.getElementById("btn-star"),
    starText: document.getElementById("star-text"),
    questionTitle: document.getElementById("question-title"),
    optionsContainer: document.getElementById("options-container"),
    explanationAlert: document.getElementById("explanation-alert"),
    explanationText: document.getElementById("explanation-text"),

    btnPrev: document.getElementById("btn-prev"),
    btnSaveDraft: document.getElementById("btn-save-draft"),
    btnNext: document.getElementById("btn-next"),

    scoreCircle: document.getElementById("score-circle"),
    scorePercent: document.getElementById("score-percent"),
    resultsHeading: document.getElementById("results-heading"),
    resultsSummary: document.getElementById("results-summary"),
    reviewContainer: document.getElementById("review-container"),
    btnRestart: document.getElementById("btn-restart"),

    favContainer: document.getElementById("fav-container")
  };

  // Load Saved Data from LocalStorage
  loadStorageData();

  // Attach Event Listeners
  attachEvents();

  // Fetch Questions & Start New Quiz
  fetchQuestionsAndStartQuiz();
});

// Load LocalStorage Data
function loadStorageData() {
  const savedFavs = localStorage.getItem("quiz_favs");
  if (savedFavs) favoritedQuestions = JSON.parse(savedFavs);

  const savedHistory = localStorage.getItem("quiz_history");
  if (savedHistory) quizHistory = JSON.parse(savedHistory);

  const savedDrafts = localStorage.getItem("quiz_drafts");
  if (savedDrafts) inProgressDrafts = JSON.parse(savedDrafts);

  updateSidebarLists();
}

// Attach Event Listeners
function attachEvents() {
  // Sidebar Toggles
  el.btnHamburger.addEventListener("click", openSidebar);
  el.btnCloseSidebar.addEventListener("click", closeSidebar);
  el.sidebarOverlay.addEventListener("click", closeSidebar);

  // Navigation Items
  el.btnNewQuiz.addEventListener("click", () => {
    closeSidebarIfMobile();
    fetchQuestionsAndStartQuiz();
  });
  el.menuQuiz.addEventListener("click", () => {
    closeSidebarIfMobile();
    switchView("quiz");
  });
  el.menuFavorites.addEventListener("click", () => {
    closeSidebarIfMobile();
    renderFavoritesView();
    switchView("favorites");
  });

  // Quiz Control Buttons
  el.btnStar.addEventListener("click", toggleFavorite);
  el.btnPrev.addEventListener("click", () => {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      renderQuestion();
    }
  });
  el.btnNext.addEventListener("click", () => {
    if (currentQuestionIndex < currentQuizQuestions.length - 1) {
      currentQuestionIndex++;
      renderQuestion();
    } else {
      finishQuiz();
    }
  });
  el.btnSaveDraft.addEventListener("click", saveDraft);
  el.btnRestart.addEventListener("click", fetchQuestionsAndStartQuiz);
}

// Sidebar Open/Close Control
function openSidebar() {
  el.sidebar.classList.remove("closed");
  el.sidebar.classList.add("mobile-open");
  el.sidebarOverlay.classList.add("active");
  document.body.classList.remove("sidebar-closed");
}

function closeSidebar() {
  el.sidebar.classList.add("closed");
  el.sidebar.classList.remove("mobile-open");
  el.sidebarOverlay.classList.remove("active");
  document.body.classList.add("sidebar-closed");
}

function closeSidebarIfMobile() {
  if (window.innerWidth <= 768) {
    closeSidebar();
  }
}

// View Switcher
function switchView(viewName) {
  el.viewQuiz.classList.add("hidden");
  el.viewResults.classList.add("hidden");
  el.viewFavorites.classList.add("hidden");

  el.menuQuiz.classList.remove("active");
  el.menuFavorites.classList.remove("active");

  if (viewName === "quiz") {
    el.viewQuiz.classList.remove("hidden");
    el.menuQuiz.classList.add("active");
  } else if (viewName === "results") {
    el.viewResults.classList.remove("hidden");
  } else if (viewName === "favorites") {
    el.viewFavorites.classList.remove("hidden");
    el.menuFavorites.classList.add("active");
  }
}

// Helper: Decode HTML Entities returned by OpenTDB API
function decodeHTML(htmlStr) {
  const txt = document.createElement("textarea");
  txt.innerHTML = htmlStr;
  return txt.value;
}

// Fetch 5 Questions from local questions.json file
function fetchQuestionsAndStartQuiz() {
  switchView("quiz");
  el.loadingSpinner.classList.remove("hidden");
  el.quizCardContent.classList.add("hidden");

  fetch(LOCAL_QUESTIONS_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
    .then((allQuestions) => {
      if (allQuestions && allQuestions.length > 0) {
        // Clone and shuffle all questions from questions.json
        const pool = [...allQuestions];
        for (let i = pool.length - 1; i > 0; i--) {
          const r = Math.floor(Math.random() * (i + 1));
          const temp = pool[i];
          pool[i] = pool[r];
          pool[r] = temp;
        }

        // Select 5 random questions for this quiz session
        const selected = pool.slice(0, 5);

        // Format selected questions and shuffle options
        const quizList = [];
        for (let i = 0; i < selected.length; i++) {
          const item = selected[i];
          const originalCorrect = item.options[item.answer];

          // Copy options and shuffle them
          const optionsCopy = [...item.options];
          for (let k = optionsCopy.length - 1; k > 0; k--) {
            const r = Math.floor(Math.random() * (k + 1));
            const temp = optionsCopy[k];
            optionsCopy[k] = optionsCopy[r];
            optionsCopy[r] = temp;
          }

          // Find new index of correct answer
          let newCorrectIdx = 0;
          for (let m = 0; m < optionsCopy.length; m++) {
            if (optionsCopy[m] === originalCorrect) {
              newCorrectIdx = m;
              break;
            }
          }

          quizList.push({
            id: item.id || ("q_" + Date.now() + "_" + i),
            category: item.category || "General",
            question: item.question,
            options: optionsCopy,
            answer: newCorrectIdx,
            explanation: item.explanation
          });
        }

        currentQuizQuestions = quizList;
        startNewQuizState();
      } else {
        showFetchError("No questions found in questions.json.");
      }
    })
    .catch((err) => {
      console.error("Local questions.json load failed:", err);
      showFetchError("Unable to load questions.json. Please check if the file is present.");
    });
}

function showFetchError(message) {
  el.loadingSpinner.classList.add("hidden");
  el.quizCardContent.classList.remove("hidden");
  el.questionNumber.textContent = "Error Loading Questions";
  el.quizProgress.textContent = "";
  el.questionTitle.textContent = message;
  el.optionsContainer.innerHTML = `
    <button class="btn btn-primary" id="btn-retry-fetch" style="margin-top: 1rem;">Retry Fetching Questions</button>
  `;
  const retryBtn = document.getElementById("btn-retry-fetch");
  if (retryBtn) {
    retryBtn.addEventListener("click", fetchQuestionsAndStartQuiz);
  }
  el.explanationAlert.classList.add("hidden");
  el.btnPrev.disabled = true;
  el.btnNext.disabled = true;
  el.btnSaveDraft.disabled = true;
}

function startNewQuizState() {
  currentQuestionIndex = 0;
  userAnswers = new Array(currentQuizQuestions.length).fill(null);

  el.btnPrev.disabled = false;
  el.btnNext.disabled = false;
  el.btnSaveDraft.disabled = false;
  el.loadingSpinner.classList.add("hidden");
  el.quizCardContent.classList.remove("hidden");
  renderQuestion();
}

// Render Current Question
function renderQuestion() {
  if (currentQuizQuestions.length === 0) return;

  const q = currentQuizQuestions[currentQuestionIndex];
  const total = currentQuizQuestions.length;

  el.questionNumber.textContent = `Question ${currentQuestionIndex + 1} of ${total}`;
  if (el.questionCategory) {
    el.questionCategory.textContent = q.category || "General";
  }
  el.quizProgress.textContent = `Q ${currentQuestionIndex + 1}/${total}`;
  el.questionTitle.textContent = q.question;

  // Favorite Star State Check using loop
  let isFav = false;
  for (let i = 0; i < favoritedQuestions.length; i++) {
    if (favoritedQuestions[i].question === q.question) {
      isFav = true;
      break;
    }
  }

  if (isFav) {
    el.btnStar.classList.add("active");
    el.starText.textContent = "Favorited";
  } else {
    el.btnStar.classList.remove("active");
    el.starText.textContent = "Favorite";
  }

  // Render Options with Red/Green Feedback
  el.optionsContainer.innerHTML = "";
  const letters = ["A", "B", "C", "D"];
  const selectedIndex = userAnswers[currentQuestionIndex];

  for (let i = 0; i < q.options.length; i++) {
    const btn = document.createElement("button");
    btn.className = "option-btn";

    // If an answer has already been selected for this question
    if (selectedIndex !== null) {
      btn.classList.add("disabled");

      // Red bubble on wrong option, Green bubble on correct option
      if (i === selectedIndex && selectedIndex === q.answer) {
        btn.classList.add("correct");
      } else if (i === selectedIndex && selectedIndex !== q.answer) {
        btn.classList.add("wrong");
      } else if (i === q.answer) {
        btn.classList.add("correct");
      }
    }

    btn.innerHTML = `
      <span class="option-badge">${letters[i]}</span>
      <span>${q.options[i]}</span>
    `;

    btn.addEventListener("click", () => {
      if (userAnswers[currentQuestionIndex] !== null) return; // Prevent multiple clicks

      userAnswers[currentQuestionIndex] = i;
      renderQuestion();
    });

    el.optionsContainer.appendChild(btn);
  }

  // Explanation Alert Feedback
  if (selectedIndex !== null) {
    el.explanationAlert.classList.remove("hidden");
    if (selectedIndex === q.answer) {
      el.explanationAlert.classList.remove("wrong-alert");
      el.explanationAlert.innerHTML = `<strong>✓ Correct!</strong> <p>${q.explanation}</p>`;
    } else {
      el.explanationAlert.classList.add("wrong-alert");
      el.explanationAlert.innerHTML = `<strong>✗ Incorrect!</strong> <p>${q.explanation}</p>`;
    }
  } else {
    el.explanationAlert.classList.add("hidden");
  }

  // Navigation Buttons
  el.btnPrev.disabled = currentQuestionIndex === 0;
  if (currentQuestionIndex === total - 1) {
    el.btnNext.textContent = "Finish Quiz";
  } else {
    el.btnNext.textContent = "Next";
  }
}

// Favorite Toggle
function toggleFavorite() {
  const currentQ = currentQuizQuestions[currentQuestionIndex];
  let foundIndex = -1;

  for (let i = 0; i < favoritedQuestions.length; i++) {
    if (favoritedQuestions[i].question === currentQ.question) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex >= 0) {
    favoritedQuestions.splice(foundIndex, 1);
  } else {
    favoritedQuestions.push(currentQ);
  }

  localStorage.setItem("quiz_favs", JSON.stringify(favoritedQuestions));
  updateSidebarLists();
  renderQuestion();
}

// Finish Quiz & Show Results
function finishQuiz() {
  let score = 0;
  for (let i = 0; i < currentQuizQuestions.length; i++) {
    if (userAnswers[i] === currentQuizQuestions[i].answer) {
      score++;
    }
  }

  const percent = Math.round((score / currentQuizQuestions.length) * 100);

  el.scorePercent.textContent = `${percent}%`;
  el.resultsSummary.textContent = `You scored ${score} out of ${currentQuizQuestions.length}`;

  if (percent >= 80) {
    el.resultsHeading.textContent = "🎉 Excellent Job!";
  } else if (percent >= 50) {
    el.resultsHeading.textContent = "👍 Good Attempt!";
  } else {
    el.resultsHeading.textContent = "📚 Keep Practicing!";
  }

  // Build Detailed Review using loop
  el.reviewContainer.innerHTML = "";
  for (let i = 0; i < currentQuizQuestions.length; i++) {
    const q = currentQuizQuestions[i];
    const uAns = userAnswers[i];
    const isCorrect = uAns === q.answer;

    const div = document.createElement("div");
    div.className = `review-item ${isCorrect ? 'correct' : 'wrong'}`;
    div.innerHTML = `
      <strong>Q${i + 1}: ${q.question}</strong>
      <div>Your Answer: ${uAns !== null ? q.options[uAns] : 'Skipped'} ${isCorrect ? '✓' : '✗'}</div>
      <div>Correct Answer: ${q.options[q.answer]}</div>
    `;
    el.reviewContainer.appendChild(div);
  }

  // Save to History
  const historyRecord = {
    date: new Date().toLocaleDateString(),
    score: score,
    total: currentQuizQuestions.length,
    percent: percent,
    questions: currentQuizQuestions,
    answers: userAnswers
  };

  quizHistory.unshift(historyRecord);
  localStorage.setItem("quiz_history", JSON.stringify(quizHistory));

  // Clear in-progress draft
  inProgressDrafts = [];
  localStorage.setItem("quiz_drafts", JSON.stringify(inProgressDrafts));

  updateSidebarLists();
  switchView("results");
}

// Save In Progress Draft
function saveDraft() {
  const draft = {
    currentIndex: currentQuestionIndex,
    questions: currentQuizQuestions,
    answers: userAnswers,
    date: new Date().toLocaleDateString()
  };

  inProgressDrafts = [draft];
  localStorage.setItem("quiz_drafts", JSON.stringify(inProgressDrafts));

  updateSidebarLists();
  alert("Quiz saved! You can resume anytime from the left sidebar.");
}

// Delete item helper functions
function deleteDraft(index) {
  inProgressDrafts.splice(index, 1);
  localStorage.setItem("quiz_drafts", JSON.stringify(inProgressDrafts));
  updateSidebarLists();
}

function deleteHistoryItem(index) {
  quizHistory.splice(index, 1);
  localStorage.setItem("quiz_history", JSON.stringify(quizHistory));
  updateSidebarLists();
}

function deleteFavorite(index) {
  favoritedQuestions.splice(index, 1);
  localStorage.setItem("quiz_favs", JSON.stringify(favoritedQuestions));
  updateSidebarLists();
  renderFavoritesView();
  if (currentQuizQuestions.length > 0 && currentQuestionIndex < currentQuizQuestions.length) {
    renderQuestion();
  }
}

// Update Sidebar Lists
function updateSidebarLists() {
  el.favBadge.textContent = favoritedQuestions.length;

  // In Progress Drafts
  el.inprogressList.innerHTML = "";
  if (inProgressDrafts.length === 0) {
    el.inprogressList.innerHTML = `<div class="empty-text">No unfinished quiz</div>`;
  } else {
    for (let i = 0; i < inProgressDrafts.length; i++) {
      const draft = inProgressDrafts[i];
      const div = document.createElement("div");
      div.className = "history-item";
      div.innerHTML = `
        <span>Draft (${draft.date})</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--accent-star);">Resume</span>
          <button class="btn-delete-item" title="Delete draft">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
      div.addEventListener("click", () => {
        closeSidebarIfMobile();
        currentQuizQuestions = draft.questions;
        currentQuestionIndex = draft.currentIndex;
        userAnswers = draft.answers;
        renderQuestion();
        switchView("quiz");
      });

      const delBtn = div.querySelector(".btn-delete-item");
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteDraft(i);
      });

      el.inprogressList.appendChild(div);
    }
  }

  // History List
  el.historyList.innerHTML = "";
  if (quizHistory.length === 0) {
    el.historyList.innerHTML = `<div class="empty-text">No quiz history</div>`;
  } else {
    for (let i = 0; i < quizHistory.length; i++) {
      const item = quizHistory[i];
      const div = document.createElement("div");
      div.className = "history-item";
      div.innerHTML = `
        <span>Quiz (${item.date})</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--accent-green); font-weight: bold;">${item.score}/${item.total} (${item.percent}%)</span>
          <button class="btn-delete-item" title="Delete history record">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
      div.addEventListener("click", () => {
        closeSidebarIfMobile();
        el.scorePercent.textContent = `${item.percent}%`;
        el.resultsSummary.textContent = `Scored ${item.score} out of ${item.total}`;
        el.resultsHeading.textContent = "Past Quiz Review";

        // Build review container for history item
        el.reviewContainer.innerHTML = "";
        for (let j = 0; j < item.questions.length; j++) {
          const q = item.questions[j];
          const uAns = item.answers[j];
          const isCorrect = uAns === q.answer;

          const reviewDiv = document.createElement("div");
          reviewDiv.className = `review-item ${isCorrect ? 'correct' : 'wrong'}`;
          reviewDiv.innerHTML = `
            <strong>Q${j + 1}: ${q.question}</strong>
            <div>Your Answer: ${uAns !== null ? q.options[uAns] : 'Skipped'} ${isCorrect ? '✓' : '✗'}</div>
            <div>Correct Answer: ${q.options[q.answer]}</div>
          `;
          el.reviewContainer.appendChild(reviewDiv);
        }

        switchView("results");
      });

      const delBtn = div.querySelector(".btn-delete-item");
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteHistoryItem(i);
      });

      el.historyList.appendChild(div);
    }
  }
}

// Render Favorites View
function renderFavoritesView() {
  el.favContainer.innerHTML = "";
  if (favoritedQuestions.length === 0) {
    el.favContainer.innerHTML = `<div class="empty-text">No favorited questions yet.</div>`;
    return;
  }

  for (let i = 0; i < favoritedQuestions.length; i++) {
    const q = favoritedQuestions[i];
    const card = document.createElement("div");
    card.className = "fav-card";
    card.innerHTML = `
      <div class="fav-card-top">
        <div style="display: flex; align-items: center; gap: 10px;">
          <strong>${q.question}</strong>
          <span class="category-badge">${q.category || "General"}</span>
        </div>
        <button class="btn-delete-fav" title="Remove from Favorites">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Remove
        </button>
      </div>
      <div><strong>Correct Answer:</strong> ${q.options[q.answer]}</div>
      <div style="font-size: 0.85rem; color: var(--text-muted);">${q.explanation}</div>
    `;

    const delBtn = card.querySelector(".btn-delete-fav");
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteFavorite(i);
    });

    el.favContainer.appendChild(card);
  }
}
