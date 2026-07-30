// OpenTDB API Endpoint (Category 18 = Science: Computers)
const OPENTDB_API_URL = "https://opentdb.com/api.php?amount=5&category=18&type=multiple";

// Fallback Questions Bank (used if API fails or offline)
const FALLBACK_QUESTIONS = [
  {
    id: 1,
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "High Tech Modern Language",
      "Hyperlink and Text Management Language",
      "Home Tool Markup Language"
    ],
    answer: 0,
    explanation: "HTML stands for Hyper Text Markup Language, the standard markup language for web pages."
  },
  {
    id: 2,
    question: "Which CSS property is used to change the background color of an element?",
    options: [
      "color",
      "background-color",
      "bg-color",
      "canvas-color"
    ],
    answer: 1,
    explanation: "The 'background-color' property sets the background color of an element in CSS."
  },
  {
    id: 3,
    question: "How do you declare a variable in modern JavaScript?",
    options: [
      "v myVar;",
      "let myVar;",
      "variable myVar;",
      "dim myVar;"
    ],
    answer: 1,
    explanation: "In modern JavaScript (ES6+), block-scoped variables are declared using 'let' or 'const'."
  },
  {
    id: 4,
    question: "Which of the following is used to loop through items in JavaScript?",
    options: [
      "for loop",
      "repeat loop",
      "cycle statement",
      "jump loop"
    ],
    answer: 0,
    explanation: "The 'for' loop (along with while, for...of, forEach) is used to iterate over code blocks in JavaScript."
  },
  {
    id: 5,
    question: "What is the correct file extension for JavaScript files?",
    options: [
      ".java",
      ".script",
      ".js",
      ".html"
    ],
    answer: 2,
    explanation: "JavaScript files use the '.js' extension."
  }
];

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
    closeSidebar();
    fetchQuestionsAndStartQuiz();
  });
  el.menuQuiz.addEventListener("click", () => {
    closeSidebar();
    switchView("quiz");
  });
  el.menuFavorites.addEventListener("click", () => {
    closeSidebar();
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

// Fetch 5 Questions from OpenTDB API
function fetchQuestionsAndStartQuiz() {
  switchView("quiz");
  el.loadingSpinner.classList.remove("hidden");
  el.quizCardContent.classList.add("hidden");

  fetch(OPENTDB_API_URL)
    .then((response) => response.json())
    .then((data) => {
      if (data.results && data.results.length > 0) {
        const fetched = [];
        
        // Use a JS for loop to parse API results
        for (let i = 0; i < data.results.length; i++) {
          const item = data.results[i];
          const decodedQuestion = decodeHTML(item.question);
          const decodedCorrect = decodeHTML(item.correct_answer);
          
          // Decode incorrect answers
          const decodedIncorrect = [];
          for (let j = 0; j < item.incorrect_answers.length; j++) {
            decodedIncorrect.push(decodeHTML(item.incorrect_answers[j]));
          }

          // Combine correct and incorrect choices
          const allOptions = [decodedCorrect, ...decodedIncorrect];

          // Shuffle choices using Fisher-Yates shuffle loop
          for (let k = allOptions.length - 1; k > 0; k--) {
            const randomIndex = Math.floor(Math.random() * (k + 1));
            const temp = allOptions[k];
            allOptions[k] = allOptions[randomIndex];
            allOptions[randomIndex] = temp;
          }

          // Find correct answer index in shuffled options
          let correctIdx = 0;
          for (let m = 0; m < allOptions.length; m++) {
            if (allOptions[m] === decodedCorrect) {
              correctIdx = m;
              break;
            }
          }

          fetched.push({
            id: "api_" + Date.now() + "_" + i,
            question: decodedQuestion,
            options: allOptions,
            answer: correctIdx,
            explanation: `The correct answer is "${decodedCorrect}".`
          });
        }

        currentQuizQuestions = fetched;
      } else {
        currentQuizQuestions = [...FALLBACK_QUESTIONS];
      }
      startNewQuizState();
    })
    .catch((err) => {
      console.warn("OpenTDB Fetch failed, loading fallback questions:", err);
      currentQuizQuestions = [...FALLBACK_QUESTIONS];
      startNewQuizState();
    });
}

function startNewQuizState() {
  currentQuestionIndex = 0;
  userAnswers = new Array(currentQuizQuestions.length).fill(null);
  
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
        <span style="color: var(--accent-star);">Resume</span>
      `;
      div.addEventListener("click", () => {
        closeSidebar();
        currentQuizQuestions = draft.questions;
        currentQuestionIndex = draft.currentIndex;
        userAnswers = draft.answers;
        renderQuestion();
        switchView("quiz");
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
        <span style="color: var(--accent-green); font-weight: bold;">${item.score}/${item.total} (${item.percent}%)</span>
      `;
      div.addEventListener("click", () => {
        closeSidebar();
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
        <strong>${q.question}</strong>
        <span style="color: var(--accent-star);">★ Saved</span>
      </div>
      <div><strong>Correct Answer:</strong> ${q.options[q.answer]}</div>
      <div style="font-size: 0.85rem; color: var(--text-muted);">${q.explanation}</div>
    `;
    el.favContainer.appendChild(card);
  }
}
