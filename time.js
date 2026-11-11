// Time practice release at local midnight on 14 November 2026.
const TIME_PRACTICE_RELEASE = new Date(2026, 10, 14, 0, 0, 0, 0);

let timePracticeBusy = false;
let timePracticeExpected = '';
let timePracticeKind = 'read-clock';

function timeToLabel(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function clockSvg(time, className = '') {
  const [hour, minute] = time.split(':').map(Number);
  const minuteAngle = minute * 6;
  const hourAngle = (hour % 12) * 30 + minute / 2;

  const ticks = Array.from({ length: 12 }, (_, index) => {
    const angle = index * 30;
    return `<line x1="50" y1="9" x2="50" y2="14" transform="rotate(${angle} 50 50)" class="clock-tick" />`;
  }).join('');

  return `<svg class="time-clock ${className}" viewBox="0 0 100 100" role="img" aria-label="Analogue clock showing ${time}">
    <circle cx="50" cy="50" r="46" class="clock-face" />${ticks}
    <line x1="50" y1="52" x2="50" y2="29" transform="rotate(${hourAngle} 50 50)" class="clock-hour-hand" />
    <line x1="50" y1="52" x2="50" y2="19" transform="rotate(${minuteAngle} 50 50)" class="clock-minute-hand" />
    <circle cx="50" cy="50" r="3" class="clock-pin" />
    <text x="50" y="23" class="clock-number">12</text><text x="77" y="53" class="clock-number">3</text>
    <text x="50" y="82" class="clock-number">6</text><text x="23" y="53" class="clock-number">9</text>
  </svg>`;
}

function ensureTimePracticeStyles() {
  if (document.getElementById('time-practice-styles')) return;

  const style = document.createElement('style');
  style.id = 'time-practice-styles';
  style.textContent = `
    #time-practice-button { background:linear-gradient(110deg,#0f766e,#06b6d4); }
    .time-practice-open .container > .nav-buttons,.time-practice-open #column-ui,.time-practice-open .tutor-box { display:none !important; }
    .time-practice-panel[hidden] { display:none; }
    .time-practice-panel { display:grid; grid-template-columns:minmax(0,1fr) minmax(180px,260px); gap:18px; align-items:center; width:100%; padding:10px 0; text-align:center; }
    .time-practice-main { min-width:0; }
    .time-practice-panel h2 { margin:12px 0; }
    .time-practice-question { font-size:1.15rem; font-weight:700; margin:14px 0; }
    .time-clock { display:block; width:min(240px,65vw); margin:14px auto; filter:drop-shadow(0 5px 3px #0002); }
    .time-clock-choice { width:125px; padding:8px; border:3px solid #d5e5ee; border-radius:14px; background:#fff; cursor:pointer; }
    .time-clock-choice:hover,.time-clock-choice:focus-visible { border-color:#0891b2; outline:3px solid #a5f3fc; }
    .time-clock-choice .time-clock { width:100px; }
    .time-clock-choice-grid { display:flex; flex-wrap:wrap; justify-content:center; gap:10px; }
    .clock-face { fill:#fffdf5; stroke:#17324d; stroke-width:3; }
    .clock-tick { stroke:#334155; stroke-width:1.8; }
    .clock-hour-hand { stroke:#17324d; stroke-width:4; stroke-linecap:round; }
    .clock-minute-hand { stroke:#0e7490; stroke-width:2.6; stroke-linecap:round; }
    .clock-pin { fill:#f97316; }
    .clock-number { fill:#334155; font: bold 7px sans-serif; text-anchor:middle; }
    .digital-time { display:inline-block; padding:12px 22px; border:3px solid #0f172a; border-radius:12px; background:#0f172a; color:#a7f3d0; font:700 clamp(2rem,8vw,3rem)/1 monospace; letter-spacing:.08em; box-shadow:inset 0 0 14px #0008; }
    .time-cat-scene { position:relative; height:230px; display:grid; place-items:center; perspective:700px; }
    .time-cat { position:relative; width:170px; height:190px; transform-style:preserve-3d; transform:rotateY(-18deg) rotateX(5deg); animation:time-cat-float 3s ease-in-out infinite; }
    .time-cat-body { position:absolute; width:100px; height:112px; left:37px; top:66px; border-radius:48% 48% 42% 42%; background:linear-gradient(120deg,#fbbf24,#c2410c 78%); box-shadow:inset -12px -5px 0 #9a341266, 10px 12px 15px #082f4960; transform:translateZ(12px); }
    .time-cat-head { position:absolute; z-index:3; width:112px; height:98px; left:30px; top:26px; border-radius:48% 48% 45% 45%; background:radial-gradient(circle at 35% 25%,#fde68a,#f59e0b 70%); box-shadow:inset -9px -5px 0 #b4530966, 8px 10px 12px #082f4955; transform:translateZ(25px); }
    .time-cat-ear { position:absolute; z-index:2; top:10px; width:0; height:0; border-left:22px solid transparent; border-right:22px solid transparent; border-bottom:42px solid #d97706; filter:drop-shadow(2px 3px 1px #7c2d12); }
    .time-cat-ear.left { left:35px; transform:rotate(-18deg) translateZ(18px); }
    .time-cat-ear.right { right:35px; transform:rotate(18deg) translateZ(18px); }
    .time-cat-ear:after { content:''; position:absolute; left:-11px; top:17px; border-left:11px solid transparent; border-right:11px solid transparent; border-bottom:21px solid #fb7185; }
    .time-cat-eye { position:absolute; top:41px; width:9px; height:13px; border-radius:50%; background:#172554; box-shadow:inset 2px 1px #fff; }
    .time-cat-eye.left { left:31px; } .time-cat-eye.right { right:31px; }
    .time-cat-muzzle { position:absolute; top:57px; left:39px; width:34px; height:20px; border-radius:50%; background:#ffedd5; }
    .time-cat-nose { position:absolute; left:52px; top:56px; width:10px; height:7px; background:#fb7185; clip-path:polygon(0 0,100% 0,50% 100%); }
    .time-cat-leg { position:absolute; z-index:2; top:155px; width:24px; height:30px; border-radius:12px; background:linear-gradient(90deg,#d97706,#fbbf24); box-shadow:4px 5px 4px #082f4944; }
    .time-cat-leg.one { left:43px; } .time-cat-leg.two { left:105px; }
    .time-cat-tail { position:absolute; z-index:0; left:118px; top:94px; width:48px; height:58px; border:12px solid #b45309; border-left:0; border-bottom:0; border-radius:0 40px 0 0; transform:rotate(18deg) translateZ(-5px); }
    .time-cat-caption { margin:0; color:#475569; font-size:.9rem; }
    @keyframes time-cat-float { 0%,100% { transform:rotateY(-18deg) rotateX(5deg) translateY(0); } 50% { transform:rotateY(-18deg) rotateX(5deg) translateY(-7px); } }
    @media(max-width:650px) { .time-practice-panel { grid-template-columns:1fr; } .time-cat-scene { height:195px; } }
    @media(prefers-reduced-motion:reduce) { .time-cat { animation:none; } }
  `;
  document.head.append(style);
}

function makeTimeProblem() {
  const hour = Math.floor(Math.random() * 12) + 1;
  const minute = Math.floor(Math.random() * 12) * 5;
  const time = timeToLabel(hour, minute);
  const digital = document.getElementById('time-practice-digital');
  const clockArea = document.getElementById('time-practice-clock-area');
  const choices = document.getElementById('time-practice-choices');
  const answerForm = document.getElementById('time-practice-form');
  const question = document.getElementById('time-practice-question');
  const feedback = document.getElementById('time-practice-feedback');

  timePracticeExpected = time;
  timePracticeBusy = false;
  feedback.textContent = '';
  feedback.className = 'practice-feedback';

  if (Math.random() < 0.5) {
    timePracticeKind = 'read-clock';
    digital.hidden = true;
    answerForm.hidden = false;
    clockArea.innerHTML = clockSvg(time);
    question.textContent = 'Read the analogue clock and enter the time digitally (HH:MM).';
    document.getElementById('time-practice-answer').value = '';
  } else {
    timePracticeKind = 'match-clock';
    digital.hidden = false;
    digital.textContent = time;
    answerForm.hidden = true;
    clockArea.replaceChildren();
    question.textContent = 'Which analogue clock matches this digital time?';
    const wrongTimes = new Set();
    while (wrongTimes.size < 2) {
      const other = timeToLabel(Math.floor(Math.random() * 12) + 1, Math.floor(Math.random() * 12) * 5);
      if (other !== time) wrongTimes.add(other);
    }
    const options = [time, ...wrongTimes].sort(() => Math.random() - 0.5);
    options.forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'time-clock-choice';
      button.innerHTML = clockSvg(option);
      button.addEventListener('click', () => scoreTimeAnswer(option));
      choices.append(button);
    });
  }
}

function scoreTimeAnswer(answer) {
  if (timePracticeBusy) return;
  timePracticeBusy = true;
  const feedback = document.getElementById('time-practice-feedback');

  const correct = answer === timePracticeExpected;

  if (correct) {
    stats.stars += 5;
    stats.correct++;
    feedback.textContent = 'Correct! +5 points 🎉';
    feedback.className = 'practice-feedback correct';
    addToHistory(`${timePracticeExpected} ✅ (+5)`);
  } else {
    stats.stars -= 2;
    stats.wrong++;
    feedback.textContent = `Not quite. The time was ${timePracticeExpected}. −2 points.`;
    feedback.className = 'practice-feedback incorrect';
    addToHistory(`${answer} ❌ (−2)`, true);
  }

  updateStatsUI();
  window.setTimeout(() => {
    makeTimeProblem();
    document.getElementById('time-practice-answer').focus();
  }, 900);
}

function refreshTimeButton() {
  const button = document.getElementById('time-practice-button');
  if (!button) return;

  const countdown = getReleaseCountdown(TIME_PRACTICE_RELEASE);

  if (!countdown) {
    button.textContent = 'Time — Play!';
    button.setAttribute('aria-label', 'Play time practice');
    return;
  }

  button.textContent = `Time — ${countdown.days}d ${String(countdown.hours).padStart(2, '0')}h ${String(countdown.minutes).padStart(2, '0')}m ${String(countdown.seconds).padStart(2, '0')}s`;
  button.setAttribute('aria-label', `Time practice available in ${formatReleaseCountdown(countdown)}, on 14th November 2026`);
}

function setupTimePractice() {
  ensureTimePracticeStyles();

  const anchor = document.getElementById('maths-problem-button') || document.getElementById('decimal-fractions-button');
  if (!anchor) return;

  const button = document.createElement('button');
  button.id = 'time-practice-button';
  button.className = 'btn practice-tab';
  button.type = 'button';
  button.addEventListener('click', openTimePractice);

  anchor.after(button);

  const panel = document.createElement('section');
  panel.id = 'time-practice-panel';
  panel.className = 'time-practice-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <div class="time-practice-main">
      <button class="btn game-back-button" type="button">← Back to maths</button>
      <h2>Time</h2>
      <p class="game-rules">Practise reading analogue clocks and matching them to digital time. Correct answers earn <strong>5 points</strong>; incorrect answers lose <strong>2 points</strong>.</p>
      <p id="time-practice-question" class="time-practice-question" aria-live="polite"></p>
      <div id="time-practice-clock-area"></div>
      <div id="time-practice-digital" class="digital-time" hidden></div>
      <div id="time-practice-choices" class="time-clock-choice-grid"></div>
      <form id="time-practice-form" class="practice-answer-form">
        <label for="time-practice-answer">Your answer (HH:MM):</label>
        <input id="time-practice-answer" class="practice-answer" type="text" inputmode="numeric" autocomplete="off" placeholder="e.g. 03:25" aria-describedby="time-practice-feedback">
        <button class="btn practice-submit" type="submit">Check answer</button>
      </form>
      <p id="time-practice-feedback" class="practice-feedback" aria-live="polite"></p>
    </div>
    <aside class="time-cat-aside" aria-label="Decorative 3D cat model">
      <div class="time-cat-scene">
        <div class="time-cat" role="img" aria-label="A small orange 3D cat">
          <div class="time-cat-tail"></div>
          <div class="time-cat-body"></div>
          <div class="time-cat-ear left"></div>
          <div class="time-cat-ear right"></div>
          <div class="time-cat-head">
            <span class="time-cat-eye left"></span>
            <span class="time-cat-eye right"></span>
            <span class="time-cat-muzzle"></span>
            <span class="time-cat-nose"></span>
          </div>
          <div class="time-cat-leg one"></div>
          <div class="time-cat-leg two"></div>
        </div>
      </div>
      <p class="time-cat-caption">Your 3D time-telling cat 🐱</p>
    </aside>
  `;

  const lastPractice = document.getElementById('rounding-game') || document.getElementById('decimal-fraction-game');
  if (lastPractice) lastPractice.after(panel);
  else document.querySelector('.container').append(panel);

  panel.querySelector('.game-back-button').addEventListener('click', closeTimePractice);
  panel.querySelector('#time-practice-form').addEventListener('submit', event => {
    event.preventDefault();
    const value = document.getElementById('time-practice-answer').value.trim();

    if (!/^\\d{1,2}:\\d{2}$/.test(value)) {
      const feedback = document.getElementById('time-practice-feedback');
      feedback.textContent = 'Enter a time in HH:MM format, for example 03:25.';
      feedback.className = 'practice-feedback incorrect';
      return;
    }

    const [hour, minute] = value.split(':').map(Number);
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59 || minute % 5 !== 0) {
      const feedback = document.getElementById('time-practice-feedback');
      feedback.textContent = 'Use an hour from 1 to 12 and a five-minute interval.';
      feedback.className = 'practice-feedback incorrect';
      return;
    }

    scoreTimeAnswer(timeToLabel(hour, minute));
  });

  refreshTimeButton();
  window.setInterval(refreshTimeButton, 1000);
}

function openTimePractice() {
  const countdown = getReleaseCountdown(TIME_PRACTICE_RELEASE);
  if (countdown) {
    alert(`Coming in ${formatReleaseCountdown(countdown)}. Available 14th November 2026.`);
    return;
  }

  document.body.classList.remove('decimal-game-open', 'maths-problem-game-open', 'weight-game-open', 'measuring-game-open', 'rounding-game-open');
  ['decimal-fraction-game', 'maths-problem-game', 'weight-maths-game', 'measuring-game', 'rounding-game'].forEach(id => {
    const section = document.getElementById(id);
    if (section) section.hidden = true;
  });

  document.body.classList.add('time-practice-open');
  document.getElementById('time-practice-panel').hidden = false;
  makeTimeProblem();
  document.getElementById('time-practice-answer').focus();
}

function closeTimePractice() {
  document.body.classList.remove('time-practice-open');
  document.getElementById('time-practice-panel').hidden = true;
}

setupTimePractice();
