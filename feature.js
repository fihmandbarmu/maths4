// The new practice mode opens on 1st December 2026 (local time).
const DECIMAL_FRACTION_RELEASE = new Date(2026, 12, 1, 6, 2, 0, 0);
const WEIGHT_MATHS_RELEASE = new Date(2026, 11, 5, 0, 0, 0, 0);
const ALLOWED_DIVISORS = [2, 5, 10, 20, 25, 100, 1000, 10000];
let decimalFractionFormat = 'decimal';
let decimalFractionOperation = 'add';
let decimalFractionExpected = 0;
let decimalFractionBusy = false;
let weightOperation = 'add';
let weightExpected = 0;
let weightAnswerUnit = 'mg';
let weightBusy = false;

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
  document.body.classList.remove('weight-game-open');
  document.getElementById('weight-maths-game').hidden = true;
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
  document.body.classList.remove('decimal-game-open');
  document.getElementById('decimal-fraction-game').hidden = true;
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

setupWeightMathsTab();
refreshDecimalFractionButton();
window.setInterval(() => {
  refreshDecimalFractionButton();
  refreshReleaseButton('weight-maths-button', WEIGHT_MATHS_RELEASE, 'Weight Maths');
}, 1000);
document.getElementById('decimal-game-form').addEventListener('submit', submitDecimalFractionAnswer);
document.querySelectorAll('.format-button').forEach(button => {
  button.addEventListener('click', () => setDecimalFractionFormat(button.dataset.format));
});
document.querySelectorAll('.operation-button').forEach(button => {
  button.addEventListener('click', () => setDecimalFractionOperation(button.dataset.operation));
});
