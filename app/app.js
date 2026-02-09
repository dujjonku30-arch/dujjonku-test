const state = {
  index: 0,
  answers: Array(QUESTIONS.length).fill(null)
};
const TEST_DRAFT_KEY = "duzzonTestDraft";

const questionText = document.getElementById("question-text");
const questionNumber = document.getElementById("question-number");
const answersEl = document.getElementById("answers");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const subjectiveImpactNote = document.getElementById("subjective-impact-note");

const LETTERS = ["A.", "B.", "C.", "D."];

function saveDraft() {
  try {
    sessionStorage.setItem(
      TEST_DRAFT_KEY,
      JSON.stringify({
        index: state.index,
        answers: state.answers
      })
    );
  } catch (_error) {}
}

function restoreDraft() {
  try {
    const raw = sessionStorage.getItem(TEST_DRAFT_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.answers)) return;
    state.index = Math.max(0, Math.min(QUESTIONS.length - 1, Number(parsed.index) || 0));
    state.answers = QUESTIONS.map((_, idx) => parsed.answers[idx] ?? null);
  } catch (_error) {}
}

function clearDraft() {
  try {
    sessionStorage.removeItem(TEST_DRAFT_KEY);
  } catch (_error) {}
}

function renderChoiceAnswers(question) {
  answersEl.innerHTML = "";
  question.answers.forEach((answer, i) => {
    const btn = document.createElement("button");
    btn.className = "answer-row";
    btn.type = "button";
    const letter = document.createElement("span");
    letter.className = "answer-letter";
    letter.textContent = LETTERS[i] || "";
    const text = document.createElement("span");
    text.className = "answer-textline";
    text.textContent = answer.text;
    btn.appendChild(letter);
    btn.appendChild(text);
    if (state.answers[state.index] === i) {
      btn.classList.add("selected");
    }
    btn.addEventListener("click", () => {
      state.answers[state.index] = i;
      saveDraft();
      renderQuestion();
    });
    answersEl.appendChild(btn);
  });
}

function renderTextAnswer(question) {
  answersEl.innerHTML = "";
  const card = document.createElement("div");
  card.className = "text-answer-card";

  const textarea = document.createElement("textarea");
  textarea.className = "text-answer";
  textarea.rows = 3;
  textarea.maxLength = 200;

  const counter = document.createElement("div");
  counter.className = "text-counter";
  const dict = window.getDuzzonDict ? window.getDuzzonDict(document.documentElement.lang || "ko") : null;
  const localizedQuestion = dict?.questions?.[state.index];
  if (localizedQuestion?.placeholder) {
    textarea.placeholder = localizedQuestion.placeholder;
  } else {
    textarea.placeholder = question.placeholder || dict?.placeholderDefault || "여기에 적어주세요";
  }
  textarea.value = state.answers[state.index] || "";
  textarea.addEventListener("input", (event) => {
    state.answers[state.index] = event.target.value;
    saveDraft();
    counter.textContent = `(${event.target.value.length} / 200)`;
  });
  counter.textContent = `(${textarea.value.length} / 200)`;
  card.appendChild(textarea);
  card.appendChild(counter);
  answersEl.appendChild(card);
}

function renderQuestion() {
  const qBase = QUESTIONS[state.index];
  if (!qBase) {
    questionText.textContent = "질문 데이터를 불러오지 못했습니다.";
    answersEl.innerHTML = "";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }
  const lang = document.documentElement.lang || "ko";
  const dict = window.getDuzzonDict ? window.getDuzzonDict(lang) : null;
  // 한국어는 data.js 문항을 원본으로 사용
  const qLocal = lang === "ko" ? null : dict?.questions?.[state.index];
  const q = qLocal
    ? {
        ...qBase,
        text: qLocal.text || qBase.text,
        answers:
          Array.isArray(qBase.answers)
            ? qBase.answers.map((ans, idx) => ({
                ...ans,
                text: qLocal.answers?.[idx] || ans.text
              }))
            : qBase.answers,
        placeholder: qLocal.placeholder || qBase.placeholder
      }
    : qBase;
  if (questionNumber) {
    questionNumber.textContent = `Q${q.id}.` + (q.type === "text" ? " (주관식)" : "");
  }
  questionText.textContent = q.text;

  if (q.type === "text") {
    renderTextAnswer(q);
    if (subjectiveImpactNote) subjectiveImpactNote.style.display = "block";
  } else {
    renderChoiceAnswers(q);
    if (subjectiveImpactNote) subjectiveImpactNote.style.display = "none";
  }

  if (progressText) {
    progressText.textContent = `${state.index + 1} / ${QUESTIONS.length}`;
  }
  const progress = ((state.index + 1) / QUESTIONS.length) * 100;
  progressFill.style.width = `${progress}%`;

  prevBtn.disabled = state.index === 0;
  const nextLabel = state.index === QUESTIONS.length - 1 ? dict?.viewResult || "결과 보기" : dict?.next || "다음";
  nextBtn.textContent = nextLabel;
  nextBtn.disabled = false;
}

function canProceed() {
  const q = QUESTIONS[state.index];
  const answer = state.answers[state.index];
  if (q.type === "text") {
    return true;
  }
  return answer !== null && answer !== undefined;
}

function mergeRawScores(base, extra) {
  const out = { ...base };
  if (!extra) return out;
  Object.keys(extra).forEach((id) => {
    out[id] = (out[id] || 0) + (extra[id] || 0);
  });
  return out;
}

async function getAiSubjectiveScores(answers) {
  if (!CONFIG?.enableAI || !CONFIG?.aiEndpoint) return null;
  const raw = typeof answers[9] === "string" ? answers[9].trim() : "";
  const compact = raw.replace(/\s+/g, "");
  if (!compact || compact.length < 3 || /^[.。…·]+$/.test(compact)) {
    return null;
  }
  const subjective = [raw];
  try {
    const response = await fetch(CONFIG.aiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "duzzon-subjective-score",
        texts: subjective,
        candidates: RESULT_ORDER,
        framework: {
          dimensions: ["temperature", "energy", "timeDirection", "style"],
          combine: { objective: 85, llm: 15 },
          notes: [
            "Warm vs Cold",
            "High vs Low Energy",
            "Future vs Present",
            "Explosive vs Calculated"
          ]
        }
      })
    });
    if (!response.ok) return null;
    const json = await response.json();
    if (!json || typeof json !== "object" || typeof json.scores !== "object") return null;
    const safe = {};
    RESULT_ORDER.forEach((id) => {
      const v = Number(json.scores[id] || 0);
      safe[id] = Number.isFinite(v) ? v : 0;
    });
    return safe;
  } catch (_error) {
    return null;
  }
}

prevBtn.addEventListener("click", () => {
  if (state.index === 0) {
    const dict = window.getDuzzonDict ? window.getDuzzonDict(document.documentElement.lang || "ko") : null;
    const message =
      dict?.confirmExitToMain || "두쫀쿠 테스트를 중단하고 메인으로 돌아가시나요?";
    const yes = window.confirm(message);
    if (yes) {
      clearDraft();
      window.location.href = "index.html";
    }
    return;
  }
  if (state.index > 0) {
    state.index -= 1;
    saveDraft();
    renderQuestion();
  }
});

nextBtn.addEventListener("click", async () => {
  if (!canProceed()) {
    const dict = window.getDuzzonDict ? window.getDuzzonDict(document.documentElement.lang || "ko") : null;
    alert(dict?.needAnswer || "먼저 답변을 입력해 주세요.");
    return;
  }

  const currentQuestion = QUESTIONS[state.index];
  const currentAnswer = state.answers[state.index];
  if (
    currentQuestion.type === "text" &&
    (currentAnswer === null || currentAnswer === undefined || String(currentAnswer).trim() === "")
  ) {
    const ok = window.confirm(
      dict?.confirmSkipSubjective || "주관식을 비워두면 분석 정확도가 낮아질 수 있어요. 그래도 넘어갈까요?"
    );
    if (!ok) return;
  }

  if (state.index < QUESTIONS.length - 1) {
    state.index += 1;
    saveDraft();
    renderQuestion();
    return;
  }

  const objectiveScores = scoreObjectiveAnswers(state.answers);
  const subjectiveScores = scoreSubjectiveAnswers(state.answers);
  const aiScores = await getAiSubjectiveScores(state.answers);
  const combinedSubjective = mergeRawScores(subjectiveScores, aiScores);
  const finalScores = mergeScores(objectiveScores, combinedSubjective);
  if (typeof shouldForceEmptyJar === "function" && shouldForceEmptyJar(state.answers)) {
    const maxScore = Math.max(...Object.values(finalScores));
    finalScores["empty-jar"] = maxScore + 999;
  }
  const result = pickResultFromScores(finalScores, state.answers);
  const resultId = Object.keys(RESULTS).find((key) => RESULTS[key] === result) || "duzzon-vicky";
  recordReferralTestCompletion();
  localStorage.setItem("duzzonLastSource", "test");
  clearDraft();
  window.location.href = `result.html?id=${resultId}&src=test`;
});

restoreDraft();
renderQuestion();

document.addEventListener("duzzon:lang", () => {
  renderQuestion();
});
