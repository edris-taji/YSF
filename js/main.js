/* Youth Savior Foundation – site behaviour (vanilla JS, no dependencies). Loaded with `defer`. */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktopNav = window.matchMedia("(min-width: 1000px)");

  /* ---------- Navigation: mobile panel + dropdown disclosures ---------- */
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.getElementById("site-nav");
  const menuButtons = [...document.querySelectorAll(".nav-item--dropdown > .nav-link")];

  const setMenu = (button, open) => {
    button.setAttribute("aria-expanded", String(open));
    document.getElementById(button.getAttribute("aria-controls"))?.classList.toggle("is-open", open);
  };
  const closeMenus = (except) => menuButtons.forEach((b) => b !== except && setMenu(b, false));
  const setNav = (open) => {
    siteNav?.classList.toggle("is-open", open);
    navToggle?.setAttribute("aria-expanded", String(open));
  };

  navToggle?.addEventListener("click", () => setNav(navToggle.getAttribute("aria-expanded") !== "true"));

  menuButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      if (desktopNav.matches) closeMenus(button);
      setMenu(button, open);
    });
    // On desktop, keyboard focus leaving a dropdown closes it.
    button.parentElement.addEventListener("focusout", (event) => {
      if (desktopNav.matches && !button.parentElement.contains(event.relatedTarget)) setMenu(button, false);
    });
  });

  document.addEventListener("click", (event) => {
    if (desktopNav.matches && !event.target.closest(".nav-item--dropdown")) closeMenus();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const open = menuButtons.find((b) => b.getAttribute("aria-expanded") === "true");
    if (open) {
      setMenu(open, false);
      open.focus();
    } else if (navToggle?.getAttribute("aria-expanded") === "true") {
      setNav(false);
      navToggle.focus();
    }
  });

  desktopNav.addEventListener("change", () => {
    closeMenus();
    setNav(false);
  });

  /* ---------- Header shadow + back-to-top (one rAF-throttled scroll handler) ---------- */
  const header = document.querySelector(".site-header");
  const backToTop = document.querySelector(".back-to-top");
  let queued = false;
  const onScroll = () => {
    queued = false;
    header?.classList.toggle("is-scrolled", window.scrollY > 8);
    backToTop?.classList.toggle("is-visible", window.scrollY > 600);
  };
  window.addEventListener("scroll", () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ---------- Home hero slideshow (pausable, WCAG 2.2.2) ---------- */
  document.querySelectorAll("[data-hero-carousel]").forEach((carousel) => {
    const slides = [...carousel.querySelectorAll(".hero-slide")];
    const dots = [...carousel.querySelectorAll(".slide-dots span")];
    const toggle = carousel.querySelector("[data-hero-toggle]");
    if (slides.length < 2) return;
    let index = 0;
    let timer = null;
    let paused = reduceMotion.matches; // user choice (or reduced motion) keeps it still
    let hovering = false;

    const show = (next) => {
      slides[index].classList.remove("is-active");
      slides[index].setAttribute("aria-hidden", "true");
      dots[index]?.classList.remove("is-active");
      index = (next + slides.length) % slides.length;
      slides[index].classList.add("is-active");
      slides[index].removeAttribute("aria-hidden");
      dots[index]?.classList.add("is-active");
    };
    const stop = () => { clearInterval(timer); timer = null; };
    const start = () => {
      if (paused || hovering || timer || document.hidden) return;
      timer = setInterval(() => show(index + 1), 6000);
    };
    const renderToggle = () => {
      toggle.setAttribute("aria-label", paused ? "Play slideshow" : "Pause slideshow");
      toggle.querySelector(".ico-pause").style.display = paused ? "none" : "";
      toggle.querySelector(".ico-play").style.display = paused ? "" : "none";
    };

    slides.forEach((s, i) => i && s.setAttribute("aria-hidden", "true"));
    carousel.querySelector("[data-hero-prev]")?.addEventListener("click", () => { show(index - 1); stop(); start(); });
    carousel.querySelector("[data-hero-next]")?.addEventListener("click", () => { show(index + 1); stop(); start(); });
    toggle?.addEventListener("click", () => {
      paused = !paused;
      renderToggle();
      paused ? stop() : start();
    });
    carousel.addEventListener("mouseenter", () => { hovering = true; stop(); });
    carousel.addEventListener("mouseleave", () => { hovering = false; start(); });
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    if (toggle) renderToggle();
    start();
  });

  /* ---------- "Show more" panels ---------- */
  document.querySelectorAll("[data-show-more]").forEach((button) => {
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    if (!panel) return;
    button.addEventListener("click", () => {
      const open = panel.hidden;
      panel.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
      button.textContent = open ? "Show Less" : "Show More";
    });
  });

  /* ---------- Article dialogs (founder page) ---------- */
  document.querySelectorAll("[data-dialog-open]").forEach((button) => {
    const dialog = document.getElementById(button.dataset.dialogOpen);
    if (!dialog || typeof dialog.showModal !== "function") return;
    button.addEventListener("click", () => {
      dialog.showModal();
      dialog.scrollTop = 0;
      dialog.addEventListener("close", () => button.focus(), { once: true });
    });
  });
  document.querySelectorAll("dialog.article-dialog").forEach((dialog) => {
    dialog.querySelector("[data-dialog-close]")?.addEventListener("click", () => dialog.close());
    // Close when the backdrop (not the article itself) is clicked.
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  /* ---------- Contact form: validate, then hand off to the visitor's email app ---------- */
  document.querySelectorAll("[data-contact-form]").forEach((form) => {
    const status = form.querySelector(".form-status");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        status.textContent = "Please fill in every field with a valid email address.";
        form.querySelector(":invalid")?.focus();
        return;
      }
      const data = new FormData(form);
      const body = `${data.get("message")}\n\n${data.get("name")} <${data.get("email")}>`;
      const recipient = form.getAttribute("action").replace(/^mailto:/, "");
      window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(data.get("subject"))}&body=${encodeURIComponent(body)}`;
      status.textContent = "Your email app should open with your message. If it does not, email us at " + recipient + ".";
    });
  });
})();
