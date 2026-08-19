'use strict';

function pickDaily(seedStr) {
  var sum = 0;
  for (var i = 0; i < seedStr.length; i++) sum += seedStr.charCodeAt(i);
  var codes = Object.keys(DAILY_TASKS);
  return codes[sum % codes.length];
}

function ensureDaily() {
  if (S.daily.date !== todayStr()) {
    S.daily = { date: todayStr(), code: pickDaily(todayStr()), progress: 0, claimed: false };
    save();
  }
}

function dailyInfo() {
  ensureDaily();
  var t = DAILY_TASKS[S.daily.code];
  return { code: S.daily.code, task: t, progress: S.daily.progress, target: t.target, done: S.daily.claimed };
}

function dailyProgress(code) {
  ensureDaily();
  if (S.daily.claimed || S.daily.code !== code) return;
  var t = DAILY_TASKS[S.daily.code];
  S.daily.progress++;
  if (S.daily.progress >= t.target) {
    S.daily.claimed = true;
    S.totals.totalScore += 100;
    save();
    addNotif('reward', 'Ежедневное задание выполнено', 'Задание «' + t.title + '» выполнено. Начислено +100 очков.');
    toast('Ежедневное задание выполнено! +100', 'good');
    checkBadges();
  }
  save();
}

function touchActivity() {
  var t = todayStr();
  if (S.totals.lastDay === t) return;
  if (S.totals.lastDay === yesterdayStr()) S.totals.streak++;
  else S.totals.streak = 1;
  S.totals.lastDay = t;
  save();
  checkBadges();
}

function recordProgress(attempt) {
  var rec = S.levels[attempt.levelId] || { stars: 0, best: 0, plays: 0 };
  rec.plays++;
  if (attempt.passed) {
    rec.stars = Math.max(rec.stars, attempt.stars);
    if (attempt.score > (rec.best || 0)) rec.best = attempt.score;
    S.totals.levelsCompleted++;
    S.totals.totalScore += attempt.score;
    if (attempt.levelId === 'tutorial') {
      addNotif('system', 'Уровень пройден', 'Туториал завершён. Начался основной курс «Огненного дозора».');
    }
  }
  S.levels[attempt.levelId] = rec;

  ensureDaily();
  if (attempt.passed) {
    if (S.daily.code === 'complete_level') dailyProgress('complete_level');
    if (S.daily.code === 'no_hints' && attempt.hintsUsed === 0 && attempt.wrongTaps === 0) dailyProgress('no_hints');
  }
  checkBadges();
  save();
}

function checkBadges() {
  BADGES.forEach(function (b) {
    if (S.badges.indexOf(b.code) !== -1) return;
    var met = false;
    switch (b.code) {
      case 'first_watch': met = S.totals.levelsCompleted >= 1; break;
      case 'attentive': met = S.totals.hazardsFound >= 15; break;
      case 'office_master': met = (S.levels.office_adv && S.levels.office_adv.stars >= 1); break;
      case 'azs_guard': met = (S.levels.azs_adv && S.levels.azs_adv.stars >= 1); break;
      case 'flawless': met = S.totals.flawless >= 1; break;
      case 'streak7': met = S.totals.streak >= 7; break;
      case 'perfect_shift': met = (S.levels.exam && S.levels.exam.stars === 3); break;
    }
    if (met) badgeEarned(b.code);
  });
}

function badgeEarned(code) {
  var b = BADGES.filter(function (x) { return x.code === code; })[0];
  if (!b || S.badges.indexOf(code) !== -1) return;
  S.badges.push(code);
  S.totals.totalScore += 50;
  save();
  addNotif('reward', 'Новый бейдж: ' + b.title, b.desc + ' Начислено +50 очков.');
  toast('Бейдж «' + b.title + '» получен! +50', 'good');
}

var ROUTES = {
  'splash': renderSplash,
  'onboarding': renderOnboarding,
  'register': renderRegister,
  'role': renderRole,
  'home': renderHome,
  'levels': renderLevels,
  'prestart': renderPrestart,
  'profile': renderProfile,
  'badges': renderBadges,
  'leaderboard': renderLeaderboard,
  'settings': renderSettings,
  'notifications': renderNotifications
};

function go(name, param) {
  if (name === 'game') { startLevel(param); return; }
  var f = ROUTES[name];
  if (f) f(param);
}

function route() {
  if (!S.onboarded) return renderOnboarding();
  if (!S.user) return renderRegister();
  if (!S.user.track) return renderRole();
  var tut = S.levels.tutorial;
  if (!tut || tut.stars < 1) return renderPrestart('tutorial');
  return renderHome();
}

function init() {
  ensureDaily();
  touchActivity();
  renderSplash();
  setTimeout(route, 1000);

  window.addEventListener('offline', function () {
    toast('Нет соединения. Результаты сохраняются локально');
  });
  window.addEventListener('online', function () {
    toast('Соединение восстановлено');
  });
  if (!navigator.onLine) {
    addNotif('system', 'Офлайн-режим', 'Нет интернета: прогресс сохраняется локально и будет синхронизирован позже.');
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && typeof G !== 'undefined' && G && !G.over && !G.paused) pauseGame();
  });
}

document.addEventListener('DOMContentLoaded', init);
