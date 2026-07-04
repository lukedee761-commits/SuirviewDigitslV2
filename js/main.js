/* SuirViewDigital v2 — interactions */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== Cal.com "Book a call" popup (same account as v1) =====
  var CAL_LINK = 'luke-stapleton-gffimi';
  var CAL_NAMESPACE = 'intro-call';
  (function (C, A, L) {
    var p = function (a, ar) { a.q.push(ar); };
    var d = C.document;
    C.Cal = C.Cal || function () {
      var cal = C.Cal, ar = arguments;
      if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; }
      if (ar[0] === L) {
        var api = function () { p(api, arguments); };
        var namespace = ar[1];
        api.q = api.q || [];
        if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); }
        else { p(cal, ar); }
        return;
      }
      p(cal, ar);
    };
  })(window, 'https://app.cal.com/embed/embed.js', 'init');
  Cal('init', CAL_NAMESPACE, { origin: 'https://cal.com' });
  Cal.ns[CAL_NAMESPACE]('ui', { hideEventTypeDetails: false, layout: 'month_view' });
  document.querySelectorAll('.book-call').forEach(function (btn) {
    btn.setAttribute('data-cal-namespace', CAL_NAMESPACE);
    btn.setAttribute('data-cal-link', CAL_LINK);
    btn.setAttribute('data-cal-config', '{"layout":"month_view"}');
  });

  // ===== Preloader curtain → hero choreography =====
  var preloader = document.querySelector('.preloader');
  function lift() {
    if (preloader) preloader.classList.add('done');
    document.documentElement.classList.add('loaded');
  }
  if (reduced) { lift(); }
  else {
    var lifted = false;
    var doLift = function () { if (!lifted) { lifted = true; setTimeout(lift, 350); } };
    window.addEventListener('load', doLift);
    setTimeout(doLift, 1200); // never hold the page hostage
  }

  // ===== Scroll reveals (resilient handler — no IntersectionObserver) =====
  var reveals = [].slice.call(document.querySelectorAll('.reveal'));

  // ===== Scroll spy for the rail =====
  var spyLinks = [].slice.call(document.querySelectorAll('.rail-index a'));
  var spySections = [].slice.call(document.querySelectorAll('[data-spy-target]'));
  function spy() {
    var mid = window.innerHeight * 0.4;
    var current = spySections[0] ? spySections[0].id : null;
    for (var i = 0; i < spySections.length; i++) {
      if (spySections[i].getBoundingClientRect().top <= mid) current = spySections[i].id;
    }
    spyLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-spy') === current); });
  }

  // ===== Progress bar =====
  var bar = document.getElementById('progressBar');
  function progress() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? h.scrollTop / max : 0;
    if (bar) bar.style.transform = 'scaleX(' + p + ')';
  }

  // ===== Counters =====
  var counters = [].slice.call(document.querySelectorAll('[data-count]'));
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduced) { el.textContent = prefix + target + suffix; return; }
    var t0 = null;
    function tick(t) {
      if (!t0) t0 = t;
      var k = Math.min((t - t0) / 1100, 1);
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ===== Unified scroll pipeline =====
  var ticking = false;
  function onFrame() {
    ticking = false;
    var trigger = window.innerHeight * 0.92;
    for (var i = reveals.length - 1; i >= 0; i--) {
      if (reveals[i].getBoundingClientRect().top < trigger) {
        reveals[i].classList.add('in');
        reveals.splice(i, 1);
      }
    }
    for (var j = counters.length - 1; j >= 0; j--) {
      if (counters[j].getBoundingClientRect().top < trigger) {
        runCounter(counters[j]);
        counters.splice(j, 1);
      }
    }
    spy();
    progress();
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(onFrame); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('load', onFrame);
  onFrame();

  // Safety net: never leave content invisible.
  setTimeout(function () {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }, 2500);

  // ===== Overlay menu =====
  var menuBtn = document.querySelector('.menu-btn');
  var overlay = document.getElementById('overlayMenu');
  function setMenu(open) {
    if (open) overlay.removeAttribute('hidden');
    else overlay.setAttribute('hidden', '');
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (menuBtn && overlay) {
    menuBtn.addEventListener('click', function () { setMenu(overlay.hasAttribute('hidden')); });
    overlay.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !overlay.hasAttribute('hidden')) setMenu(false);
    });
  }

  // ===== Accordions =====
  document.querySelectorAll('[data-acc-group]').forEach(function (group) {
    group.querySelectorAll('.acc-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        group.querySelectorAll('.acc-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
        btn.setAttribute('aria-expanded', String(!open));
      });
    });
  });

  // ===== Bento glow follows the cursor =====
  document.querySelectorAll('[data-glow]').forEach(function (tile) {
    tile.addEventListener('mousemove', function (e) {
      var r = tile.getBoundingClientRect();
      tile.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      tile.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // ===== Trailing cursor ring (fine pointers, motion allowed) =====
  var ring = document.querySelector('.glow-ring');
  if (ring && !reduced && window.matchMedia('(pointer: fine)').matches) {
    var tx = -100, ty = -100, rx = -100, ry = -100, active = false;
    document.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!active) { active = true; requestAnimationFrame(follow); }
    }, { passive: true });
    function follow() {
      rx += (tx - rx) * 0.16;
      ry += (ty - ry) * 0.16;
      ring.style.transform = 'translate(' + (rx - ring.offsetWidth / 2) + 'px,' + (ry - ring.offsetHeight / 2) + 'px)';
      requestAnimationFrame(follow);
    }
    document.querySelectorAll('a, button').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('hot'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('hot'); });
    });
  }

  // ===== Footer year =====
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // ===== Contact form → Formspree (same endpoint as v1) =====
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  if (form) {
    var submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var message = form.message.value.trim();

      if (!name || !email || !message) {
        setStatus('Please fill in your name, email and message.', 'err');
        (!name ? form.name : !email ? form.email : form.message).focus();
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus('Please enter a valid email address.', 'err');
        form.email.focus();
        return;
      }
      if (form.consent && !form.consent.checked) {
        setStatus('Please tick the box to confirm you’re happy to be contacted.', 'err');
        form.consent.focus();
        return;
      }

      var action = form.getAttribute('action') || '';
      if (action.indexOf('formspree.io/f/') === -1) {
        setStatus('Enquiries aren’t connected yet — please call 085 153 8421 or email Lukedigital489@gmail.com.', 'err');
        return;
      }

      setStatus('Sending…', 'ok');
      submitBtn.disabled = true;
      fetch(action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (res.ok) {
          setStatus('Thanks, ' + name + ' — I’ll be in touch shortly.', 'ok');
          form.reset();
        } else {
          return res.json().then(function (data) {
            var msg = (data && data.errors && data.errors.length)
              ? data.errors.map(function (er) { return er.message; }).join(', ')
              : 'Something went wrong. Please call 085 153 8421 or email Lukedigital489@gmail.com.';
            setStatus(msg, 'err');
          });
        }
      }).catch(function () {
        setStatus('Couldn’t send just now — please call 085 153 8421 or email Lukedigital489@gmail.com.', 'err');
      }).then(function () {
        submitBtn.disabled = false;
      });
    });

    function setStatus(text, type) {
      status.textContent = text;
      status.className = 'form-status ' + type;
    }
  }
})();
