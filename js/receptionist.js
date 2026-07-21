/* receptionist.js — sample-call player + missed-call cost calculator */
(function () {
  'use strict';

  /* ---------- waveform bars ---------- */
  var wave = document.getElementById('wave');
  if (wave) {
    var BARS = 56;
    var seed = 7;
    var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (var i = 0; i < BARS; i++) {
      var b = document.createElement('i');
      // conversational shape: peaks and lulls, not uniform noise
      var env = 0.35 + 0.65 * Math.abs(Math.sin(i / 4.5) * Math.cos(i / 11));
      b.style.height = Math.max(10, Math.round(env * rnd() * 100)) + '%';
      wave.appendChild(b);
    }
  }

  /* ---------- audio player ---------- */
  var audio = document.getElementById('sampleAudio');
  var btn = document.getElementById('playBtn');
  var fill = document.getElementById('tFill');
  var cur = document.getElementById('tCur');
  var dur = document.getElementById('tDur');
  var note = document.getElementById('playerNote');
  var bars = wave ? wave.querySelectorAll('i') : [];

  var fmt = function (s) {
    if (!isFinite(s)) return '--:--';
    var m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + (r < 10 ? '0' : '') + r;
  };

  var paintBars = function (pct) {
    for (var i = 0; i < bars.length; i++) {
      var played = (i / bars.length) * 100 <= pct;
      bars[i].style.opacity = played ? '1' : '0.32';
      bars[i].style.background = played ? 'var(--gold-light)' : 'var(--blue-bright)';
    }
  };
  paintBars(0);

  if (audio && btn) {
    var ICON_PLAY = '<path d="M8 5v14l11-7z"/>';
    var ICON_PAUSE = '<path d="M7 4h4v16H7zM13 4h4v16h-4z"/>';

    var MISSING_NOTE = 'Recording coming shortly — Ava is being recorded on a live booking call.';

    // If the recording isn't in place yet, fail honestly rather than silently.
    var disablePlayer = function () {
      btn.disabled = true;
      btn.style.opacity = '0.45';
      btn.style.cursor = 'not-allowed';
      btn.querySelector('svg').innerHTML = ICON_PLAY;
      try { audio.pause(); } catch (e) {}
      if (dur) dur.textContent = '--:--';
      if (note) note.textContent = MISSING_NOTE;
    };

    var enablePlayer = function () {
      btn.disabled = false;
      btn.style.opacity = '';
      btn.style.cursor = '';
    };

    // Start closed: the button only goes live once the browser confirms it has
    // real audio. The markup uses preload="metadata" so that answer arrives on
    // load — a missing file then fires `error` and we stay honestly disabled.
    // (Don't probe with fetch/HEAD: static hosts vary, and this server 500s on HEAD.)
    var onMeta = function () {
      enablePlayer();
      if (dur) dur.textContent = fmt(audio.duration);
      if (note) note.textContent = 'A real call with Ava — nothing scripted.';
    };

    disablePlayer();
    audio.addEventListener('error', disablePlayer);
    audio.addEventListener('loadedmetadata', onMeta);
    // Metadata can land before this script runs (cached file), in which case the
    // event has already fired and we'd stay disabled with a perfectly good recording.
    if (audio.readyState >= 1) { onMeta(); }

    btn.addEventListener('click', function () {
      if (audio.paused) { audio.play().catch(function () {}); }
      else { audio.pause(); }
    });

    audio.addEventListener('play', function () { btn.querySelector('svg').innerHTML = ICON_PAUSE; });
    audio.addEventListener('pause', function () { btn.querySelector('svg').innerHTML = ICON_PLAY; });
    audio.addEventListener('ended', function () {
      btn.querySelector('svg').innerHTML = ICON_PLAY;
      if (fill) fill.style.width = '0';
      if (cur) cur.textContent = '0:00';
      paintBars(0);
    });

    audio.addEventListener('timeupdate', function () {
      if (!audio.duration) return;
      var pct = (audio.currentTime / audio.duration) * 100;
      if (fill) fill.style.width = pct + '%';
      if (cur) cur.textContent = fmt(audio.currentTime);
      paintBars(pct);
    });

    // "Hear Ava" in the hero: scroll to the player, then actually start it.
    var heroPlay = document.querySelector('[data-play-sample]');
    if (heroPlay) {
      heroPlay.addEventListener('click', function () {
        setTimeout(function () {
          if (!btn.disabled && audio.paused) { btn.click(); }
        }, 600);
      });
    }
  }

  /* ---------- missed-call cost calculator ---------- */
  var cMissed = document.getElementById('cMissed');
  var cValue = document.getElementById('cValue');
  var cConv = document.getElementById('cConv');

  if (cMissed && cValue && cConv) {
    var euro = function (n) { return Math.round(n).toLocaleString('en-IE'); };
    var PLAN_YEAR = 249 * 12 + 50;

    var calc = function () {
      var missed = +cMissed.value;
      var value = +cValue.value;
      var conv = +cConv.value;

      var callsYear = missed * 52;
      var wonYear = callsYear * (conv / 100);
      var lost = wonYear * value;

      document.getElementById('vMissed').textContent = missed;
      document.getElementById('vValue').textContent = euro(value);
      document.getElementById('vConv').textContent = conv;
      document.getElementById('vCalls').textContent = euro(callsYear);
      document.getElementById('vWon').textContent = euro(wonYear);
      document.getElementById('vLost').textContent = euro(lost);

      var verdict = document.getElementById('vVerdict');
      if (!verdict) return;

      if (lost <= 0) {
        verdict.textContent = 'Move the sliders to see what the phone is costing you.';
        return;
      }
      var ratio = lost / PLAN_YEAR;
      if (ratio >= 1) {
        verdict.innerHTML = 'Ava costs <strong>€' + euro(PLAN_YEAR) + '</strong> a year. On your numbers she pays for herself <strong>' +
          (ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)) + '×</strong> over.';
      } else {
        verdict.innerHTML = 'Ava costs <strong>€' + euro(PLAN_YEAR) + '</strong> a year — more than these numbers suggest you’re losing. ' +
          'On this alone she wouldn’t pay for herself yet. Worth a chat before you spend anything.';
      }
    };

    [cMissed, cValue, cConv].forEach(function (el) { el.addEventListener('input', calc); });
    calc();
  }

  /* ---------- year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
