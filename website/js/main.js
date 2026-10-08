/* ===== CH Lucky Global — UI interactions & form handling ===== */
(function () {
  "use strict";

  document.documentElement.classList.add("js-anim");

  function hidePreloader() {
    var preloader = document.getElementById("preloader");
    document.body.classList.remove("is-loading");
    if (!preloader) return;
    preloader.classList.add("is-hidden");
    preloader.addEventListener("transitionend", function () {
      if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
    }, { once: true });
  }

  var preloaderWaits = { settings: false, gallery: false };
  function markPreloaderWait(key) {
    preloaderWaits[key] = true;
    if (preloaderWaits.settings && preloaderWaits.gallery) hidePreloader();
  }
  setTimeout(hidePreloader, 8000);

  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    initFooterYear();
    initCourierForm();
    initScrollReveal();
    initSiteSettings();
    initGallery();
    initPhoneChoiceModal();
  });

  function toWaHref(phone) {
    return "https://wa.me/" + phone.replace(/[^0-9]/g, "");
  }

  function toTelHref(phone) {
    return "tel:" + phone.replace(/[^0-9+]/g, "");
  }

  function initPhoneChoiceModal() {
    var modal = document.getElementById("phoneChoiceModal");
    if (!modal) return;
    var numberEl = document.getElementById("phoneModalNumber");
    var callBtn = document.getElementById("phoneModalCall");
    var waBtn = document.getElementById("phoneModalWhatsapp");

    function openModal(phone) {
      numberEl.textContent = phone;
      callBtn.href = toTelHref(phone);
      waBtn.href = toWaHref(phone);
      modal.hidden = false;
      document.body.classList.add("modal-open");
    }

    function closeModal() {
      modal.hidden = true;
      document.body.classList.remove("modal-open");
    }

    document.addEventListener("click", function (e) {
      var trigger = e.target.closest("[data-phone-choice]");
      if (trigger) {
        e.preventDefault();
        openModal(trigger.getAttribute("data-phone-choice"));
        return;
      }
      if (e.target.closest("[data-phone-modal-close]")) closeModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });
  }

  var SOCIAL_ICONS = {
    facebook: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M14 9h3V5.5h-3c-2 0-3.5 1.5-3.5 3.5v2H8v3.5h2.5V22H14v-7.5h2.7l.5-3.5H14V9z" fill="currentColor"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M16.5 3c.3 2 1.6 3.6 3.5 4v3c-1.5 0-2.9-.5-4-1.3v6.6a5.7 5.7 0 11-5.7-5.7c.3 0 .6 0 .9.1v3.1a2.6 2.6 0 102 2.5V3h3.3z" fill="currentColor"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M10 9l6 3-6 3V9z" fill="currentColor"/></svg>'
  };
  var WHATSAPP_ICON = '<svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor"><path d="M16.001 2.667c-7.364 0-13.334 5.97-13.334 13.333 0 2.352.615 4.646 1.782 6.666l-1.892 6.914 7.077-1.856a13.27 13.27 0 0 0 6.367 1.622h.006c7.363 0 13.333-5.97 13.333-13.333 0-3.561-1.387-6.909-3.906-9.428a13.246 13.246 0 0 0-9.433-3.918zm0 24.4h-.005a11.05 11.05 0 0 1-5.634-1.542l-.404-.24-4.199 1.101 1.121-4.093-.263-.42a11.05 11.05 0 0 1-1.694-5.873c0-6.115 4.977-11.09 11.083-11.09a11.03 11.03 0 0 1 7.848 3.26 11.02 11.02 0 0 1 3.25 7.838c0 6.115-4.977 11.06-11.103 11.06zm6.08-8.288c-.333-.167-1.971-.972-2.276-1.083-.305-.111-.527-.167-.749.167-.222.333-.86 1.083-1.054 1.305-.194.222-.389.25-.722.083-.333-.167-1.406-.518-2.679-1.652-.99-.883-1.659-1.974-1.853-2.307-.194-.333-.021-.514.146-.68.15-.15.333-.389.5-.583.167-.194.222-.333.333-.556.111-.222.056-.417-.028-.583-.083-.167-.749-1.805-1.026-2.472-.27-.649-.545-.561-.749-.572-.194-.01-.416-.012-.638-.012s-.583.083-.888.417c-.305.333-1.166 1.14-1.166 2.778 0 1.639 1.194 3.222 1.361 3.444.167.222 2.35 3.59 5.694 5.035.796.344 1.417.549 1.901.702.798.254 1.525.218 2.1.132.641-.096 1.971-.806 2.249-1.583.278-.778.278-1.444.194-1.583-.083-.14-.305-.222-.638-.389z"/></svg>';

  function initSiteSettings() {
    if (!window.chGetSettings) {
      markPreloaderWait("settings");
      return;
    }

    var lastSettings = null;

    function getPhones(contact) {
      var list = Array.isArray(contact.phones) ? contact.phones : (contact.phone ? [contact.phone] : []);
      return list.filter(function (p) { return p && p.trim(); });
    }

    function renderTopbarPhones(phones) {
      var el = document.getElementById("topbarPhones");
      if (!el) return;
      el.innerHTML = phones.map(function (phone) {
        return '<a class="topbar-link" href="' + toTelHref(phone) + '" data-phone-choice="' + phone + '">' + WHATSAPP_ICON + "<span>" + phone + "</span></a>";
      }).join("");
    }

    function renderContactPhones(phones) {
      var el = document.getElementById("contactPhones");
      if (!el) return;
      el.innerHTML = phones.map(function (phone) {
        return '<a href="' + toTelHref(phone) + '" data-phone-choice="' + phone + '"><strong>' + phone + "</strong></a>";
      }).join("");
    }

    function renderFooterPhones(phones) {
      var el = document.getElementById("footerPhones");
      if (!el) return;
      el.innerHTML = phones.map(function (phone) {
        return '<a href="' + toTelHref(phone) + '" data-phone-choice="' + phone + '">' + WHATSAPP_ICON + "<span>" + phone + "</span></a>";
      }).join("");
    }

    function renderSocialRow(elId, social, phones, includeWhatsapp) {
      var el = document.getElementById(elId);
      if (!el) return;
      var links = [];
      ["facebook", "instagram", "tiktok", "youtube"].forEach(function (key) {
        if (social[key]) {
          links.push('<a href="' + social[key] + '" target="_blank" rel="noopener" aria-label="' + key + '">' + SOCIAL_ICONS[key] + "</a>");
        }
      });
      if (includeWhatsapp && phones.length) {
        links.push('<a href="' + toWaHref(phones[0]) + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + WHATSAPP_ICON + "</a>");
      }
      el.innerHTML = links.join("");
    }

    function applySettings(settings) {
      if (!settings) return;
      lastSettings = settings;

      var contact = settings.contact || {};
      var social = settings.social || {};
      var hero = settings.hero || {};
      var map = settings.map || {};
      var phones = getPhones(contact);

      if (phones.length) {
        renderTopbarPhones(phones);
        renderContactPhones(phones);
        renderFooterPhones(phones);
        document.querySelectorAll("[data-phone-href]").forEach(function (el) { el.href = toWaHref(phones[0]); });
      }
      renderSocialRow("footerSocialRow", social, phones, true);
      renderSocialRow("contactSocialRow", social, phones, false);

      if (contact.email) {
        document.querySelectorAll("[data-email-href]").forEach(function (el) { el.href = "mailto:" + contact.email; });
        document.querySelectorAll("[data-email-text]").forEach(function (el) { el.textContent = contact.email; });
      }
      if (contact.address) {
        document.querySelectorAll("[data-address-text]").forEach(function (el) { el.textContent = contact.address; });
      }

      var heroBg = document.querySelector(".hero-bg");
      if (heroBg) {
        if (hero.enabled && hero.backgroundImage) {
          heroBg.style.backgroundImage =
            "linear-gradient(155deg, rgba(5,15,36,.72), rgba(5,15,36,.42)), url('" + hero.backgroundImage + "')";
          heroBg.style.backgroundSize = "cover";
          heroBg.style.backgroundPosition = "center";
        } else {
          heroBg.style.backgroundImage = "";
        }
      }

      var mapFrame = document.getElementById("contactMapFrame");
      var mapQuery = map.query || contact.address;
      if (mapFrame && mapQuery) {
        mapFrame.src = "https://www.google.com/maps?q=" + encodeURIComponent(mapQuery) + "&output=embed";
        var dirLink = document.getElementById("contactMapDirections");
        if (dirLink) dirLink.href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(mapQuery);
      }

      updateStructuredData(contact, social, phones);
    }

    function updateStructuredData(contact, social, phones) {
      var script = document.getElementById("ldJsonOrg");
      if (!script) return;
      try {
        var data = JSON.parse(script.textContent);
        if (phones.length) data.telephone = "+" + phones[0].replace(/[^0-9]/g, "");
        if (contact.email) data.email = contact.email;
        if (contact.address) data.address.streetAddress = contact.address;
        var sameAs = [];
        ["facebook", "instagram", "tiktok", "youtube"].forEach(function (key) {
          if (social[key]) sameAs.push(social[key]);
        });
        if (sameAs.length) data.sameAs = sameAs;
        script.textContent = JSON.stringify(data);
      } catch (e) { /* leave static fallback in place */ }
    }

    window.chGetSettings().then(function (settings) {
      applySettings(settings);
      markPreloaderWait("settings");
    });
    document.addEventListener("ch:langchange", function () { applySettings(lastSettings); });
  }

  function initGallery() {
    var section = document.getElementById("gallery");
    var grid = document.getElementById("galleryGrid");
    var lightbox = document.getElementById("lightbox");
    var lightboxImg = document.getElementById("lightboxImg");
    var lightboxClose = document.getElementById("lightboxClose");
    var lightboxPrev = document.getElementById("lightboxPrev");
    var lightboxNext = document.getElementById("lightboxNext");
    if (!section || !grid || !window.chGetGallery) {
      markPreloaderWait("gallery");
      return;
    }

    var images = [];
    var currentIndex = -1;

    function showIndex(idx) {
      if (!images.length) return;
      currentIndex = (idx + images.length) % images.length;
      lightboxImg.src = images[currentIndex];
    }
    function openLightbox(idx) {
      showIndex(idx);
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
    }
    function closeLightbox() {
      lightbox.hidden = true;
      lightboxImg.src = "";
      document.body.style.overflow = "";
    }
    lightboxClose.addEventListener("click", closeLightbox);
    lightboxPrev.addEventListener("click", function () { showIndex(currentIndex - 1); });
    lightboxNext.addEventListener("click", function () { showIndex(currentIndex + 1); });
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showIndex(currentIndex - 1);
      if (e.key === "ArrowRight") showIndex(currentIndex + 1);
    });

    window.chGetGallery().then(function (items) {
      if (!items.length) {
        section.style.display = "none";
        markPreloaderWait("gallery");
        return;
      }
      images = items.map(function (item) { return item.image; });
      lightboxPrev.hidden = lightboxNext.hidden = images.length <= 1;

      grid.innerHTML = items.map(function (item, idx) {
        var delayClass = ["", "reveal-delay-1", "reveal-delay-2", "reveal-delay-3"][idx % 4];
        return (
          '<div class="gallery-item reveal ' + delayClass + '" data-index="' + idx + '">' +
            '<img src="' + item.image + '" alt="" loading="lazy">' +
          "</div>"
        );
      }).join("");

      grid.querySelectorAll(".gallery-item").forEach(function (el) {
        el.addEventListener("click", function () { openLightbox(Number(el.getAttribute("data-index"))); });
      });

      if (window.CH_OBSERVE_REVEAL) window.CH_OBSERVE_REVEAL();
      markPreloaderWait("gallery");
    });
  }

  function initScrollReveal() {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var observer = null;

    if (!reduceMotion && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    }

    function observeAll() {
      document.querySelectorAll(".reveal:not(.in-view)").forEach(function (el) {
        if (reduceMotion || !observer) {
          el.classList.add("in-view");
        } else {
          observer.observe(el);
        }
      });
    }

    observeAll();
    window.CH_OBSERVE_REVEAL = observeAll;
    document.addEventListener("ch:langchange", function () {
      requestAnimationFrame(observeAll);
    });
  }

  function initMobileNav() {
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("mainNav");
    var header = document.querySelector(".site-header");
    if (!toggle || !nav || !header) return;

    var lockedScrollY = 0;

    function syncOffset() {
      var bottom = header.getBoundingClientRect().bottom;
      document.documentElement.style.setProperty("--nav-offset", Math.ceil(bottom) + "px");
    }

    function lockScroll() {
      lockedScrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = (-lockedScrollY) + "px";
      document.body.style.left = "0";
      document.body.style.right = "0";
    }

    function unlockScroll(restorePosition) {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      if (restorePosition) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            window.scrollTo({ top: lockedScrollY, left: 0, behavior: "instant" });
          });
        });
      }
    }

    function closeNav(restorePosition) {
      nav.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      unlockScroll(restorePosition !== false);
    }

    function openNav() {
      syncOffset();
      nav.classList.add("open");
      toggle.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
      lockScroll();
    }

    toggle.addEventListener("click", function () {
      if (nav.classList.contains("open")) closeNav(true); else openNav();
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { closeNav(false); });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav(true);
    });

    window.addEventListener("resize", syncOffset);
    document.addEventListener("ch:langchange", syncOffset);
    syncOffset();
  }

  function initFooterYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  function t(path) {
    return window.CH_I18N ? window.CH_I18N.t(path) : path;
  }

  function initCourierForm() {
    var form = document.getElementById("courierForm");
    if (!form) return;

    var submitBtn = document.getElementById("submitBtn");
    var btnLabel = submitBtn.querySelector(".btn-label");
    var feedback = document.getElementById("formFeedback");
    var requiredFields = form.querySelectorAll("[required]");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      hideFeedback();

      // Honeypot: bots tend to fill every input, humans never see this field.
      var honeypot = form.querySelector('[name="company_website"]');
      if (honeypot && honeypot.value.trim() !== "") {
        form.reset();
        showFeedback("success", t("form.success_title"), t("form.success_text"));
        return;
      }

      var valid = true;
      requiredFields.forEach(function (field) {
        field.classList.remove("field-error");
        if (!field.value || (field.type === "checkbox" && !field.checked)) {
          field.setCustomValidity(t("form.required_field"));
          field.classList.add("field-error");
          valid = false;
        } else {
          field.setCustomValidity("");
        }
      });

      if (!valid) {
        form.reportValidity();
        return;
      }

      var payload = {
        fullName: form.fullName.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
        city: form.city.value.trim(),
        vehicle: form.vehicle.value,
        license: form.license.value,
        availability: form.availability.value,
        message: form.message.value.trim(),
        language: window.CH_I18N ? window.CH_I18N.getLang() : "en"
      };

      setSubmitting(true);

      var submitPromise = window.chSubmitApplication
        ? window.chSubmitApplication(payload)
        : Promise.reject(new Error("firebase-not-configured"));

      submitPromise
        .then(function () {
          form.reset();
          showFeedback("success", t("form.success_title"), t("form.success_text"));
        })
        .catch(function (err) {
          console.error("Application submission failed:", err);
          showFeedback("error", t("form.error_title"), t("form.error_text"));
        })
        .finally(function () {
          setSubmitting(false);
        });
    });

    function setSubmitting(isSubmitting) {
      submitBtn.disabled = isSubmitting;
      btnLabel.textContent = isSubmitting ? t("form.submitting") : t("form.submit");
    }

    function showFeedback(type, title, text) {
      feedback.hidden = false;
      feedback.className = "form-feedback " + type;
      feedback.innerHTML = "<strong>" + title + "</strong><br>" + text;
      feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function hideFeedback() {
      feedback.hidden = true;
      feedback.className = "form-feedback";
      feedback.innerHTML = "";
    }
  }
})();
