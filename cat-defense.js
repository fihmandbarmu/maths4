// Maths-powered cat tower defence. Enemy mice follow a visible path to the gate;
// answer a column problem between waves to earn lives and build another tower.
(() => {
  const state = {
    lives: 250, round: 1, towers: 1, mice: [], nextId: 1,
    spawned: 0, waveSize: 0, spawnCountdown: 0, shotCountdown: 0,
    interval: null, active: false, asking: false, over: false, expected: 0n
  };
  const byId = id => document.getElementById(id);

  function randomNumber(digits) {
    let text = String(Math.floor(Math.random() * 9) + 1);
    while (text.length < digits) text += String(Math.floor(Math.random() * 10));
    return BigInt(text);
  }
  function grouped(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function createQuestion() {
    const digits = Number(byId('tower-digits').value);
    const operation = byId('tower-operation').value;
    let a = randomNumber(digits);
    let b = randomNumber(digits);
    let symbol = '+';
    if (operation === 'subtract') {
      if (a < b) [a, b] = [b, a];
      state.expected = a - b;
      symbol = '−';
    } else if (operation === 'multiply') {
      state.expected = a * b;
      symbol = '×';
    } else if (operation === 'divide') {
      b = BigInt(Math.floor(Math.random() * 8) + 2);
      state.expected = a;
      a *= b;
      symbol = '÷';
    } else {
      state.expected = a + b;
    }

    const first = grouped(a);
    const second = grouped(b);
    const width = Math.max(first.length, second.length);
    byId('tower-column-question').innerHTML =
      `<div>${first.padStart(width, ' ')}</div><div>${symbol} ${second.padStart(width, ' ')}</div><div class="tower-column-rule"></div><div>?</div>`;
    byId('tower-answer').value = '';
    byId('tower-feedback').textContent = `Between waves: solve this ${digits}-digit ${operation} problem. Correct: +10 lives and one tower. Incorrect: −10 lives.`;
  }

  function render() {
    byId('tower-lives').textContent = state.lives;
    byId('tower-round').textContent = `${Math.min(state.round, 100)} / 100`;
    byId('tower-count').textContent = state.towers;
    byId('tower-mice-count').textContent = state.mice.length;
    const towerRow = byId('tower-emplacements');
    towerRow.replaceChildren();
    for (let i = 0; i < Math.min(state.towers, 12); i++) {
      const cat = document.createElement('span');
      cat.className = 'tower-cat';
      cat.textContent = '🐱';
      cat.title = `Cat tower ${i + 1}`;
      towerRow.append(cat);
    }
    const lane = byId('tower-lane');
    lane.querySelectorAll('.tower-mouse, .tower-shot').forEach(item => item.remove());
    state.mice.forEach(mouse => {
      const sprite = document.createElement('span');
      sprite.className = `tower-mouse${mouse.hp > 1 ? ' tower-armoured' : ''}`;
      sprite.textContent = mouse.hp > 1 ? '🐀' : '🐭';
      sprite.style.left = `${Math.max(1, Math.min(93, mouse.position))}%`;
      sprite.setAttribute('aria-label', `Mouse with ${mouse.hp} health`);
      lane.append(sprite);
    });
    byId('tower-wave-status').textContent = state.active
      ? `Wave ${state.round}: ${state.spawned} / ${state.waveSize} mice entered · ${state.mice.length} on the path`
      : state.over
        ? (state.lives > 0 ? 'Victory! The gate is safe after all 100 waves! 🏆' : `The gate was overrun on wave ${state.round}.`)
        : `Wave ${state.round} is ready. Solve the column problem to begin.`;
  }

  function showQuestion() {
    if (state.lives <= 0) return endGame(false);
    if (state.round > 100) return endGame(true);
    state.active = false;
    state.asking = true;
    byId('tower-wave-panel').hidden = true;
    byId('tower-question-panel').hidden = false;
    createQuestion();
    render();
  }

  function startWave() {
    if (state.over) return;
    state.asking = false;
    state.active = true;
    state.spawned = 0;
    state.waveSize = Math.min(4 + state.round, 20);
    state.spawnCountdown = 0;
    state.shotCountdown = 0;
    byId('tower-question-panel').hidden = true;
    byId('tower-wave-panel').hidden = false;
    render();
    state.interval = window.setInterval(tick, 100);
  }

  function submitAnswer(event) {
    event.preventDefault();
    if (!state.asking || state.over) return;
    const raw = byId('tower-answer').value.replace(/[ ,]/g, '');
    if (!/^\d+$/.test(raw)) {
      byId('tower-feedback').textContent = 'Enter a whole-number answer to start the wave.';
      byId('tower-answer').focus();
      return;
    }
    if (BigInt(raw) === state.expected) {
      state.lives += 10;
      state.towers++;
      byId('tower-feedback').textContent = 'Correct! +10 lives and a new cat tower joins the defence! 🐱';
    } else {
      state.lives -= 10;
      byId('tower-feedback').textContent = 'Not quite: −10 lives. The wave is still coming!';
    }
    render();
    if (state.lives <= 0) {
      state.lives = 0;
      endGame(false);
      return;
    }
    window.setTimeout(startWave, 800);
  }

  function tick() {
    if (!state.active || state.over) return;
    state.spawnCountdown--;
    if (state.spawned < state.waveSize && state.spawnCountdown <= 0) {
      state.spawned++;
      state.mice.push({ id: state.nextId++, position: 0, hp: state.round > 50 ? 1 + Math.floor((state.round - 50) / 10) : 1 });
      state.spawnCountdown = Math.max(5, 18 - Math.floor(state.round / 10));
    }

    // Mice move continuously toward the gate, faster in later waves.
    const speed = Math.min(0.85, 0.18 + state.round * 0.006);
    for (const mouse of state.mice) mouse.position += speed;
    const escaped = state.mice.filter(mouse => mouse.position >= 100).length;
    if (escaped) {
      state.lives = Math.max(0, state.lives - escaped);
      state.mice = state.mice.filter(mouse => mouse.position < 100);
      if (!state.lives) return endGame(false);
    }

    // Towers fire at the mouse nearest the gate. Tower count strengthens volleys.
    state.shotCountdown++;
    if (state.mice.length && state.shotCountdown >= Math.max(3, 13 - Math.floor(state.towers / 2))) {
      state.shotCountdown = 0;
      const target = state.mice.reduce((best, mouse) => mouse.position > best.position ? mouse : best);
      target.hp -= Math.max(1, Math.floor(state.towers / 4));
      if (target.hp <= 0) state.mice = state.mice.filter(mouse => mouse !== target);
    }

    render();
    if (state.spawned >= state.waveSize && state.mice.length === 0) {
      state.active = false;
      window.clearInterval(state.interval);
      state.interval = null;
      state.round++;
      window.setTimeout(showQuestion, 700);
    }
  }

  function endGame(won) {
    state.active = false;
    state.asking = false;
    state.over = true;
    if (state.interval) window.clearInterval(state.interval);
    state.interval = null;
    byId('tower-question-panel').hidden = true;
    byId('tower-wave-panel').hidden = false;
    byId('tower-restart').hidden = false;
    byId('tower-wave-status').textContent = won
      ? 'Victory! You defended the gate through all 100 waves! 🏆'
      : `Game over on wave ${state.round}. The mice reached the gate too many times.`;
    render();
  }

  function resetGame() {
    if (state.interval) window.clearInterval(state.interval);
    Object.assign(state, { lives:250, round:1, towers:1, mice:[], nextId:1, spawned:0, waveSize:0, spawnCountdown:0, shotCountdown:0, interval:null, active:false, asking:false, over:false, expected:0n });
    byId('tower-restart').hidden = true;
    byId('tower-question-panel').hidden = false;
    byId('tower-wave-panel').hidden = true;
    showQuestion();
  }

  function closeTowerGame() {
    if (state.interval) window.clearInterval(state.interval);
    state.interval = null;
    state.active = false;
    state.asking = false;
    document.body.classList.remove('cat-game-open');
    byId('cat-catch-game').hidden = true;
  }

  function openTowerGame() {
    document.body.classList.remove('decimal-game-open');
    byId('decimal-fraction-game').hidden = true;
    byId('column-ui').hidden = true;
    document.querySelectorAll('.container > .nav-buttons').forEach(row => { row.hidden = true; });
    document.querySelector('.tutor-box').hidden = true;
    document.body.classList.add('cat-game-open');
    byId('cat-catch-game').hidden = false;
    if (state.over) resetGame();
    else if (state.active) {
      state.interval = window.setInterval(tick, 100);
      byId('tower-question-panel').hidden = true;
      byId('tower-wave-panel').hidden = false;
      render();
    } else if (state.asking) {
      byId('tower-question-panel').hidden = false;
      byId('tower-wave-panel').hidden = true;
      render();
    } else resetGame();
  }

  function install() {
    const entry = byId('cat-catch-button-entry');
    const panel = byId('cat-catch-game');
    if (!entry || !panel) return;
    const newEntry = entry.cloneNode(true);
    newEntry.textContent = '🏰 Cat Tower Defence';
    newEntry.setAttribute('aria-label', 'Play Cat Tower Defence');
    entry.replaceWith(newEntry);
    newEntry.addEventListener('click', openTowerGame);

    panel.innerHTML = `
      <button id="tower-back" class="btn game-back-button" type="button">← Back to maths</button>
      <h2>🏰 Cat Tower Defence</h2>
      <p class="tower-rules">Protect the gate from moving mouse waves. Cat towers automatically target mice on the path. Between each wave, solve a column question to gain 10 lives and add a tower; a wrong answer costs 10 lives. Choose addition, subtraction, multiplication, or division and 1–12 digits. Mice get faster each wave and gain extra health after wave 50. Defend all 100 waves!</p>
      <section id="tower-question-panel" class="tower-question-panel" hidden>
        <h3>Maths break — prepare the next wave</h3>
        <div class="tower-options">
          <label>Operation <select id="tower-operation"><option value="add">Addition (+)</option><option value="subtract">Subtraction (−)</option><option value="multiply">Multiplication (×)</option><option value="divide">Division (÷)</option></select></label>
          <label>Digits <select id="tower-digits">${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1} digit${i ? 's' : ''}</option>`).join('')}</select></label>
          <button id="tower-new-question" class="btn" type="button">New question</button>
        </div>
        <div id="tower-column-question" class="tower-column-question" aria-live="polite"></div>
        <form id="tower-answer-form" class="tower-answer-form"><label for="tower-answer">Answer</label><input id="tower-answer" type="text" inputmode="numeric" autocomplete="off" placeholder="Type your answer"><button class="btn" type="submit">Check &amp; start wave</button></form>
        <p id="tower-feedback" aria-live="polite"></p>
      </section>
      <section id="tower-wave-panel" hidden>
        <div class="tower-hud"><span>❤️ Lives: <b id="tower-lives">250</b></span><span>🌊 Wave: <b id="tower-round">1 / 100</b></span><span>🐱 Towers: <b id="tower-count">1</b></span><span>🐭 Mice: <b id="tower-mice-count">0</b></span></div>
        <div class="tower-battlefield"><div id="tower-emplacements" class="tower-emplacements" aria-label="Cat towers"></div><div id="tower-lane" class="tower-lane"><span class="tower-gate" aria-label="Gate">🚪</span></div></div>
        <p id="tower-wave-status" class="tower-wave-status" aria-live="polite"></p>
        <button id="tower-restart" class="btn" type="button" hidden>Play again</button>
      </section>`;

    const style = document.createElement('style');
    style.textContent = `
      #cat-catch-game[hidden], #tower-question-panel[hidden], #tower-wave-panel[hidden] { display:none !important; }
      #cat-catch-game { width:100%; text-align:center; }
      .tower-rules { line-height:1.5; }
      .tower-hud { display:flex; justify-content:center; flex-wrap:wrap; gap:12px; margin:14px 0; font-weight:bold; }
      .tower-battlefield { position:relative; min-height:250px; max-width:760px; margin:15px auto; overflow:hidden; border:4px solid #222; border-radius:14px; background:linear-gradient(#b8e9ff 0 57%,#82bd53 57% 100%); }
      .tower-lane { position:absolute; inset:0; }
      .tower-gate { position:absolute; right:8px; bottom:14px; z-index:3; font-size:3.2rem; }
      .tower-emplacements { position:absolute; left:8px; bottom:18px; z-index:3; display:flex; flex-direction:column-reverse; gap:0; font-size:2rem; filter:drop-shadow(1px 2px 1px #333); }
      .tower-cat { display:block; line-height:1; }
      .tower-mouse { position:absolute; z-index:2; bottom:14px; font-size:2rem; transition:left .1s linear; }
      .tower-armoured { filter:drop-shadow(0 0 2px #222); }
      .tower-question-panel { padding:12px; border:3px dashed #315a82; border-radius:14px; background:#eef7ff; }
      .tower-options { display:flex; justify-content:center; align-items:center; flex-wrap:wrap; gap:10px; margin:12px 0; }
      .tower-options label { display:flex; align-items:center; gap:5px; font-weight:bold; }
      .tower-options select { min-height:38px; max-width:180px; }
      .tower-column-question { display:inline-block; min-width:190px; margin:12px auto; padding:8px 18px; text-align:right; font:bold clamp(1.5rem,5vw,2.4rem)/1.2 monospace; background:#fff; border:2px solid #333; border-radius:8px; white-space:pre; }
      .tower-column-rule { border-top:3px solid #222; margin:4px 0; }
      .tower-answer-form { display:flex; flex-direction:column; gap:8px; max-width:360px; margin:0 auto; text-align:left; }
      .tower-answer-form label { font-weight:bold; }
      .tower-answer-form input { min-height:46px; border:2px solid #222; border-radius:8px; padding:8px; font-size:1.1rem; }
      .tower-answer-form button, #tower-new-question, #tower-restart { padding:10px; background:#b7f0c5; }
      .tower-wave-status { min-height:1.5em; font-weight:bold; }
      body.cat-game-open .container > .nav-buttons, body.cat-game-open #column-ui, body.cat-game-open .tutor-box, body.decimal-game-open .container > .nav-buttons, body.decimal-game-open #column-ui, body.decimal-game-open .tutor-box { display:none !important; }
    `;
    document.head.append(style);
    byId('tower-back').addEventListener('click', closeTowerGame);
    byId('tower-answer-form').addEventListener('submit', submitAnswer);
    byId('tower-new-question').addEventListener('click', createQuestion);
    byId('tower-operation').addEventListener('change', createQuestion);
    byId('tower-digits').addEventListener('change', createQuestion);
    byId('tower-restart').addEventListener('click', resetGame);
    window.closeCatCatchGame = closeTowerGame;
    window.openCatCatchGame = openTowerGame;
  }

  install();
})();
