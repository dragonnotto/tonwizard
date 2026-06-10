/* =================================================================
   คิดเลขเร็ว (Fast Math Game) - ตรรกะการทำงาน (Vanilla JavaScript)
   -----------------------------------------------------------------
   โครงสร้างหลัก:
     1) state            : เก็บสถานะของเกมทั้งหมด
     2) ระบบสุ่มโจทย์      : generateProblem() ให้คำตอบเป็นจำนวนเต็มเสมอ
     3) ระบบจับเวลา        : startTimer() นับถอยหลังด้วย setInterval
     4) ระบบคะแนน/ฟีดแบ็ก  : ตรวจคำตอบ ให้เสียงและสีตอบสนอง
     5) ระบบบันทึกสถิติ     : เก็บคะแนนสูงสุดไว้ใน localStorage
   ================================================================= */

"use strict";

/* ----------------------------------------------------------------
   ตัวช่วยเล็ก ๆ : ดึง element ด้วย id / querySelector
   ---------------------------------------------------------------- */
const $ = (sel) => document.querySelector(sel);
const $id = (id) => document.getElementById(id);

/* ----------------------------------------------------------------
   สถานะของเกม (Game State)
   ---------------------------------------------------------------- */
const state = {
  player: { name: "", cls: "" },   // ข้อมูลผู้เล่น
  difficulty: "medium",            // ระดับความยากที่เลือก
  operators: ["+", "-", "×", "÷"], // ประเภทโจทย์ที่เปิดใช้งาน
  duration: 60,                    // เวลาต่อรอบ (วินาที)
  soundOn: true,                   // เปิด/ปิดเสียง
  timeLeft: 60,                    // เวลาที่เหลือ
  score: 0,                        // คะแนนปัจจุบัน
  correct: 0,                      // จำนวนข้อที่ตอบถูก
  wrong: 0,                        // จำนวนข้อที่ตอบผิด
  streak: 0,                       // จำนวนข้อที่ตอบถูกติดต่อกัน ณ ปัจจุบัน
  bestStreak: 0,                   // สถิติตอบถูกติดต่อสูงสุดในรอบนี้
  answer: 0,                       // เฉลยของโจทย์ที่กำลังแสดง
  timerId: null,                   // id ของ setInterval ไว้เคลียร์ภายหลัง
};

const STORAGE_KEY = "fastmath_scores_v1"; // คีย์เก็บสถิติใน localStorage

/* ================================================================
   1) ระบบสุ่มโจทย์ (Random Problem Generator)
   ----------------------------------------------------------------
   หลักการ:
   - แต่ละระดับความยากกำหนด "ช่วงของตัวเลข" (min..max) ไว้
   - สุ่มเครื่องหมายจากรายการที่ผู้เล่นเปิดใช้งาน
   - กุญแจสำคัญคือการทำให้ "คำตอบเป็นจำนวนเต็มเสมอ":
       • บวก/คูณ  : สุ่มตัวตั้งและตัวบวก/คูณได้ตรง ๆ
       • ลบ       : สลับให้ตัวตั้ง >= ตัวลบ จะได้ผลลัพธ์ไม่ติดลบ
       • หาร      : สุ่มผลหาร (quotient) และตัวหาร (divisor) ก่อน
                    แล้วคำนวณตัวตั้ง = quotient × divisor
                    ทำให้หารลงตัวเป็นจำนวนเต็มแน่นอน
   ================================================================ */

// สุ่มจำนวนเต็มในช่วง [min, max] แบบรวมปลายทั้งสองข้าง
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ตารางช่วงตัวเลขของแต่ละระดับความยาก
const RANGES = {
  easy:   { min: 1,  max: 9,   mulMax: 9 },   // เลข 1 หลัก
  medium: { min: 10, max: 99,  mulMax: 12 },  // เลข 2 หลัก (คูณ/หารคุมไม่ให้ใหญ่เกินไป)
  hard:   { min: 100, max: 999, mulMax: 25 }, // เลข 3 หลัก และคูณ/หารซับซ้อนขึ้น
};

function generateProblem() {
  const r = RANGES[state.difficulty];
  // เลือกเครื่องหมายแบบสุ่มจากที่เปิดใช้งาน
  const op = state.operators[randInt(0, state.operators.length - 1)];

  let a, b, answer;

  switch (op) {
    case "+":
      a = randInt(r.min, r.max);
      b = randInt(r.min, r.max);
      answer = a + b;
      break;

    case "-":
      a = randInt(r.min, r.max);
      b = randInt(r.min, r.max);
      if (b > a) [a, b] = [b, a]; // สลับให้ผลลัพธ์ไม่ติดลบ
      answer = a - b;
      break;

    case "×":
      // ระดับง่ายใช้ตัวคูณ 1 หลัก, ระดับอื่นคุมขนาดตัวคูณด้วย mulMax
      if (state.difficulty === "easy") {
        a = randInt(2, 9);
        b = randInt(2, 9);
      } else {
        a = randInt(r.min, r.max);
        b = randInt(2, r.mulMax);
      }
      answer = a * b;
      break;

    case "÷": {
      // สุ่มตัวหารและผลหารก่อน เพื่อรับประกันว่าหารลงตัว
      const divisor = randInt(2, state.difficulty === "easy" ? 9 : r.mulMax);
      const quotient = randInt(2, state.difficulty === "easy" ? 9 : r.max / 10 | 0 || 9);
      a = divisor * quotient; // ตัวตั้ง
      b = divisor;            // ตัวหาร
      answer = quotient;      // คำตอบเป็นจำนวนเต็มแน่นอน
      break;
    }
  }

  state.answer = answer;
  // แสดงโจทย์บนหน้าจอ
  $id("problem").textContent = `${a} ${op} ${b}`;
}

/* ================================================================
   2) ระบบจับเวลา (Countdown Timer)
   ----------------------------------------------------------------
   - ใช้ setInterval ลดค่า timeLeft ทีละ 1 วินาที
   - อัปเดตตัวเลขเวลา + แถบเวลากราฟิก (time bar)
   - เมื่อเหลือ <= 10 วินาที จะเปลี่ยนเป็นสีแดงและกะพริบเตือน
   - เมื่อเวลาเป็น 0 จะหยุดเกมและไปหน้าสรุปผลทันที
   ================================================================ */
function startTimer() {
  state.timeLeft = state.duration;
  updateTimerUI();

  state.timerId = setInterval(() => {
    state.timeLeft--;
    updateTimerUI();

    if (state.timeLeft <= 0) {
      endGame(); // หมดเวลา -> สรุปคะแนนทันที
    }
  }, 1000);
}

function updateTimerUI() {
  $id("timer").textContent = state.timeLeft;

  // อัปเดตความกว้างของแถบเวลาตามสัดส่วนที่เหลือ
  const pct = Math.max(0, (state.timeLeft / state.duration) * 100);
  $id("time-bar-fill").style.width = pct + "%";

  // เตือนเมื่อเวลาใกล้หมด (10 วินาทีสุดท้าย)
  const low = state.timeLeft <= 10;
  $(".timer-stat").classList.toggle("low", low);
  $id("time-bar-fill").classList.toggle("low", low);
}

/* ================================================================
   3) ระบบเสียงเอฟเฟกต์ (Web Audio API)
   ----------------------------------------------------------------
   สร้างเสียง "บี๊บ" สั้น ๆ เองโดยไม่ต้องโหลดไฟล์เสียงภายนอก
   - ตอบถูก  : โทนเสียงสูง สดใส
   - ตอบผิด  : โทนเสียงต่ำ
   - หมดเวลา : เสียงโทนลดต่ำลง
   ================================================================ */
let audioCtx = null;
function playSound(type) {
  if (!state.soundOn) return;
  try {
    // สร้าง AudioContext เมื่อจำเป็น (ต้องเกิดหลังผู้ใช้กดปุ่ม)
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === "correct") {
      osc.frequency.setValueAtTime(660, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08);
    } else if (type === "wrong") {
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
    } else { // หมดเวลา
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.5);
    }

    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.45);
  } catch (e) {
    /* บางเบราว์เซอร์อาจบล็อกเสียง - ข้ามไปอย่างเงียบ ๆ */
  }
}

/* ================================================================
   4) ระบบคะแนนและการตรวจคำตอบ
   ----------------------------------------------------------------
   - ตอบถูก : +1 คะแนน, เพิ่ม streak, เล่นเสียง/สีเขียว
   - ตอบผิด : ไม่หักคะแนน แต่รีเซ็ต streak, เล่นเสียง/สีแดง พร้อมเฉลย
   ================================================================ */
function checkAnswer(value) {
  const zone = $(".problem-zone");
  const feedback = $id("feedback");
  const userAns = Number(value);

  if (userAns === state.answer) {
    // ----- ตอบถูก -----
    state.score++;
    state.correct++;
    state.streak++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);

    feedback.textContent = randomPraise();
    feedback.className = "feedback correct";
    zone.classList.remove("wrong");
    void zone.offsetWidth;        // บังคับ reflow เพื่อรีสตาร์ทแอนิเมชัน
    zone.classList.add("correct");
    playSound("correct");
  } else {
    // ----- ตอบผิด -----
    state.wrong++;
    state.streak = 0;

    feedback.textContent = `ผิดนะ คำตอบคือ ${state.answer}`;
    feedback.className = "feedback wrong";
    zone.classList.remove("correct");
    void zone.offsetWidth;
    zone.classList.add("wrong");
    playSound("wrong");
  }

  // อัปเดตตัวเลขคะแนนและสตรีคบนหน้าจอ
  $id("score").textContent = state.score;
  $id("streak").textContent = state.streak;

  // ออกโจทย์ข้อใหม่ทันที พร้อมล้างช่องคำตอบ
  generateProblem();
  $id("answer-input").value = "";
  $id("answer-input").focus();
}

// คำชมแบบสุ่มเพื่อให้กำลังใจนักเรียน
function randomPraise() {
  const list = ["ถูกต้อง! 🎯", "เก่งมาก! ⭐", "เยี่ยม! 🔥", "ใช่เลย! 👍", "สุดยอด! 💪"];
  return list[randInt(0, list.length - 1)];
}

/* ================================================================
   5) วงจรชีวิตของเกม : เริ่ม / จบ / รีเซ็ต
   ================================================================ */
function startGame() {
  // รีเซ็ตค่าสถานะรอบใหม่
  state.score = 0;
  state.correct = 0;
  state.wrong = 0;
  state.streak = 0;
  state.bestStreak = 0;

  $id("score").textContent = "0";
  $id("streak").textContent = "0";
  $id("feedback").textContent = "";
  $id("feedback").className = "feedback";

  showScreen("screen-game");
  generateProblem();
  startTimer();

  $id("answer-input").value = "";
  $id("answer-input").focus();
}

function endGame() {
  clearInterval(state.timerId);
  playSound("timeup");
  saveScore();        // บันทึกสถิติลง localStorage
  renderResult();     // แสดงหน้าสรุปผล
  showScreen("screen-result");
}

/* ================================================================
   หน้าสรุปผล
   ================================================================ */
function renderResult() {
  const total = state.correct + state.wrong;
  const accuracy = total ? Math.round((state.correct / total) * 100) : 0;

  $id("result-score").textContent = state.score;
  $id("result-correct").textContent = state.correct;
  $id("result-wrong").textContent = state.wrong;
  $id("result-accuracy").textContent = accuracy + "%";
  $id("result-best").textContent = state.bestStreak;

  // แสดงชื่อผู้เล่น (ถ้ามีการกรอก)
  const p = state.player;
  $id("result-player").textContent = p.name
    ? `${p.name}${p.cls ? " • " + p.cls : ""}`
    : "";

  // เลือกอีโมจิ/ข้อความตามระดับคะแนน เพื่อสร้างกำลังใจ
  let emoji = "🎉", title = "เก่งมาก!";
  if (state.score === 0) { emoji = "💡"; title = "ลองอีกครั้งนะ!"; }
  else if (state.score < 10) { emoji = "🙂"; title = "ทำได้ดี!"; }
  else if (state.score < 20) { emoji = "🎉"; title = "เยี่ยมมาก!"; }
  else { emoji = "🏆"; title = "สุดยอดอัจฉริยะ!"; }

  $id("result-emoji").textContent = emoji;
  $id("result-title").textContent = title;
}

/* ================================================================
   ระบบบันทึกสถิติด้วย localStorage
   ----------------------------------------------------------------
   หมายเหตุ: นี่คือการเก็บคะแนนฝั่งเครื่องผู้ใช้ (client-side)
   หากต้องการเก็บรวมศูนย์สำหรับการแข่งขัน สามารถแทนที่ฟังก์ชัน
   saveScore() ด้วยการส่งข้อมูล (fetch POST) ไปยัง PHP+MySQL หรือ
   Google Apps Script ได้ทันที (ดูตัวอย่างใน README)
   ================================================================ */
function loadScores() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveScore() {
  const scores = loadScores();
  scores.push({
    name: state.player.name || "ผู้เล่นนิรนาม",
    cls: state.player.cls || "",
    score: state.score,
    difficulty: state.difficulty,
    date: new Date().toLocaleDateString("th-TH"),
  });
  // เรียงจากมากไปน้อย แล้วเก็บไว้แค่ 10 อันดับแรก
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores.slice(0, 10)));
}

function renderLeaderboard() {
  const scores = loadScores();
  const card = $id("leaderboard-card");
  const list = $id("leaderboard-list");

  if (!scores.length) {
    card.hidden = true;
    return;
  }
  card.hidden = false;
  list.innerHTML = scores
    .map(
      (s) => `<li>
        <span class="lb-name">${escapeHtml(s.name)}
          <span class="lb-meta">${escapeHtml(s.cls)} • ${labelDifficulty(s.difficulty)} • ${s.date}</span>
        </span>
        <span class="lb-score">${s.score}</span>
      </li>`
    )
    .join("");
}

// แปลงรหัสระดับความยากเป็นข้อความไทย
function labelDifficulty(d) {
  return { easy: "ง่าย", medium: "ปานกลาง", hard: "ยาก" }[d] || d;
}

// ป้องกัน XSS จากชื่อที่ผู้ใช้กรอก ก่อนนำไปแสดงด้วย innerHTML
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

/* ================================================================
   ระบบสลับหน้าจอ
   ================================================================ */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $id(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ================================================================
   ผูกเหตุการณ์ (Event Bindings) เมื่อหน้าโหลดเสร็จ
   ================================================================ */
document.addEventListener("DOMContentLoaded", () => {
  renderLeaderboard();

  // ----- เลือกระดับความยาก -----
  $id("difficulty-group").addEventListener("click", (e) => {
    const btn = e.target.closest(".option");
    if (!btn) return;
    $id("difficulty-group").querySelectorAll(".option").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.difficulty = btn.dataset.difficulty;
  });

  // ----- เลือกประเภทโจทย์ (เปิด/ปิดได้หลายอัน แต่ต้องเหลืออย่างน้อย 1) -----
  $id("ops-group").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    const active = $id("ops-group").querySelectorAll(".chip.active");
    // ห้ามปิดอันสุดท้าย
    if (chip.classList.contains("active") && active.length === 1) return;
    chip.classList.toggle("active");
  });

  // ----- เลือกเวลาต่อรอบ -----
  $id("time-group").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    $id("time-group").querySelectorAll(".chip").forEach((b) => b.classList.remove("active"));
    chip.classList.add("active");
    state.duration = Number(chip.dataset.time);
  });

  // ----- กดเริ่มเล่น : รวบรวมค่าตั้งค่าทั้งหมด -----
  $id("player-form").addEventListener("submit", (e) => {
    e.preventDefault();

    state.player.name = $id("player-name").value.trim();
    state.player.cls = $id("player-class").value.trim();
    state.soundOn = $id("sound-toggle").checked;

    // รวบรวมประเภทโจทย์ที่เปิดอยู่
    state.operators = Array.from($id("ops-group").querySelectorAll(".chip.active"))
      .map((c) => c.dataset.op);

    startGame();
  });

  // ----- ส่งคำตอบ -----
  $id("answer-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const val = $id("answer-input").value;
    if (val === "") return; // ยังไม่กรอกก็ไม่ต้องตรวจ
    checkAnswer(val);
  });

  // ----- จบเกมก่อนเวลา -----
  $id("quit-btn").addEventListener("click", endGame);

  // ----- ปุ่มในหน้าสรุปผล -----
  $id("play-again").addEventListener("click", startGame);
  $id("back-home").addEventListener("click", () => {
    renderLeaderboard();
    showScreen("screen-start");
  });

  // ----- ล้างสถิติ -----
  $id("clear-scores").addEventListener("click", () => {
    if (confirm("ต้องการล้างสถิติคะแนนทั้งหมดหรือไม่?")) {
      localStorage.removeItem(STORAGE_KEY);
      renderLeaderboard();
    }
  });
});
