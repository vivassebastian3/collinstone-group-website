(function () {
  "use strict";

  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var isOpen = links.getAttribute("data-open") === "true";
      links.setAttribute("data-open", String(!isOpen));
      toggle.setAttribute("aria-expanded", String(!isOpen));
    });

    links.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        links.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.getAttribute("data-open") === "true") {
        links.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  // Scroll reveal
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll("[data-reveal]");

  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  }

  // Ambient background parallax
  var blobTracks = document.querySelectorAll(".bg-blob-track");

  // Perspective corridor: a real 3D-feeling vanishing point that drifts
  // vertically (and a little horizontally) as the page scrolls, as if a
  // camera were moving through the hallway and panning up/down — rather
  // than a flat CSS transform on the whole graphic, which just reads as
  // the image spinning.
  var corridorWrap = document.querySelector(".bg-corridor");
  var corridorSvg = document.querySelector(".bg-corridor-svg");
  var spokeEls = corridorSvg ? corridorSvg.querySelectorAll(".corridor-spoke") : [];
  var ringEls = corridorSvg ? corridorSvg.querySelectorAll("[data-t]") : [];
  var vpGlowEl = corridorSvg ? corridorSvg.querySelector(".corridor-vp-glow") : null;
  var vpHaloEl = corridorSvg ? corridorSvg.querySelector(".corridor-vp-halo") : null;
  var vpDotEl = corridorSvg ? corridorSvg.querySelector(".corridor-vp-dot") : null;
  var lightFalloffEl = corridorSvg ? corridorSvg.querySelector("#lightFalloff") : null;

  var CORRIDOR_CORNERS = [
    [0, 0],
    [1600, 0],
    [1600, 900],
    [0, 900]
  ];
  var BASE_VP = { x: 1150, y: 380 };

  var spokeAnchors = [];
  spokeEls.forEach(function (el) {
    spokeAnchors.push({
      el: el,
      x: parseFloat(el.getAttribute("x1")),
      y: parseFloat(el.getAttribute("y1"))
    });
  });

  var ringData = [];
  ringEls.forEach(function (el) {
    ringData.push({ el: el, t: parseFloat(el.getAttribute("data-t")) || 0.5 });
  });

  var updateCorridor = function (y) {
    if (!corridorSvg) return;

    var vpX = BASE_VP.x + 55 * Math.sin(y / 2100 + 1.1);
    var vpY = BASE_VP.y + 135 * Math.sin(y / 1350);

    spokeAnchors.forEach(function (spoke) {
      spoke.el.setAttribute("x2", vpX.toFixed(1));
      spoke.el.setAttribute("y2", vpY.toFixed(1));
    });

    ringData.forEach(function (ring) {
      var pts = CORRIDOR_CORNERS.map(function (c) {
        var px = c[0] + (vpX - c[0]) * ring.t;
        var py = c[1] + (vpY - c[1]) * ring.t;
        return px.toFixed(1) + "," + py.toFixed(1);
      }).join(" ");
      ring.el.setAttribute("points", pts);
    });

    var zoom = Math.min(y / 2600, 1);

    if (vpGlowEl) {
      vpGlowEl.setAttribute("cx", vpX.toFixed(1));
      vpGlowEl.setAttribute("cy", vpY.toFixed(1));
      vpGlowEl.setAttribute("r", (260 * (1 + zoom * 0.1)).toFixed(1));
    }
    if (vpHaloEl) {
      vpHaloEl.setAttribute("cx", vpX.toFixed(1));
      vpHaloEl.setAttribute("cy", vpY.toFixed(1));
      vpHaloEl.setAttribute("r", (520 * (1 + zoom * 0.08)).toFixed(1));
    }
    if (vpDotEl) {
      vpDotEl.setAttribute("cx", vpX.toFixed(1));
      vpDotEl.setAttribute("cy", vpY.toFixed(1));
    }
    if (lightFalloffEl) {
      lightFalloffEl.setAttribute("cx", vpX.toFixed(1));
      lightFalloffEl.setAttribute("cy", vpY.toFixed(1));
    }

    if (corridorWrap) {
      corridorWrap.style.transform = "scale(" + (1 + zoom * 0.14).toFixed(3) + ")";
    }
  };

  if ((blobTracks.length || corridorSvg) && !prefersReduced) {
    // A continuously-running, eased loop rather than snapping straight to
    // window.scrollY on each scroll event: the latter looks stepped/jerky
    // because scroll events (and their payloads) don't arrive at a steady
    // 60fps, especially on mouse-wheel or trackpad momentum. Easing the
    // rendered position toward the real scroll position every frame
    // decouples the animation from that raw input and reads as smooth
    // continuous motion, with a little natural trailing inertia.
    var targetY = window.scrollY;
    var currentY = targetY;
    var EASE = 0.085;

    window.addEventListener(
      "scroll",
      function () {
        targetY = window.scrollY;
      },
      { passive: true }
    );

    var tick = function () {
      currentY += (targetY - currentY) * EASE;
      if (Math.abs(targetY - currentY) < 0.05) currentY = targetY;

      blobTracks.forEach(function (track) {
        var depth = parseFloat(track.getAttribute("data-depth")) || 0.1;
        track.style.transform = "translate3d(0," + (currentY * depth * -1).toFixed(1) + "px,0)";
      });
      updateCorridor(currentY);

      window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);
  }
})();
