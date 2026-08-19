'use strict';

var STORE_KEY = 'ognenny_dozor_v1';

function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function todayStr() {
  var d = new Date();
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

function yesterdayStr() {
  var d = new Date(Date.now() - 86400000);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

function ago(ts) {
  var m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return m + ' мин назад';
  var h = Math.floor(m / 60);
  if (h < 24) return h + ' ч назад';
  return Math.floor(h / 24) + ' дн назад';
}

function initials(name) {
  var p = String(name || '?').trim().split(/\s+/);
  return ((p[0] || '?')[0] + (p[1] || '')[0]).toUpperCase();
}

var AV_COLORS = ['#1f5f8b', '#2b7aa8', '#e0703a', '#3f8f5f', '#8a5fb0', '#b0404a', '#3a7f9e', '#a8783a', '#5a6fa5'];

function avatarColor(name) {
  var h = 0;
  for (var i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % 997;
  return AV_COLORS[h % AV_COLORS.length];
}

function defaultState() {
  return {
    user: null,
    onboarded: false,
    levels: {},
    totals: { hazardsFound: 0, wrongTaps: 0, hintsUsed: 0, levelsCompleted: 0, totalScore: 0, streak: 0, lastDay: null, flawless: 0 },
    badges: [],
    daily: { date: null, code: null, progress: 0, claimed: false },
    notifs: [],
    settings: { sound: true, vibrate: true }
  };
}

function loadState() {
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    var s = JSON.parse(raw);
    var d = defaultState();
    return {
      user: s.user || d.user,
      onboarded: !!s.onboarded,
      levels: s.levels || {},
      totals: Object.assign({}, d.totals, s.totals),
      badges: s.badges || [],
      daily: Object.assign({}, d.daily, s.daily),
      notifs: s.notifs || [],
      settings: Object.assign({}, d.settings, s.settings)
    };
  } catch (e) {
    return defaultState();
  }
}

var S = loadState();

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) {}
}

function addNotif(type, title, body) {
  S.notifs.unshift({ type: type, title: title, body: body, ts: Date.now(), read: false });
  if (S.notifs.length > 40) S.notifs.length = 40;
  save();
}

/* ---------------- звук ---------------- */
var AC = null;
function ensureAudio() {
  if (!AC) {
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; }
  }
  if (AC && AC.state === 'suspended') AC.resume();
}
function beep(freq, dur, type, vol) {
  if (!S.settings.sound) return;
  ensureAudio();
  if (!AC) return;
  var o = AC.createOscillator();
  var g = AC.createGain();
  o.type = type || 'sine';
  o.frequency.value = freq;
  g.gain.value = vol || 0.12;
  o.connect(g); g.connect(AC.destination);
  var t = AC.currentTime;
  g.gain.setValueAtTime(vol || 0.12, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t); o.stop(t + dur);
}
function soundFind() { beep(660, 0.12, 'sine', 0.14); setTimeout(function () { beep(880, 0.16, 'sine', 0.12); }, 90); }
function soundWrong() { beep(160, 0.2, 'square', 0.08); }
function soundHint() { beep(520, 0.12, 'triangle', 0.1); }
function soundWin() { [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { beep(f, 0.16, 'triangle', 0.13); }, i * 130); }); }
function soundLose() { beep(220, 0.3, 'sine', 0.1); }

function vibrate(ms) {
  if (S.settings.vibrate && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} }
}

/* ---------------- тосты ---------------- */
function toast(msg, type) {
  var el = document.createElement('div');
  el.className = 'toast ' + (type || '');
  el.textContent = msg;
  $('#toast-root').appendChild(el);
  setTimeout(function () {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s';
    setTimeout(function () { el.remove(); }, 320);
  }, 2600);
}

/* ---------------- модалка ---------------- */
function modal(html, center) {
  var root = $('#modal-root');
  root.innerHTML = '<div class="overlay' + (center ? ' center' : '') + '"><div class="sheet">' + html + '</div></div>';
  $$('.overlay', root).forEach(function (o) {
    o.addEventListener('click', function (e) { if (e.target === o) closeModal(); });
  });
}
function closeModal() { $('#modal-root').innerHTML = ''; }

/* ---------------- иконки ---------------- */
var ICO = {
  back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  star: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  book: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v4a6 6 0 0 1-12 0zM6 5H3v2a4 4 0 0 0 4 4M18 5h3v2a4 4 0 0 1-4 4M12 13v5M8 21h8M9 18h6"/></svg>',
  info: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8h.01M12 12v4"/></svg>',
  bell: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  gear: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5h.2a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1h.1a2 2 0 1 1 0 4H21a1.6 1.6 0 0 0-1.6 1z"/></svg>',
  user: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  home: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
  target: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  zap: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>'
};

function ic(name, cls) {
  return '<span class="' + (cls || '') + '" aria-hidden="true">' + ICO[name] + '</span>';
}
