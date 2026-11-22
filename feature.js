function parsePracticeAnswer(value) {
  const normalized = value.trim().replace(/,/g, '.');
  if (!normalized) return NaN;
  const fraction = normalized.match(/^([+-]?\d+(?:\.\d+)?)\s*\/\s*([+-]?\d+(?:\.\d+)?)$/);
  if (fraction) return Number(fraction[2]) === 0 ? NaN : Number(fraction[1]) / Number(fraction[2]);
  return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) ? Number(normalized) : NaN;
}

let decimalFractionFormat = 'decimal';
let decimalFractionOperation = 'add';
let decimalFractionExpected = 0;
let decimalFractionBusy = false;
const DECIMAL_DIVISORS = [2, 5, 10, 20, 25, 100, 1000, 10000];

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

  const first = makeOperand();
  let second = decimalFractionOperation === 'divide'
    ? (() => {
        const divisor = DECIMAL_DIVISORS[Math.floor(Math.random() * DECIMAL_DIVISORS.length)];
        return { value: divisor, display: String(divisor) };
      })()
    : makeOperand();
  let left = first;
  if (decimalFractionOperation === 'subtract' && left.value < second.value) [left, second] = [second, left];

  const symbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
  if (decimalFractionOperation === 'add') decimalFractionExpected = left.value + second.value;
  else if (decimalFractionOperation === 'subtract') decimalFractionExpected = left.value - second.value;
  else if (decimalFractionOperation === 'multiply') decimalFractionExpected = left.value * second.value;
  else decimalFractionExpected = left.value / second.value;

  document.getElementById('decimal-game-question').textContent = `${left.display} ${symbols[decimalFractionOperation]} ${second.display} = ?`;
  document.getElementById('decimal-game-answer').value = '';
  const feedback = document.getElementById('decimal-game-feedback');
  feedback.textContent = '';
  feedback.className = 'decimal-game-feedback';
}

function openDecimalFractionGame() {
  closeCatCatchGame();
  document.body.classList.add('decimal-game-open');
  document.getElementById('column-ui').hidden = true;
  document.querySelectorAll('.container > .nav-buttons').forEach(row => { row.hidden = true; });
  document.querySelector('.tutor-box').hidden = true;
  const game = document.getElementById('decimal-fraction-game');
  game.hidden = false;
  generateDecimalFractionProblem();
  document.getElementById('decimal-game-answer').focus();
}

function closeDecimalFractionGame() {
  document.body.classList.remove('decimal-game-open');
  document.getElementById('decimal-fraction-game').hidden = true;
  document.getElementById('column-ui').hidden = false;
  document.querySelectorAll('.container > .nav-buttons').forEach(row => { row.hidden = false; });
  document.querySelector('.tutor-box').hidden = false;
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

function submitDecimalFractionAnswer(event) {
  event.preventDefault();
  if (decimalFractionBusy) return;
  const input = document.getElementById('decimal-game-answer');
  const answer = parsePracticeAnswer(input.value);
  const feedback = document.getElementById('decimal-game-feedback');
  if (!Number.isFinite(answer)) {
    feedback.textContent = 'Enter a decimal or a fraction like 3/4.';
    feedback.className = 'decimal-game-feedback incorrect';
    input.focus();
    return;
  }

  decimalFractionBusy = true;
  const question = document.getElementById('decimal-game-question').textContent.replace(' = ?', ' =');
  if (Math.abs(answer - decimalFractionExpected) < 1e-9) {
    stats.stars += 5;
    stats.correct++;
    feedback.textContent = 'Correct! +5 points 🎉';
    feedback.className = 'decimal-game-feedback correct';
    addToHistory(`${question} ${input.value.trim()} ✅ (+5)`);
  } else {
    stats.stars -= 2;
    stats.wrong++;
    feedback.textContent = 'Not quite. −2 points. Try the next one!';
    feedback.className = 'decimal-game-feedback incorrect';
    addToHistory(`${question} ${input.value.trim()} ❌ (−2)`, true);
  }
  updateStatsUI();
  window.setTimeout(() => {
    generateDecimalFractionProblem();
    decimalFractionBusy = false;
    if (!document.getElementById('decimal-fraction-game').hidden) input.focus();
  }, 900);
}

// Cat Catch: catch each cat before it reaches the gate. The game is created
// here so the page's existing HTML remains simple and all controls work offline.
const catCatchState = {
  lives: 250,
  round: 1,
  normalTotal: 5,
  normalCaught: 0,
  giantCaught: false,
  escaped: 0,
  clicks: 0,
  requiredClicks: 1,
  progress: 0,
  interval: null,
  running: false,
  gameOver: false
};
const CAT_EMOJIS = ['🐈', '🐈‍⬛', '😺', '😸', '😹', '😻'];

function installCatCatchStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .decimal-game[hidden], #cat-catch-game[hidden] { display:none !important; }
    .decimal-game, #cat-catch-game { width:100%; text-align:center; padding:8px 0; }
    .decimal-game h2, #cat-catch-game h2 { margin:14px 0 8px; }
    .game-controls { display:flex; justify-content:center; flex-wrap:wrap; gap:10px; margin:14px 0; }
    .format-button.selected, .operation-button.selected { background:#b7f0c5; outline:3px solid #228b45; }
    .decimal-game-question, .cat-game-question { margin:22px 0; font-size:clamp(1.7rem,6vw,2.5rem); font-weight:bold; overflow-wrap:anywhere; }
    .decimal-answer-form { display:flex; flex-direction:column; gap:10px; max-width:440px; margin:0 auto; text-align:left; }
    .decimal-answer-form label { font-weight:bold; }
    .decimal-answer-form input { min-height:48px; border:3px solid #222; border-radius:9px; padding:8px 12px; font-size:1.2rem; }
    .decimal-submit-button { background:linear-gradient(110deg,#00a6a6,#2563eb); color:white; padding:10px; }
    .decimal-game-feedback { min-height:1.5em; font-weight:bold; }
    .decimal-game-feedback.correct { color:#16752d; }
    .decimal-game-feedback.incorrect { color:#c62828; }
    .game-back-button { margin-bottom:8px; }
    .cat-game-stats { display:flex; justify-content:center; gap:12px; flex-wrap:wrap; font-weight:bold; margin:15px 0; }
    .cat-gate-track { position:relative; height:170px; max-width:620px; margin:18px auto; border:4px solid #222; border-radius:14px; overflow:hidden; background:linear-gradient(#b8e9ff 0 65%,#8bc34a 65%); }
    .cat-gate { position:absolute; right:12px; bottom:10px; font-size:3rem; }
    .cat-runner { position:absolute; left:0; bottom:10px; font-size:3.3rem; transform:translateX(-50%); transition:left .1s linear; }
    .cat-progress { max-width:620px; height:18px; margin:0 auto 15px; border:2px solid #222; border-radius:10px; overflow:hidden; background:#fff; }
    .cat-progress-fill { width:0; height:100%; background:#ff8a65; transition:width .1s linear; }
    .cat-catch-button { min-width:190px; padding:12px 20px; font-size:1.1rem; background:#ffb74d; }
    .cat-game-message { min-height:1.5em; font-weight:bold; }
    .cat-game-rules { line-height:1.5; }
    body.cat-game-open .container > .nav-buttons, body.cat-game-open #column-ui, body.cat-game-open .tutor-box,
    body.decimal-game-open .container > .nav-buttons, body.decimal-game-open #column-ui, body.decimal-game-open .tutor-box { display:none !important; }
  `;
  document.head.append(style);
}

function setCatGameMessage(message) {
  document.getElementById('cat-game-message').textContent = message;
}

function currentCatIsGiant() {
  return catCatchState.normalCaught >= catCatchState.normalTotal && !catCatchState.giantCaught;
}

function updateCatCatchUI() {
  const state = catCatchState;
  const giant = currentCatIsGiant();
  const target = document.getElementById('cat-runner');
  document.getElementById('cat-lives').textContent = state.lives;
  document.getElementById('cat-round').textContent = `${state.round} / 100`;
  document.getElementById('cat-count').textContent = `${state.normalCaught} / ${state.normalTotal}${state.giantCaught ? ' + giant caught' : ''}`;
  document.getElementById('cat-click-count').textContent = `${state.clicks} / ${state.requiredClicks}`;
  target.textContent = giant ? '🐈‍⬛' : CAT_EMOJIS[(state.normalCaught + state.round) % CAT_EMOJIS.length];
  target.style.fontSize = giant ? '4.3rem' : '3.3rem';
  target.style.left = `${Math.max(3, Math.min(93, state.progress))}%`;
  document.getElementById('cat-progress-fill').style.width = `${Math.min(100, state.progress)}%`;
  document.getElementById('cat-catch-button').disabled = !state.running || state.gameOver;
}

function prepareNextCat() {
  const state = catCatchState;
  if (state.lives <= 0) {
    finishCatCatchGame(false);
    return;
  }
  if (state.normalCaught >= state.normalTotal && state.giantCaught) {
    if (state.round >= 100) {
      finishCatCatchGame(true);
      return;
    }
    state.round++;
    state.normalTotal = state.round * 5;
    state.normalCaught = 0;
    state.giantCaught = false;
    setCatGameMessage(`Round ${state.round}! The cats are getting quicker—catch them before the gate!`);
  }
  state.progress = 0;
  state.clicks = 0;
  state.requiredClicks = currentCatIsGiant()
    ? 85
    : state.round > 50 ? 7 + state.round - 51 : 1;
  updateCatCatchUI();
}

function advanceCatAfterEscape() {
  const state = catCatchState;
  state.lives--;
  state.escaped++;
  if (currentCatIsGiant()) state.giantCaught = true;
  else state.normalCaught++;
  setCatGameMessage(`A cat reached the gate! You lost one life. ${state.lives} lives left.`);
  prepareNextCat();
}

function tickCatCatchGame() {
  const state = catCatchState;
  if (!state.running || state.gameOver) return;
  // Ordinary cats get faster with each round; the giant is slower but takes 85 clicks.
  state.progress += currentCatIsGiant() ? 0.36 + state.round * 0.002 : 0.55 + state.round * 0.008;
  if (state.progress >= 100) {
    advanceCatAfterEscape();
    return;
  }
  updateCatCatchUI();
}

function catchCat() {
  const state = catCatchState;
  if (!state.running || state.gameOver) return;
  state.clicks++;
  if (state.clicks >= state.requiredClicks) {
    if (currentCatIsGiant()) {
      state.giantCaught = true;
      setCatGameMessage('Giant cat caught! Get ready for the next round!');
    } else {
      state.normalCaught++;
      setCatGameMessage('Cat caught! Keep going!');
    }
    prepareNextCat();
    return;
  }
  updateCatCatchUI();
}

function finishCatCatchGame(won) {
  const state = catCatchState;
  state.running = false;
  state.gameOver = true;
  if (state.interval) window.clearInterval(state.interval);
  state.interval = null;
  document.getElementById('cat-catch-button').disabled = true;
  setCatGameMessage(won
    ? 'Amazing! You caught every cat and giant through all 100 rounds! 🏆'
    : `Game over on round ${state.round}. You caught ${state.escaped} cats before your lives ran out.`);
  document.getElementById('cat-restart-button').hidden = false;
}

function beginCatCatchGame() {
  const state = catCatchState;
  if (state.interval) window.clearInterval(state.interval);
  Object.assign(state, { lives:250, round:1, normalTotal:5, normalCaught:0, giantCaught:false, escaped:0, clicks:0, requiredClicks:1, progress:0, running:true, gameOver:false });
  document.getElementById('cat-restart-button').hidden = true;
  setCatGameMessage('Catch the cats before they reach the gate!');
  updateCatCatchUI();
  state.interval = window.setInterval(tickCatCatchGame, 100);
}

function openCatCatchGame() {
  closeDecimalFractionGame();
  document.body.classList.add('cat-game-open');
  document.getElementById('cat-catch-game').hidden = false;
  if (!catCatchState.running && !catCatchState.gameOver) beginCatCatchGame();
  updateCatCatchUI();
}

function closeCatCatchGame() {
  document.body.classList.remove('cat-game-open');
  const panel = document.getElementById('cat-catch-game');
  if (panel) panel.hidden = true;
  if (catCatchState.interval) window.clearInterval(catCatchState.interval);
  catCatchState.interval = null;
  catCatchState.running = false;
}

function installGames() {
  const decimalGame = document.getElementById('decimal-fraction-game');
  if (!decimalGame) return;
  installCatCatchStyles();
  const decimalButton = document.getElementById('decimal-fractions-button');
  const catButton = document.createElement('button');
  catButton.id = 'cat-catch-button-entry';
  catButton.className = 'btn cat-catch-entry';
  catButton.type = 'button';
  catButton.textContent = '🐾 Cat Catch Game';
  catButton.addEventListener('click', openCatCatchGame);
  decimalButton.after(catButton);

  const catPanel = document.createElement('section');
  catPanel.id = 'cat-catch-game';
  catPanel.hidden = true;
  catPanel.innerHTML = `
    <button class="btn game-back-button" type="button" id="cat-game-back">← Back to maths</button>
    <h2>🐾 Cat Catch!</h2>
    <p class="cat-game-rules">Catch the cat with the button before it reaches the gate. You start with <strong>250 lives</strong> and can play up to <strong>100 rounds</strong>. Round 1 has 5 regular cats, with 5 more cats added each round. Every round also has one giant cat that needs 85 clicks. After round 50, regular cats need 7 clicks, then one extra click for each later round.</p>
    <div class="cat-game-stats"><span>❤️ Lives: <span id="cat-lives">250</span></span><span>🏁 Round: <span id="cat-round">1 / 100</span></span><span>🐱 Regular cats: <span id="cat-count">0 / 5</span></span><span>👆 Clicks: <span id="cat-click-count">0 / 1</span></span></div>
    <div class="cat-gate-track" aria-label="Cat running toward a gate"><span id="cat-runner" class="cat-runner">🐈</span><span class="cat-gate" aria-hidden="true">🚪</span></div>
    <div class="cat-progress" aria-hidden="true"><div id="cat-progress-fill" class="cat-progress-fill"></div></div>
    <button id="cat-catch-button" class="btn cat-catch-button" type="button">Catch the cat! 🐾</button>
    <p id="cat-game-message" class="cat-game-message" aria-live="polite">Catch the cats before they reach the gate!</p>
    <button id="cat-restart-button" class="btn" type="button" hidden>Play again</button>`;
  decimalGame.after(catPanel);

  document.getElementById('decimal-game-form').addEventListener('submit', submitDecimalFractionAnswer);
  document.getElementById('cat-game-back').addEventListener('click', closeCatCatchGame);
  document.getElementById('cat-catch-button').addEventListener('click', catchCat);
  document.getElementById('cat-restart-button').addEventListener('click', beginCatCatchGame);
  document.querySelectorAll('.format-button').forEach(button => button.addEventListener('click', () => setDecimalFractionFormat(button.dataset.format)));
  document.querySelectorAll('.operation-button').forEach(button => button.addEventListener('click', () => setDecimalFractionOperation(button.dataset.operation)));
}

installGames();
