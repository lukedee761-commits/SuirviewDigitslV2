/* The six-layer hero: continuous scroll lighting + pointer specular.
   Kept out of main.js so the whole hero can be reverted by deleting two
   <link>/<script> tags and this file. Selectors are the `lyr-` namespace. */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- tap to open a layer (touch only) --------------------------------
     On a mouse, hover opens these. Touch has no hover, and leaving all six
     expanded pushed the pricing section 3.4 screens down the page — so on
     touch they collapse and this button opens one at a time. The layer name
     is a link to its article, so it can't double as the toggle. */
  document.querySelectorAll(".lyr-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var layer = btn.closest(".lyr");
      var open = layer.classList.contains("is-open");
      // close any other open layer so the stack keeps its compact height
      document.querySelectorAll(".lyr.is-open").forEach(function (other) {
        if (other !== layer) {
          other.classList.remove("is-open");
          var b = other.querySelector(".lyr-toggle");
          if (b) b.setAttribute("aria-expanded", "false");
        }
      });
      layer.classList.toggle("is-open", !open);
      btn.setAttribute("aria-expanded", open ? "false" : "true");
    });
  });
  var lyrs = Array.prototype.slice.call(document.querySelectorAll(".lyr"));

  /* ---- continuous lighting ----------------------------------------------
     Each layer gets --lit from 0 to 1 by how close its plate is to the
     reading line, so the light builds and falls as you scroll instead of
     switching on once. Plain geometry rather than IntersectionObserver: an
     unlit layer is unreadable, so this must never depend on observer
     callbacks being delivered.
     ---------------------------------------------------------------------- */
  var FLOOR = 0.18;          // far lyrs stay faintly visible, never black

  function easeOut(t) { return 1 - Math.pow(1 - t, 2); }

  var plates = lyrs.map(function (l) { return l.querySelector(".lyr-plate"); });

  function relight() {
    var vh = window.innerHeight;
    var line = vh * 0.46;    // where a layer reads as "current"
    var reach = vh * 0.62;   // distance over which it falls away
    var i, values = [];

    // Read every rect first, then write. Interleaving them makes the browser
    // re-run layout on each iteration.
    for (i = 0; i < plates.length; i++) {
      if (!plates[i]) { values.push(null); continue; }
      var r = plates[i].getBoundingClientRect();
      var d = Math.abs((r.top + r.bottom) / 2 - line) / reach;
      values.push(FLOOR + (1 - FLOOR) * easeOut(Math.max(0, Math.min(1, 1 - d))));
    }
    for (i = 0; i < lyrs.length; i++) {
      if (values[i] === null) continue;
      lyrs[i].style.setProperty("--lit", values[i].toFixed(3));
      lyrs[i].classList.add("is-lit");
    }
  }

  // Called straight from the scroll event rather than through rAF: six rect
  // reads are cheap, and rAF can be starved, which would strand the section
  // at its floor brightness.
  function onScroll() { relight(); }

  if (reduce) {
    lyrs.forEach(function (l) {
      l.classList.add("is-lit");
      l.style.setProperty("--lit", "1");
    });
  } else {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    relight();
    // rAF can be starved before first paint; a direct call guarantees state.
    window.addEventListener("load", relight);

    /* Pointer-tracked specular, fine pointers only — on touch there is no
       cursor to follow and the listener would just cost scroll performance. */
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      document.querySelectorAll(".lyr-plate").forEach(function (plate) {
        plate.addEventListener("pointermove", function (e) {
          var b = plate.getBoundingClientRect();
          plate.style.setProperty("--mx", (((e.clientX - b.left) / b.width) * 100).toFixed(1) + "%");
        });
        plate.addEventListener("pointerleave", function () {
          plate.style.removeProperty("--mx");
        });
      });
    }
  }
})();
