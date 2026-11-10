// The new practice mode opens on 1st December 2026 (local time).
const DECIMAL_FRACTION_RELEASE = new Date(2026, 12, 1, 6, 2, 0, 0);
const WEIGHT_MATHS_RELEASE = new Date(2026, 11, 5, 0, 0, 0, 0);
const MEASURING_RELEASE = new Date(2026, 0, 2, 0, 0, 0, 0);
const ROUNDING_RELEASE = new Date(2026, 11, 15, 0, 0, 0, 0);
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
let roundingExpected = 0;
let roundingBusy = false;
let roundingPlace = 10;

function getReleaseCountdown(releaseDate, now = new Date()) {
  if (now >= releaseDate) return null;

  // Count whole calendar months first, then the remaining days and clock time.
  let months = (releaseDate.getFullYear() - now.getFullYear()) * 12
    + releaseDate.getMonth() - now.getMonth();
  const cursor = new Date(now);
  const originalDay = cursor.getDate();
  cursor.setDate(1);
  cursor.setMonth(cursor.getMonth() + months);
  const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  cursor.setDate(Math.min(originalDay, lastDay));
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
  const seconds = Math.floor(remaining / 1000);
  return { months, days, hours, minutes, seconds };
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
  } else {
    const label = formatReleaseCountdown(countdown);
    button.textContent = `${name} — ${countdown.days}d ${String(countdown.hours).padStart(2, '0')}h ${String(countdown.minutes).padStart(2, '0')}m ${String(countdown.seconds).padStart(2, '0')}s`;
    button.setAttribute('aria-label', `${name} available in ${label}`);
  }
}

function refreshDecimalFractionButton() {
  refreshReleaseButton('decimal-fractions-button', DECIMAL_FRACTION_RELEASE, 'Decimals & Fractions');
}

function openDecimalFractionGame() {
  const countdown = getReleaseCountdown(DECIMAL_FRACTION_RELEASE);
  if (countdown) {
    alert(`Coming in ${formatReleaseCountdown(countdown)}. Available 1st December 2026.`);
    return;
  }
  document.body.classList.remove('weight-game-open', 'measuring-game-open', 'rounding-game-open');
  document.getElementById('weight-maths-game').hidden = true;
  document.getElementById('measuring-game').hidden = true;
  document.getElementById('rounding-game').hidden = true;
  document.body.classList.add('decimal-game-open');
  document.getElementById('decimal-fraction-game').hidden = false;
  generateDecimalFractionProblem();
  document.getElementById('decimal-game-answer').focus();
}

function closeDecimalFractionGame() {
  document.body.classList.remove('decimal-game-open');
  document.getElementById('decimal-fraction-game').hidden = true;
}

function setDecimalFractionFormat(format) {
  decimalFractionFormat = format;
  document.querySelectorAll('.format-button').forEach(button => {
    button.classList.toggle('selected', button.dataset.format === format);
  });
  generateDecimalFractionProblem();
}

function setDecimalFractionOperation(operation) {
  decimalFractionOperation = operation;
  document.querySelectorAll('.operation-button').forEach(button => {
    button.classList.toggle('selected', button.dataset.operation === operation);
  });
  generateDecimalFractionProblem();
}

function makeOperand(format) {
  if (format === 'fraction') {
    const numerator = Math.floor(Math.random() * 9) + 1;
    const denominator = Math.floor(Math.random() * 9) + 2;
    return { value: numerator / denominator, display: `${numerator}/${denominator}` };
  }
  const tenths = Math.floor(Math.random() * 99) + 1;
  return { value: tenths / 10, display: (tenths / 10).toFixed(1) };
}

function generateDecimalFractionProblem() {
  let first = makeOperand(decimalFractionFormat);
  let second = decimalFractionOperation === 'divide'
    ? (() => {
        const divisor = ALLOWED_DIVISORS[Math.floor(Math.random() * ALLOWED_DIVISORS.length)];
        return { value: divisor, display: divisor.toLocaleString('en-US') };
      })()
    : makeOperand(decimalFractionFormat);

  if (decimalFractionOperation === 'subtract' && first.value < second.value) {
    [first, second] = [second, first];
  }
  const symbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
  if (decimalFractionOperation === 'add') decimalFractionExpected = first.value + second.value;
  else if (decimalFractionOperation === 'subtract') decimalFractionExpected = first.value - second.value;
  else if (decimalFractionOperation === 'multiply') decimalFractionExpected = first.value * second.value;
  else decimalFractionExpected = first.value / second.value;

  document.getElementById('decimal-game-question').textContent = `${first.display} ${symbols[decimalFractionOperation]} ${second.display} = ?`;
  document.getElementById('decimal-game-answer').value = '';
  document.getElementById('decimal-game-feedback').textContent = '';
  document.getElementById('decimal-game-feedback').className = 'decimal-game-feedback';
}

function parseDecimalOrFraction(answer) {
  const normalized = answer.trim().replace(/,/g, '');
  if (!normalized) return NaN;
  const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*\/\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    return denominator === 0 ? NaN : numerator / denominator;
  }
  return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) ? Number(normalized) : NaN;
}

function submitDecimalFractionAnswer(event) {
  event.preventDefault();
  if (decimalFractionBusy) return;
  const input = document.getElementById('decimal-game-answer');
  const userAnswer = parseDecimalOrFraction(input.value);
  const feedback = document.getElementById('decimal-game-feedback');
  if (!Number.isFinite(userAnswer)) {
    feedback.textContent = 'Enter a number or a fraction like 3/4.';
    feedback.className = 'decimal-game-feedback incorrect';
    input.focus();
    return;
  }

  decimalFractionBusy = true;
  if (Math.abs(userAnswer - decimalFractionExpected) < 1e-9) {
    stats.stars += 5;
    stats.correct++;
    feedback.textContent = 'Correct! +5 points 🎉';
    feedback.className = 'decimal-game-feedback correct';
    addToHistory(`${document.getElementById('decimal-game-question').textContent.replace(' = ?', '')} = ${input.value.trim()} ✅ (+5)`);
  } else {
    stats.stars -= 2;
    stats.wrong++;
    feedback.textContent = 'Not quite. −2 points. Try the next one!';
    feedback.className = 'decimal-game-feedback incorrect';
    addToHistory(`${document.getElementById('decimal-game-question').textContent.replace(' = ?', '')} = ${input.value.trim()} ❌ (−2)`, true);
  }
  updateStatsUI();
  window.setTimeout(() => {
    generateDecimalFractionProblem();
    decimalFractionBusy = false;
    input.focus();
  }, 900);
}

function openWeightMathsGame() {
  const countdown = getReleaseCountdown(WEIGHT_MATHS_RELEASE);
  if (countdown) {
    alert(`Coming in ${formatReleaseCountdown(countdown)}. Available 5th December 2026.`);
    return;
  }
  document.body.classList.remove('decimal-game-open', 'measuring-game-open', 'rounding-game-open');
  document.getElementById('decimal-fraction-game').hidden = true;
  document.getElementById('measuring-game').hidden = true;
  document.getElementById('rounding-game').hidden = true;
  document.body.classList.add('weight-game-open');
  document.getElementById('weight-maths-game').hidden = false;
  generateWeightProblem();
  document.getElementById('weight-game-answer').focus();
}

function closeWeightMathsGame() {
  document.body.classList.remove('weight-game-open');
  document.getElementById('weight-maths-game').hidden = true;
}

function setWeightOperation(operation) {
  weightOperation = operation;
  document.querySelectorAll('.weight-operation-button').forEach(button => {
    button.classList.toggle('selected', button.dataset.operation === operation);
  });
  generateWeightProblem();
}

function makeWeightOperand() {
  const units = [
    { name: 'mg', milligrams: 1, max: 999 },
    { name: 'g', milligrams: 1000, max: 999 },
    { name: 'kg', milligrams: 1000000, max: 20 }
  ];
  const unit = units[Math.floor(Math.random() * units.length)];
  const amount = Math.floor(Math.random() * unit.max) + 1;
  return { amount, unit: unit.name, milligrams: amount * unit.milligrams, factor: unit.milligrams };
}

function generateWeightProblem() {
  let first = makeWeightOperand();
  let second = makeWeightOperand();
  if (weightOperation === 'subtract' && first.milligrams < second.milligrams) {
    [first, second] = [second, first];
  }

  // Answer in the smaller unit shown so conversions always have a whole-number answer.
  weightAnswerUnit = first.factor <= second.factor ? first.unit : second.unit;
  const answerFactor = { mg: 1, g: 1000, kg: 1000000 }[weightAnswerUnit];
  const totalMilligrams = weightOperation === 'add'
    ? first.milligrams + second.milligrams
    : first.milligrams - second.milligrams;
  weightExpected = totalMilligrams / answerFactor;
  const symbol = weightOperation === 'add' ? '+' : '−';
  document.getElementById('weight-game-question').textContent = `${first.amount} ${first.unit} ${symbol} ${second.amount} ${second.unit} = ? ${weightAnswerUnit}`;
  document.getElementById('weight-game-answer').value = '';
  const feedback = document.getElementById('weight-game-feedback');
  feedback.textContent = '';
  feedback.className = 'weight-game-feedback';
}

function submitWeightAnswer(event) {
  event.preventDefault();
  if (weightBusy) return;
  const input = document.getElementById('weight-game-answer');
  const answer = parseDecimalOrFraction(input.value);
  const feedback = document.getElementById('weight-game-feedback');
  if (!Number.isFinite(answer)) {
    feedback.textContent = `Enter a number in ${weightAnswerUnit}.`;
    feedback.className = 'weight-game-feedback incorrect';
    input.focus();
    return;
  }

  weightBusy = true;
  if (Math.abs(answer - weightExpected) < 1e-9) {
    stats.stars += 5;
    stats.correct++;
    feedback.textContent = 'Correct! +5 points 🎉';
    feedback.className = 'weight-game-feedback correct';
    addToHistory(`${document.getElementById('weight-game-question').textContent.replace(' = ?', ' =')} ${answer} ${weightAnswerUnit} ✅ (+5)`);
  } else {
    stats.stars -= 2;
    stats.wrong++;
    feedback.textContent = 'Not quite. −2 points. Check the units and try the next one!';
    feedback.className = 'weight-game-feedback incorrect';
    addToHistory(`${document.getElementById('weight-game-question').textContent.replace(' = ?', ' =')} ${input.value.trim()} ${weightAnswerUnit} ❌ (−2)`, true);
  }
  updateStatsUI();
  window.setTimeout(() => {
    generateWeightProblem();
    weightBusy = false;
    input.focus();
  }, 900);
}

function setupWeightMathsTab() {
  const navigation = document.querySelector('.container > .nav-buttons');
  const decimalButton = document.getElementById('decimal-fractions-button');
  if (navigation && decimalButton) {
    const button = document.createElement('button');
    button.id = 'weight-maths-button';
    button.className = 'btn weight-maths-button';
    button.type = 'button';
    button.addEventListener('click', openWeightMathsGame);
    decimalButton.after(button);
  }

  const game = document.createElement('section');
  game.id = 'weight-maths-game';
  game.className = 'weight-game';
  game.hidden = true;
  game.setAttribute('aria-labelledby', 'weight-game-title');
  game.innerHTML = `
    <button class="btn game-back-button" type="button">← Back to maths</button>
    <h2 id="weight-game-title">Weight Maths</h2>
    <p class="game-rules">Add and subtract weights in milligrams (mg), grams (g), and kilograms (kg). Answers earn <strong>5 points</strong>; incorrect answers lose <strong>2 points</strong>.</p>
    <div class="game-controls" aria-label="Choose weight operation">
      <button class="btn weight-operation-button selected" type="button" data-operation="add">+</button>
      <button class="btn weight-operation-button" type="button" data-operation="subtract">−</button>
    </div>
    <div id="weight-game-question" class="weight-game-question" aria-live="polite"></div>
    <form id="weight-game-form" class="weight-answer-form">
      <label for="weight-game-answer">Your answer (in the unit shown):</label>
      <input id="weight-game-answer" type="text" inputmode="decimal" autocomplete="off" placeholder="Answer" aria-describedby="weight-game-feedback">
      <button class="btn weight-submit-button" type="submit">Check answer</button>
    </form>
    <p id="weight-game-feedback" class="weight-game-feedback" aria-live="polite"></p>`;
  document.getElementById('decimal-fraction-game').after(game);
  game.querySelector('.game-back-button').addEventListener('click', closeWeightMathsGame);
  game.querySelectorAll('.weight-operation-button').forEach(button => {
    button.addEventListener('click', () => setWeightOperation(button.dataset.operation));
  });
  game.querySelector('#weight-game-form').addEventListener('submit', submitWeightAnswer);
}

function openScheduledPractice(gameId, bodyClass, releaseDate, releaseLabel, generate, inputId) {
  const countdown = getReleaseCountdown(releaseDate);
  if (countdown) {
    alert(`Coming in ${formatReleaseCountdown(countdown)}. Available ${releaseLabel}.`);
    return;
  }
  document.body.classList.remove('decimal-game-open', 'weight-game-open', 'measuring-game-open', 'rounding-game-open');
  ['decimal-fraction-game', 'weight-maths-game', 'measuring-game', 'rounding-game'].forEach(id => {
    document.getElementById(id).hidden = true;
  });
  document.body.classList.add(bodyClass);
  document.getElementById(gameId).hidden = false;
  generate();
  document.getElementById(inputId).focus();
}

function generateMeasuringProblem() {
  const conversions = [
    { from: 'mm', to: 'cm', factor: 10, max: 900 },
    { from: 'cm', to: 'mm', factor: 0.1, max: 900 },
    { from: 'cm', to: 'm', factor: 100, max: 900 },
    { from: 'm', to: 'cm', factor: 0.01, max: 900 },
    { from: 'm', to: 'km', factor: 1000, max: 900 },
    { from: 'km', to: 'm', factor: 0.001, max: 900 },
    { from: 'ml', to: 'l', factor: 1000, max: 900 },
    { from: 'l', to: 'ml', factor: 0.001, max: 900 }
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

function submitMeasuringAnswer(event) {
  event.preventDefault();
  if (measuringBusy) return;
  const input = document.getElementById('measuring-game-answer');
  const answer = parseDecimalOrFraction(input.value);
  const feedback = document.getElementById('measuring-game-feedback');
  if (!Number.isFinite(answer)) {
    feedback.textContent = 'Enter a number for your measurement.';
    feedback.className = 'practice-feedback incorrect';
    input.focus();
    return;
  }
  measuringBusy = true;
  const question = document.getElementById('measuring-game-question').textContent;
  if (Math.abs(answer - measuringExpected) < 1e-9) {
    stats.stars += 5;
    stats.correct++;
    feedback.textContent = 'Correct! +5 points 🎉';
    feedback.className = 'practice-feedback correct';
    addToHistory(`${question} ${answer} ✅ (+5)`);
  } else {
    stats.stars -= 2;
    stats.wrong++;
    feedback.textContent = 'Not quite. −2 points. Check the units and try the next one!';
    feedback.className = 'practice-feedback incorrect';
    addToHistory(`${question} ${input.value.trim()} ❌ (−2)`, true);
  }
  updateStatsUI();
  window.setTimeout(() => {
    generateMeasuringProblem();
    measuringBusy = false;
    input.focus();
  }, 900);
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

function setRoundingPlace(place) {
  roundingPlace = Number(place);
  document.querySelectorAll('.rounding-place-button').forEach(button => {
    button.classList.toggle('selected', Number(button.dataset.place) === roundingPlace);
  });
  generateRoundingProblem();
}

function submitRoundingAnswer(event) {
  event.preventDefault();
  if (roundingBusy) return;
  const input = document.getElementById('rounding-game-answer');
  const answer = parseDecimalOrFraction(input.value);
  const feedback = document.getElementById('rounding-game-feedback');
  if (!Number.isFinite(answer)) {
    feedback.textContent = 'Enter a rounded number.';
    feedback.className = 'practice-feedback incorrect';
    input.focus();
    return;
  }
  roundingBusy = true;
  const question = document.getElementById('rounding-game-question').textContent;
  if (answer === roundingExpected) {
    stats.stars += 5;
    stats.correct++;
    feedback.textContent = 'Correct! +5 points 🎉';
    feedback.className = 'practice-feedback correct';
    addToHistory(`${question} ${answer.toLocaleString('en-US')} ✅ (+5)`);
  } else {
    stats.stars -= 2;
    stats.wrong++;
    feedback.textContent = 'Not quite. −2 points. Check the place value and try the next one!';
    feedback.className = 'practice-feedback incorrect';
    addToHistory(`${question} ${input.value.trim()} ❌ (−2)`, true);
  }
  updateStatsUI();
  window.setTimeout(() => {
    generateRoundingProblem();
    roundingBusy = false;
    input.focus();
  }, 900);
}

function addScheduledPracticeTabs() {
  const navigation = document.querySelector('.container > .nav-buttons');
  const decimalButton = document.getElementById('decimal-fractions-button');
  if (!navigation || !decimalButton) return;

  const style = document.createElement('style');
  style.textContent = `
    #measuring-button, #rounding-button { color: #fff; border-color: #123; font-size: .85rem; padding: 9px 14px; max-width: 100%; }
    #measuring-button { background: linear-gradient(110deg, #00a6a6, #2563eb); }
    #rounding-button { background: linear-gradient(110deg, #8b5cf6, #d946ef); }
    #measuring-button:hover { background: linear-gradient(110deg, #008888, #1d4ed8); }
    #rounding-button:hover { background: linear-gradient(110deg, #7040d0, #b832cf); }
    .measuring-game-open .container > .nav-buttons, .measuring-game-open #column-ui, .measuring-game-open .tutor-box,
    .rounding-game-open .container > .nav-buttons, .rounding-game-open #column-ui, .rounding-game-open .tutor-box { display: none !important; }
    .practice-game[hidden] { display: none; }
    .practice-game { width: 100%; text-align: center; padding: 8px 0; }
    .practice-game h2 { margin: 14px 0 8px; }
    .practice-question { margin: 22px 0; font-size: clamp(1.7rem, 6vw, 2.5rem); font-weight: bold; overflow-wrap: anywhere; }
    .practice-answer-form { display: flex; flex-direction: column; align-items: stretch; gap: 10px; max-width: 440px; margin: 0 auto; text-align: left; }
    .practice-answer-form label { font-weight: bold; }
    .practice-answer { min-height: 48px; border: 3px solid #222; border-radius: 9px; padding: 8px 12px; font-size: 1.2rem; }
    .practice-submit { background: linear-gradient(110deg, #00a6a6, #2563eb); color: #fff; padding: 10px; }
    .practice-feedback { min-height: 1.5em; font-weight: bold; }
    .practice-feedback.correct { color: #16752d; }
    .practice-feedback.incorrect { color: #c62828; }
    @media (max-width: 600px) { #measuring-button, #rounding-button { line-height: 1.4; } }
  `;
  document.head.append(style);

  const tabs = [
    { id: 'measuring-button', name: 'Measuring', release: MEASURING_RELEASE, gameId: 'measuring-game', bodyClass: 'measuring-game-open', label: '2nd January 2026', generate: generateMeasuringProblem, input: 'measuring-game-answer', color: 'measuring' },
    { id: 'rounding-button', name: 'Rounding', release: ROUNDING_RELEASE, gameId: 'rounding-game', bodyClass: 'rounding-game-open', label: '15th December 2026', generate: generateRoundingProblem, input: 'rounding-game-answer', color: 'rounding' }
  ];
  tabs.forEach(tab => {
    const button = document.createElement('button');
    button.id = tab.id;
    button.className = 'btn';
    button.type = 'button';
    button.addEventListener('click', () => openScheduledPractice(tab.gameId, tab.bodyClass, tab.release, tab.label, tab.generate, tab.input));
    decimalButton.after(button);
    const section = document.createElement('section');
    section.id = tab.gameId;
    section.className = 'practice-game';
    section.hidden = true;
    section.setAttribute('aria-labelledby', `${tab.gameId}-title`);
    const content = tab.name === 'Measuring'
      ? `<p class="game-rules">Practise converting metric measurements of length and capacity. Correct answers earn <strong>5 points</strong>; incorrect answers lose <strong>2 points</strong>.</p>`
      : `<p class="game-rules">Round numbers to the nearest 10, 100, or 1,000. Correct answers earn <strong>5 points</strong>; incorrect answers lose <strong>2 points</strong>.</p>
         <div class="game-controls" aria-label="Choose rounding place">
           <button class="btn rounding-place-button selected" type="button" data-place="10">Nearest 10</button>
           <button class="btn rounding-place-button" type="button" data-place="100">Nearest 100</button>
           <button class="btn rounding-place-button" type="button" data-place="1000">Nearest 1,000</button>
         </div>`;
    section.innerHTML = `
      <button class="btn game-back-button" type="button">← Back to maths</button>
      <h2 id="${tab.gameId}-title">${tab.name}</h2>
      ${content}
      <div id="${tab.gameId}-question" class="practice-question" aria-live="polite"></div>
      <form class="practice-answer-form">
        <label for="${tab.input}">Your answer:</label>
        <input id="${tab.input}" class="practice-answer" type="text" inputmode="decimal" autocomplete="off" placeholder="Answer" aria-describedby="${tab.gameId}-feedback">
        <button class="btn practice-submit" type="submit">Check answer</button>
      </form>
      <p id="${tab.gameId}-feedback" class="practice-feedback" aria-live="polite"></p>`;
    document.getElementById('weight-maths-game').after(section);
    section.querySelector('.game-back-button').addEventListener('click', () => {
      document.body.classList.remove(tab.bodyClass);
      section.hidden = true;
    });
    section.querySelector('.practice-answer-form').addEventListener('submit', tab.name === 'Measuring' ? submitMeasuringAnswer : submitRoundingAnswer);
    if (tab.name === 'Rounding') {
      section.querySelectorAll('.rounding-place-button').forEach(placeButton => {
        placeButton.addEventListener('click', () => setRoundingPlace(placeButton.dataset.place));
      });
    }
  });
  refreshReleaseButton('measuring-button', MEASURING_RELEASE, 'Measuring');
  refreshReleaseButton('rounding-button', ROUNDING_RELEASE, 'Rounding');
}

setupWeightMathsTab();
addScheduledPracticeTabs();
refreshDecimalFractionButton();
window.setInterval(() => {
  refreshDecimalFractionButton();
  refreshReleaseButton('weight-maths-button', WEIGHT_MATHS_RELEASE, 'Weight Maths');
  refreshReleaseButton('measuring-button', MEASURING_RELEASE, 'Measuring');
  refreshReleaseButton('rounding-button', ROUNDING_RELEASE, 'Rounding');
}, 1000);
document.getElementById('decimal-game-form').addEventListener('submit', submitDecimalFractionAnswer);
document.querySelectorAll('.format-button').forEach(button => {
  button.addEventListener('click', () => setDecimalFractionFormat(button.dataset.format));
});
document.querySelectorAll('.operation-button').forEach(button => {
  button.addEventListener('click', () => setDecimalFractionOperation(button.dataset.operation));
});
