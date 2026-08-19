'use strict';

var G = null;
var G_TIMER = null;

function levelById(id) {
  for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i];
  return null;
}

function fmtTime(sec) {
  var m = Math.floor(sec / 60), s = Math.round(sec - m * 60);
  return m + ':' + ('0' + s).slice(-2);
}

function startLevel(levelId) {
  var level = levelById(levelId);
  if (!level) return;
  G = {
    level: level,
    hazards: level.hazards.map(function (h) { var o = Object.assign({}, h); o.found = false; return o; }),
    foundHazards: [],
    score: 0, wrongTaps: 0, hintsUsed: 0, hintsLeft: level.hints,
    combo: 0, comboTier: 0,
    duration: level.duration || 0,
    elapsed: 0, timeLeft: level.duration || 0,
    risk: 0, paused: false, over: false, lastTick: Date.now()
  };
  G.riskRate = riskRateNow();
  renderGame();
  G_TIMER = setInterval(tick, 250);
}

function riskRateNow() {
  if (!G) return 0;
  var sum = 0;
  G.hazards.forEach(function (h) { if (!h.found) sum += SEV_RATE[h.severity]; });
  return sum * G.level.riskScale;
}

function tick() {
  if (!G || G.paused || G.over) return;
  var now = Date.now();
  var dt = Math.min((now - G.lastTick) / 1000, 1);
  G.lastTick = now;
  G.elapsed += dt;
  if (G.duration > 0) G.timeLeft = Math.max(0, G.duration - G.elapsed);
  if (G.level.riskScale > 0) {
    G.risk = Math.min(100, G.risk + G.riskRate * dt);
    if (G.risk >= 100) { finishGame(false, 'risk'); return; }
  }
  if (G.duration > 0 && G.timeLeft <= 0) { finishGame(false, 'time'); return; }
  updateHUD();
}

function renderGame() {
  var lvl = G.level;
  $('#app').innerHTML =
    '<div class="screen game">' +
      '<div class="game-hud">' +
        '<div class="hud-top">' +
          '<div class="hud-chip">' + ICO.clock + ' <b id="g-time">' + (G.duration ? fmtTime(G.duration) : '—') + '</b></div>' +
          '<div class="hud-chip">' + ICO.target + ' <b id="g-found">0/' + G.hazards.length + '</b></div>' +
          '<div style="flex:1"></div>' +
          '<div class="hud-chip">' + ICO.star + ' <b id="g-score">0</b></div>' +
          '<button class="icon-btn" id="g-pause" aria-label="Пауза" style="background:rgba(255,255,255,.09);box-shadow:none;color:#fff">' +
            '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg></button>' +
        '</div>' +
        '<div class="timer-bar' + (G.duration ? '' : '') + '"><i id="g-tbar" style="width:' + (G.duration ? '100%' : '100%') + '"></i></div>' +
        '<div class="risk-row">' +
          '<span class="risk-label">' + (G.level.riskScale > 0 ? 'РИСК' : 'ОБУЧЕНИЕ') + '</span>' +
          '<div class="risk-gauge"><i id="g-risk"></i></div>' +
          '<span class="pct" id="g-risk-pct">' + (G.level.riskScale > 0 ? '0%' : '') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="scene-wrap scene-bg-' + lvl.track + '" id="g-scene">' + lvl.scene() + '</div>' +
      '<div class="game-bottom">' +
        '<button class="btn ghost" id="g-pause-btn">Пауза</button>' +
        '<button class="btn accent" id="g-hint-btn" style="flex:1.4">Подсказка · <span id="g-hints">' + G.hintsLeft + '</span></button>' +
      '</div>' +
    '</div>';

  var wrap = $('#g-scene');
  wrap.addEventListener('click', onTap);
  wrap.addEventListener('touchstart', onTap, { passive: false });
  $('#g-pause').addEventListener('click', pauseGame);
  $('#g-pause-btn').addEventListener('click', pauseGame);
  $('#g-hint-btn').addEventListener('click', useHint);
}

function svgPoint(e) {
  var svg = $('#g-scene svg');
  if (!svg) return null;
  var rect = svg.getBoundingClientRect();
  var pt = e.touches && e.touches.length ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
  var vb = svg.viewBox.baseVal;
  return { x: (pt.x - rect.left) * (vb.width / rect.width), y: (pt.y - rect.top) * (vb.height / rect.height) };
}

function onTap(e) {
  if (!G || G.over || G.paused) return;
  e.preventDefault();
  var p = svgPoint(e);
  if (!p) return;
  for (var i = 0; i < G.hazards.length; i++) {
    var h = G.hazards[i];
    if (h.found) continue;
    var dx = p.x - h.cx, dy = p.y - h.cy;
    if (Math.sqrt(dx * dx + dy * dy) <= h.r) { onFound(h); return; }
  }
  onWrong();
}

function onFound(h) {
  h.found = true;
  G.foundHazards.push(h);
  G.combo++;
  G.comboTier = Math.min(3, Math.floor(G.combo / 3));
  var f = G.duration > 0 ? G.timeLeft / G.duration : 1;
  var bonus = f >= 0.8 ? 50 : f >= 0.6 ? 30 : f >= 0.4 ? 10 : 0;
  var pts = Math.round((100 + bonus) * (1 + 0.1 * G.comboTier));
  G.score += pts;
  G.risk = Math.max(0, G.risk - SEV_REDUCE[h.severity]);
  G.riskRate = riskRateNow();
  S.totals.hazardsFound++;
  dailyProgress('find_hazards');
  addRing(h.cx, h.cy, 'pop', 14);
  showFoundToast(h, pts);
  soundFind();
  vibrate(30);
  updateHUD();
  if (G.foundHazards.length === G.hazards.length) finishGame(true, 'all');
}

function onWrong() {
  G.wrongTaps++;
  G.combo = 0; G.comboTier = 0;
  G.score = Math.max(0, G.score - 20);
  G.risk = Math.min(100, G.risk + 5);
  S.totals.wrongTaps++;
  flashWrong();
  soundWrong();
  vibrate(40);
  updateHUD();
}

function useHint() {
  if (!G || G.over) return;
  if (G.hintsLeft <= 0) { toast('Подсказки закончились'); return; }
  G.hintsLeft--; G.hintsUsed++;
  G.score = Math.max(0, G.score - 30);
  G.combo = 0; G.comboTier = 0;
  S.totals.hintsUsed++;
  soundHint();
  var unfound = G.hazards.filter(function (h) { return !h.found; });
  if (unfound.length) {
    var h = unfound[Math.floor(Math.random() * unfound.length)];
    addRing(h.cx, h.cy, 'hint', h.r + 6);
    toast('Подсказка: зона подсвечена');
  }
  updateHUD();
}

function pauseGame() {
  if (!G || G.over) return;
  G.paused = true;
  modal(
    '<div class="close-row"><button class="icon-btn" id="m-close" aria-label="Закрыть">' + ICO.back + '</button></div>' +
    '<h2>Пауза</h2>' +
    '<div class="row" style="flex-direction:column;gap:10px">' +
      '<button class="btn primary" id="m-resume">Продолжить</button>' +
      '<button class="btn ghost" id="m-exit">Выйти из уровня</button>' +
    '</div>',
    true
  );
  $('#m-close').addEventListener('click', closeModal);
  $('#m-resume').addEventListener('click', function () { closeModal(); G.paused = false; G.lastTick = Date.now(); });
  $('#m-exit').addEventListener('click', function () { closeModal(); G.over = true; clearInterval(G_TIMER); G_TIMER = null; go('levels'); });
}

function addRing(cx, cy, kind, r) {
  var svg = $('#g-scene svg');
  if (!svg) return;
  var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
  c.setAttribute('class', 'rg-' + kind);
  c.setAttribute('style', 'transform-box:fill-box;transform-origin:center');
  svg.appendChild(c);
  setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, kind === 'hint' ? 3200 : 650);
}

function showFoundToast(h, pts) {
  var wrap = $('#g-scene');
  var el = document.createElement('div');
  el.className = 'found-toast';
  el.innerHTML = '<div class="t">' + esc(h.name) + ' · +' + pts + ' очков</div><div class="d">' + esc(h.why) + '</div>';
  wrap.appendChild(el);
  setTimeout(function () { el.remove(); }, 3600);
}

function flashWrong() {
  var wrap = $('#g-scene');
  var el = document.createElement('div');
  el.className = 'wrong-flash';
  wrap.appendChild(el);
  setTimeout(function () { el.remove(); }, 420);
}

function updateHUD() {
  var t = $('#g-time'); if (t) t.textContent = G.duration ? fmtTime(G.timeLeft) : '—';
  var f = $('#g-found'); if (f) f.textContent = G.foundHazards.length + '/' + G.hazards.length;
  var s = $('#g-score'); if (s) s.textContent = G.score;
  var h = $('#g-hints'); if (h) h.textContent = G.hintsLeft;
  var bar = $('#g-tbar');
  if (bar) {
    var pct = G.duration ? (G.timeLeft / G.duration * 100) : 100;
    bar.style.width = pct + '%';
    bar.parentNode.classList.toggle('low', G.duration > 0 && G.timeLeft <= 10 && G.timeLeft > 0);
  }
  var rg = $('#g-risk'); if (rg) rg.style.width = G.risk + '%';
  var rp = $('#g-risk-pct'); if (rp) rp.textContent = G.level.riskScale > 0 ? Math.round(G.risk) + '%' : '';
}

function finishGame(passed, reason) {
  if (G.over) return;
  G.over = true;
  clearInterval(G_TIMER); G_TIMER = null;
  var attempt = {
    levelId: G.level.id, passed: passed, reason: reason, stars: 0,
    score: G.score, wrongTaps: G.wrongTaps, hintsUsed: G.hintsUsed,
    found: G.foundHazards.map(function (h) { return h.id; }),
    missed: G.hazards.filter(function (h) { return !h.found; }).map(function (h) { return h.id; }),
    timeSpent: Math.round(G.elapsed), risk: Math.round(G.risk)
  };
  if (passed) {
    if (G.wrongTaps === 0 && G.hintsUsed === 0) {
      G.score += 100;
      S.totals.flawless++;
      attempt.score = G.score;
    }
    var maxHaz = G.hazards.length * 195;
    var pct = G.score / maxHaz;
    attempt.stars = (pct >= 0.9 && G.wrongTaps === 0) ? 3 : (pct >= 0.75 ? 2 : 1);
    recordProgress(attempt);
  }
  if (passed) soundWin(); else soundLose();
  vibrate(passed ? [40, 60, 40] : 80);
  save();
  renderResult(attempt);
}

function renderResult(a) {
  var lvl = levelById(a.levelId);
  var next = nextLevelId(a.levelId);
  var starsHtml = '';
  for (var i = 0; i < 3; i++) starsHtml += '<i class="' + (a.passed && i < a.stars ? 'on' : '') + '">★</i>';
  var reasonText = a.passed ? '' : (a.reason === 'risk' ? 'Шкала риска достигла 100%' : 'Время вышло');
  var cards = '';
  a.missed.forEach(function (id) {
    var h = lvl.hazards.filter(function (x) { return x.id === id; })[0];
    cards += reviewCard(h, 'm');
  });
  a.found.forEach(function (id) {
    var h = lvl.hazards.filter(function (x) { return x.id === id; })[0];
    cards += reviewCard(h, 'f');
  });
  if (!cards) cards = '<div class="card" style="text-align:center;color:var(--muted)">Все нарушения найдены. Отличная работа!</div>';

  var actions;
  if (a.passed) {
    actions =
      '<button class="btn ghost" id="r-retry">Повторить уровень</button>' +
      (next ? '<button class="btn primary" id="r-next">Следующий уровень</button>' : '') +
      '<button class="btn ghost" id="r-home" style="box-shadow:none;color:var(--muted)">На главную</button>';
  } else {
    actions =
      '<button class="btn primary" id="r-retry">Попробовать снова</button>' +
      '<button class="btn ghost" id="r-home" style="box-shadow:none;color:var(--muted)">На главную</button>';
  }

  $('#app').innerHTML =
    '<div class="screen result ' + (a.passed ? 'pass' : 'fail') + '">' +
      '<div style="padding:20px 20px 0;flex:1;display:flex;flex-direction:column">' +
        '<div style="text-align:center">' +
          '<div class="st-title">' + (a.passed ? 'Уровень пройден' : 'Уровень не пройден') + '</div>' +
          '<div class="big">' + a.score + '</div>' +
          '<div class="stars">' + starsHtml + '</div>' +
          (a.passed ? '' : '<div style="color:#ffd0d0;font-weight:700">' + reasonText + '</div>') +
        '</div>' +
        '<div class="panel">' +
          '<h3>Результат</h3>' +
          '<div class="res-rows">' +
            resRow('Найдено нарушений', a.found.length + ' / ' + lvl.hazards.length) +
            resRow('Ложные тапы', a.wrongTaps) +
            resRow('Подсказки', a.hintsUsed) +
            resRow('Время', fmtTime(a.timeSpent)) +
            resRow('Итоговый риск', a.risk + '%') +
            (a.passed && G && G.wrongTaps === 0 && G.hintsUsed === 0 ? resRow('Идеально', '+100 бонус') : '') +
          '</div>' +
        '</div>' +
        '<h3 class="section-title" style="margin-top:18px">Разбор нарушений</h3>' +
        cards +
        '<div class="res-actions">' + actions + '</div>' +
      '</div>' +
    '</div>';

  var r1 = $('#r-retry'); if (r1) r1.addEventListener('click', function () { startLevel(a.levelId); });
  var r2 = $('#r-next'); if (r2) r2.addEventListener('click', function () { go('prestart', next); });
  var r3 = $('#r-home'); if (r3) r3.addEventListener('click', function () { go('home'); });
}

function resRow(k, v) {
  return '<div class="rr"><span>' + k + '</span><b>' + v + '</b></div>';
}

function reviewCard(h, kind) {
  return '<div class="review-card ' + (kind === 'm' ? 'missed' : '') + '">' +
    '<div class="head">' + esc(h.name) +
      '<span class="badge ' + (kind === 'm' ? 'm' : 'f') + '">' + (kind === 'm' ? 'Пропущено' : 'Найдено') + '</span>' +
    '</div>' +
    '<div style="margin-top:6px"><span class="chip">' + esc(h.category) + '</span> <span class="chip ' + (h.severity === 'high' ? 'danger' : h.severity === 'medium' ? 'warn' : 'ok') + '">Опасность: ' + SEV_LABEL[h.severity].toLowerCase() + '</span></div>' +
    '<div class="why">' + esc(h.why) + '</div>' +
    '<div class="how"><b>Как правильно:</b> ' + esc(h.how) + '</div>' +
    '</div>';
}

function nextLevelId(currentId) {
  for (var i = 0; i < LEVELS.length; i++) {
    if (LEVELS[i].id === currentId) {
      return i + 1 < LEVELS.length ? LEVELS[i + 1].id : null;
    }
  }
  return null;
}
