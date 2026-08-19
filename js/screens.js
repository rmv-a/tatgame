'use strict';

var ONB_SLIDES = [
  { icon: 'eye', title: 'Найди опасность', text: 'Сканируй сцены офиса и АЗС и находи нарушения пожарной безопасности за ограниченное время.' },
  { icon: 'book', title: 'Учись на каждом шаге', text: 'Каждое найденное нарушение — мини-урок: что произошло, почему опасно и как правильно действовать.' },
  { icon: 'trophy', title: 'Соревнуйся', text: 'Зарабатывай очки, звёзды и бейджи, поднимайся в рейтинге коллег и защищай свою команду.' },
  { icon: 'info', title: 'Важно знать', text: 'Игра — обучающий тренажёр. Она не заменяет официальный инструктаж по пожарной безопасности.' }
];

function starRow(n) {
  var s = '';
  for (var i = 0; i < 3; i++) s += '<i class="' + (i < n ? 'on' : '') + '">★</i>';
  return '<span class="stars">' + s + '</span>';
}

function totalStars() {
  var s = 0;
  Object.keys(S.levels).forEach(function (k) { s += S.levels[k].stars || 0; });
  return s;
}

function unreadCount() {
  return S.notifs.filter(function (n) { return !n.read; }).length;
}

function badgeIcon(b) {
  return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + b.icon + '</svg>';
}

function renderSplash() {
  $('#app').innerHTML =
    '<div class="screen splash">' +
      '<div class="logo"><img src="icon.png" alt="Огненный дозор"></div>' +
      '<div class="brand">ОГНЕННЫЙ ДОЗОР</div>' +
      '<div class="sub">Обучающая игра по пожарной безопасности</div>' +
      '<div class="bar"><i></i></div>' +
    '</div>';
}

function renderOnboarding() {
  var i = 0;
  function draw() {
    var s = ONB_SLIDES[i];
    $('#app').innerHTML =
      '<div class="screen onboard">' +
        '<div class="dots">' + ONB_SLIDES.map(function (_, k) { return '<i class="' + (k === i ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
        '<div class="art">' + ICO[s.icon] + '</div>' +
        '<div>' +
          '<h2>' + s.title + '</h2>' +
          '<p>' + s.text + '</p>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px;width:100%">' +
          '<button class="btn primary" id="o-next">' + (i === ONB_SLIDES.length - 1 ? 'Начать' : 'Далее') + '</button>' +
          '<button class="skip" id="o-skip">Пропустить</button>' +
        '</div>' +
      '</div>';
    $('#o-next').addEventListener('click', function () {
      i++;
      if (i >= ONB_SLIDES.length) finish();
      else draw();
    });
    $('#o-skip').addEventListener('click', finish);
  }
  function finish() {
    S.onboarded = true;
    save();
    route();
  }
  draw();
}

function renderRegister() {
  $('#app').innerHTML =
    '<div class="screen">' +
      '<div class="topbar"><h1>Создание профиля</h1></div>' +
      '<div class="content pad-top">' +
        '<div style="text-align:center;margin-bottom:6px">' +
          '<div class="reg-logo"><img src="icon.png" alt="Огненный дозор"></div>' +
          '<h2 style="font-size:24px;font-weight:900">Как к вам обращаться?</h2>' +
          '<p class="muted" style="margin-top:6px">Имя будет отображаться в игре и рейтинге</p>' +
        '</div>' +
        '<div class="card" style="margin-top:6px">' +
          '<div class="field"><label for="r-name">Ваше имя</label><input id="r-name" type="text" maxlength="24" placeholder="Например, Алексей" autocomplete="name"></div>' +
          '<div class="form-msg" id="r-err"></div>' +
          '<button class="btn primary" id="r-go">Создать профиль</button>' +
        '</div>' +
        '<div class="disclaimer" style="margin-top:14px">Профиль хранится локально на устройстве (офлайн-режим) и будет синхронизирован при следующем подключении к сети.</div>' +
      '</div>' +
    '</div>';
  function err(m) { $('#r-err').textContent = m; }
  $('#r-go').addEventListener('click', function () {
    var name = $('#r-name').value.trim();
    if (name.length < 2) return err('Введите имя (минимум 2 символа)');
    S.user = { name: name, email: null, track: null, dept: '' };
    save();
    go('role');
  });
  $('#r-name').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('#r-go').click(); });
}

function renderRole() {
  $('#app').innerHTML =
    '<div class="screen">' +
      '<div class="topbar"><h1>Выбор профиля</h1></div>' +
      '<div class="content pad-top">' +
        '<p class="muted" style="text-align:center;margin-bottom:4px">Выберите ваше основное место работы. От этого зависит рекомендуемый контент.</p>' +
        '<button class="role-card" id="r-office">' +
          '<span class="ico o">' + ic('home') + '</span>' +
          '<span style="flex:1"><h3>Офис</h3><p>Рабочие кабинеты, переговорные, серверная, кухня</p></span>' +
        '</button>' +
        '<button class="role-card" id="r-azs">' +
          '<span class="ico a">' + ic('zap') + '</span>' +
          '<span style="flex:1"><h3>АЗС</h3><p>Топливораздаточные колонки, зона слива, магазин</p></span>' +
        '</button>' +
        '<div class="disclaimer">Профиль можно будет сменить позже в настройках профиля.</div>' +
      '</div>' +
    '</div>';
  $('#r-office').addEventListener('click', function () { pick('office'); });
  $('#r-azs').addEventListener('click', function () { pick('azs'); });
  function pick(track) {
    S.user.track = track;
    S.user.dept = track === 'office' ? 'Центральный офис' : 'АЗС №42';
    addNotif('system', 'Профиль выбран', 'Профиль «' + TRACK_LABEL[track] + '» готов. Удачи в дозоре!');
    save();
    route();
  }
}

function renderHome() {
  var u = S.user;
  var di = dailyInfo();
  var stars = totalStars();
  var un = unreadCount();
  var done = di.done;
  $('#app').innerHTML =
    '<div class="screen">' +
      '<div class="topbar">' +
        '<h1>Огненный дозор</h1>' +
        '<button class="icon-btn" id="h-notif" aria-label="Уведомления">' + ic('bell') + (un ? '<span class="dot"></span>' : '') + '</button>' +
      '</div>' +
      '<div class="content pad-top">' +
        '<div class="offline-banner"><span class="spin"></span>Офлайн-режим · прогресс сохраняется локально</div>' +
        '<div class="hero">' +
          '<div><div class="hi">На смену заступает:</div><div class="name">' + esc(u.name) + '</div></div>' +
          '<div class="play-row">' +
            '<button class="btn play" id="h-play">' + ic('play') + ' Играть</button>' +
            '<div class="score"><b>' + S.totals.totalScore + '</b><span>очков</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="daily card">' +
          '<div class="dt">' +
            '<div style="display:flex;justify-content:space-between;align-items:center">' +
              '<h3>Ежедневное задание</h3>' +
              (done ? '<span class="chip ok">' + ic('check') + ' Выполнено</span>' : '') +
            '</div>' +
            '<p>' + esc(di.task.title) + ' · ' + esc(di.task.desc) + '</p>' +
            '<div class="bar"><i style="width:' + Math.min(100, di.progress / di.task.target * 100) + '%"></i></div>' +
          '</div>' +
        '</div>' +
        '<div class="stats-grid">' +
          '<div class="stat"><b>' + S.totals.levelsCompleted + '</b><span>уровней пройдено</span></div>' +
          '<div class="stat"><b>' + S.totals.hazardsFound + '</b><span>нарушений найдено</span></div>' +
          '<div class="stat"><b>' + stars + '</b><span>звёзд собрано</span></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
          '<button class="card" id="h-lb" style="display:flex;align-items:center;gap:10px;padding:14px">' + ic('trophy') + '<b>Рейтинг</b></button>' +
          '<button class="card" id="h-bg" style="display:flex;align-items:center;gap:10px;padding:14px">' + ic('star') + '<b>Бейджи</b></button>' +
          '<button class="card" id="h-pf" style="display:flex;align-items:center;gap:10px;padding:14px">' + ic('user') + '<b>Профиль</b></button>' +
          '<button class="card" id="h-st" style="display:flex;align-items:center;gap:10px;padding:14px">' + ic('gear') + '<b>Настройки</b></button>' +
        '</div>' +
      '</div>' +
    '</div>';
  $('#h-play').addEventListener('click', function () { go('levels'); });
  $('#h-notif').addEventListener('click', function () { go('notifications'); });
  $('#h-lb').addEventListener('click', function () { go('leaderboard'); });
  $('#h-bg').addEventListener('click', function () { go('badges'); });
  $('#h-pf').addEventListener('click', function () { go('profile'); });
  $('#h-st').addEventListener('click', function () { go('settings'); });
}

function renderLevels() {
  var html = '<div class="screen"><div class="topbar"><button class="back" id="l-back" aria-label="Назад">' + ICO.back + '</button><h1>Уровни</h1></div><div class="content pad-top">';
  for (var i = 0; i < LEVELS.length; i++) {
    var l = LEVELS[i];
    var prev = i === 0 ? null : S.levels[LEVELS[i - 1].id];
    var unlocked = i === 0 || (prev && prev.stars >= 1);
    var rec = S.levels[l.id];
    var isDone = rec && rec.stars >= 1;
    html +=
      '<button class="lvl ' + (isDone ? 'done' : '') + (unlocked ? '' : ' locked') + '" data-id="' + l.id + '" ' + (unlocked ? '' : 'disabled') + '>' +
        '<span class="num">' + (isDone ? '✓' : l.code.replace('L', '')) + '</span>' +
        '<span style="flex:1;min-width:0">' +
          '<h3>' + esc(l.title) + '</h3>' +
          '<p>' + esc(l.desc) + '</p>' +
          '<div style="margin-top:5px">' +
            '<span class="chip">' + TRACK_LABEL[l.track] + '</span> ' +
            '<span class="chip">' + DIFF_LABEL[l.difficulty] + '</span>' +
          '</div>' +
          (unlocked ? '<div style="margin-top:5px">' + (isDone ? starRow(rec.stars) : '<span class="muted" style="font-size:12.5px">Не пройден</span>') + '</div>' : '') +
        '</span>' +
        '<span class="best">' +
          (isDone ? '<b>' + rec.best + '</b><span>лучший счёт</span>' : (unlocked ? '' : '<span style="color:var(--muted);font-size:11px">Заблокирован</span>')) +
        '</span>' +
        '<span class="chev">›</span>' +
      '</button>';
  }
  html += '</div></div>';
  $('#app').innerHTML = html;
  $('#l-back').addEventListener('click', function () { go('home'); });
  $$('.lvl').forEach(function (el) {
    el.addEventListener('click', function () {
      var id = el.getAttribute('data-id');
      if (el.classList.contains('locked')) { toast('Сначала пройди предыдущий уровень'); return; }
      go('prestart', id);
    });
  });
}

function renderPrestart(id) {
  var l = levelById(id);
  if (!l) { go('levels'); return; }
  $('#app').innerHTML =
    '<div class="screen">' +
      '<div class="topbar"><button class="back" id="p-back" aria-label="Назад">' + ICO.back + '</button><h1>Уровень</h1></div>' +
      '<div class="content pad-top">' +
        '<div class="pre-hero">' +
          '<div class="lvl-badge">' + l.code + ' · ' + TRACK_LABEL[l.track] + ' · ' + DIFF_LABEL[l.difficulty] + '</div>' +
          '<h2>' + esc(l.title) + '</h2>' +
          '<p>' + esc(l.desc) + '</p>' +
        '</div>' +
        '<div class="param-row">' +
          '<div class="param"><b>' + (l.duration ? l.duration + ' с' : '∞') + '</b><span>таймер</span></div>' +
          '<div class="param"><b>' + l.hazards.length + '</b><span>нарушений</span></div>' +
          '<div class="param"><b>' + l.hints + '</b><span>подсказок</span></div>' +
          '<div class="param"><b class="' + (l.riskScale > 0 ? 'danger-c' : '') + '">' + (l.riskScale > 0 ? 'Активна' : 'Нет') + '</b><span>шкала риска</span></div>' +
        '</div>' +
        (l.isTutorial ? '<div class="disclaimer">Обучающий уровень: таймер отключён, шкала риска не растёт, подсказки доступны.</div>' : '') +
        '<div class="disclaimer">Цель: найди все нарушения' + (l.minPass < 100 ? ' и не допускай переполнения шкалы риска' : '') + '. Уровень завершится, когда будут найдены все нарушения или истечёт время.</div>' +
        '<button class="btn primary" id="p-start">' + ic('play') + ' Начать</button>' +
      '</div>' +
    '</div>';
  $('#p-back').addEventListener('click', function () { go('levels'); });
  $('#p-start').addEventListener('click', function () { go('game', id); });
}

function renderProfile() {
  var u = S.user;
  var earned = BADGES.filter(function (b) { return S.badges.indexOf(b.code) !== -1; });
  $('#app').innerHTML =
    '<div class="screen">' +
      '<div class="topbar"><button class="back" id="pf-back" aria-label="Назад">' + ICO.back + '</button><h1>Профиль</h1></div>' +
      '<div class="content pad-top pf">' +
        '<div class="pf-head">' +
          '<h2>' + esc(u.name) + '</h2>' +
          '<p>' + TRACK_LABEL[u.track] + ' · ' + esc(u.dept || 'Подразделение') + '</p>' +
        '</div>' +
        '<div class="stats-grid">' +
          '<div class="stat"><b>' + S.totals.levelsCompleted + '</b><span>уровней</span></div>' +
          '<div class="stat"><b>' + S.totals.hazardsFound + '</b><span>нарушений</span></div>' +
          '<div class="stat"><b>' + S.totals.streak + '</b><span>дней подряд</span></div>' +
        '</div>' +
        '<div class="pf-badges-head">' +
          '<h3 class="section-title">Бейджи</h3>' +
          '<button class="btn small ghost" id="pf-badges">Все ' + BADGES.length + '</button>' +
        '</div>' +
        '<div class="badges-grid">' +
          earned.slice(0, 4).map(function (b) { return badgeCardHtml(b, true); }).join('') +
        '</div>' +
        '<div class="disclaimer">Приложение — обучающий тренажёр и не заменяет официальный инструктаж по пожарной безопасности.</div>' +
      '</div>' +
    '</div>';
  $('#pf-back').addEventListener('click', function () { go('home'); });
  $('#pf-badges').addEventListener('click', function () { go('badges'); });
}

function badgeCardHtml(b, earnedFlag) {
  var earned = earnedFlag !== undefined ? earnedFlag : S.badges.indexOf(b.code) !== -1;
  return '<div class="badge-card ' + (earned ? '' : 'locked') + '">' +
    (earned ? '<span class="earned">' + ICO.check + '</span>' : '') +
    '<div class="ico" style="color:' + (earned ? '#2fae6d' : '#9aa2ad') + ';background:' + (earned ? '#e6f7ee' : '#eef0f4') + '">' + badgeIcon(b) + '</div>' +
    '<h4>' + esc(b.title) + '</h4><p>' + esc(b.desc) + '</p>' +
    '</div>';
}

function renderBadges() {
  $('#app').innerHTML =
    '<div class="screen">' +
      '<div class="topbar"><button class="back" id="b-back" aria-label="Назад">' + ICO.back + '</button><h1>Достижения</h1></div>' +
      '<div class="content pad-top">' +
        '<div class="badges-grid">' +
          BADGES.map(function (b) { return badgeCardHtml(b); }).join('') +
        '</div>' +
        '<p class="muted" style="font-size:13px;text-align:center">Бейджи выдаются автоматически при выполнении условий.</p>' +
      '</div>' +
    '</div>';
  $('#b-back').addEventListener('click', function () { go('profile'); });
}

function renderLeaderboard() {
  var tab = 'all';
  function draw() {
    var rows = SEED_PLAYERS.filter(function (p) { return tab === 'all' || p.t === tab; }).map(function (p) {
      return { n: p.n, t: p.t, s: p.s, me: false };
    });
    var mine = { n: S.user.name, t: S.user.track, s: S.totals.totalScore, me: true };
    if (tab === 'all' || mine.t === tab) rows.push(mine);
    rows.sort(function (a, b) { return b.s - a.s; });
    var html = '<div class="screen"><div class="topbar"><button class="back" id="lb-back" aria-label="Назад">' + ICO.back + '</button><h1>Рейтинг</h1></div><div class="content pad-top">' +
      '<div class="tabs">' +
        '<button class="' + (tab === 'all' ? 'on' : '') + '" data-t="all">Все</button>' +
        '<button class="' + (tab === 'office' ? 'on' : '') + '" data-t="office">Офис</button>' +
        '<button class="' + (tab === 'azs' ? 'on' : '') + '" data-t="azs">АЗС</button>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px">' +
        rows.map(function (r, i) {
          return '<div class="lb-item ' + (r.me ? 'me' : '') + '">' +
            '<span class="place ' + (i < 3 ? 'top' : '') + '">' + (i + 1) + '</span>' +
            '<span class="av" style="background:' + avatarColor(r.n) + '">' + initials(r.n) + '</span>' +
            '<span class="nm"><b>' + esc(r.n) + (r.me ? ' <span class="chip warn" style="padding:2px 8px">вы</span>' : '') + '</b><span>' + esc(TRACK_LABEL[r.t]) + '</span></span>' +
            '<span class="sc">' + r.s + '</span>' +
            '<span class="tr ' + (r.t === 'azs' ? 'a' : 'o') + '">' + (r.t === 'azs' ? 'АЗС' : 'Офис') + '</span>' +
            '</div>';
        }).join('') +
      '</div>' +
      '<p class="muted" style="font-size:12.5px;text-align:center;margin-top:6px">Офлайн-режим: рейтинг обновится после синхронизации с сервером.</p>' +
      '</div></div>';
    $('#app').innerHTML = html;
    $('#lb-back').addEventListener('click', function () { go('home'); });
    $$('.tabs button').forEach(function (b) {
      b.addEventListener('click', function () { tab = b.getAttribute('data-t'); draw(); });
    });
  }
  draw();
}

function renderSettings() {
  var track = S.user.track;
  function markTrack() {
    var o = $('#s-tr-office'), a = $('#s-tr-azs');
    o.classList.toggle('on', track === 'office');
    a.classList.toggle('on', track === 'azs');
  }
  $('#app').innerHTML =
    '<div class="screen">' +
      '<div class="topbar"><button class="back" id="s-back" aria-label="Назад">' + ICO.back + '</button><h1>Настройки</h1></div>' +
      '<div class="content pad-top" style="gap:12px">' +
        '<div class="card">' +
          '<h3 style="margin-bottom:4px">Профиль</h3>' +
          '<p class="muted" style="font-size:13px;margin-bottom:14px">Эти данные показываются в рейтинге и на главном экране</p>' +
          '<div class="field"><label for="s-name">Имя</label><input id="s-name" type="text" maxlength="24" value="' + esc(S.user.name) + '"></div>' +
          '<div class="field"><label for="s-dept">Подразделение</label><input id="s-dept" type="text" maxlength="40" value="' + esc(S.user.dept || '') + '"></div>' +
          '<div class="field"><label>Место работы</label>' +
            '<div class="role-select">' +
              '<button class="' + (track === 'office' ? 'on' : '') + '" id="s-tr-office">Офис</button>' +
              '<button class="' + (track === 'azs' ? 'on' : '') + '" id="s-tr-azs">АЗС</button>' +
            '</div>' +
          '</div>' +
          '<div class="form-msg" id="s-err"></div>' +
          '<button class="btn primary" id="s-save" style="width:100%">Сохранить</button>' +
        '</div>' +
        '<div class="set-row"><div><div class="l">Звук</div><div class="d">Звуковые эффекты игры</div></div><button class="switch ' + (S.settings.sound ? 'on' : '') + '" id="s-sound" aria-label="Звук"></button></div>' +
        '<div class="set-row"><div><div class="l">Вибрация</div><div class="d">Виброотклик при нахождении нарушения</div></div><button class="switch ' + (S.settings.vibrate ? 'on' : '') + '" id="s-vib" aria-label="Вибрация"></button></div>' +
        '<button class="btn danger" id="s-reset">Сбросить прогресс</button>' +
        '<div class="disclaimer">Огненный дозор · прототип v0.1.<br><br>Приложение является обучающим тренажёром и не заменяет официальный инструктаж по пожарной безопасности. Все сценарии должны быть согласованы с ответственным за пожарную безопасность / HSE.</div>' +
      '</div>' +
    '</div>';
  $('#s-back').addEventListener('click', function () { go('home'); });
  $('#s-tr-office').addEventListener('click', function () { track = 'office'; markTrack(); });
  $('#s-tr-azs').addEventListener('click', function () { track = 'azs'; markTrack(); });
  $('#s-save').addEventListener('click', function () {
    var name = $('#s-name').value.trim();
    if (name.length < 2) { $('#s-err').textContent = 'Введите имя (минимум 2 символа)'; return; }
    $('#s-err').textContent = '';
    S.user.name = name;
    S.user.dept = $('#s-dept').value.trim();
    S.user.track = track;
    save();
    toast('Профиль обновлён');
    go('home');
  });
  $('#s-sound').addEventListener('click', function () {
    S.settings.sound = !S.settings.sound;
    save();
    this.classList.toggle('on', S.settings.sound);
  });
  $('#s-vib').addEventListener('click', function () {
    S.settings.vibrate = !S.settings.vibrate;
    save();
    this.classList.toggle('on', S.settings.vibrate);
  });
  $('#s-reset').addEventListener('click', function () {
    modal('<h2>Сбросить прогресс?</h2><p class="muted" style="margin-bottom:14px">Уровни, звёзды, бейджи и рейтинг будут очищены. Профиль и настройки сохранятся.</p>' +
      '<div class="row"><button class="btn ghost" id="m-cancel" style="flex:1">Отмена</button><button class="btn danger" id="m-do" style="flex:1">Сбросить</button></div>', true);
    $('#m-cancel').addEventListener('click', closeModal);
    $('#m-do').addEventListener('click', function () {
      var user = S.user, settings = S.settings, onboarded = S.onboarded;
      S = defaultState();
      S.user = user; S.settings = settings; S.onboarded = onboarded;
      save();
      closeModal();
      toast('Прогресс сброшен');
      go('home');
    });
  });
}

function renderNotifications() {
  S.notifs.forEach(function (n) { n.read = true; });
  save();
  var html = '<div class="screen"><div class="topbar"><button class="back" id="n-back" aria-label="Назад">' + ICO.back + '</button><h1>Уведомления</h1></div><div class="content pad-top">';
  if (!S.notifs.length) html += '<div class="card" style="text-align:center;color:var(--muted)">Пока нет уведомлений</div>';
  html += S.notifs.map(function (n) {
    return '<div class="notif"><span class="dot"></span><div style="flex:1;min-width:0"><b>' + esc(n.title) + '</b><p>' + esc(n.body) + '</p><time>' + ago(n.ts) + '</time></div></div>';
  }).join('');
  html += '</div></div>';
  $('#app').innerHTML = html;
  $('#n-back').addEventListener('click', function () { go('home'); });
}
