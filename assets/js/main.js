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

  // Nordic background: the layers slide sideways as the page scrolls down.
  // Each layer travels the width it overflows the viewport by, so the wider
  // (nearer) layers move further than the far ones.
  var layers = Array.prototype.slice.call(document.querySelectorAll(".bg-layer"));

  if (layers.length && !prefersReduced) {
    var travel = [];
    var maxScroll = 1;

    var measure = function () {
      var vw = document.documentElement.clientWidth;
      travel = layers.map(function (el) { return Math.max(el.offsetWidth - vw, 0); });
      maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    };

    // Ease toward the real scroll position every frame instead of snapping to
    // it, so the motion stays smooth even when scroll events arrive unevenly.
    var targetY = window.scrollY;
    var currentY = targetY;
    var running = false;

    var render = function () {
      var p = Math.min(Math.max(currentY / maxScroll, 0), 1);
      for (var i = 0; i < layers.length; i++) {
        layers[i].style.transform = "translate3d(" + (-p * travel[i]).toFixed(1) + "px,0,0)";
      }
    };

    var tick = function () {
      currentY += (targetY - currentY) * 0.1;
      if (Math.abs(targetY - currentY) < 0.3) currentY = targetY;
      render();
      if (currentY !== targetY) window.requestAnimationFrame(tick);
      else running = false;
    };

    var kick = function () {
      if (!running) {
        running = true;
        window.requestAnimationFrame(tick);
      }
    };

    window.addEventListener("scroll", function () {
      targetY = window.scrollY;
      kick();
    }, { passive: true });

    window.addEventListener("resize", function () {
      measure();
      targetY = window.scrollY;
      currentY = targetY;
      render();
    });

    // Page height can change once fonts/images settle
    window.addEventListener("load", function () {
      measure();
      render();
    });

    measure();
    render();
  }
})();
