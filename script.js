let currentMode = '';
let digitsCount = 2;
let isSubtraction = false;
let isDivision = false;
let numA = 0, numB = 0;

// Lock flag to prevent double clicking
let isProcessing = false;

// Tracking Variables
let stats = { stars: 0, correct: 0, wrong: 0 };
let consecutiveWrongs = 0; 
let currentProblemStr = "";

// Place names ordered right to left (0 = Ones, 1 = Tens, ...)
const PLACE_NAMES = ['O', 'T', 'H', 'Th', 'TTh', 'HTh', 'M'];

// Web Audio FX
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    if (type === 'correct') {
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'exchange') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(500, audioCtx.currentTime);
      osc.frequency.setValueAtTime(700, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    }
  } catch(e) {}
}

// Input sanitizer: strictly restricts allowed characters
function attachInputSanitizer(input, type = 'number') {
  input.addEventListener('input', function() {
    this.classList.remove('empty-error', 'wrong-input'); // Clear error states on type
    if (type === 'number') {
      this.value = this.value.replace(/[^0-9]/g, '');
    } else if (type === 'cross') {
      this.value = this.value.replace(/[^0-9/]/g, '');
    }
  });
}

function updateStatsUI() {
  document.getElementById('stat-stars').innerText = stats.stars;
  document.getElementById('stat-correct').innerText = stats.correct;
  document.getElementById('stat-wrong').innerText = stats.wrong;
}

function addToHistory(logText, isWrong = false) {
  const list = document.getElementById('history-list');
  const li = document.createElement('li');
  li.className = 'history-item';
  if (isWrong) li.classList.add('wrong');
  li.innerText = logText;
  list.prepend(li);
}

function setMode(mode) {
  if (isProcessing) return; 
  currentMode = mode;
  digitsCount = parseInt(mode.replace(/\D/g, ''), 10) || 2; 
  isSubtraction = mode.startsWith('sub');
  isDivision = mode.startsWith('div');
  
  if (isDivision) {
    generateDivisionProblem();
  } else {
    generateColumnProblem();
  }
}

function generateDivisionProblem() {
  consecutiveWrongs = 0;
  
  const minA = Math.pow(10, digitsCount - 1);
  const maxA = Math.pow(10, digitsCount) - 1;
  
  numB = Math.floor(Math.random() * 8) + 2; 
  
  let tempA = Math.floor(Math.random() * (maxA - minA + 1)) + minA;
  tempA = tempA - (tempA % numB);
  if (tempA < minA) tempA += numB;
  numA = tempA;

  currentProblemStr = `${numA} ÷ ${numB}`;

  const grid = document.getElementById('column-grid');
  grid.innerHTML = '';
  
  grid.style.gridTemplateColumns = `40px 20px repeat(${digitsCount}, 60px)`;

  grid.appendChild(createCell(''));
  grid.appendChild(createCell(''));
  for (let i = 0; i < digitsCount; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 1;
    input.className = 'answer-input';
    input.id = `ans-div-${i}`;
    attachInputSanitizer(input, 'number');
    grid.appendChild(input);
  }

  grid.appendChild(createCell(''));
  grid.appendChild(createCell(''));
  const line = document.createElement('div');
  line.className = 'div-line';
  line.style.gridColumn = `3 / -1`;
  grid.appendChild(line);

  grid.appendChild(createCell(numB));
  grid.appendChild(createCell(')'));
  const strA = numA.toString();
  for (let char of strA) {
    grid.appendChild(createCell(char));
  }

  for(let row = 0; row < 2; row++) {
    grid.appendChild(createCell(''));
    grid.appendChild(createCell(''));
    for (let i = 0; i < digitsCount; i++) {
      const workInput = document.createElement('input');
      workInput.type = 'text';
      workInput.maxLength = 2;
      workInput.className = 'exchange-box working-box';
      workInput.placeholder = "rem";
      attachInputSanitizer(workInput, 'number');
      grid.appendChild(workInput);
    }
  }

  document.getElementById('tutor-msg').innerHTML = 
    `Divide from left to right! Type your answers in the green boxes on top. Use the blue dotted boxes to write your remainders! ➗`;
}

function generateColumnProblem() {
  consecutiveWrongs = 0; 
  
  const minA = Math.pow(10, digitsCount - 1);
  const maxA = Math.pow(10, digitsCount) - 1;
  
  let valA = Math.floor(Math.random() * (maxA - minA + 1)) + minA;
  let valB;

  if (currentMode.startsWith('mult')) {
    valB = Math.floor(Math.random() * 8) + 2; 
  } else {
    const minB = Math.pow(10, digitsCount - 1);
    const maxB = Math.pow(10, digitsCount) - 1;
    valB = Math.floor(Math.random() * (maxB - minB + 2)) + minB;
  }

  if (isSubtraction) {
    numA = Math.max(valA, valB);
    numB = Math.min(valA, valB);
  } else {
    numA = valA;
    numB = valB;
  }

  const operatorSymbol = isSubtraction ? '-' : (currentMode.startsWith('mult') ? '×' : '+');
  currentProblemStr = `${numA} ${operatorSymbol} ${numB}`;

  const grid = document.getElementById('column-grid');
  grid.innerHTML = '';
  
  const cols = digitsCount + 1; 
  grid.style.gridTemplateColumns = `repeat(${cols}, 65px)`;

  const allHeaders = ['M', 'HTh', 'TTh', 'Th', 'H', 'T', 'O'];
  const headers = allHeaders.slice(allHeaders.length - cols);
  headers.forEach(h => grid.appendChild(createCell(h, 'place-header')));

  grid.appendChild(createCell('')); 
  for (let i = 1; i < cols; i++) {
    const placeIdx = cols - 1 - i; 
    const carryInput = document.createElement('input');
    carryInput.type = 'text';
    carryInput.maxLength = 2;
    carryInput.className = 'exchange-box';
    carryInput.id = `carry-${placeIdx}`;
    carryInput.placeholder = isSubtraction ? "new" : "1";
    attachInputSanitizer(carryInput, 'number');
    carryInput.oninput = () => {
      carryInput.value = carryInput.value.replace(/[^0-9]/g, '');
      carryInput.classList.remove('wrong-input', 'correct-input');
      playSound('exchange');
    };
    grid.appendChild(carryInput);
  }

  if (isSubtraction) {
    grid.appendChild(createCell(''));
    for (let i = 0; i < cols - 1; i++) {
      const crossInput = document.createElement('input');
      crossInput.type = 'text';
      crossInput.maxLength = 1;
      crossInput.className = 'cross-box';
      crossInput.placeholder = "/";
      attachInputSanitizer(crossInput, 'cross');
      grid.appendChild(crossInput);
    }
  }

  const strA = numA.toString().padStart(cols - 1, ' ');
  grid.appendChild(createCell('')); 
  for (let char of strA) grid.appendChild(createCell(char));

  const strB = numB.toString().padStart(cols - 1, ' ');
  grid.appendChild(createCell(operatorSymbol));
  for (let char of strB) grid.appendChild(createCell(char));

  const line = document.createElement('div');
  line.className = 'line';
  grid.appendChild(line);

  for (let i = 0; i < cols; i++) {
    const ansInput = document.createElement('input');
    ansInput.type = 'text';
    ansInput.maxLength = 1;
    ansInput.className = 'answer-input';
    ansInput.id = `ans-${cols - 1 - i}`; 
    attachInputSanitizer(ansInput, 'number');
    grid.appendChild(ansInput);
  }

  if (isSubtraction) {
    document.getElementById('tutor-msg').innerHTML = `Need to borrow? Type a <b>/</b> in the red box to cross out, then write the new value in the top box! ✂️`;
  } else if (currentMode.startsWith('mult')) {
    document.getElementById('tutor-msg').innerHTML = `Multiply from right to left! Carry any tens to the top yellow boxes! 🚀`;
  } else {
    document.getElementById('tutor-msg').innerHTML = `Start adding from the Ones column! Write any carried numbers in the top yellow boxes! 📦`;
  }
}

function createCell(text, className = 'cell') {
  const div = document.createElement('div');
  div.className = className;
  div.innerText = text;
  return div;
}

function getExpectedExchanges() {
  let expected = {};
  if (isDivision) return expected;

  if (currentMode.startsWith('add')) {
    let carry = 0;
    for (let p = 0; p < digitsCount; p++) {
      let dA = Math.floor(numA / Math.pow(10, p)) % 10;
      let dB = Math.floor(numB / Math.pow(10, p)) % 10;
      let sum = dA + dB + carry;
      carry = Math.floor(sum / 10);
      expected[p + 1] = carry > 0 ? carry.toString() : "";
    }
  } else if (currentMode.startsWith('mult')) {
    let carry = 0;
    for (let p = 0; p < digitsCount; p++) {
      let dA = Math.floor(numA / Math.pow(10, p)) % 10;
      let prod = dA * numB + carry;
      carry = Math.floor(prod / 10);
      expected[p + 1] = carry > 0 ? carry.toString() : "";
    }
  } else if (isSubtraction) {
    let digitsA = [];
    for (let p = 0; p < digitsCount; p++) {
      digitsA.push(Math.floor(numA / Math.pow(10, p)) % 10);
    }
    let modified = new Array(digitsCount).fill(false);
    for (let p = 0; p < digitsCount; p++) {
      let dB = Math.floor(numB / Math.pow(10, p)) % 10;
      if (digitsA[p] < dB) {
        let k = p + 1;
        while (k < digitsCount && digitsA[k] === 0) k++;
        if (k < digitsCount) {
          digitsA[k] -= 1;
          modified[k] = true;
          for (let j = k - 1; j > p; j--) {
            digitsA[j] = 9;
            modified[j] = true;
          }
          digitsA[p] += 10;
          modified[p] = true;
        }
      }
    }
    for (let p = 0; p < digitsCount; p++) {
      expected[p] = modified[p] ? digitsA[p].toString() : "";
    }
  }
  return expected;
}

function checkAnswer() {
  if (isProcessing) return;
  isProcessing = true;

  const checkBtn = document.getElementById('btn-check-ans');
  checkBtn.disabled = true;

  let expected;
  if (isDivision) { expected = numA / numB; } 
  else if (isSubtraction) { expected = numA - numB; } 
  else if (currentMode.startsWith('mult')) { expected = numA * numB; } 
  else { expected = numA + numB; }

  let userAnsStr = '';
  let hasInput = false;
  let emptyBoxes = []; // To track for our error state improvement
  const cols = isDivision ? digitsCount : digitsCount + 1;
  
  if (isDivision) {
    for (let i = 0; i < digitsCount; i++) {
      const inputEl = document.getElementById(`ans-div-${i}`);
      const val = inputEl.value.trim();
      if (val !== '') hasInput = true;
      else emptyBoxes.push(inputEl);
      userAnsStr += val;
    }
  } else {
    for (let i = cols - 1; i >= 0; i--) {
      const inputEl = document.getElementById(`ans-${i}`);
      const val = inputEl.value.trim();
      if (val !== '') hasInput = true;
      else emptyBoxes.push(inputEl);
      userAnsStr += val;
    }
  }

  // Improved Error Handling: Highlighting empty required boxes
  if (!hasInput) {
    document.getElementById('tutor-msg').innerHTML = "Don't forget to type in your answer before checking! 🤔";
    playSound('wrong');
    emptyBoxes.forEach(box => {
      // Force trigger animation reset
      box.classList.remove('empty-error');
      void box.offsetWidth; 
      box.classList.add('empty-error');
    });
    isProcessing = false;
    checkBtn.disabled = false;
    return;
  }

  let expectedExchanges = getExpectedExchanges();
  let exchangesCorrect = true;

  if (!isDivision) {
    for (let p = 0; p < digitsCount; p++) {
      let carryElem = document.getElementById(`carry-${p}`);
      if (carryElem) {
        let userVal = carryElem.value.trim();
        let expVal = expectedExchanges[p] || "";

        if (expVal !== "") {
          if (userVal === expVal) {
            carryElem.classList.add('correct-input');
            carryElem.classList.remove('wrong-input');
          } else {
            // Force animation restart for error improvement
            carryElem.classList.remove('wrong-input');
            void carryElem.offsetWidth; 
            carryElem.classList.add('wrong-input');
            carryElem.classList.remove('correct-input');
            exchangesCorrect = false;
          }
        } else {
          if (userVal !== "" && userVal !== "0") {
            carryElem.classList.remove('wrong-input');
            void carryElem.offsetWidth; 
            carryElem.classList.add('wrong-input');
            carryElem.classList.remove('correct-input');
            exchangesCorrect = false;
          } else {
            carryElem.classList.remove('wrong-input', 'correct-input');
          }
        }
      }
    }
  }

  const userAnsNum = parseInt(userAnsStr, 10);

  if (userAnsNum === expected && exchangesCorrect) {
    playSound('correct');
    stats.stars += 10;
    stats.correct++;
    updateStatsUI();
    addToHistory(`${currentProblemStr} = ${expected} ✅`, false);
    
    document.getElementById('tutor-msg').innerText = "Super star work! Fantastic calculation! 🌟";
    setTimeout(() => {
      isDivision ? generateDivisionProblem() : generateColumnProblem();
      isProcessing = false;
      checkBtn.disabled = false;
    }, 1800);
    return;
  }

  playSound('wrong');
  stats.stars -= 1;
  stats.wrong++;
  consecutiveWrongs++;
  updateStatsUI();

  let wrongPlaces = [];
  let formattedUserAns = "";
  let expStr = expected.toString();
  
  if (isDivision) {
     let paddedExp = expStr.padStart(digitsCount, ' ');
     for (let i = 0; i < digitsCount; i++) {
        let uInput = document.getElementById(`ans-div-${i}`);
        let uVal = uInput.value.trim();
        formattedUserAns += uVal === '' ? '_' : uVal;
        let expChar = paddedExp[i];
        let isZeroSpaceEquivalent = (expChar === ' ' && uVal === '0') || (expChar === '0' && uVal === '');
        
        if (uVal !== expChar && !isZeroSpaceEquivalent) {
            uInput.classList.remove('wrong-input');
            void uInput.offsetWidth; 
            uInput.classList.add('wrong-input');
            let placeIndex = digitsCount - 1 - i;
            wrongPlaces.push(PLACE_NAMES[placeIndex] || `Col ${placeIndex + 1}`);
        } else {
            uInput.classList.remove('wrong-input');
        }
     }
  } else {
     let paddedExp = expStr.padStart(cols, ' ');
     for (let i = cols - 1; i >= 0; i--) {
        let uInput = document.getElementById(`ans-${i}`);
        let uVal = uInput.value.trim();
        formattedUserAns += uVal === '' ? '_' : uVal;
        let expCharIndex = cols - 1 - i;
        let expChar = paddedExp[expCharIndex];
        
        let isZeroSpaceEquivalent = (expChar === ' ' && uVal === '0');

        if (uVal !== expChar && !isZeroSpaceEquivalent) {
            uInput.classList.remove('wrong-input');
            void uInput.offsetWidth; 
            uInput.classList.add('wrong-input');
            wrongPlaces.push(PLACE_NAMES[i] || `Col ${i + 1}`);
        } else {
            uInput.classList.remove('wrong-input');
        }
     }
  }

  formattedUserAns = formattedUserAns.replace(/^_+/, ''); 
  if (formattedUserAns === '') formattedUserAns = '0';
  addToHistory(`${currentProblemStr} = ${formattedUserAns} ❌`, true);

  wrongPlaces = [...new Set(wrongPlaces)].reverse();

  let hintText = `💡 <b>Hint:</b> Check the highlighted boxes!<br>`;
  if (wrongPlaces.length > 0) {
    hintText += `You have mistakes in the <b>${wrongPlaces.join(' and ')}</b> column(s).<br>`;
  }
  if (!exchangesCorrect) {
    hintText += `Check your top yellow carry/exchange boxes too!<br>`;
  }
  
  if (consecutiveWrongs >= 3) {
      if (currentMode.startsWith('add')) hintText += "Make sure you add any 1s you carried over to the top!";
      if (isSubtraction) hintText += "If the top number is smaller, you MUST cross out the neighbor and borrow 10!";
      if (currentMode.startsWith('mult')) hintText += "Multiply the bottom number by the top digit, and add your carried tens!";
      if (isDivision) hintText += "Check your remainders as you divide left to right!";
  } else {
      hintText += "Try fixing those specific boxes! You can do it! 💪";
  }

  document.getElementById('tutor-msg').innerHTML = hintText;
  
  setTimeout(() => {
    isProcessing = false;
    checkBtn.disabled = false;
  }, 400);
}

// Initialize default mode
setMode('add2');
