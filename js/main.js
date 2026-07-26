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

/* ===== Website configurator (build & price) ===== */
(function () {
  var root = document.querySelector('.configurator');
  if (!root) return;
  var BASE = 349;
  var totalEl = document.getElementById('configTotal');
  var listEl = document.getElementById('configList');
  var quoteBtn = document.getElementById('configQuote');
  var addons = [].slice.call(root.querySelectorAll('.addon[data-price]'));

  function fmt(n) { return '€' + n.toLocaleString('en-IE'); }

  function render() {
    var total = BASE;
    var items = [{ name: 'Starter website', price: BASE, base: true }];
    addons.forEach(function (a) {
      if (a.getAttribute('aria-pressed') === 'true') {
        var price = parseInt(a.getAttribute('data-price'), 10) || 0;
        total += price;
        items.push({ name: a.getAttribute('data-name') || 'Add-on', price: price, base: false });
      }
    });
    if (totalEl) totalEl.textContent = fmt(total);
    if (listEl) {
      listEl.innerHTML = '';
      items.forEach(function (it) {
        var li = document.createElement('li');
        if (it.base) li.className = 'is-base';
        var nm = document.createElement('span'); nm.textContent = it.name;
        var pr = document.createElement('span'); pr.textContent = (it.base ? '' : '+') + fmt(it.price);
        li.appendChild(nm); li.appendChild(pr);
        listEl.appendChild(li);
      });
    }
    return { total: total, items: items };
  }

  addons.forEach(function (a) {
    a.addEventListener('click', function () {
      a.setAttribute('aria-pressed', a.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      render();
    });
  });

  if (quoteBtn) {
    quoteBtn.addEventListener('click', function () {
      var state = render();
      var form = document.getElementById('contactForm');
      if (form && form.message) {
        var lines = state.items.map(function (it) {
          return '• ' + it.name + ' (' + (it.base ? '' : '+') + fmt(it.price) + ')';
        });
        form.message.value = 'I’d like a quote for this build (from ' + fmt(state.total) + '):\n' + lines.join('\n') + '\n\nA bit about my business: ';
      }
      setTimeout(function () {
        var nameField = document.getElementById('name');
        if (nameField) nameField.focus({ preventScroll: true });
      }, 550);
    });
  }

  var moreBtn = document.getElementById('configMore');
  if (moreBtn) {
    moreBtn.addEventListener('click', function () {
      var box = root.querySelector('.config-addons');
      var open = box.classList.toggle('show-all');
      moreBtn.setAttribute('aria-expanded', String(open));
      moreBtn.textContent = open ? 'Show fewer add-ons' : 'Show 6 more add-ons';
    });
  }

  render();
})();

/* ===== Sales chat assistant (guided — never quotes a price) ===== */
(function () {
  var chat = document.getElementById('chat');
  if (!chat) return;
  var launch = document.getElementById('chatLaunch');
  var panel = document.getElementById('chatPanel');
  var closeBtn = document.getElementById('chatClose');
  var log = document.getElementById('chatLog');
  var chipBar = document.getElementById('chatChips');
  var form = document.getElementById('chatInput');
  var field = document.getElementById('chatField');
  var started = false;

  function goTo(hash) { window.location.hash = hash; }
  function bookCall() { var b = document.querySelector('.book-call'); if (b) b.click(); }

  var TOPICS = {
    build: {
      chip: 'What do you build?',
      keys: ['build', 'make', 'websites', 'what do you', 'offer', 'services', 'design'],
      answer: 'We design custom websites for local businesses — from a 5-page Starter site to full e-commerce and bigger builds, all made around your brand (never a template).',
      actions: [{ label: 'Design & price one', act: function () { goTo('#build'); } }, { label: 'See packages', act: function () { goTo('#plans'); } }]
    },
    price: {
      chip: 'How much does it cost?',
      keys: ['cost', 'price', 'how much', 'expensive', 'budget', 'pricing', 'quote', 'cheap'],
      answer: 'It depends on exactly what you need — the quickest way is to build your own package and see a starting price, then we confirm an exact quote. No obligation.',
      actions: [{ label: 'Build & price it', act: function () { goTo('#build'); } }, { label: 'Get a quote', act: function () { goTo('#contact'); } }]
    },
    time: {
      chip: 'How long does it take?',
      keys: ['long', 'time', 'quick', 'fast', 'when', 'turnaround', 'ready'],
      answer: 'Usually about a week from our first call to going live — sometimes faster. You’ll see a live preview early, so there are no surprises.',
      actions: [{ label: 'Book a quick call', act: bookCall }]
    },
    seo: {
      chip: 'SEO & AI search?',
      keys: ['seo', 'google', 'rank', 'ai search', 'chatgpt', 'geo', 'found', 'search', 'perplexity'],
      answer: 'Every site is built to be found — on Google and on AI search like ChatGPT, Perplexity and Gemini (we call that GEO). Our monthly plans add fresh content to keep you climbing.',
      actions: [{ label: 'See the plans', act: function () { goTo('#plans'); } }]
    },
    offer: {
      chip: 'The founding offer',
      keys: ['offer', 'founding', 'deal', 'discount', 'spaces', 'special'],
      answer: 'The founding offer runs until 31 July: a full build, 12 months of Care and a year of blog content — 52 articles, one a week. It’s €200 to start, then €50/month for the year — or €400 up front and you save 50%. After the year, both carry on at €50/month.',
      actions: [{ label: 'Claim a space', act: function () { goTo('#contact'); } }]
    },
    ava: {
      chip: '',
      keys: ['ava', 'receptionist', 'phone', 'answer call', 'answer the phone', 'missed call'],
      answer: 'That’s Ava — our 24/7 AI phone receptionist. She answers every call and books straight into your calendar. Website + Ava is €279/month together (Care + Ava), on top of your one-off build.',
      actions: [{ label: 'Meet Ava', act: function () { window.location.href = 'receptionist.html'; } }]
    },
    quote: {
      chip: 'Get a quote',
      keys: ['contact', 'talk', 'human', 'enquire', 'email', 'get in touch', 'speak'],
      answer: 'Perfect — tell us a little about your business and we’ll come back fast with an exact price. You can also book a quick call.',
      actions: [{ label: 'Get a quote', act: function () { goTo('#contact'); } }, { label: 'Book a call', act: bookCall }]
    }
  };
  var DEFAULT_CHIPS = ['build', 'price', 'time', 'seo', 'offer', 'quote'];

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function openChat(open) {
    if (open) { panel.removeAttribute('hidden'); start(); setTimeout(function () { field.focus(); }, 60); }
    else { panel.setAttribute('hidden', ''); }
    launch.setAttribute('aria-expanded', String(open));
    chat.classList.toggle('is-open', open);
  }

  function addMsg(text, who) {
    var m = el('div', 'chat-msg chat-msg--' + who, text);
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
  }

  function addActions(actions) {
    if (!actions || !actions.length) return;
    var wrap = el('div', 'chat-actions');
    actions.forEach(function (a) {
      var b = el('button', 'chat-action', a.label);
      b.type = 'button';
      b.addEventListener('click', function () { a.act(); openChat(false); });
      wrap.appendChild(b);
    });
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
  }

  function renderChips() {
    chipBar.innerHTML = '';
    DEFAULT_CHIPS.forEach(function (key) {
      var t = TOPICS[key];
      if (!t || !t.chip) return;
      var c = el('button', 'chat-chip', t.chip);
      c.type = 'button';
      c.addEventListener('click', function () { answer(key, t.chip); });
      chipBar.appendChild(c);
    });
  }

  function answer(key, echo) {
    var t = TOPICS[key];
    if (echo) addMsg(echo, 'user');
    setTimeout(function () { addMsg(t.answer, 'bot'); addActions(t.actions); }, 240);
  }

  function match(text) {
    var q = text.toLowerCase();
    var found = null;
    Object.keys(TOPICS).forEach(function (key) {
      TOPICS[key].keys.forEach(function (kw) { if (!found && q.indexOf(kw) !== -1) found = key; });
    });
    return found;
  }

  function start() {
    if (started) return;
    started = true;
    addMsg('Hi! 👋 I can help you get a website sorted. What would you like to know?', 'bot');
    renderChips();
  }

  launch.addEventListener('click', function () { openChat(panel.hasAttribute('hidden')); });
  if (closeBtn) closeBtn.addEventListener('click', function () { openChat(false); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = field.value.trim();
    if (!text) return;
    addMsg(text, 'user');
    field.value = '';
    var key = match(text);
    setTimeout(function () {
      if (key) { addMsg(TOPICS[key].answer, 'bot'); addActions(TOPICS[key].actions); }
      else {
        addMsg('Good question! The quickest way is a proper answer from us — want to get a quote or book a quick call?', 'bot');
        addActions([{ label: 'Get a quote', act: function () { goTo('#contact'); } }, { label: 'Book a call', act: bookCall }]);
      }
    }, 240);
  });
})();
