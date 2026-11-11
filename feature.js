// Practice modes release at local midnight on their scheduled dates.
const DECIMAL_FRACTION_RELEASE = new Date(2026, 11, 1, 0, 0, 0, 0);
const MATHS_PROBLEM_RELEASE = new Date(2026, 11, 4, 0, 0, 0, 0);
const TIME_PRACTICE_RELEASE = new Date(2026, 10, 14, 0, 0, 0, 0);
const WEIGHT_MATHS_RELEASE = new Date(2026, 11, 5, 0, 0, 0, 0);
const MEASURING_RELEASE = new Date(2027, 01, 10, 0, 0, 0, 0);
const ROUNDING_RELEASE = new Date(2027, 07, 30, 0, 0, 0, 0);
const ALLOWED_DIVISORS = [2, 5, 10, 20, 25, 100, 1000, 10000];
let decimalFractionFormat = 'decimal';
let decimalFractionOperation = 'add';
let decimalFractionExpected = 0;
let decimalFractionBusy = false;
let weightOperation = 'add';
let weightExpected = 0;
let weightAnswerUnit = 'mg';
let weightBusy = false;
let measuringExpected = 0;
let measuringBusy = false;
let mathsProblemExpected = 0;
let mathsProblemBusy = false;
let roundingExpected = 0;
let roundingBusy = false;
let roundingPlace = 10;

function getReleaseCountdown(releaseDate, now = new Date()) {
  if (now >= releaseDate) return null;
  let months = (releaseDate.getFullYear() - now.getFullYear()) * 12
    + releaseDate.getMonth() - now.getMonth();
  const cursor = new Date(now);
  const originalDay = cursor.getDate();
  cursor.setDate(1);
  cursor.setMonth(cursor.getMonth() + months);
  cursor.setDate(Math.min(originalDay, new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()));
  if (cursor > releaseDate) {
    months--;
    cursor.setDate(1);
    cursor.setMonth(cursor.getMonth() - 1);
    cursor.setDate(Math.min(originalDay, new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()));
  }
  let remaining = releaseDate - cursor;
  const days = Math.floor(remaining / 86400000);
  remaining -= days * 86400000;
  const hours = Math.floor(remaining / 3600000);
  remaining -= hours * 3600000;
  const minutes = Math.floor(remaining / 60000);
  remaining -= minutes * 60000;
  return { months, days, hours, minutes, seconds: Math.floor(remaining / 1000) };
}

function formatReleaseCountdown(countdown) {
  if (!countdown) return 'Available now!';
  return `${countdown.months} months, ${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, ${countdown.seconds} seconds`;
}

function refreshReleaseButton(buttonId, releaseDate, name) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  const countdown = getReleaseCountdown(releaseDate);
  if (!countdown) {
    button.textContent = `${name} — Play!`;
    button.setAttribute('aria-label', `Play ${name.toLowerCase()}`);
    return;
  }
  button.textContent = `${name} — ${countdown.days}d ${String(countdown.hours).padStart(2, '0')}h ${String(countdown.minutes).padStart(2, '0')}m ${String(countdown.seconds).padStart(2, '0')}s`;
  button.setAttribute('aria-label', `${name} available in ${formatReleaseCountdown(countdown)}`);
}

function parsePracticeAnswer(value) {
  const normalized = value.trim().replace(/,/g, '');
  if (!normalized) return NaN;
  const fraction = normalized.match(/^([+-]?\d+(?:\.\d+)?)\s*\/\s*([+-]?\d+(?:\.\d+)?)$/);
  if (fraction) return Number(fraction[2]) === 0 ? NaN : Number(fraction[1]) / Number(fraction[2]);
  return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) ? Number(normalized) : NaN;
}

function recordPracticeAnswer({ answer, expected, question, feedback, busy, onNext, tolerance = 0 }) {
  const parsed = parsePracticeAnswer(answer.value);
  if (!Number.isFinite(parsed)) {
    feedback.textContent = 'Enter a number for your answer.';
    feedback.className = 'practice-feedback incorrect';
    answer.focus();
    return false;
  }
  if (busy()) return false;
  busy(true);
  const correct = Math.abs(parsed - expected) <= tolerance;
  if (correct) {
    stats.stars += 5;
    stats.correct++;
    feedback.textContent = 'Correct! +5 points 🎉';
    feedback.className = 'practice-feedback correct';
    addToHistory(`${question} ${answer.value.trim()} ✅ (+5)`);
  } else {
    stats.stars -= 2;
    stats.wrong++;
    feedback.textContent = 'Not quite. −2 points. Try the next one!';
    feedback.className = 'practice-feedback incorrect';
    addToHistory(`${question} ${answer.value.trim()} ❌ (−2)`, true);
  }
  updateStatsUI();
  window.setTimeout(() => {
    onNext();
    busy(false);
    answer.focus();
  }, 900);
  return true;
}

function getWeightQuestion() {
  const units = [
    { name: 'mg', factor: 1, max: 999 },
    { name: 'g', factor: 1000, max: 999 },
    { name: 'kg', factor: 1000000, max: 20 }
  ];
  const make = () => {
    const unit = units[Math.floor(Math.random() * units.length)];
    const amount = Math.floor(Math.random() * unit.max) + 1;
    return { amount, unit, mg: amount * unit.factor };
  };
  let first = make();
  let second = make();
  if (weightOperation === 'subtract' && first.mg < second.mg) [first, second] = [second, first];
  const answerUnit = first.unit.factor <= second.unit.factor ? first.unit : second.unit;
  weightAnswerUnit = answerUnit.name;
  const resultMg = weightOperation === 'add' ? first.mg + second.mg : first.mg - second.mg;
  weightExpected = resultMg / answerUnit.factor;
  const symbol = weightOperation === 'add' ? '+' : '−';
  return `${first.amount} ${first.unit.name} ${symbol} ${second.amount} ${second.unit.name} = ? ${answerUnit.name}`;
}

function generateWeightProblem() {
  document.getElementById('weight-game-question').textContent = getWeightQuestion();
  document.getElementById('weight-game-answer').value = '';
  const feedback = document.getElementById('weight-game-feedback');
  feedback.textContent = '';
  feedback.className = 'practice-feedback';
}

function generateMeasuringProblem() {
  const conversions = [
    { from: 'mm', to: 'cm', factor: 0.1, max: 900 },
    { from: 'cm', to: 'mm', factor: 10, max: 90 },
    { from: 'cm', to: 'm', factor: 0.01, max: 900 },
    { from: 'm', to: 'cm', factor: 100, max: 9 },
    { from: 'm', to: 'km', factor: 0.001, max: 900 },
    { from: 'km', to: 'm', factor: 1000, max: 9 },
    { from: 'ml', to: 'l', factor: 0.001, max: 900 },
    { from: 'l', to: 'ml', factor: 1000, max: 9 }
  ];
  const conversion = conversions[Math.floor(Math.random() * conversions.length)];
  const amount = Math.floor(Math.random() * conversion.max) + 1;
  measuringExpected = amount * conversion.factor;
  document.getElementById('measuring-game-question').textContent = `Convert ${amount} ${conversion.from} to ${conversion.to}.`;
  document.getElementById('measuring-game-answer').value = '';
  const feedback = document.getElementById('measuring-game-feedback');
  feedback.textContent = '';
  feedback.className = 'practice-feedback';
}

function generateMathsProblem() {
  const operations = [
    { symbol: '+', calculate: (a, b) => a + b },
    { symbol: '−', calculate: (a, b) => a - b },
    { symbol: '×', calculate: (a, b) => a * b }
  ];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  let first = Math.floor(Math.random() * 20) + 2;
  let second = Math.floor(Math.random() * 20) + 2;
  if (operation.symbol === '−' && first < second) [first, second] = [second, first];
  mathsProblemExpected = operation.calculate(first, second);
  document.getElementById('maths-problem-question').textContent = `${first} ${operation.symbol} ${second} = ?`;
  document.getElementById('maths-problem-answer').value = '';
  const feedback = document.getElementById('maths-problem-feedback');
  feedback.textContent = '';
  feedback.className = 'practice-feedback';
}

function generateRoundingProblem() {
  const amount = Math.floor(Math.random() * 99999) + 1;
  roundingExpected = Math.round(amount / roundingPlace) * roundingPlace;
  document.getElementById('rounding-game-question').textContent = `Round ${amount.toLocaleString('en-US')} to the nearest ${roundingPlace.toLocaleString('en-US')}.`;
  document.getElementById('rounding-game-answer').value = '';
  const feedback = document.getElementById('rounding-game-feedback');
  feedback.textContent = '';
  feedback.className = 'practice-feedback';
}

function generateDecimalFractionProblem() {
  const makeOperand = () => {
    if (decimalFractionFormat === 'fraction') {
      const numerator = Math.floor(Math.random() * 9) + 1;
      const denominator = Math.floor(Math.random() * 9) + 2;
      return { value: numerator / denominator, display: `${numerator}/${denominator}` };
    }
    const tenths = Math.floor(Math.random() * 99) + 1;
    return { value: tenths / 10, display: (tenths / 10).toFixed(1) };
  };
  let first = makeOperand();
  let second = decimalFractionOperation === 'divide'
    ? (() => { const divisor = ALLOWED_DIVISORS[Math.floor(Math.random() * ALLOWED_DIVISORS.length)]; return { value: divisor, display: String(divisor) }; })()
    : makeOperand();
  if (decimalFractionOperation === 'subtract' && first.value < second.value) [first, second] = [second, first];
  const symbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
  if (decimalFractionOperation === 'add') decimalFractionExpected = first.value + second.value;
  else if (decimalFractionOperation === 'subtract') decimalFractionExpected = first.value - second.value;
  else if (decimalFractionOperation === 'multiply') decimalFractionExpected = first.value * second.value;
  else decimalFractionExpected = first.value / second.value;
  document.getElementById('decimal-game-question').textContent = `${first.display} ${symbols[decimalFractionOperation]} ${second.display} = ?`;
  document.getElementById('decimal-game-answer').value = '';
  const feedback = document.getElementById('decimal-game-feedback');
  feedback.textContent = '';
  feedback.className = 'decimal-game-feedback';
}

function openPractice(gameId, className, release, label, generate, inputId) {
  const countdown = getReleaseCountdown(release);
  if (countdown) {
    alert(`Coming in ${formatReleaseCountdown(countdown)}. Available ${label}.`);
    return;
  }
  document.body.classList.remove('decimal-game-open', 'maths-problem-game-open', 'time-practice-open', 'weight-game-open', 'measuring-game-open', 'rounding-game-open');
  ['decimal-fraction-game', 'maths-problem-game', 'time-practice-panel', 'weight-maths-game', 'measuring-game', 'rounding-game'].forEach(id => {
    const section = document.getElementById(id);
    if (section) section.hidden = true;
  });
  document.body.classList.add(className);
  document.getElementById(gameId).hidden = false;
  generate();
  document.getElementById(inputId).focus();
}

function closePractice(gameId, className) {
  document.body.classList.remove(className);
  document.getElementById(gameId).hidden = true;
}

function addPracticeTab({ id, title, release, releaseLabel, gameId, className, content, questionId, answerId, feedbackId, generate, submit }) {
  const nav = document.querySelector('.container > .nav-buttons');
  const anchor = document.getElementById('decimal-fractions-button');
  const button = document.createElement('button');
  button.id = id;
  button.className = 'btn practice-tab';
  button.type = 'button';
  button.addEventListener('click', () => openPractice(gameId, className, release, releaseLabel, generate, answerId));
  anchor.after(button);

  const section = document.createElement('section');
  section.id = gameId;
  section.className = 'practice-game';
  section.hidden = true;
  section.innerHTML = `<button class="btn game-back-button" type="button">← Back to maths</button>
    <h2>${title}</h2>${content}<div id="${questionId}" class="practice-question" aria-live="polite"></div>
    <form class="practice-answer-form"><label for="${answerId}">Your answer:</label>
    <input id="${answerId}" class="practice-answer" type="text" inputmode="decimal" autocomplete="off" placeholder="Answer" aria-describedby="${feedbackId}">
    <button class="btn practice-submit" type="submit">Check answer</button></form>
    <p id="${feedbackId}" class="practice-feedback" aria-live="polite"></p>`;
  document.getElementById('decimal-fraction-game').after(section);
  section.querySelector('.game-back-button').addEventListener('click', () => closePractice(gameId, className));
  section.querySelector('form').addEventListener('submit', submit);
  refreshReleaseButton(id, release, title);
  return section;
}

function setupPracticeModes() {
  const decimalButton = document.getElementById('decimal-fractions-button');
  if (!decimalButton) return;
  decimalButton.addEventListener('click', () => openPractice('decimal-fraction-game', 'decimal-game-open', DECIMAL_FRACTION_RELEASE, '1st December 2026', generateDecimalFractionProblem, 'decimal-game-answer'));
  document.querySelectorAll('.format-button').forEach(button => button.addEventListener('click', () => {
    decimalFractionFormat = button.dataset.format;
    document.querySelectorAll('.format-button').forEach(item => item.classList.toggle('selected', item === button));
    generateDecimalFractionProblem();
  }));
  document.querySelectorAll('.operation-button').forEach(button => button.addEventListener('click', () => {
    decimalFractionOperation = button.dataset.operation;
    document.querySelectorAll('.operation-button').forEach(item => item.classList.toggle('selected', item === button));
    generateDecimalFractionProblem();
  }));
  document.getElementById('decimal-game-form').addEventListener('submit', event => {
    event.preventDefault();
    if (decimalFractionBusy) return;
    const input = document.getElementById('decimal-game-answer');
    const answer = parsePracticeAnswer(input.value);
    const feedback = document.getElementById('decimal-game-feedback');
    if (!Number.isFinite(answer)) { feedback.textContent = 'Enter a number or a fraction like 3/4.'; feedback.className = 'decimal-game-feedback incorrect'; return; }
    decimalFractionBusy = true;
    const question = document.getElementById('decimal-game-question').textContent.replace(' = ?', ' =');
    if (Math.abs(answer - decimalFractionExpected) < 1e-9) {
      stats.stars += 5; stats.correct++; feedback.textContent = 'Correct! +5 points 🎉'; feedback.className = 'decimal-game-feedback correct'; addToHistory(`${question} ${input.value.trim()} ✅ (+5)`);
    } else {
      stats.stars -= 2; stats.wrong++; feedback.textContent = 'Not quite. −2 points. Try the next one!'; feedback.className = 'decimal-game-feedback incorrect'; addToHistory(`${question} ${input.value.trim()} ❌ (−2)`, true);
    }
    updateStatsUI();
    window.setTimeout(() => { generateDecimalFractionProblem(); decimalFractionBusy = false; input.focus(); }, 900);
  });

  const commonStyle = document.createElement('style');
  commonStyle.textContent = `
    .practice-tab { color:#fff; border-color:#123; font-size:.85rem; padding:9px 14px; max-width:100%; background:linear-gradient(110deg,#00a6a6,#2563eb); }
    #maths-problem-button { background:linear-gradient(110deg,#f59e0b,#ef4444); }
    #time-practice-button { background:linear-gradient(110deg,#0f766e,#06b6d4); }
    #weight-maths-button { background:linear-gradient(110deg,#f6a623,#e34b73); }
    #rounding-button { background:linear-gradient(110deg,#8b5cf6,#d946ef); }
    .decimal-game-open .container > .nav-buttons,.decimal-game-open #column-ui,.decimal-game-open .tutor-box,
    .maths-problem-game-open .container > .nav-buttons,.maths-problem-game-open #column-ui,.maths-problem-game-open .tutor-box,
    .time-practice-open .container > .nav-buttons,.time-practice-open #column-ui,.time-practice-open .tutor-box,
    .weight-game-open .container > .nav-buttons,.weight-game-open #column-ui,.weight-game-open .tutor-box,
    .measuring-game-open .container > .nav-buttons,.measuring-game-open #column-ui,.measuring-game-open .tutor-box,
    .rounding-game-open .container > .nav-buttons,.rounding-game-open #column-ui,.rounding-game-open .tutor-box { display:none !important; }
    .practice-game[hidden] { display:none; }
    .practice-game { width:100%; text-align:center; padding:8px 0; }
    .practice-game h2 { margin:14px 0 8px; }
    .game-rules { line-height:1.5; }
    .game-controls { display:flex; justify-content:center; flex-wrap:wrap; gap:10px; margin:14px 0; }
    .format-button.selected,.operation-button.selected,.weight-operation-button.selected,.rounding-place-button.selected { background:#b7f0c5; outline:3px solid #228b45; }
    .practice-question { margin:22px 0; font-size:clamp(1.7rem,6vw,2.5rem); font-weight:bold; overflow-wrap:anywhere; }
    .practice-answer-form { display:flex; flex-direction:column; gap:10px; max-width:440px; margin:0 auto; text-align:left; }
    .practice-answer-form label { font-weight:bold; }
    .practice-answer { min-height:48px; border:3px solid #222; border-radius:9px; padding:8px 12px; font-size:1.2rem; }
    .practice-submit { background:linear-gradient(110deg,#00a6a6,#2563eb); color:white; padding:10px; }
    .practice-feedback { min-height:1.5em; font-weight:bold; }
    .practice-feedback.correct,.decimal-game-feedback.correct { color:#16752d; }
    .practice-feedback.incorrect,.decimal-game-feedback.incorrect { color:#c62828; }
    @media(max-width:600px){.practice-tab{line-height:1.4;}}
  `;
  document.head.append(commonStyle);

  addPracticeTab({
    id: 'maths-problem-button', title: 'Maths Problem', release: MATHS_PROBLEM_RELEASE, releaseLabel: '4th December 2026',
    gameId: 'maths-problem-game', className: 'maths-problem-game-open', questionId: 'maths-problem-question', answerId: 'maths-problem-answer', feedbackId: 'maths-problem-feedback',
    content: '<p class="game-rules">Solve a quick arithmetic challenge. Correct answers earn <strong>5 points</strong>; incorrect answers lose <strong>2 points</strong>.</p>',
    generate: generateMathsProblem,
    submit: event => { event.preventDefault(); const question = document.getElementById('maths-problem-question').textContent.replace(' = ?', ' ='); recordPracticeAnswer({ answer: document.getElementById('maths-problem-answer'), expected: mathsProblemExpected, question, feedback: document.getElementById('maths-problem-feedback'), busy: value => { if (value) mathsProblemBusy = true; return mathsProblemBusy; }, onNext: () => { mathsProblemBusy = false; generateMathsProblem(); }, tolerance: 1e-9 }); }
  });

  const weightSection = addPracticeTab({
    id: 'weight-maths-button', title: 'Weight Maths', release: WEIGHT_MATHS_RELEASE, releaseLabel: '5th December 2026',
    gameId: 'weight-maths-game', className: 'weight-game-open', questionId: 'weight-game-question', answerId: 'weight-game-answer', feedbackId: 'weight-game-feedback',
    content: `<p class="game-rules">Add and subtract weights in mg, g, and kg. Correct answers earn <strong>5 points</strong>; incorrect answers lose <strong>2 points</strong>.</p>
      <div class="game-controls"><button class="btn weight-operation-button selected" data-operation="add" type="button">+</button><button class="btn weight-operation-button" data-operation="subtract" type="button">−</button></div>`,
    generate: generateWeightProblem,
    submit: event => { event.preventDefault(); const question = document.getElementById('weight-game-question').textContent.replace(' = ?', ' ='); recordPracticeAnswer({ answer: document.getElementById('weight-game-answer'), expected: weightExpected, question, feedback: document.getElementById('weight-game-feedback'), busy: value => { if (value) weightBusy = true; return weightBusy; }, onNext: () => { weightBusy = false; generateWeightProblem(); }, tolerance: 1e-9 }); }
  });
  weightSection.querySelectorAll('.weight-operation-button').forEach(button => button.addEventListener('click', () => {
    weightOperation = button.dataset.operation;
    weightSection.querySelectorAll('.weight-operation-button').forEach(item => item.classList.toggle('selected', item === button));
    generateWeightProblem();
  }));

  addPracticeTab({
    id: 'measuring-button', title: 'Measuring', release: MEASURING_RELEASE, releaseLabel: '10th December 2026',
    gameId: 'measuring-game', className: 'measuring-game-open', questionId: 'measuring-game-question', answerId: 'measuring-game-answer', feedbackId: 'measuring-game-feedback',
    content: `<p class="game-rules">Practise converting metric measurements of length and capacity. Correct answers earn <strong>5 points</strong>; incorrect answers lose <strong>2 points</strong>.</p>`,
    generate: generateMeasuringProblem,
    submit: event => { event.preventDefault(); const question = document.getElementById('measuring-game-question').textContent; recordPracticeAnswer({ answer: document.getElementById('measuring-game-answer'), expected: measuringExpected, question, feedback: document.getElementById('measuring-game-feedback'), busy: value => { if (value) measuringBusy = true; return measuringBusy; }, onNext: () => { measuringBusy = false; generateMeasuringProblem(); }, tolerance: 1e-9 }); }
  });

  const roundingSection = addPracticeTab({
    id: 'rounding-button', title: 'Rounding', release: ROUNDING_RELEASE, releaseLabel: '15th December 2026',
    gameId: 'rounding-game', className: 'rounding-game-open', questionId: 'rounding-game-question', answerId: 'rounding-game-answer', feedbackId: 'rounding-game-feedback',
    content: `<p class="game-rules">Round numbers to the nearest 10, 100, or 1,000. Correct answers earn <strong>5 points</strong>; incorrect answers lose <strong>2 points</strong>.</p>
      <div class="game-controls"><button class="btn rounding-place-button selected" type="button" data-place="10">Nearest 10</button><button class="btn rounding-place-button" type="button" data-place="100">Nearest 100</button><button class="btn rounding-place-button" type="button" data-place="1000">Nearest 1,000</button></div>`,
    generate: generateRoundingProblem,
    submit: event => { event.preventDefault(); const question = document.getElementById('rounding-game-question').textContent; recordPracticeAnswer({ answer: document.getElementById('rounding-game-answer'), expected: roundingExpected, question, feedback: document.getElementById('rounding-game-feedback'), busy: value => { if (value) roundingBusy = true; return roundingBusy; }, onNext: () => { roundingBusy = false; generateRoundingProblem(); }, tolerance: 1e-9 }); }
  });
  roundingSection.querySelectorAll('.rounding-place-button').forEach(button => button.addEventListener('click', () => {
    roundingPlace = Number(button.dataset.place);
    roundingSection.querySelectorAll('.rounding-place-button').forEach(item => item.classList.toggle('selected', item === button));
    generateRoundingProblem();
  }));
}

setupPracticeModes();
refreshReleaseButton('decimal-fractions-button', DECIMAL_FRACTION_RELEASE, 'Decimals & Fractions');
refreshReleaseButton('maths-problem-button', MATHS_PROBLEM_RELEASE, 'Maths Problem');
window.setInterval(() => {
  refreshReleaseButton('decimal-fractions-button', DECIMAL_FRACTION_RELEASE, 'Decimals & Fractions');
  refreshReleaseButton('maths-problem-button', MATHS_PROBLEM_RELEASE, 'Maths Problem');
  refreshReleaseButton('weight-maths-button', WEIGHT_MATHS_RELEASE, 'Weight Maths');
  refreshReleaseButton('measuring-button', MEASURING_RELEASE, 'Measuring');
  refreshReleaseButton('rounding-button', ROUNDING_RELEASE, 'Rounding');
}, 1000);
