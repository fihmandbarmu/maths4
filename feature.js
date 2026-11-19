// Practice modes release at local midnight on their scheduled dates.
const DECIMAL_FRACTION_RELEASE = new Date(2026, 11, 1, 0, 0, 0, 0);
const MATHS_PROBLEM_RELEASE = new Date(2026, 11, 4, 0, 0, 0, 0);
const TIME_PRACTICE_RELEASE = new Date(2026, 10, 14, 0, 0, 0, 0);
const WEIGHT_MATHS_RELEASE = new Date(2027, 01, 5, 0, 0, 0, 0);
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
    { from: '](#)*

