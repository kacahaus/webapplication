(function () {
  "use strict";

  var NAV_OFFSET = 96;

  function scrollToId(hash) {
    var id = hash.charAt(0) === "#" ? hash.slice(1) : hash;
    var el = document.getElementById(id);
    if (!el) return;
    var top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  }

  /* ---------------------------------------------------------------------
   * Scroll progress bar
   * ------------------------------------------------------------------- */
  var progressBar = document.getElementById("scroll-progress");
  function updateProgress() {
    var doc = document.documentElement;
    var scrollTop = window.scrollY || doc.scrollTop;
    var height = doc.scrollHeight - doc.clientHeight;
    var ratio = height > 0 ? scrollTop / height : 0;
    progressBar.style.transform = "scaleX(" + Math.min(Math.max(ratio, 0), 1) + ")";
  }

  /* ---------------------------------------------------------------------
   * Navbar scrolled state + mobile menu
   * ------------------------------------------------------------------- */
  var navbar = document.getElementById("navbar");
  var menuToggle = document.getElementById("menu-toggle");
  var mobileNav = document.getElementById("mobile-nav");
  var iconMenu = document.getElementById("icon-menu");
  var iconClose = document.getElementById("icon-close");
  var menuOpen = false;

  function updateNavbar() {
    if (window.scrollY > 40) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  }

  function setMenuOpen(open) {
    menuOpen = open;
    mobileNav.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    iconMenu.style.display = open ? "none" : "";
    iconClose.style.display = open ? "" : "none";
  }

  menuToggle.addEventListener("click", function () {
    setMenuOpen(!menuOpen);
  });

  mobileNav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      setMenuOpen(false);
    });
  });

  /* ---------------------------------------------------------------------
   * Back to top button
   * ------------------------------------------------------------------- */
  var backToTop = document.getElementById("back-to-top");
  function updateBackToTop() {
    backToTop.classList.toggle("visible", window.scrollY > window.innerHeight * 0.8);
  }

  /* ---------------------------------------------------------------------
   * Smooth anchor scrolling (with history + fixed-nav offset)
   * ------------------------------------------------------------------- */
  if (window.location.hash) {
    requestAnimationFrame(function () {
      setTimeout(function () {
        scrollToId(window.location.hash);
      }, 60);
    });
  }

  document.addEventListener("click", function (e) {
    var anchor = e.target.closest("a");
    if (!anchor) return;
    var href = anchor.getAttribute("href");
    if (!href || href.charAt(0) !== "#" || href === "#") return;
    if (!document.getElementById(href.slice(1))) return;

    e.preventDefault();
    history.pushState(null, "", href);
    requestAnimationFrame(function () {
      scrollToId(href);
    });
  });

  /* ---------------------------------------------------------------------
   * Reveal-on-scroll (IntersectionObserver replaces Framer Motion whileInView)
   * ------------------------------------------------------------------- */
  var revealTargets = document.querySelectorAll(".reveal, .reveal-group, .hero-content");
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  revealTargets.forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ---------------------------------------------------------------------
   * Animated stat counters
   * ------------------------------------------------------------------- */
  var counters = document.querySelectorAll(".counter");
  var counterObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        counterObserver.unobserve(entry.target);
        animateCounter(entry.target);
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach(function (el) {
    counterObserver.observe(el);
  });

  function animateCounter(el) {
    var raw = el.getAttribute("data-value") || "";
    var match = raw.match(/^(\d+)(.*)$/);
    var target = match ? parseInt(match[1], 10) : 0;
    var suffix = match ? match[2] : raw;
    var duration = 1200;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(eased * target);
      el.textContent = current + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix;
      }
    }
    requestAnimationFrame(step);
  }

  /* ---------------------------------------------------------------------
   * Projects filter
   * ------------------------------------------------------------------- */
  var filterButtons = document.querySelectorAll(".filter-btn");
  var projectCards = document.querySelectorAll(".project-card");

  function applyFilter(filter) {
    projectCards.forEach(function (card) {
      var show = filter === "All" || card.getAttribute("data-category") === filter;
      if (show) {
        card.classList.remove("hidden-card");
        requestAnimationFrame(function () {
          card.classList.add("shown");
        });
      } else {
        card.classList.remove("shown");
        card.classList.add("hidden-card");
      }
    });
  }

  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterButtons.forEach(function (b) {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      applyFilter(btn.getAttribute("data-filter"));
    });
  });

  applyFilter("All");

  /* ---------------------------------------------------------------------
   * Inquiry form: solution chips + submit -> success state
   * ------------------------------------------------------------------- */
  var toggleChips = document.querySelectorAll(".toggle-chip");
  var solutionsInput = document.getElementById("solutions-input");
  function syncSolutionsInput() {
    if (!solutionsInput) return;
    var active = [];
    toggleChips.forEach(function (chip) {
      if (chip.classList.contains("active")) active.push(chip.getAttribute("data-solution"));
    });
    solutionsInput.value = active.join(", ");
  }
  toggleChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chip.classList.toggle("active");
      syncSolutionsInput();
    });
  });

  var inquiryForm = document.getElementById("inquiry-form");
  var inquirySuccess = document.getElementById("inquiry-success");
  if (inquiryForm) {
    inquiryForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var submitBtn = inquiryForm.querySelector(".submit-btn");
      if (submitBtn) submitBtn.disabled = true;

      var ajaxUrl = inquiryForm.action.replace("https://formsubmit.co/", "https://formsubmit.co/ajax/");

      fetch(ajaxUrl, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(inquiryForm),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed");
          inquiryForm.hidden = true;
          inquirySuccess.hidden = false;
        })
        .catch(function () {
          if (submitBtn) submitBtn.disabled = false;
          alert("We couldn't send your inquiry — please try again, or WhatsApp us directly at +91 87903 19101.");
        });
    });
  }

  /* ---------------------------------------------------------------------
   * Scroll listeners (single rAF-throttled handler)
   * ------------------------------------------------------------------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      updateProgress();
      updateNavbar();
      updateBackToTop();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  updateProgress();
  updateNavbar();
  updateBackToTop();
})();
