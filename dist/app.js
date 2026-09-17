import {
  TOPICS,
  LEVELS,
  fmt,
  freshQuestion,
  validateAnswer,
  answerText,
  skillStats,
  recommend,
} from "./math.js";
const $ = (s) => document.querySelector(s),
  main = $("#main"),
  homeHTML = main.innerHTML,
  KEY = "decimal-lab-v1-release";
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let storageOK = true,
  data = {
    records: [],
    history: [],
    seen: [],
    session: null,
    motion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || "null");
  if (
    saved &&
    Array.isArray(saved.records) &&
    Array.isArray(saved.seen) &&
    Array.isArray(saved.history)
  )
    data = { ...data, ...saved };
} catch {
  storageOK = false;
}
let session = data.session,
  seen = new Set(data.seen),
  difficulty = "adaptive",
  lastHash = "",
  modalAction = null,
  toastTimeout;
const topicName = (id) => TOPICS.find((t) => t.id === id)?.name || "Decimals";
const save = () => {
  data.session = session;
  data.seen = [...seen];
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    storageOK = false;
  }
};
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(
    () => $("#toast").classList.remove("visible"),
    3500,
  );
}
function motion() {
  document.body.classList.toggle("reduce-motion", data.motion);
  $("#motion-toggle").setAttribute(
    "aria-label",
    data.motion ? "Turn on animations" : "Turn off animations",
  );
  $("#motion-toggle").title = data.motion
    ? "Turn on animations"
    : "Turn off animations";
}
$("#motion-toggle").onclick = () => {
  data.motion = !data.motion;
  motion();
  save();
  toast(data.motion ? "Animations paused." : "Animations on.");
};
motion();
function head(eyebrow, title, desc) {
  return `<div class="page-head"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${desc}</p></div>`;
}
function card(t, i) {
  const s = skillStats(data.records, t.id);
  return `<a class="topic-card ${t.color}" href="#practice/${t.id}"><span class="topic-symbol">${esc(t.symbol)}</span><span class="topic-index">${String(i + 1).padStart(2, "0")} / ${t.chapter}</span><h3>${t.name}</h3><p>${t.description}</p>${s.count ? `<span class="topic-progress">${s.label} · ${s.count} recent questions</span>` : ""}<span class="topic-bottom">Start exploring <span>↗</span></span></a>`;
}
function home() {
  main.innerHTML = homeHTML;
  if (data.records.length) {
    const rec = recommend(data.records);
    $(".mission-card>div:first-child").innerHTML =
      `<span class="pill">✦ YOUR NEXT DISCOVERY</span><h2>A little practice.<br>A new possibility.</h2><p>Let’s explore ${rec.name.toLowerCase()}.<br>One step at a time, with help along the way.</p><a class="button primary" href="#practice/${rec.id}">Continue exploring <span>↗</span></a><div class="mission-meta"><span>10 fresh questions</span><span>Hints when you need them</span></div>`;
  }
  if (session) {
    main.insertAdjacentHTML(
      "afterbegin",
      `<div class="storage-warning"><strong>Your ${session.mode === "test" ? "test mission" : "practice"} is waiting.</strong> <a class="text-link" href="#session">Continue question ${session.index + 1} →</a>${session.deadline ? " The test timer is still running." : ""}</div>`,
    );
  }
}
function topics() {
  main.innerHTML =
    head(
      "ONE SKILL. ONE DISCOVERY AT A TIME.",
      "Your decimal universe",
      "Choose a topic and a challenge level. Every session brings fresh questions and a little help when you need it.",
    ) + `<div class="topic-grid full">${TOPICS.map(card).join("")}</div>`;
}
function setup(mode, topic) {
  const diagnostic = mode === "diagnostic",
    test = mode === "test",
    title = diagnostic
      ? "Find your starting point."
      : test
        ? "Your test mission."
        : topicName(topic) + ".";
  main.innerHTML =
    head(
      diagnostic
        ? "CURIOSITY, NOT A GRADE"
        : test
          ? "A LITTLE PRACTICE FOR THE BIG DAY"
          : "LET’S EXPLORE",
      title,
      diagnostic
        ? "Try 12 questions across decimal skills. It’s okay to say “not yet”—that helps us know where to begin."
        : test
          ? "25 original questions. Choose the skills you want to review and a time that works for you."
          : "Try 10 fresh questions. Take your time, use a hint, and watch the numbers make sense.",
    ) +
    `<div class="setup-grid"><section class="panel setup"><h2>${test ? "Build your mission" : diagnostic ? "You don’t have to know everything." : "Choose your challenge"}</h2><p>${diagnostic ? "This is a first look at your skills. Your learning picture gets clearer as you practice." : test ? "Answers stay hidden until you finish. You can revisit any question." : "Start easy or let the questions adjust as you go."}</p>${diagnostic ? "" : `<span class="field-label">Difficulty</span><div class="segmented" role="group" aria-label="Difficulty">${(test ? ["mixed", 0, 1, 2] : ["adaptive", 0, 1, 2]).map((v) => `<button type="button" data-level="${v}" class="${difficulty === v ? "selected" : ""}" aria-pressed="${difficulty === v}">${v === "adaptive" ? "Find my level" : v === "mixed" ? "Mixed" : LEVELS[v]}</button>`).join("")}</div>`}${test ? `<label class="field-label" for="minutes">Time limit</label><select id="minutes"><option value="0">No timer — take your time</option><option value="20">20 minutes</option><option value="30" selected>30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option></select><span class="field-label">Topics to include</span><div class="checkbox-grid">${TOPICS.map((t) => `<label class="check-option"><input type="checkbox" name="topics" value="${t.id}" checked>${t.name}</label>`).join("")}</div><p class="micro" style="margin-top:14px">Choose only the topics on your class test. We don’t know your teacher’s exact test scope.</p>` : ""}<p id="setup-error" class="form-error" role="alert"></p><button class="button primary" data-start="${mode}" data-topic="${topic || ""}">${diagnostic ? "Start discovering" : test ? "Start test mission" : "Start exploring"} <span>↗</span></button></section><aside class="panel setup-note"><span class="eyebrow">HERE’S HOW IT WORKS</span><h2 style="margin-top:13px">${test ? "You’ve got this." : "Small steps count."}</h2><ol>${test ? "<li>Type your answers. There are no multiple-choice questions.</li><li>Skip and return to questions whenever you need.</li><li>Finish to see your results and every worked solution.</li>" : diagnostic ? "<li>Start with a mix of decimal skills.</li><li>Answer what you can. Tell us if something is new.</li><li>Get a starting point for your next practice session.</li>" : "<li>Try the problem on your own.</li><li>Need a hand? Get a hint or an animated explanation.</li><li>Try a new problem to put your discovery to work.</li>"}</ol><p class="micro">${test ? "The timer keeps running if you switch tabs. Your answers save on this device." : "A mistake is useful information. There’s no rush and no penalty for learning."}</p></aside></div>`;
}
function askModal(title, body, label, action) {
  modalAction = action;
  const div = document.createElement("div");
  div.className = "modal-backdrop";
  div.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><h2 id="modal-title">${title}</h2><p>${body}</p><div class="inline-buttons"><button class="button" data-action="cancel-modal">Go back</button><button class="button primary" data-action="confirm-modal">${label}</button></div></section>`;
  document.body.append(div);
  div.querySelector('[data-action="cancel-modal"]').focus();
}
function closeModal() {
  document.querySelector(".modal-backdrop")?.remove();
  modalAction = null;
}
function start(mode, topic) {
  const selected =
    mode === "test"
      ? [...document.querySelectorAll("input[name=topics]:checked")].map(
          (e) => e.value,
        )
      : [];
  if (mode === "test" && !selected.length) {
    $("#setup-error").textContent = "Choose at least one topic for your test.";
    return;
  }
  if (session) {
    askModal(
      "Start a new mission?",
      "Your unfinished mission will be replaced. Completed practice answers will stay in your discoveries.",
      "Start new mission",
      () => {
        session = null;
        start(mode, topic);
      },
    );
    return;
  }
  const minutes = mode === "test" ? Number($("#minutes").value) : 0;
  session = {
    id: crypto.randomUUID(),
    mode,
    topic,
    level: difficulty,
    index: 0,
    total: mode === "test" ? 25 : mode === "diagnostic" ? 12 : 10,
    questions: [],
    responses: [],
    started: Date.now(),
    deadline: minutes ? Date.now() + minutes * 60000 : null,
    topics: selected,
  };
  if (mode === "test") {
    for (let i = 0; i < 25; i++) {
      const level =
        difficulty === "mixed" ? [0, 1, 1, 0, 2][i % 5] : difficulty;
      session.questions.push(
        freshQuestion(selected[i % selected.length], level, seen),
      );
    }
  } else ensureQuestion();
  save();
  location.hash = "session";
}
function ensureQuestion() {
  if (session.questions[session.index]) return;
  let topic = session.topic,
    level = typeof session.level === "number" ? session.level : 0;
  if (session.mode === "diagnostic") {
    const sequence = [
      "place",
      "compare",
      "round",
      "add",
      "subtract",
      "multiply",
      "divide",
      "expanded",
      "word",
    ];
    if (session.index < 9) topic = sequence[session.index];
    else {
      const candidates = session.responses
        .slice(0, 9)
        .map((a, i) => ({
          topic: session.questions[i].topic,
          score: a?.firstCorrect && !a?.helped ? 1 : 0,
        }))
        .sort((a, b) => a.score - b.score);
      topic = candidates[session.index - 9].topic;
    }
    level = session.index < 9 ? 1 : 0;
  } else if (session.level === "adaptive") {
    const recent = session.responses.filter(Boolean).slice(-2);
    if (recent.length === 2 && recent.every((a) => a.firstCorrect && !a.helped))
      level = Math.min(2, (session.questions.at(-1)?.level || 0) + 1);
    else if (recent.length)
      level = Math.max(
        0,
        (session.questions.at(-1)?.level || 0) -
          (recent.at(-1).firstCorrect ? 0 : 1),
      );
  }
  session.questions.push(freshQuestion(topic, level, seen));
}
const response = () =>
  session.responses[session.index] ??
  (session.responses[session.index] = {
    raw: "",
    attempts: 0,
    firstCorrect: false,
    correct: false,
    helped: false,
    revealed: false,
    hint: false,
    visual: false,
    done: false,
    steps: 0,
  });
function visual(q) {
  const v = q.visual;
  if (!v) return "";
  let body = "";
  if (v.kind === "place") {
    const [whole, dec = ""] = v.number.split("."),
      wholeNames = ["Hundreds", "Tens", "Ones"].slice(-whole.length),
      cols = [...wholeNames, "Tenths", "Hundredths", "Thousandths"],
      digits = [...whole, ...dec.padEnd(3, "0")];
    body = `<div class="place-chart" style="grid-template-columns:repeat(${cols.length},1fr)">${cols.map((name, i) => `<span>${name}<strong style="--i:${i}">${digits[i]}</strong></span>`).join("")}</div><p class="visual-caption">${esc(v.number)} · Each step right is one tenth of the place before it.</p>`;
  } else if (v.kind === "vertical") {
    body = `<div class="vertical-math"><div>${v.a.toFixed(v.p)}</div><div>${v.op} ${v.b.toFixed(v.p)}</div><div>${v.result.toFixed(v.p)}</div></div><p class="visual-caption">The decimal points stay in the same column. Trailing zeros keep the value the same.</p>`;
  } else if (v.kind === "line") {
    const pos = 5 + (90 * (v.value - v.low)) / (v.high - v.low);
    body = `<div class="number-line"><span class="point" style="--pos:${pos}%">${fmt(v.value)}</span><div class="line-labels"><span>${fmt(v.low)}</span><span>${fmt(v.high)}</span></div></div><p class="visual-caption">Choose the closer end. Exactly halfway? Round up.</p>`;
  } else if (v.kind === "compare") {
    const p = Math.max(
      ...v.numbers.map((n) => (String(n).split(".")[1] || "").length),
    );
    body = `<div class="vertical-math">${v.numbers.map((n) => `<div>${n.toFixed(p)}</div>`).join("")}</div><p class="visual-caption">Zeros on the right keep the value the same. Compare one column at a time, starting on the left.</p>`;
    if (v.numbers.every((n) => n <= 1) && p <= 2)
      body += `<div class="hundred-grid" aria-label="${Math.round(v.numbers[0] * 100)} of 100 squares filled">${Array.from({ length: 100 }, (_, i) => `<i class="${i < Math.round(v.numbers[0] * 100) ? "filled" : ""}" style="--i:${i}" aria-hidden="true"></i>`).join("")}</div><p class="visual-caption">${fmt(v.numbers[0])} = ${Math.round(v.numbers[0] * 100)} hundredths.</p>`;
  } else
    body = `<p style="font-size:1.2rem;color:#6652ba;text-align:center">${esc(v.text)}</p><p class="visual-caption">Follow the equal groups and keep track of each decimal place.</p>`;
  return `<div class="step-visual">${body}</div>`;
}
function sessionView() {
  if (!session) {
    location.hash = "home";
    return;
  }
  ensureQuestion();
  const q = session.questions[session.index],
    a = response(),
    test = session.mode === "test",
    diag = session.mode === "diagnostic";
  main.innerHTML = `<div class="session-top"><button class="back-button" data-action="leave">← Back to my lab</button><span class="session-status">${test ? "Test mission" : diag ? "Starting-point check" : topicName(q.topic)} · ${session.index + 1} of ${session.total}</span>${session.deadline ? '<span class="timer" id="timer" role="timer" aria-label="Time remaining"></span>' : '<span class="tag">No rush</span>'}</div><div class="progress-track" role="progressbar" aria-label="Mission progress" aria-valuenow="${session.index}" aria-valuemin="0" aria-valuemax="${session.total}"><div class="progress-fill" style="width:${(session.index / session.total) * 100}%"></div></div><div class="question-layout"><section class="panel question-card"><div class="question-meta"><span class="eyebrow">${topicName(q.topic).toUpperCase()}</span><span class="tag">${LEVELS[q.level]}</span></div><h1 id="question-title">${esc(q.prompt)}</h1>${q.display ? `<div class="equation">${esc(q.display)}</div>` : ""}<form id="answer-form" novalidate><label class="answer-label" for="answer">${q.type === "order" ? "Your numbers, smallest first" : q.type === "symbol" ? "Your symbol" : "Your answer"}</label><div class="answer-row"><input class="answer-input" id="answer" name="answer" aria-describedby="answer-tip" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="${q.type === "number" ? "decimal" : "text"}" placeholder="${q.type === "order" ? "0.1, 0.2, 0.3" : q.type === "symbol" ? "<, >, or =" : "Type here"}" value="${esc(a.raw)}" ${a.done && !test ? "disabled" : ""}><span class="answer-unit">${q.unit}</span></div><p id="answer-tip" class="micro" style="margin-top:10px">${q.type === "order" ? "Separate the numbers with commas." : q.type === "symbol" ? "Use your keyboard to type <, >, or =." : "Type a number. Equivalent answers like 0.5 and 0.50 both work."}</p><p class="form-error" id="answer-error" role="alert"></p>${!test && a.done ? `<div class="feedback ${a.correct ? "good" : "neutral"}" role="status">${a.correct ? (a.attempts === 1 && !a.helped ? "✦ You’ve got it!" : "✦ Nice work sticking with it.") : `Let’s keep exploring. The answer is <strong>${esc(answerText(q))}${q.unit ? " " + q.unit : ""}</strong>.`}</div>` : !test && a.attempts ? `<div class="feedback retry" role="status">Not quite yet. ${esc(q.hint)} Try again, or walk through the solution.</div>` : ""}<div class="question-actions">${test ? `<button class="button primary" type="submit">${session.index === session.total - 1 ? "Review & finish" : "Save & next"} <span>→</span></button><button class="button" type="button" data-action="skip-test">Skip for now</button>` : a.done ? `<button class="button primary" type="button" data-action="next">${session.index === session.total - 1 ? "See my discoveries" : "Next discovery"} <span>→</span></button>` : `<button class="button primary" type="submit">Check my answer <span>↗</span></button><button class="button" type="button" data-action="unsure">${diag ? "I haven’t learned this yet" : "I’m not sure yet"}</button>`}</div></form></section><aside class="help-panel"><div class="help-title"><span class="help-orb" aria-hidden="true"></span><h2>${test ? "Your mission notes" : "A little help from the lab"}</h2></div>${
    test
      ? `<p>Work it out on paper if that helps. You can come back to any question.</p><p style="margin-top:14px">Explanations unlock when you finish.</p><button class="button" data-action="finish-test">Finish & see results</button><div class="question-nav" aria-label="Test questions">${session.questions.map((_, i) => `<button class="${i === session.index ? "current" : session.responses[i]?.raw?.trim() ? "answered" : ""}" data-jump="${i}" aria-label="Question ${i + 1}${session.responses[i]?.raw?.trim() ? ", answered" : ", unanswered"}" ${i === session.index ? 'aria-current="step"' : ""}>${i + 1}</button>`).join("")}</div>`
      : `<p>${diag ? "Try on your own first. If a skill is new, tell us." : "You can ask for a hint, see the numbers move, or take it one step at a time."}</p>${a.hint ? `<div class="feedback neutral">${esc(q.hint)}</div>` : ""}${a.visual ? visual(q) : ""}${
          a.steps
            ? `<ol>${q.steps
                .slice(0, a.steps)
                .map((s) => `<li>${esc(s)}</li>`)
                .join("")}</ol>`
            : ""
        }<button class="button" data-action="hint">${a.hint ? "Read the hint again" : "Give me a hint"}</button><button class="button" data-action="visual">${a.visual ? "Replay the visual" : "Show me visually"}</button><button class="button" data-action="step">${a.steps >= q.steps.length ? "Replay the steps" : a.steps ? "Show the next step" : "Walk me through it"}</button>${a.steps >= q.steps.length && !a.done ? '<button class="subtle-button" data-action="unsure">Continue with a new question</button>' : ""}`
  }</aside></div>`;
  main.querySelector("#answer-form").addEventListener("submit", (e) => {
    e.preventDefault();
    submitAnswer();
  });
  $("#answer").addEventListener("input", (e) => {
    a.raw = e.target.value;
    save();
  });
  updateTimer();
}
function submitAnswer() {
  const q = session.questions[session.index],
    a = response();
  a.raw = $("#answer").value;
  const result = validateAnswer(q, a.raw);
  if (!result.valid) {
    $("#answer-error").textContent = result.message;
    $("#answer").focus();
    return;
  }
  if (session.mode === "test") {
    a.done = true;
    save();
    if (session.index === 24) finishPrompt();
    else {
      session.index++;
      save();
      sessionView();
    }
    return;
  }
  if (a.done) return;
  if (a.attempts === 0) a.firstCorrect = result.correct;
  a.attempts++;
  a.correct = result.correct;
  if (result.correct) {
    a.done = true;
    recordCurrent();
  } else if (a.attempts >= 2) {
    a.helped = true;
    a.steps = q.steps.length;
    a.visual = true;
    a.revealed = true;
  } else {
    a.hint = true;
    a.helped = true;
  }
  save();
  sessionView();
  if (result.correct) $(".question-card").classList.add("celebrate");
  else $("#answer").focus();
}
function recordCurrent() {
  const a = response(),
    q = session.questions[session.index],
    id = session.id + "-" + session.index;
  if (!data.records.some((r) => r.id === id) && !a.skipped)
    data.records.push({
      id,
      topic: q.topic,
      level: q.level,
      firstCorrect: a.firstCorrect,
      correct: a.correct,
      helped: a.helped,
      attempts: a.attempts,
      time: Date.now(),
    });
  data.records = data.records.slice(-2000);
  save();
}
function unsure() {
  const a = response();
  a.skipped = session.mode === "diagnostic" && !a.attempts;
  a.done = true;
  a.helped = true;
  a.revealed = true;
  a.steps = session.questions[session.index].steps.length;
  a.visual = true;
  recordCurrent();
  save();
  sessionView();
}
function next() {
  if (session.index === session.total - 1) {
    finish();
    return;
  }
  session.index++;
  ensureQuestion();
  save();
  sessionView();
  main.focus();
}
function finishPrompt() {
  const unanswered = session.questions.filter(
    (q, i) => !session.responses[i]?.raw?.trim(),
  ).length;
  askModal(
    "Finish your test mission?",
    unanswered
      ? `You have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}. You can go back, or finish and learn from the solutions.`
      : "All 25 questions have answers. Ready to see what you discovered?",
    "Finish mission",
    finish,
  );
}
function finish(expired = false) {
  if (!session) return;
  document.querySelector(".modal-backdrop")?.remove();
  if (session.mode === "test") {
    session.questions.forEach((q, i) => {
      const a = session.responses[i] || { raw: "" };
      a.correct = validateAnswer(q, a.raw).correct || false;
      a.firstCorrect = a.correct;
      a.helped = false;
      a.attempts = a.raw.trim() ? 1 : 0;
      a.done = true;
      session.responses[i] = a;
      const id = session.id + "-" + i;
      if (!data.records.some((r) => r.id === id))
        data.records.push({
          id,
          topic: q.topic,
          level: q.level,
          firstCorrect: a.correct,
          correct: a.correct,
          helped: false,
          attempts: a.attempts,
          time: Date.now(),
        });
    });
  }
  data.records = data.records.slice(-2000);
  const done = { ...session, finished: Date.now(), expired };
  data.history.push(done);
  data.history = data.history.slice(-30);
  session = null;
  save();
  location.hash = "results/" + done.id;
}
function updateTimer() {
  if (!session?.deadline) return;
  const remaining = Math.max(
    0,
    Math.ceil((session.deadline - Date.now()) / 1000),
  );
  if ($("#timer")) {
    $("#timer").textContent =
      `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
    $("#timer").classList.toggle("urgent", remaining < 180);
  }
  if (remaining <= 0) finish(true);
}
setInterval(updateTimer, 1000);
document.addEventListener("visibilitychange", updateTimer);
function results(id) {
  const h = data.history.find((h) => h.id === id);
  if (!h) {
    location.hash = "progress";
    return;
  }
  const independent = h.responses.filter(
      (a) => a?.firstCorrect && !a.helped,
    ).length,
    correct = h.responses.filter((a) => a?.correct).length,
    rec = recommend(data.records),
    test = h.mode === "test";
  main.innerHTML = `<section class="result-hero"><span class="eyebrow">${test ? "MISSION COMPLETE" : "LOOK WHAT YOU DISCOVERED"}</span><h1>${h.mode === "diagnostic" ? "A starting point for your journey." : independent === h.total ? "That was brilliant exploring." : "Every step is progress."}</h1><div class="score">${independent}<span> / ${h.total}</span></div><p>${test ? "Questions answered correctly." : `Questions answered independently on the first try.${correct > independent ? ` You also solved ${correct - independent} with another try or help.` : ""}`} ${h.expired ? "Time’s up—your answers were saved." : h.mode === "diagnostic" ? "This is a first look, not a final judgment of your skills." : "Now let’s turn a tricky moment into a new discovery."}</p><div class="result-buttons"><a class="button primary" href="#practice/${rec.id}">Explore ${rec.name.toLowerCase()} ↗</a><a class="button" href="${test ? "#test" : "#topics"}">${test ? "Try a fresh test" : "Choose a topic"}</a><a class="button" href="#progress">My discoveries</a></div></section><div class="section-heading"><div><span class="eyebrow">LET’S TAKE ANOTHER LOOK</span><h2>Your mission notebook</h2></div></div><div class="review-list">${h.questions
    .map((q, i) => {
      const a = h.responses[i] || {};
      return `<details><summary>${i + 1}. ${esc(q.display || q.prompt)}<span>${a.firstCorrect && !a.helped ? "✓ Independent" : a.correct ? "✓ With practice" : a.skipped ? "New skill" : "Let’s explore"}</span></summary>${q.display ? `<p>${esc(q.prompt)}</p>` : ""}<p>Your answer: <strong>${esc(a.raw?.trim() || "Not answered")}</strong><br>Answer: <strong>${esc(answerText(q))}${q.unit ? " " + q.unit : ""}</strong></p>${visual(q)}<ol>${q.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol><a class="text-link" href="#practice/${q.topic}">Practice ${topicName(q.topic).toLowerCase()} →</a></details>`;
    })
    .join("")}</div>`;
}
function progress() {
  if (!data.records.length && !data.history.length) {
    main.innerHTML =
      head(
        "YOUR LEARNING NOTEBOOK",
        "Discoveries start here.",
        "Your progress will grow with every question you explore.",
      ) +
      `<section class="panel empty-state"><div class="help-orb" aria-hidden="true"></div><h2>Let’s find your first discovery.</h2><p>Try a starting-point check or choose a topic. We’ll keep track of what you can do on your own and what needs a little practice.</p><a class="button primary" href="#diagnostic">Find my starting point ↗</a></section>`;
    return;
  }
  const independent = data.records.filter(
    (r) => r.firstCorrect && !r.helped,
  ).length;
  main.innerHTML =
    head(
      "YOUR LEARNING NOTEBOOK",
      "Look how far you’re going.",
      "We track independent answers and helpful retries. A few questions give us clues; regular practice gives us a clearer picture.",
    ) +
    `<div class="stats-grid"><div class="panel stat"><strong>${data.records.length}</strong><span>Questions explored</span></div><div class="panel stat"><strong>${independent}</strong><span>Solved independently</span></div><div class="panel stat"><strong>${data.history.length}</strong><span>Completed missions</span></div></div><section class="panel"><h2>Your skills, one discovery at a time</h2><p class="micro" style="margin-top:10px">Based on the last 20 attempts per topic. “Growing strong” needs at least 3 attempts and 80% independent answers. These are practice clues, not school grades or MAP scores.</p><div class="skill-list">${TOPICS.map(
      (t) => {
        const s = skillStats(data.records, t.id);
        return `<div class="skill-row"><div><h3>${t.name}</h3><p>${s.count ? `${s.label} · ${s.independent} of ${s.count} independent` : "Not explored yet"}</p></div><div class="skill-bar" role="meter" aria-label="${t.name} independent accuracy" aria-valuenow="${Math.round(s.accuracy * 100)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${s.accuracy * 100}%"></span></div><a class="text-link" href="#practice/${t.id}">Explore ↗</a></div>`;
      },
    ).join("")}</div></section>${
      data.history.length
        ? `<div class="section-heading"><h2>Recent missions</h2></div><div class="review-list">${[
            ...data.history,
          ]
            .reverse()
            .slice(0, 10)
            .map(
              (h) =>
                `<a class="panel" href="#results/${h.id}" style="display:flex;justify-content:space-between;gap:20px"><span>${h.mode === "test" ? "Test mission" : h.mode === "diagnostic" ? "Starting-point check" : topicName(h.topic)} <span class="micro">· ${new Date(h.finished).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span></span><span class="text-link">See notebook ↗</span></a>`,
            )
            .join("")}</div>`
        : ""
    }<p class="micro" style="margin-top:24px">Saved in this browser on this device. Clearing browser data clears this history. Up to 2,000 attempts and 30 completed missions are kept.</p>`;
}
function about() {
  main.innerHTML =
    head(
      "BUILT FOR CURIOUS MINDS",
      "About Decimal Lab.",
      "A friendly place to practice fifth-grade decimal skills.",
    ) +
    `<section class="panel about-copy"><h2>Original questions, familiar skills</h2><p>Decimal Lab uses original, generated questions covering skills found in Spectrum Math Grade 5. It is not affiliated with Spectrum, Carson Dellosa, or NWEA, and does not reproduce their question banks.</p><p>The topic sequence was informed by the <a href="https://images.carsondellosa.com/media/cd/pdfs/Activities/FR01804.pdf" target="_blank" rel="noopener">publisher’s Grade 5 sample</a>. We haven’t verified your teacher’s exact unit-test scope. Choose the test topics that match classwork.</p><h2>Fresh questions, familiar ideas</h2><p>Previously generated questions are remembered in this browser so later sessions use new problems. The same skills will come back with new numbers. Different browsers and devices have separate histories.</p><h2>Guidance without AI</h2><p>Hints, worked solutions, and visuals are built into the app. There is no chatbot or AI API. The starting-point check suggests practice; it does not diagnose a learning difficulty or estimate a MAP score.</p><h2>Your device, your progress</h2><p>Answers and progress stay in browser storage on this device. No account is needed by the learning app, and progress does not sync between iPad and MacBook. A private hosted preview may separately require its owner to sign in.</p><h2>Motion at your pace</h2><p>Use the round motion button in the top bar to pause animations. Your device’s reduced-motion preference is also respected.</p><a href="#home" class="button primary">Back to my lab ↗</a></section>`;
}
function render() {
  const hash = location.hash.slice(1) || "home",
    [page, arg] = hash.split("/");
  document
    .querySelectorAll("[data-nav]")
    .forEach((a) =>
      a.classList.toggle(
        "active",
        a.dataset.nav === page ||
          (a.dataset.nav === "topics" && page === "practice") ||
          (a.dataset.nav === "progress" && page === "results"),
      ),
    );
  try {
    if (page === "home") home();
    else if (page === "topics") topics();
    else if (page === "practice" && TOPICS.some((t) => t.id === arg)) {
      if (lastHash !== hash) difficulty = "adaptive";
      setup("practice", arg);
    } else if (page === "diagnostic") setup("diagnostic");
    else if (page === "test") {
      if (lastHash !== hash) difficulty = "mixed";
      setup("test");
    } else if (page === "session") sessionView();
    else if (page === "results") results(arg);
    else if (page === "progress") progress();
    else if (page === "about") about();
    else home();
  } catch (error) {
    main.innerHTML =
      head("A LITTLE PAUSE", "Let’s try another route.", esc(error.message)) +
      `<a class="button primary" href="#topics">Choose a topic</a>`;
  }
  if (!storageOK)
    main.insertAdjacentHTML(
      "afterbegin",
      '<p class="storage-warning" role="status">This browser could not save progress. You can keep practicing, but history and repeat prevention may not survive closing this page.</p>',
    );
  lastHash = hash;
  window.scrollTo({ top: 0, behavior: "instant" });
}
window.addEventListener("hashchange", () => {
  if (location.hash === "#main") {
    main.focus();
    return;
  }
  render();
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.level !== undefined) {
    difficulty = /^\d$/.test(b.dataset.level)
      ? Number(b.dataset.level)
      : b.dataset.level;
    document.querySelectorAll("[data-level]").forEach((el) => {
      el.classList.toggle("selected", el === b);
      el.setAttribute("aria-pressed", String(el === b));
    });
    return;
  }
  if (b.dataset.start) {
    start(b.dataset.start, b.dataset.topic);
    return;
  }
  if (b.dataset.jump !== undefined && session) {
    session.index = Number(b.dataset.jump);
    save();
    sessionView();
    return;
  }
  const action = b.dataset.action;
  if (!action) return;
  if (action === "cancel-modal") {
    closeModal();
    return;
  }
  if (action === "confirm-modal") {
    const fn = modalAction;
    closeModal();
    fn?.();
    return;
  }
  if (action === "leave") {
    save();
    location.hash = "home";
    return;
  }
  if (!session) return;
  const a = response();
  if (action === "hint") {
    if (!a.done) a.helped = true;
    a.hint = true;
    save();
    sessionView();
  } else if (action === "visual") {
    if (!a.done) a.helped = true;
    a.visual = true;
    a.revealed = true;
    save();
    sessionView();
  } else if (action === "step") {
    if (!a.done) a.helped = true;
    a.steps =
      a.steps >= session.questions[session.index].steps.length
        ? 1
        : a.steps + 1;
    if (a.steps === session.questions[session.index].steps.length)
      a.revealed = true;
    save();
    sessionView();
  } else if (action === "unsure") unsure();
  else if (action === "next") next();
  else if (action === "skip-test") {
    save();
    session.index = (session.index + 1) % session.total;
    save();
    sessionView();
  } else if (action === "finish-test") finishPrompt();
});
document.addEventListener("keydown", (e) => {
  const modal = document.querySelector(".modal-backdrop");
  if (!modal) return;
  if (e.key === "Escape") closeModal();
  if (e.key === "Tab") {
    const buttons = [...modal.querySelectorAll("button")],
      first = buttons[0],
      last = buttons.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
render();
