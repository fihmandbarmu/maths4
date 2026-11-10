// The new practice mode opens on 1st December 2026 (local time).
const DECIMAL_FRACTION_RELEASE = new Date(2026, 11, 1, 0, 0, 0, 0);
const ALLOWED_DIVISORS = [2, 5, 10, 20, 25, 100, 1000, 10000];
let decimalFractionFormat = 'decimal';
let decimalFractionOperation = 'add';
let decimalFractionExpected = 0;
let decimalFractionBusy = false;

function getReleaseCountdown(now = new Date()) {
  if (now >= DECIMAL_FRACTION_RELEASE) return null;

  // Count whole calendar months first, then the remaining days and clock time.
  let months = (DECIMAL_FRACTION_RELEASE.getFullYear() - now.getFullYear()) * 12
    + DECIMAL_FRACTION_RELEASE.getMonth() - now.getMonth();
  const cursor = new Date(now);
  const originalDay = cursor.getDate();
  cursor.setDate(1);
  cursor.setMonth(cursor.getMonth() + months);
  const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  cursor.setDate(Math.min(originalDay, lastDay));
  if (cursor > DECIMAL_FRACTION_RELEASE) {
    months--;
    cursor.setDate(1);
    cursor.setMonth(cursor.getMonth() - 1);
    cursor.setDate(Math.min(originalDay, new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()));
  }

  let remaining = DECIMAL_FRACTION_RELEASE - cursor;
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

function refreshDecimalFractionButton() {
  const button = document.getElementById('decimal-fractions-button');
  if (!button) return;
  const countdown = getReleaseCountdown();
  if (!countdown) {
    button.textContent = 'Decimals & Fractions — Play!';
    button.setAttribute('aria-label', 'Play decimals and fractions');
  } else {
    const label = formatReleaseCountdown(countdown);
    button.textContent = `Decimals & Fractions — ${countdown.days}d ${String(countdown.hours).padStart(2, '0')}h ${String(countdown.minutes).padStart(2, '0')}m ${String(countdown.seconds).padStart(2, '0')}s`;
    button.setAttribute('aria-label', `Decimals and fractions available in ${label}`);
  }
}

function openDecimalFractionGame() {
  const countdown = getReleaseCountdown();
  if (countdown) {
    alert(`Coming in ${formatReleaseCountdown(countdown)}. Available 1st December 2026.`);
    return;
  }
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

refreshDecimalFractionButton();
window.setInterval(refreshDecimalFractionButton, 1000);
document.getElementById('decimal-game-form').addEventListener('submit', submitDecimalFractionAnswer);
document.querySelectorAll('.format-button').forEach(button => {
  button.addEventListener('click', () => setDecimalFractionFormat(button.dataset.format));
});
document.querySelectorAll('.operation-button').forEach(button => {
  button.addEventListener('click', () => setDecimalFractionOperation(button.dataset.operation));
});
