/* ===== CH Lucky Global — i18n engine ===== */
(function () {
  "use strict";

  var SUPPORTED = ["en", "sq", "tr"];
  var DEFAULT_LANG = "en";
  var STORAGE_KEY = "ch_lang";

  var PRINCIPLE_ICONS = [
    // 1. Respect for Kosovo / handshake
    '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M11 12l3-3 5 5-3 3M2 13l3 3 7-7-3-3-7 7z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/></svg>',
    // 2. Legal documents
    '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M7 2h7l5 5v15H7z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M14 2v5h5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M9.5 14.5l2 2 4-4.5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    // 3. Traffic / moped
    '<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="6" cy="18" r="2.6" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="18" cy="18" r="2.6" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M6 18l3-8h4l2 4h3" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 10h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    // 4. Customer communication / chat
    '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 4h16v11H9l-5 4V4z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M8 9h8M8 12.5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    // 5. Personal care / professionalism
    '<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="8" r="3.4" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M4.5 21c1-4 4-6.2 7.5-6.2s6.5 2.2 7.5 6.2" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
    // 6. Represent country / flag
    '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M6 2v20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M6 3.5h13l-3 4 3 4H6z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/></svg>'
  ];

  var currentLang = DEFAULT_LANG;
  var dict = {};

  function detectLang() {
    try {
      var urlLang = new URLSearchParams(window.location.search).get("lang");
      if (urlLang && SUPPORTED.indexOf(urlLang) !== -1) return urlLang;
    } catch (e) {}

    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;
    } catch (e) {}

    var candidates = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || DEFAULT_LANG];

    for (var i = 0; i < candidates.length; i++) {
      var code = (candidates[i] || "").toLowerCase().slice(0, 2);
      if (code === "sq") return "sq";
      if (code === "tr") return "tr";
      if (code === "en") return "en";
    }
    return DEFAULT_LANG;
  }

  function getValue(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
  }

  function applyTranslations() {
    document.documentElement.setAttribute("lang", currentLang);

    var canonicalUrl = "https://chluckyglobal.com/" + (currentLang !== DEFAULT_LANG ? "?lang=" + currentLang : "");
    var canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) canonicalEl.setAttribute("href", canonicalUrl);
    var ogUrlEl = document.querySelector('meta[property="og:url"]');
    if (ogUrlEl) ogUrlEl.setAttribute("content", canonicalUrl);

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var val = getValue(dict, el.getAttribute("data-i18n"));
      if (typeof val === "string") el.textContent = val;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var val = getValue(dict, el.getAttribute("data-i18n-placeholder"));
      if (typeof val === "string") el.setAttribute("placeholder", val);
    });

    document.querySelectorAll("[data-i18n-content]").forEach(function (el) {
      var val = getValue(dict, el.getAttribute("data-i18n-content"));
      if (typeof val === "string") el.setAttribute("content", val);
    });

    var titleEl = document.querySelector("title[data-i18n-title]");
    if (titleEl) {
      var titleVal = getValue(dict, titleEl.getAttribute("data-i18n-title"));
      if (typeof titleVal === "string") document.title = titleVal;
    }

    renderPrinciples();

    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === currentLang);
    });
  }

  function renderPrinciples() {
    var grid = document.getElementById("principlesGrid");
    if (!grid) return;
    var items = getValue(dict, "principles.items");
    if (!Array.isArray(items)) return;

    grid.innerHTML = items.map(function (item, idx) {
      var num = String(idx + 1).padStart(2, "0");
      var icon = PRINCIPLE_ICONS[idx] || "";
      var delayClass = ["", "reveal-delay-1", "reveal-delay-2"][idx % 3];
      return (
        '<div class="principle-card reveal ' + delayClass + '">' +
          '<span class="principle-num">' + num + "</span>" +
          '<div class="principle-icon">' + icon + "</div>" +
          "<h3>" + item.title + "</h3>" +
          "<p>" + item.text + "</p>" +
        "</div>"
      );
    }).join("");
  }

  function loadLang(lang) {
    return fetch("i18n/" + lang + ".json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to load " + lang + ".json");
        return res.json();
      })
      .then(function (json) {
        dict = json;
        currentLang = lang;
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
        applyTranslations();
        document.dispatchEvent(new CustomEvent("ch:langchange", { detail: { lang: lang } }));
      });
  }

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1 || lang === currentLang) return Promise.resolve();
    return loadLang(lang);
  }

  function t(path) {
    var val = getValue(dict, path);
    return typeof val === "string" ? val : path;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var initialLang = detectLang();
    loadLang(initialLang);

    var switcher = document.getElementById("langSwitch");
    if (switcher) {
      switcher.addEventListener("click", function (e) {
        var btn = e.target.closest(".lang-btn");
        if (!btn) return;
        setLang(btn.getAttribute("data-lang"));
      });
    }
  });

  window.CH_I18N = {
    t: t,
    setLang: setLang,
    getLang: function () { return currentLang; }
  };
})();
