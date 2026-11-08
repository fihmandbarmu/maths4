let currentMode = 'add2';
let digitsCount = 2;
let isSubtraction = false;
let isDivision = false;
let numA = 0;
let numB = 0;
let isProcessing = false;
let stats = { stars: 0, correct: 0, wrong: 0 };
let consecutiveWrongs = 0;
let currentProblemStr = '';

const PLACE_NAMES = ['Ones', 'Tens', 'Hundreds', 'Thousands', 'Ten-thousands', 'Hundred-thousands', 'Millions', 'Ten-millions', 'Hundred-millions', 'Billions', 'Ten-billions', 'Hundred-billions', 'Trillions'];
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audioCtx = AudioContextClass ? new AudioContextClass() : null;

function playSound(type) {
  if (!audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = type === 'exchange' ? 'triangle' : type === 'correct' ? 'sine' : 'sawtooth';
    const startFrequency = type === 'correct' ? 300 : type === 'exchange' ? 500 : 180;
    osc.frequency.setValueAtTime(startFrequency, audioCtx.currentTime);
    if (type === 'correct') osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (error) {
    // Sound is optional; a browser audio limitation must not stop the maths game.
  }
}

function attachInputSanitizer(input) {
  input.addEventListener('input', () => {
    input.value = input.value.replace(/[^0-9]/g, '');
    input.classList.remove('empty-error', 'wrong-input', 'correct-input');
  });
}

function updateStatsUI() {
  document.getElementById('stat-stars').textContent = stats.stars;
  document.getElementById('stat-correct').textContent = stats.correct;
  document.getElementById('stat-wrong').textContent = stats.wrong;
}

function addToHistory(text, isWrong = false) {
  const item = document.createElement('li');
  item.className = `history-item${isWrong ? ' wrong' : ''}`;
  item.textContent = text;
  document.getElementById('history-list').prepend(item);
}

function createCell(text = '', className = 'cell') {
  const cell = document.createElement('div');
  cell.className = className;
  cell.textContent = text;
  return cell;
}

function getCorrectPoints() {
  return digitsCount <= 6 ? 10 : digitsCount <= 11 ? 15 : 20;
}

function getPenaltyPoints() {
  return digitsCount <= 6 ? 1 : digitsCount <= 11 ? 2 : 3;
}

function setMode(mode) {
  if (isProcessing) return;
  currentMode = mode;
  digitsCount = Math.max(2, Math.min(12, parseInt(mode.replace(/\D/g, ''), 10) || 2));
  isSubtraction = mode.startsWith('sub');
  isDivision = mode.startsWith('div');
  if (isDivision) generateDivisionProblem();
  else generateColumnProblem();
}

function generateDivisionProblem() {
  consecutiveWrongs = 0;
  const min = 10 ** (digitsCount - 1);
  const max = 10 ** digitsCount - 1;
  numB = Math.floor(Math.random() * 8) + 2;
  const minQuotient = Math.ceil(min / numB);
  const maxQuotient = Math.floor(max / numB);
  numA = (Math.floor(Math.random() * (maxQuotient - minQuotient + 1)) + minQuotient) * numB;
  currentProblemStr = `${numA} ÷ ${numB}`;
  document.getElementById('problem-question').textContent = currentProblemStr;

  const grid = document.getElementById('column-grid');
  grid.replaceChildren();
  grid.style.gridTemplateColumns = `40px 20px repeat(${digitsCount}, 60px)`;

  grid.append(createCell(''), createCell(''));
  for (let i = 0; i < digitsCount; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.maxLength = 1;
    input.className = 'answer-input';
    input.id = `ans-div-${i}`;
    attachInputSanitizer(input);
    grid.appendChild(input);
  }

  grid.append(createCell(''), createCell(''));
  const line = createCell('', 'div-line');
  line.style.gridColumn = '3 / -1';
  grid.appendChild(line);
  grid.append(createCell(numB), createCell(')'));
  for (const digit of String(numA)) grid.appendChild(createCell(digit));

  for (let row = 0; row < 2; row++) {
    grid.append(createCell(''), createCell(''));
    for (let i = 0; i < digitsCount; i++) {
      const work = document.createElement('input');
      work.type = 'text';
      work.inputMode = 'numeric';
      work.maxLength = 2;
      work.className = 'exchange-box working-box';
      work.placeholder = 'rem';
      attachInputSanitizer(work);
      grid.appendChild(work);
    }
  }
  document.getElementById('tutor-msg').textContent = 'Divide from left to right. Enter the quotient in the green boxes.';
}

function generateColumnProblem() {
  consecutiveWrongs = 0;
  const min = 10 ** (digitsCount - 1);
  const max = 10 ** digitsCount - 1;
  const valA = Math.floor(Math.random() * (max - min + 1)) + min;
  const valB = currentMode.startsWith('mult')
    ? Math.floor(Math.random() * 8) + 2
    : Math.floor(Math.random() * (max - min + 1)) + min;

  if (isSubtraction) {
    numA = Math.max(valA, valB);
    numB = Math.min(valA, valB);
  } else {
    numA = valA;
    numB = valB;
  }
  const operator = isSubtraction ? '-' : currentMode.startsWith('mult') ? '×' : '+';
  currentProblemStr = `${numA} ${operator} ${numB}`;
  document.getElementById('problem-question').textContent = currentProblemStr;

  const grid = document.getElementById('column-grid');
  grid.replaceChildren();
  const cols = digitsCount + 1;
  grid.style.gridTemplateColumns = `repeat(${cols}, 65px)`;

  const labels = ['Tn', 'Hn', 'Tb', 'Bn', 'Hm', 'Tm', 'M', 'HTh', 'TTh', 'Th', 'H', 'T', 'O'];
  labels.slice(labels.length - cols).forEach(label => grid.appendChild(createCell(label, 'place-header')));

  grid.appendChild(createCell(''));
  for (let p = digitsCount - 1; p >= 0; p--) {
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.maxLength = 2;
    input.className = 'exchange-box';
    input.id = `carry-${p}`;
    input.placeholder = isSubtraction ? 'new' : '1';
    attachInputSanitizer(input);
    grid.appendChild(input);
  }

  grid.appendChild(createCell(''));
  for (const digit of String(numA).padStart(digitsCount, ' ')) grid.appendChild(createCell(digit));
  grid.appendChild(createCell(operator));
  for (const digit of String(numB).padStart(digitsCount, ' ')) grid.appendChild(createCell(digit));

  const line = createCell('', 'line');
  line.style.gridColumn = '1 / -1';
  grid.appendChild(line);

  for (let i = 0; i < cols; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.maxLength = 1;
    input.className = 'answer-input';
    input.id = `ans-${cols - 1 - i}`;
    attachInputSanitizer(input);
    grid.appendChild(input);
  }

  document.getElementById('tutor-msg').textContent = isSubtraction
    ? 'Subtract from right to left. If you borrow, write the new value in the yellow box.'
    : currentMode.startsWith('mult')
      ? 'Multiply from right to left. Write any carried tens in the yellow boxes.'
      : 'Add from the Ones column. Write any carried numbers in the yellow boxes.';
}

function getExpectedExchanges() {
  const expected = {};
  if (currentMode.startsWith('add')) {
    let carry = 0;
    for (let p = 0; p < digitsCount; p++) {
      const a = Math.floor(numA / 10 ** p) % 10;
      const b = Math.floor(numB / 10 ** p) % 10;
      carry = Math.floor((a + b + carry) / 10);
      expected[p + 1] = carry ? String(carry) : '';
    }
  } else if (currentMode.startsWith('mult')) {
    let carry = 0;
    for (let p = 0; p < digitsCount; p++) {
      const a = Math.floor(numA / 10 ** p) % 10;
      carry = Math.floor((a * numB + carry) / 10);
      expected[p + 1] = carry ? String(carry) : '';
    }
  } else if (isSubtraction) {
    const digits = Array.from({ length: digitsCount }, (_, p) => Math.floor(numA / 10 ** p) % 10);
    const modified = new Array(digitsCount).fill(false);
    for (let p = 0; p < digitsCount; p++) {
      const bottom = Math.floor(numB / 10 ** p) % 10;
      if (digits[p] < bottom) {
        let source = p + 1;
        while (source < digitsCount && digits[source] === 0) source++;
        if (source < digitsCount) {
          digits[source]--;
          modified[source] = true;
          for (let j = source - 1; j > p; j--) {
            digits[j] = 9;
            modified[j] = true;
          }
          digits[p] += 10;
          modified[p] = true;
        }
      }
    }
    for (let p = 0; p < digitsCount; p++) expected[p] = modified[p] ? String(digits[p]) : '';
  }
  return expected;
}

function checkAnswer() {
  if (isProcessing) return;
  isProcessing = true;
  const checkButton = document.getElementById('btn-check-ans');
  checkButton.disabled = true;

  const expected = isDivision ? numA / numB : isSubtraction ? numA - numB : currentMode.startsWith('mult') ? numA * numB : numA + numB;
  const cols = isDivision ? digitsCount : digitsCount + 1;
  const answerIds = isDivision
    ? Array.from({ length: digitsCount }, (_, i) => `ans-div-${i}`)
    : Array.from({ length: cols }, (_, i) => `ans-${cols - 1 - i}`);
  const values = answerIds.map(id => document.getElementById(id));
  const hasInput = values.some(input => input.value !== '');
  if (!hasInput) {
    document.getElementById('tutor-msg').textContent = 'Enter your answer in the green boxes, then check it.';
    values.forEach(input => input.classList.add('empty-error'));
    playSound('wrong');
    isProcessing = false;
    checkButton.disabled = false;
    return;
  }

  const userAnswer = Number(values.map(input => input.value || '0').join(''));
  let exchangesCorrect = true;
  if (!isDivision) {
    const expectedExchanges = getExpectedExchanges();
    for (let p = 0; p < digitsCount; p++) {
      const input = document.getElementById(`carry-${p}`);
      const wanted = expectedExchanges[p] || '';
      if (input && input.value !== wanted && !(wanted === '' && input.value === '0')) {
        input.classList.add('wrong-input');
        exchangesCorrect = false;
      } else if (input && wanted !== '') {
        input.classList.add('correct-input');
      }
    }
  }

  if (userAnswer === expected && exchangesCorrect) {
    playSound('correct');
    stats.stars += getCorrectPoints();
    stats.correct++;
    updateStatsUI();
    addToHistory(`${currentProblemStr} = ${expected} ✅`);
    document.getElementById('tutor-msg').textContent = 'Great work! 🌟';
    setTimeout(() => {
      if (isDivision) generateDivisionProblem();
      else generateColumnProblem();
      isProcessing = false;
      checkButton.disabled = false;
    }, 1200);
    return;
  }

  playSound('wrong');
  stats.wrong++;
  consecutiveWrongs++;
  updateStatsUI();
  addToHistory(`${currentProblemStr} = ${userAnswer} ❌`, true);
  document.getElementById('tutor-msg').textContent = `Not quite—check the answer and yellow carry boxes. The answer is ${expected}.`;
  values.forEach(input => input.classList.add('wrong-input'));
  setTimeout(() => {
    isProcessing = false;
    checkButton.disabled = false;
  }, 400);
}

// Generate the first question after the deferred script runs.
setMode('add2');
