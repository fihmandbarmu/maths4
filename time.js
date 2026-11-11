// Time practice tab. The feature script is included twice on the current page,
// so keep initialization idempotent and all declarations scoped to this IIFE.
(() => {
  if (window.__timePracticeInitialized) return;
  window.__timePracticeInitialized = true;

  // 5 December 2026 (month is zero-based: 11 = December).
  const TIME_TAB_RELEASE = new Date(2026, 11, 5, 0, 0, 0, 0);
  let expectedTime = '';
  let questionBusy = false;

  function formatTime(hour, minute) {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  function clockSvg(time, label = 'Clock') {
    const [hour, minute] = time.split(':').map(Number);
    const minuteAngle = minute * 6;
    const hourAngle = (hour % 12) * 30 + minute / 2;
    const ticks = Array.from({ length: 12 }, (_, i) =>
      `<line x1="50" y1="8" x2="50" y2="14" transform="rotate(${i * 30} 50 50)" class="time-clock-tick" />`
    ).join('');
    return `<svg class="time-clock" viewBox="0 0 100 100" role="img" aria-label="${label}">
      <circle cx="50" cy="50" r="46" class="time-clock-face" />${ticks}
      <text x="50" y="23" class="time-clock-number">12</text><text x="77" y="53" class="time-clock-number">3</text>
      <text x="50" y="82" class="time-clock-number">6</text><text x="23" y="53" class="time-clock-number">9</text>
      <line x1="50" y1="51" x2="50" y2="29" transform="rotate(${hourAngle} 50 50)" class="time-hour-hand" />
      <line x1="50" y1="52" x2="50" y2="19" transform="rotate(${minuteAngle} 50 50)" class="time-minute-hand" />
      <circle cx="50" cy="50" r="3" class="time-clock-pin" />
    </svg>`;
  }

  function installStyles() {
    if (document.getElementById('time-tab-styles')) return;
    const style = document.createElement('style');
    style.id = 'time-tab-styles';
    style.textContent = `
      #time-practice-button { background:linear-gradient(110deg,#0f766e,#06b6d4); }
      body.time-practice-open .container > .nav-buttons,body.time-practice-open #column-ui,body.time-practice-open .tutor-box { display:none !important; }
      #time-practice-panel[hidden] { display:none !important; }
      #time-practice-panel { display:grid; grid-template-columns:minmax(0,1fr) minmax(190px,260px); gap:18px; align-items:center; width:100%; padding:10px 0; text-align:center; }
      .time-practice-main { min-width:0; }
      .time-practice-question { margin:16px 0; font-size:1.15rem; font-weight:700; }
      .time-clock { display:block; width:min(240px,65vw); margin:16px auto; filter:drop-shadow(0 5px 3px #0002); }
      .time-clock-face { fill:#fffdf5; stroke:#17324d; stroke-width:3; }
      .time-clock-tick { stroke:#334155; stroke-width:1.8; }
      .time-clock-number { fill:#334155; font:bold 7px sans-serif; text-anchor:middle; }
      .time-hour-hand { stroke:#17324d; stroke-width:4; stroke-linecap:round; }
      .time-minute-hand { stroke:#0e7490; stroke-width:2.6; stroke-linecap:round; }
      .time-clock-pin { fill:#f97316; }
      .digital-time { display:inline-block; padding:12px 22px; border:3px solid #0f172a; border-radius:12px; background:#0f172a; color:#a7f3d0; font:700 clamp(2rem,8vw,3rem)/1 monospace; letter-spacing:.08em; }
      .time-clock-options { display:flex; flex-wrap:wrap; justify-content:center; gap:10px; }
      .time-clock-option { width:125px; padding:8px; border:3px solid #d5e5ee; border-radius:14px; background:#fff; cursor:pointer; }
      .time-clock-option:hover,.time-clock-option:focus-visible { border-color:#0891b2; outline:3px solid #a5f3fc; }
      .time-clock-option .time-clock { width:100px; }
      .time-cat-scene { height:230px; display:grid; place-items:center; perspective:700px; }
      .time-cat { position:relative; width:170px; height:190px; transform-style:preserve-3d; transform:rotateY(-18deg) rotateX(5deg); animation:time-cat-float 3s ease-in-out infinite; }
      .time-cat-body { position:absolute; width:100px; height:112px; left:37px; top:66px; border-radius:48% 48% 42% 42%; background:linear-gradient(120deg,#fbbf24,#c2410c 78%); box-shadow:inset -12px -5px 0 #9a341266,10px 12px 15px #082f4960; transform:translateZ(12px); }
      .time-cat-head { position:absolute; z-index:3; width:112px; height:98px; left:30px; top:26px; border-radius:48% 48% 45% 45%; background:radial-gradient(circle at 35% 25%,#fde68a,#f59e0b 70%); box-shadow:inset -9px -5px 0 #b4530966,8px 10px 12px #082f4955; transform:translateZ(25px); }
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
      @media(max-width:650px) { #time-practice-panel { grid-template-columns:1fr; } .time-cat-scene { height:195px; } }
      @media(prefers-reduced-motion:reduce) { .time-cat { animation:none; } }
    `;
    document.head.append(style);
  }

  function updateButton() {
    const button = document.getElementById('time-practice-button');
    if (!button) return;
    const countdown = getReleaseCountdown(TIME_TAB_RELEASE);
    if (!countdown) {
      button.textContent = 'Time — Play!';
      button.setAttribute('aria-label', 'Play time practice');
    } else {
      button.textContent = `Time — ${countdown.days}d ${String(countdown.hours).padStart(2, '0')}h ${String(countdown.minutes).padStart(2, '0')}m ${String(countdown.seconds).padStart(2, '0')}s`;
      button.setAttribute('aria-label', `Time practice available in ${formatReleaseCountdown(countdown)}, on 5 December 2026`);
    }
  }

  function newQuestion() {
    const hour = Math.floor(Math.random() * 12) + 1;
    const minute = Math.floor(Math.random() * 12) * 5;
    expectedTime = formatTime(hour, minute);
    questionBusy = false;
    const feedback = document.getElementById('time-practice-feedback');
    const clockArea = document.getElementById('time-practice-clock-area');
    const digital = document.getElementById('time-practice-digital');
    const options = document.getElementById('time-practice-options');
    const form = document.getElementById('time-practice-form');
    feedback.textContent = '';
    feedback.className = 'practice-feedback';
    options.replaceChildren();

    if (Math.random() < 0.5) {
      digital.hidden = true;
      form.hidden = false;
      clockArea.innerHTML = clockSvg(expectedTime, 'Read this analogue clock');
      document.getElementById('time-practice-question').textContent = 'Read the analogue clock and enter its time digitally (HH:MM).';
      document.getElementById('time-practice-answer').value = '';
    } else {
      digital.hidden = false;
      digital.textContent = expectedTime;
      form.hidden = true;
      clockArea.replaceChildren();
      document.getElementById('time-practice-question').textContent = 'Choose the analogue clock that matches the digital time.';
      const distractors = new Set();
      while (distractors.size < 2) {
        const candidate = formatTime(Math.floor(Math.random() * 12) + 1, Math.floor(Math.random() * 12) * 5);
        if (candidate !== expectedTime) distractors.add(candidate);
      }
      [expectedTime, ...distractors].sort(() => Math.random() - 0.5).forEach(time => {
        const choice = document.createElement('button');
        choice.type = 'button';
        choice.className = 'time-clock-option';
        choice.setAttribute('aria-label', 'Choose this analogue clock');
        choice.innerHTML = clockSvg(time, 'Clock answer option');
        choice.addEventListener('click', () => scoreAnswer(time));
        options.append(choice);
      });
    }
  }

  function scoreAnswer(answer) {
    if (questionBusy) return;
    questionBusy = true;
    const correct = answer === expectedTime;
    const feedback = document.getElementById('time-practice-feedback');
    if (correct) {
      stats.stars += 5;
      stats.correct++;
      feedback.textContent = 'Correct! +5 points 🎉';
      feedback.className = 'practice-feedback correct';
      addToHistory(`Time: ${expectedTime} ✅ (+5)`);
    } else {
      stats.stars -= 2;
      stats.wrong++;
      feedback.textContent = `Not quite. The time was ${expectedTime}. −2 points.`;
      feedback.className = 'practice-feedback incorrect';
      addToHistory(`Time: ${answer} ❌ (−2)`, true);
    }
    updateStatsUI();
    window.setTimeout(() => {
      newQuestion();
      const answerInput = document.getElementById('time-practice-answer');
      if (!answerInput.closest('form').hidden) answerInput.focus();
    }, 900);
  }

  function openTimeTab() {
    const countdown = getReleaseCountdown(TIME_TAB_RELEASE);
    if (countdown) {
      alert(`Coming in ${formatReleaseCountdown(countdown)}. Available 5th December 2026.`);
      return;
    }
    document.body.classList.remove('decimal-game-open', 'maths-problem-game-open', 'weight-game-open', 'measuring-game-open', 'rounding-game-open');
    ['decimal-fraction-game', 'maths-problem-game', 'weight-maths-game', 'measuring-game', 'rounding-game'].forEach(id => {
      const section = document.getElementById(id);
      if (section) section.hidden = true;
    });
    document.body.classList.add('time-practice-open');
    document.getElementById('time-practice-panel').hidden = false;
    newQuestion();
    const answerInput = document.getElementById('time-practice-answer');
    if (!answerInput.closest('form').hidden) answerInput.focus();
  }

  function closeTimeTab() {
    document.body.classList.remove('time-practice-open');
    document.getElementById('time-practice-panel').hidden = true;
  }

  function setup() {
    const anchor = document.getElementById('maths-problem-button') || document.getElementById('decimal-fractions-button');
    const container = document.querySelector('.container');
    if (!anchor || !container) return;
    installStyles();

    const button = document.createElement('button');
    button.id = 'time-practice-button';
    button.className = 'btn practice-tab';
    button.type = 'button';
    button.addEventListener('click', openTimeTab);
    anchor.after(button);

    const panel = document.createElement('section');
    panel.id = 'time-practice-panel';
    panel.hidden = true;
    panel.innerHTML = `<div class="time-practice-main">
      <button class="btn game-back-button" type="button">← Back to maths</button>
      <h2>Time</h2>
      <p class="game-rules">Practise reading analogue clocks and matching them to digital time. Correct answers earn <strong>5 points</strong>; incorrect answers lose <strong>2 points</strong>.</p>
      <p id="time-practice-question" class="time-practice-question" aria-live="polite"></p>
      <div id="time-practice-clock-area"></div>
      <div id="time-practice-digital" class="digital-time" hidden></div>
      <div id="time-practice-options" class="time-clock-options"></div>
      <form id="time-practice-form" class="practice-answer-form">
        <label for="time-practice-answer">Your answer (HH:MM):</label>
        <input id="time-practice-answer" class="practice-answer" type="text" inputmode="numeric" autocomplete="off" placeholder="e.g. 03:25" aria-describedby="time-practice-feedback">
        <button class="btn practice-submit" type="submit">Check answer</button>
      </form>
      <p id="time-practice-feedback" class="practice-feedback" aria-live="polite"></p>
    </div>
    <aside class="time-cat-aside" aria-label="Decorative CSS 3D cat model">
      <div class="time-cat-scene"><div class="time-cat" role="img" aria-label="An orange three-dimensional cat">
        <div class="time-cat-tail"></div><div class="time-cat-body"></div>
        <div class="time-cat-ear left"></div><div class="time-cat-ear right"></div>
        <div class="time-cat-head"><span class="time-cat-eye left"></span><span class="time-cat-eye right"></span><span class="time-cat-muzzle"></span><span class="time-cat-nose"></span></div>
        <div class="time-cat-leg one"></div><div class="time-cat-leg two"></div>
      </div></div><p class="time-cat-caption">Your 3D time-telling cat 🐱</p>
    </aside>`;
    const endOfPractice = document.getElementById('rounding-game') || document.getElementById('decimal-fraction-game');
    if (endOfPractice) endOfPractice.after(panel);
    else container.append(panel);
    panel.querySelector('.game-back-button').addEventListener('click', closeTimeTab);
    panel.querySelector('#time-practice-form').addEventListener('submit', event => {
      event.preventDefault();
      const value = document.getElementById('time-practice-answer').value.trim();
      const feedback = document.getElementById('time-practice-feedback');
      if (!/^\d{1,2}:\d{2}$/.test(value)) {
        feedback.textContent = 'Enter a time in HH:MM format, for example 03:25.';
        feedback.className = 'practice-feedback incorrect';
        return;
      }
      const [hour, minute] = value.split(':').map(Number);
      if (hour < 1 || hour > 12 || minute < 0 || minute > 55 || minute % 5 !== 0) {
        feedback.textContent = 'Use an hour from 1 to 12 and a five-minute interval.';
        feedback.className = 'practice-feedback incorrect';
        return;
      }
      scoreAnswer(formatTime(hour, minute));
    });
    updateButton();
    window.setInterval(updateButton, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true });
  else setup();
})();
