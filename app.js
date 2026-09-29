"use strict";
/* English Flashcards — open-source edition.
 * Pure front-end: SRS state lives in localStorage, pronunciation via Web Speech API.
 * No backend, no build step, no external dependencies.
 */

const STORAGE_KEY = "english-flashcards-deck-v1";
const INTERVALS = [1, 2, 4, 7, 14, 30, 60];
const MAX_PER_SESSION = 20;

/* Sample seed words so the deck is not empty on first run.
 * Replace with your own words via the "添加单词" button. */
const SEED_CARDS = [
  {
    word: "resilient",
    pos: "adj.",
    meaning_zh: "有弹性的；能迅速恢复的",
    phonetic: "/rɪˈzɪliənt/",
    example_en: "Children are often remarkably resilient.",
    example_zh: "孩子们通常恢复力惊人。",
  },
  {
    word: "serendipity",
    pos: "n.",
    meaning_zh: "意外发现珍宝的运气；机缘巧合",
    phonetic: "/ˌserənˈdɪpəti/",
    example_en: "Finding that old letter was pure serendipity.",
    example_zh: "找到那封旧信纯属机缘巧合。",
  },
  {
    word: "meticulous",
    pos: "adj.",
    meaning_zh: "一丝不苟的；细致的",
    phonetic: "/məˈtɪkjələs/",
    example_en: "She is meticulous in her research.",
    example_zh: "她做研究一丝不苟。",
  },
  {
    word: "procrastinate",
    pos: "v.",
    meaning_zh: "拖延；耽搁",
    phonetic: "/prəˈkræstɪneɪt/",
    example_en: "Don't procrastinate on your homework.",
    example_zh: "别拖延你的作业。",
  },
  {
    word: "ubiquitous",
    pos: "adj.",
    meaning_zh: "无处不在的；普遍存在的",
    phonetic: "/juːˈbɪkwɪtəs/",
    example_en: "Smartphones have become ubiquitous.",
    example_zh: "智能手机已经无处不在。",
  },
  {
    word: "ephemeral",
    pos: "adj.",
    meaning_zh: "短暂的；转瞬即逝的",
    phonetic: "/ɪˈfemərəl/",
    example_en: "The beauty of cherry blossoms is ephemeral.",
    example_zh: "樱花之美转瞬即逝。",
  },
  {
    word: "pragmatic",
    pos: "adj.",
    meaning_zh: "务实的；实用主义的",
    phonetic: "/præɡˈmætɪk/",
    example_en: "We need a pragmatic approach to the problem.",
    example_zh: "我们需要一个务实的办法来解决这个问题。",
  },
  {
    word: "ambiguity",
    pos: "n.",
    meaning_zh: "含糊不清；模棱两可",
    phonetic: "/ˌæmbɪˈɡjuːəti/",
    example_en: "There is some ambiguity in the instructions.",
    example_zh: "说明中有些含糊之处。",
  },
];

/* ---------- date helpers (local timezone, YYYY-MM-DD) ---------- */
function todayStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return todayStr(dt);
}

/* ---------- store ---------- */
function loadDeck() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const deck = JSON.parse(raw);
      if (Array.isArray(deck)) return deck;
    }
  } catch (_) {
    /* corrupted storage -> reseed below */
  }
  const t = todayStr();
  const deck = SEED_CARDS.map((c, i) => ({
    id: i + 1,
    word: c.word,
    pos: c.pos,
    meaning_zh: c.meaning_zh,
    phonetic: c.phonetic,
    example_en: c.example_en,
    example_zh: c.example_zh,
    added_at: t,
    last_reviewed: null,
    interval_days: 1,
    next_review: t,
    known_streak: 0,
    status: "active",
  }));
  saveDeck(deck);
  return deck;
}

function saveDeck(deck) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
}

/* ---------- spaced repetition ---------- */
function nextInterval(current) {
  const i = INTERVALS.indexOf(current);
  if (i === -1) return INTERVALS[0];
  return INTERVALS[Math.min(i + 1, INTERVALS.length - 1)];
}

function applyAnswer(card, known, dateStr) {
  card.last_reviewed = dateStr;
  if (known) {
    card.known_streak += 1;
    if (card.known_streak >= 3) {
      card.status = "graduated";
    } else {
      card.interval_days = nextInterval(card.interval_days);
      card.next_review = addDays(dateStr, card.interval_days);
    }
  } else {
    card.known_streak = 0;
    card.interval_days = 1;
    card.next_review = addDays(dateStr, 1);
  }
}

function getDue(deck, dateStr) {
  return deck
    .filter((c) => c.status === "active" && c.next_review <= dateStr)
    .sort((a, b) => (a.next_review < b.next_review ? -1 : a.next_review > b.next_review ? 1 : 0))
    .slice(0, MAX_PER_SESSION);
}

/* ---------- speech ---------- */
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

/* ---------- UI ---------- */
let deck = loadDeck();
let session = null; // { queue: [ids], idx, known, again, date }

const $ = (id) => document.getElementById(id);

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function renderStats() {
  const t = todayStr();
  const graduated = deck.filter((c) => c.status === "graduated").length;
  const due = deck.filter((c) => c.status === "active" && c.next_review <= t).length;
  $("stats").textContent = `共 ${deck.length} 张 · 待复习 ${due} 张 · 已毕业 ${graduated} 张`;
  $("start-review").disabled = due === 0;
}

function statusLabel(card) {
  if (card.status === "graduated") return "已毕业";
  if (card.next_review <= todayStr()) return "待复习";
  return `${card.next_review} 复习`;
}

function renderDeck() {
  const list = $("deck-list");
  list.innerHTML = "";
  const sorted = [...deck].sort((a, b) => a.id - b.id);
  for (const card of sorted) {
    const li = document.createElement("li");
    li.className = "card-row" + (card.status === "graduated" ? " graduated" : "");
    li.innerHTML = `
      <button class="row-main" type="button" aria-expanded="false">
        <span class="row-word">${esc(card.word)}</span>
        <span class="row-meaning">${esc(card.meaning_zh)}</span>
        <span class="row-status">${esc(statusLabel(card))}</span>
      </button>
      <div class="row-detail" hidden>
        <p class="detail-line"><span class="dim">${esc(card.pos || "")}</span> <span>${esc(card.phonetic || "")}</span></p>
        <p class="detail-line">${esc(card.example_en || "")}</p>
        <p class="detail-line dim">${esc(card.example_zh || "")}</p>
        <button class="speak-btn" type="button">听发音</button>
      </div>`;
    const main = li.querySelector(".row-main");
    const detail = li.querySelector(".row-detail");
    main.addEventListener("click", () => {
      const open = detail.hidden;
      detail.hidden = !open;
      main.setAttribute("aria-expanded", String(open));
    });
    li.querySelector(".speak-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      speak(`${card.word}. ${card.example_en || ""}`);
    });
    list.appendChild(li);
  }
  if (sorted.length === 0) {
    list.innerHTML = '<li class="empty">牌堆是空的，点击「添加单词」开始收录吧。</li>';
  }
}

/* ----- review session ----- */
function startReview() {
  const t = todayStr();
  const due = getDue(deck, t);
  if (due.length === 0) return;
  session = { queue: due.map((c) => c.id), idx: 0, known: 0, again: 0, date: t };
  $("view-deck").hidden = true;
  $("view-review").hidden = false;
  $("session-done").hidden = true;
  $("review-main").hidden = false;
  renderCurrent();
}

function currentCard() {
  return deck.find((c) => c.id === session.queue[session.idx]);
}

function renderCurrent() {
  const card = currentCard();
  $("progress").textContent = `第 ${session.idx + 1} / ${session.queue.length} 张`;
  const fc = $("flashcard");
  fc.classList.remove("flipped");
  $("front-word").textContent = card.word;
  $("back-word").textContent = card.word;
  $("back-meta").textContent = `${card.pos || ""} ${card.phonetic || ""}`.trim();
  $("back-meaning").textContent = card.meaning_zh;
  $("back-example").textContent = card.example_en || "";
  $("back-example-zh").textContent = card.example_zh || "";
  $("speak-btn").onclick = (e) => {
    e.stopPropagation();
    speak(`${card.word}. ${card.example_en || ""}`);
  };
}

function answer(known) {
  const card = currentCard();
  applyAnswer(card, known, session.date);
  if (known) session.known += 1;
  else session.again += 1;
  saveDeck(deck);
  session.idx += 1;
  if (session.idx >= session.queue.length) finishSession();
  else renderCurrent();
}

function finishSession() {
  const { known, again } = session;
  session = null;
  $("review-main").hidden = true;
  const done = $("session-done");
  done.hidden = false;
  done.innerHTML = `
    <h2>本轮完成</h2>
    <p>认识了 ${known} 张 · 还不熟 ${again} 张</p>
    <p class="dim">连续 3 次「认识了」的单词会自动毕业，「还不熟」的明天再见。</p>
    <button id="back-to-deck" type="button">返回牌堆</button>`;
  $("back-to-deck").addEventListener("click", showDeck);
  renderStats();
  renderDeck();
}

function showDeck() {
  $("view-review").hidden = true;
  $("view-deck").hidden = false;
  renderStats();
  renderDeck();
}

/* ----- add word ----- */
function openAdd() {
  $("add-form").reset();
  const dialog = $("add-dialog");
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function handleAdd(e) {
  e.preventDefault();
  const word = $("f-word").value.trim();
  if (!word) return;
  const exists = deck.some((c) => c.word.toLowerCase() === word.toLowerCase());
  if (exists) {
    alert("这个单词已经在牌堆里了。");
    return;
  }
  const t = todayStr();
  deck.push({
    id: deck.length ? Math.max(...deck.map((c) => c.id)) + 1 : 1,
    word,
    pos: $("f-pos").value.trim(),
    meaning_zh: $("f-meaning").value.trim(),
    phonetic: $("f-phonetic").value.trim(),
    example_en: $("f-example-en").value.trim(),
    example_zh: $("f-example-zh").value.trim(),
    added_at: t,
    last_reviewed: null,
    interval_days: 1,
    next_review: t,
    known_streak: 0,
    status: "active",
  });
  saveDeck(deck);
  $("add-dialog").close();
  renderStats();
  renderDeck();
}

/* ----- init ----- */
$("start-review").addEventListener("click", startReview);
$("open-add").addEventListener("click", openAdd);
$("add-form").addEventListener("submit", handleAdd);
$("add-cancel").addEventListener("click", () => $("add-dialog").close());
$("flashcard").addEventListener("click", () => $("flashcard").classList.toggle("flipped"));
$("flashcard").addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    $("flashcard").classList.toggle("flipped");
  }
});
$("btn-known").addEventListener("click", () => answer(true));
$("btn-again").addEventListener("click", () => answer(false));

renderStats();
renderDeck();
