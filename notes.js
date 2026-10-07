/* Lecture notes: reading progress, contents highlighting, reference previews. */
(function () {
  "use strict";

  /* reading progress bar and back-to-top button */
  var bar = document.querySelector(".progress span");
  var top = document.querySelector(".to-top");
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    if (top) top.classList.toggle("show", h.scrollTop > 900);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* highlight the current subsection in the sidebar */
  var links = Array.prototype.slice.call(document.querySelectorAll(".sidetoc a"));
  var heads = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
  if ("IntersectionObserver" in window && heads.length) {
    var visible = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible.set(e.target, e.boundingClientRect.top); });
      var y = window.innerHeight * 0.35, current = -1;
      heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top < y) current = i; });
      links.forEach(function (a, i) { a.classList.toggle("active", i === current); });
    }, { rootMargin: "0px 0px -60% 0px", threshold: [0, 1] });
    heads.forEach(function (h) { if (h) io.observe(h); });
    document.addEventListener("scroll", function () {
      var y = window.innerHeight * 0.35, current = -1;
      heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top < y) current = i; });
      links.forEach(function (a, i) { a.classList.toggle("active", i === current); });
    }, { passive: true });
  }

  /* previews: hovering a link to an equation, figure, theorem or section shows it */
  var canHover = window.matchMedia("(hover: hover)").matches;
  var peek = document.createElement("div");
  peek.className = "peek";
  peek.hidden = true;
  peek.setAttribute("role", "tooltip");
  document.body.appendChild(peek);
  var hideTimer = null;

  function targetFor(a) {
    var href = a.getAttribute("href") || "";
    if (href.charAt(0) !== "#" || href.length < 2) return null;
    var el = document.getElementById(decodeURIComponent(href.slice(1)));
    if (!el) return null;
    var eq = el.closest("mjx-container");
    if (eq) return { node: eq, kind: "eq" };
    if (el.tagName === "H2") return { node: el, kind: "sec" };
    return { node: el, kind: "block" };
  }

  function show(a) {
    if (a.closest(".sidetoc, .toc, .peek, .topbar, .pager")) return;
    var t = targetFor(a);
    if (!t) return;
    clearTimeout(hideTimer);
    peek.innerHTML = "";
    var clone = t.node.cloneNode(true);
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach(function (n) { n.removeAttribute("id"); });
    peek.appendChild(clone);
    if (t.kind === "sec") {           /* section: heading plus its first paragraph */
      var p = t.node.nextElementSibling;
      while (p && p.tagName !== "P") p = p.nextElementSibling;
      if (p) peek.appendChild(p.cloneNode(true));
    }
    peek.hidden = false;
    var r = a.getBoundingClientRect();
    var w = peek.offsetWidth, h = peek.offsetHeight;
    var left = Math.min(Math.max(8, r.left + window.scrollX - 20), window.scrollX + document.documentElement.clientWidth - w - 8);
    var topPos = r.bottom + window.scrollY + 8;
    if (r.bottom + h + 16 > window.innerHeight && r.top - h - 8 > 0) topPos = r.top + window.scrollY - h - 8;
    peek.style.left = left + "px";
    peek.style.top = topPos + "px";
  }
  function hideSoon() { hideTimer = setTimeout(function () { peek.hidden = true; }, 180); }

  if (canHover) {
    document.addEventListener("mouseover", function (e) {
      var a = e.target.closest && e.target.closest("a[href^='#']");
      if (a) show(a);
    });
    document.addEventListener("mouseout", function (e) {
      var a = e.target.closest && e.target.closest("a[href^='#']");
      if (a) hideSoon();
    });
    peek.addEventListener("mouseenter", function () { clearTimeout(hideTimer); });
    peek.addEventListener("mouseleave", hideSoon);
  }
  document.addEventListener("focusin", function (e) {
    if (e.target.matches && e.target.matches("a[href^='#']")) show(e.target);
  });
  document.addEventListener("focusout", hideSoon);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") peek.hidden = true; });

  /* briefly highlight whatever a clicked reference jumps to */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href^='#']");
    if (!a) return;
    peek.hidden = true;
    var t = targetFor(a);
    if (!t) return;
    var n = t.kind === "eq" ? t.node : t.node;
    n.classList.remove("flash");
    void n.offsetWidth;
    n.classList.add("flash");
  });
})();
