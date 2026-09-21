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
  var spokeEls = corridorSvg ? corridorSvg.querySelectorAll(".tube-spoke") : [];
  var ringEls = corridorSvg ? corridorSvg.querySelectorAll("[data-t]") : [];
  var vpHaloEl = corridorSvg ? corridorSvg.querySelector(".corridor-vp-halo") : null;
  var windowEl = corridorSvg ? corridorSvg.querySelector(".corridor-window") : null;
  var sheenEl = corridorSvg ? corridorSvg.querySelector(".corridor-window-sheen") : null;
  var mullionEls = corridorSvg ? corridorSvg.querySelectorAll(".tube-mullion") : [];
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
      x: parseFloat(el.getAttribute("data-ax")),
      y: parseFloat(el.getAttribute("data-ay")),
      hw: parseFloat(el.getAttribute("data-hw"))
    });
  });

  var ringData = [];
  ringEls.forEach(function (el) {
    ringData.push({ el: el, t: parseFloat(el.getAttribute("data-t")) || 0.5 });
  });

  // Pane bars of the end window. Each one continues a strip from the
  // ceiling/floor (vertical bars) or the side walls (horizontal bars).
  var mullionData = [];
  mullionEls.forEach(function (el) {
    mullionData.push({
      el: el,
      vertical: el.hasAttribute("data-mx"),
      a: parseFloat(el.getAttribute(el.hasAttribute("data-mx") ? "data-mx" : "data-my"))
    });
  });

  // The four shaded surfaces (ceiling, right wall, floor, left wall) span
  // from the near frame to the end wall, which is the last ring depth.
  var END_WALL_T = 0.7379;
  var planeEls = {};
  if (corridorSvg) {
    corridorSvg.querySelectorAll(".corridor-plane").forEach(function (el) {
      planeEls[el.getAttribute("data-plane")] = el;
    });
  }

  var updateCorridor = function (y) {
    if (!corridorSvg) return;

    var vpX = BASE_VP.x + 55 * Math.sin(y / 2100 + 1.1);
    var vpY = BASE_VP.y + 135 * Math.sin(y / 1350);

    // Each spoke is a tapered tube that runs from its near anchor point to
    // the frame of the end window. Width shrinks in proportion to the
    // remaining distance, so thickness itself reads as depth.
    spokeAnchors.forEach(function (spoke) {
      var ex = spoke.x + (vpX - spoke.x) * END_WALL_T;
      var ey = spoke.y + (vpY - spoke.y) * END_WALL_T;
      var dx = ex - spoke.x;
      var dy = ey - spoke.y;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / len;
      var ny = dx / len;
      var hw = spoke.hw;
      var tip = hw * (1 - END_WALL_T);
      spoke.el.setAttribute(
        "points",
        (spoke.x + nx * hw).toFixed(1) + "," + (spoke.y + ny * hw).toFixed(1) + " " +
        (spoke.x - nx * hw).toFixed(1) + "," + (spoke.y - ny * hw).toFixed(1) + " " +
        (ex - nx * tip).toFixed(1) + "," + (ey - ny * tip).toFixed(1) + " " +
        (ex + nx * tip).toFixed(1) + "," + (ey + ny * tip).toFixed(1)
      );
    });

    ringData.forEach(function (ring) {
      var pts = CORRIDOR_CORNERS.map(function (c) {
        var px = c[0] + (vpX - c[0]) * ring.t;
        var py = c[1] + (vpY - c[1]) * ring.t;
        return px.toFixed(1) + "," + py.toFixed(1);
      }).join(" ");
      ring.el.setAttribute("points", pts);
    });

    var inner = CORRIDOR_CORNERS.map(function (c) {
      return [c[0] + (vpX - c[0]) * END_WALL_T, c[1] + (vpY - c[1]) * END_WALL_T];
    });
    var quad = function (a, b, c, d) {
      return [a, b, c, d].map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
    };
    var C = CORRIDOR_CORNERS;
    if (planeEls.ceiling) planeEls.ceiling.setAttribute("points", quad(C[0], C[1], inner[1], inner[0]));
    if (planeEls.right) planeEls.right.setAttribute("points", quad(C[1], C[2], inner[2], inner[1]));
    if (planeEls.floor) planeEls.floor.setAttribute("points", quad(C[2], C[3], inner[3], inner[2]));
    if (planeEls.left) planeEls.left.setAttribute("points", quad(C[3], C[0], inner[0], inner[3]));

    // The end window fills the last ring: the same rectangle that closes
    // the four surfaces.
    var wx = inner[0][0];
    var wy = inner[0][1];
    var ww = inner[2][0] - inner[0][0];
    var wh = inner[2][1] - inner[0][1];
    [windowEl, sheenEl].forEach(function (el) {
      if (!el) return;
      el.setAttribute("x", wx.toFixed(1));
      el.setAttribute("y", wy.toFixed(1));
      el.setAttribute("width", ww.toFixed(1));
      el.setAttribute("height", wh.toFixed(1));
    });

    mullionData.forEach(function (m) {
      if (m.vertical) {
        var mx = (m.a + (vpX - m.a) * END_WALL_T).toFixed(1);
        m.el.setAttribute("x1", mx);
        m.el.setAttribute("x2", mx);
        m.el.setAttribute("y1", wy.toFixed(1));
        m.el.setAttribute("y2", (wy + wh).toFixed(1));
      } else {
        var my = (m.a + (vpY - m.a) * END_WALL_T).toFixed(1);
        m.el.setAttribute("y1", my);
        m.el.setAttribute("y2", my);
        m.el.setAttribute("x1", wx.toFixed(1));
        m.el.setAttribute("x2", (wx + ww).toFixed(1));
      }
    });

    var zoom = Math.min(y / 2600, 1);

    // Soft glow spilling out of the window around the end of the hall.
    if (vpHaloEl) {
      var hs = 760 * (1 + zoom * 0.08);
      vpHaloEl.setAttribute("x", (vpX - hs / 2).toFixed(1));
      vpHaloEl.setAttribute("y", (vpY - hs / 2).toFixed(1));
      vpHaloEl.setAttribute("width", hs.toFixed(1));
      vpHaloEl.setAttribute("height", hs.toFixed(1));
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
