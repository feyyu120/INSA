// Active State
let currentQuizQuestions = [], currentQuestionIndex = 0, userAnswers = [];
let favoritedQuestions = [], quizHistory = [], inProgressDrafts = [];

// DOM Element Helper
const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  loadStorageData();
  attachEvents();
  fetchQuestionsAndStartQuiz();
});

// Load LocalStorage
function loadStorageData() {
  favoritedQuestions = JSON.parse(localStorage.getItem("quiz_favs") || "[]");
  quizHistory = JSON.parse(localStorage.getItem("quiz_history") || "[]");
  inProgressDrafts = JSON.parse(localStorage.getItem("quiz_drafts") || "[]");
  updateSidebarLists();
}

// Event Listeners
function attachEvents() {
  $("btn-hamburger").onclick = openSidebar;
  $("btn-close-sidebar").onclick = closeSidebar;
  $("sidebar-overlay").onclick = closeSidebar;

  $("btn-new-quiz").onclick = () => { closeSidebarIfMobile(); fetchQuestionsAndStartQuiz(); };
  $("menu-quiz").onclick = () => { closeSidebarIfMobile(); switchView("quiz"); };
  $("menu-favorites").onclick = () => { closeSidebarIfMobile(); renderFavoritesView(); switchView("favorites"); };

  $("btn-star").onclick = toggleFavorite;
  $("btn-prev").onclick = () => { if (currentQuestionIndex > 0) { currentQuestionIndex--; renderQuestion(); } };
  $("btn-next").onclick = () => {
    if (currentQuestionIndex < currentQuizQuestions.length - 1) {
      currentQuestionIndex++;
      renderQuestion();
    } else {
      finishQuiz();
    }
  };
  $("btn-save-draft").onclick = saveDraft;
  $("btn-restart").onclick = fetchQuestionsAndStartQuiz;
}

// Sidebar & View Controls
function openSidebar() {
  $("sidebar").classList.remove("closed");
  $("sidebar").classList.add("mobile-open");
  $("sidebar-overlay").classList.add("active");
  document.body.classList.remove("sidebar-closed");
}

function closeSidebar() {
  $("sidebar").classList.add("closed");
  $("sidebar").classList.remove("mobile-open");
  $("sidebar-overlay").classList.remove("active");
  document.body.classList.add("sidebar-closed");
}

function closeSidebarIfMobile() {
  if (window.innerWidth <= 768) closeSidebar();
}

function switchView(view) {
  $("view-quiz").classList.toggle("hidden", view !== "quiz");
  $("view-results").classList.toggle("hidden", view !== "results");
  $("view-favorites").classList.toggle("hidden", view !== "favorites");
  $("menu-quiz").classList.toggle("active", view === "quiz");
  $("menu-favorites").classList.toggle("active", view === "favorites");
}

// Fetch Questions (Basic load from questions.json)
function fetchQuestionsAndStartQuiz() {
  switchView("quiz");
  fetch("questions.json")
    .then((res) => res.json())
    .then((all) => {
      const shuffled = [...all].sort(() => Math.random() - 0.5);
      currentQuizQuestions = shuffled.slice(0, 5).map((q, i) => {
        const correctText = q.options[q.answer];
        const options = [...q.options].sort(() => Math.random() - 0.5);
        return {
          id: q.id || i,
          category: q.category || "General",
          question: q.question,
          options,
          answer: options.indexOf(correctText),
          explanation: q.explanation
        };
      });
      currentQuestionIndex = 0;
      userAnswers = new Array(currentQuizQuestions.length).fill(null);
      renderQuestion();
    });
}

// Render Question
function renderQuestion() {
  if (!currentQuizQuestions.length) return;
  const q = currentQuizQuestions[currentQuestionIndex];
  const total = currentQuizQuestions.length;
  const selected = userAnswers[currentQuestionIndex];

  $("question-number").textContent = `Question ${currentQuestionIndex + 1} of ${total}`;
  if ($("question-category")) $("question-category").textContent = q.category;
  $("quiz-progress").textContent = `Q ${currentQuestionIndex + 1}/${total}`;
  $("question-title").textContent = q.question;

  const isFav = favoritedQuestions.some((item) => item.question === q.question);
  $("btn-star").classList.toggle("active", isFav);
  $("star-text").textContent = isFav ? "Favorited" : "Favorite";

  // Options
  $("options-container").innerHTML = "";
  const letters = ["A", "B", "C", "D"];
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    if (selected !== null) {
      btn.classList.add("disabled");
      if (i === q.answer) btn.classList.add("correct");
      else if (i === selected) btn.classList.add("wrong");
    }
    btn.innerHTML = `<span class="option-badge">${letters[i]}</span><span>${opt}</span>`;
    btn.onclick = () => {
      if (userAnswers[currentQuestionIndex] === null) {
        userAnswers[currentQuestionIndex] = i;
        renderQuestion();
      }
    };
    $("options-container").appendChild(btn);
  });

  // Explanation
  const alertBox = $("explanation-alert");
  if (selected !== null) {
    alertBox.classList.remove("hidden");
    const isCorrect = selected === q.answer;
    alertBox.classList.toggle("wrong-alert", !isCorrect);
    alertBox.innerHTML = `<strong>${isCorrect ? "✓ Correct!" : "✗ Incorrect!"}</strong><p>${q.explanation}</p>`;
  } else {
    alertBox.classList.add("hidden");
  }

  $("btn-prev").disabled = currentQuestionIndex === 0;
  $("btn-next").textContent = currentQuestionIndex === total - 1 ? "Finish Quiz" : "Next";
}

// Favorite Toggle
function toggleFavorite() {
  const q = currentQuizQuestions[currentQuestionIndex];
  const idx = favoritedQuestions.findIndex((item) => item.question === q.question);
  if (idx >= 0) favoritedQuestions.splice(idx, 1);
  else favoritedQuestions.push(q);

  localStorage.setItem("quiz_favs", JSON.stringify(favoritedQuestions));
  updateSidebarLists();
  renderQuestion();
}

// Finish Quiz & Results
function finishQuiz() {
  const score = userAnswers.filter((ans, i) => ans === currentQuizQuestions[i].answer).length;
  const total = currentQuizQuestions.length;
  const percent = Math.round((score / total) * 100);

  $("score-percent").textContent = `${percent}%`;
  $("results-summary").textContent = `You scored ${score} out of ${total}`;
  $("results-heading").textContent = percent >= 80 ? "🎉 Excellent Job!" : percent >= 50 ? "👍 Good Attempt!" : "📚 Keep Practicing!";

  $("review-container").innerHTML = "";
  currentQuizQuestions.forEach((q, i) => {
    const uAns = userAnswers[i];
    const isCorrect = uAns === q.answer;
    const div = document.createElement("div");
    div.className = `review-item ${isCorrect ? "correct" : "wrong"}`;
    div.innerHTML = `
      <strong>Q${i + 1}: ${q.question}</strong>
      <div>Your Answer: ${uAns !== null ? q.options[uAns] : "Skipped"} ${isCorrect ? "✓" : "✗"}</div>
      <div>Correct Answer: ${q.options[q.answer]}</div>
    `;
    $("review-container").appendChild(div);
  });

  quizHistory.unshift({ date: new Date().toLocaleDateString(), score, total, percent, questions: currentQuizQuestions, answers: userAnswers });
  localStorage.setItem("quiz_history", JSON.stringify(quizHistory));

  inProgressDrafts = [];
  localStorage.setItem("quiz_drafts", JSON.stringify(inProgressDrafts));

  updateSidebarLists();
  switchView("results");
}

// Save Draft
function saveDraft() {
  inProgressDrafts = [{ currentIndex: currentQuestionIndex, questions: currentQuizQuestions, answers: userAnswers, date: new Date().toLocaleDateString() }];
  localStorage.setItem("quiz_drafts", JSON.stringify(inProgressDrafts));
  updateSidebarLists();
  alert("Quiz saved! You can resume anytime from the left sidebar.");
}

// Delete Helpers
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
  if (currentQuizQuestions.length) renderQuestion();
}

// Sidebar Lists
function updateSidebarLists() {
  $("fav-badge").textContent = favoritedQuestions.length;

  // Drafts
  $("inprogress-list").innerHTML = inProgressDrafts.length === 0 ? `<div class="empty-text">No unfinished quiz</div>` : "";
  inProgressDrafts.forEach((draft, i) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <span>Draft (${draft.date})</span>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: var(--accent-star);">Resume</span>
        <button class="btn-delete-item" title="Delete draft">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>`;
    div.onclick = () => {
      closeSidebarIfMobile();
      currentQuizQuestions = draft.questions;
      currentQuestionIndex = draft.currentIndex;
      userAnswers = draft.answers;
      renderQuestion();
      switchView("quiz");
    };
    div.querySelector(".btn-delete-item").onclick = (e) => { e.stopPropagation(); deleteDraft(i); };
    $("inprogress-list").appendChild(div);
  });

  // History
  $("history-list").innerHTML = quizHistory.length === 0 ? `<div class="empty-text">No quiz history</div>` : "";
  quizHistory.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <span>Quiz (${item.date})</span>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: var(--accent-green); font-weight: bold;">${item.score}/${item.total} (${item.percent}%)</span>
        <button class="btn-delete-item" title="Delete history record">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>`;
    div.onclick = () => {
      closeSidebarIfMobile();
      $("score-percent").textContent = `${item.percent}%`;
      $("results-summary").textContent = `Scored ${item.score} out of ${item.total}`;
      $("results-heading").textContent = "Past Quiz Review";

      $("review-container").innerHTML = "";
      item.questions.forEach((q, j) => {
        const uAns = item.answers[j];
        const isCorrect = uAns === q.answer;
        const reviewDiv = document.createElement("div");
        reviewDiv.className = `review-item ${isCorrect ? "correct" : "wrong"}`;
        reviewDiv.innerHTML = `
          <strong>Q${j + 1}: ${q.question}</strong>
          <div>Your Answer: ${uAns !== null ? q.options[uAns] : "Skipped"} ${isCorrect ? "✓" : "✗"}</div>
          <div>Correct Answer: ${q.options[q.answer]}</div>
        `;
        $("review-container").appendChild(reviewDiv);
      });
      switchView("results");
    };
    div.querySelector(".btn-delete-item").onclick = (e) => { e.stopPropagation(); deleteHistoryItem(i); };
    $("history-list").appendChild(div);
  });
}

// Favorites View
function renderFavoritesView() {
  $("fav-container").innerHTML = favoritedQuestions.length === 0 ? `<div class="empty-text">No favorited questions yet.</div>` : "";
  favoritedQuestions.forEach((q, i) => {
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
            <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Remove
        </button>
      </div>
      <div><strong>Correct Answer:</strong> ${q.options[q.answer]}</div>
      <div style="font-size: 0.85rem; color: var(--text-muted);">${q.explanation}</div>
    `;
    card.querySelector(".btn-delete-fav").onclick = (e) => { e.stopPropagation(); deleteFavorite(i); };
    $("fav-container").appendChild(card);
  });
}
