/* ===== CH Lucky Global — Admin panel logic ===== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-check.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { firebaseConfig, appCheckSiteKey } from "../../js/firebase-config.js";

const app = initializeApp(firebaseConfig);
if (appCheckSiteKey && appCheckSiteKey.indexOf("REPLACE_WITH") !== 0) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true
  });
}
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL_DOMAIN = "chluckyglobal.com";

const loginView = document.getElementById("loginView");
const dashboardView = document.getElementById("dashboardView");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginBtn = document.getElementById("loginBtn");

function showFeedback(el, type, text) {
  el.hidden = false;
  el.className = "admin-feedback " + type;
  el.textContent = text;
}
function hideFeedback(el) {
  el.hidden = true;
  el.textContent = "";
}

function toEmail(usernameOrEmail) {
  var v = usernameOrEmail.trim();
  return v.indexOf("@") === -1 ? v + "@" + ADMIN_EMAIL_DOMAIN : v;
}

loginForm.addEventListener("submit", function (e) {
  e.preventDefault();
  hideFeedback(loginError);
  var email = toEmail(document.getElementById("loginUser").value);
  var password = document.getElementById("loginPass").value;

  loginBtn.disabled = true;
  signInWithEmailAndPassword(auth, email, password)
    .catch(function (err) {
      var msg = "Kullanıcı adı veya şifre hatalı.";
      showFeedback(loginError, "error", msg);
    })
    .finally(function () {
      loginBtn.disabled = false;
    });
});

document.getElementById("logoutBtn").addEventListener("click", function () {
  signOut(auth);
});

onAuthStateChanged(auth, function (user) {
  if (user) {
    loginView.hidden = true;
    dashboardView.hidden = false;
    loadSettings();
    loadApplications();
    loadGallery();
  } else {
    loginView.hidden = false;
    dashboardView.hidden = true;
    loginForm.reset();
  }
});

/* ---------- Tabs ---------- */
document.querySelectorAll(".admin-tab").forEach(function (tab) {
  tab.addEventListener("click", function () {
    document.querySelectorAll(".admin-tab").forEach(function (t) { t.classList.remove("active"); });
    document.querySelectorAll(".admin-panel").forEach(function (p) { p.classList.remove("active"); });
    tab.classList.add("active");
    document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
  });
});

/* ---------- Settings (contact, social, hero, map) ---------- */
const SETTINGS_REF = doc(db, "settings", "site");
let currentSettings = {};

function loadSettings() {
  getDoc(SETTINGS_REF).then(function (snap) {
    currentSettings = snap.exists() ? snap.data() : {};
    var c = currentSettings.contact || {};
    var s = currentSettings.social || {};
    var h = currentSettings.hero || {};
    var m = currentSettings.map || {};

    var phones = Array.isArray(c.phones) ? c.phones : (c.phone ? [c.phone] : []);
    document.getElementById("fContactPhone1").value = phones[0] || "";
    document.getElementById("fContactPhone2").value = phones[1] || "";
    document.getElementById("fContactEmail").value = c.email || "";
    document.getElementById("fContactAddress").value = c.address || "";

    document.getElementById("fSocialFb").value = s.facebook || "";
    document.getElementById("fSocialIg").value = s.instagram || "";
    document.getElementById("fSocialTiktok").value = s.tiktok || "";
    document.getElementById("fSocialYoutube").value = s.youtube || "";

    document.getElementById("fHeroEnabled").checked = !!h.enabled;
    updateHeroPreview(h.backgroundImage || "");

    document.getElementById("fMapQuery").value = m.query || "";
  });
}

function saveSettingsField(key, value, feedbackEl) {
  var payload = { updatedAt: serverTimestamp() };
  payload[key] = value;
  hideFeedback(feedbackEl);
  return setDoc(SETTINGS_REF, payload, { merge: true })
    .then(function () {
      currentSettings[key] = value;
      showFeedback(feedbackEl, "success", "Kaydedildi.");
    })
    .catch(function (err) {
      showFeedback(feedbackEl, "error", "Kaydedilemedi: " + err.message);
    });
}

document.getElementById("saveContactBtn").addEventListener("click", function () {
  var phones = [
    document.getElementById("fContactPhone1").value.trim(),
    document.getElementById("fContactPhone2").value.trim()
  ].filter(function (p) { return p; });

  saveSettingsField("contact", {
    phones: phones,
    email: document.getElementById("fContactEmail").value.trim(),
    address: document.getElementById("fContactAddress").value.trim()
  }, document.getElementById("contactFeedback"));
});

document.getElementById("saveSocialBtn").addEventListener("click", function () {
  saveSettingsField("social", {
    facebook: document.getElementById("fSocialFb").value.trim(),
    instagram: document.getElementById("fSocialIg").value.trim(),
    tiktok: document.getElementById("fSocialTiktok").value.trim(),
    youtube: document.getElementById("fSocialYoutube").value.trim()
  }, document.getElementById("socialFeedback"));
});

document.getElementById("saveMapBtn").addEventListener("click", function () {
  saveSettingsField("map", {
    query: document.getElementById("fMapQuery").value.trim()
  }, document.getElementById("mapFeedback"));
});

/* ---------- Hero background image ---------- */
const heroFeedback = document.getElementById("heroFeedback");
let pendingHeroImage = null; // base64 data URL staged for save, or null if unchanged

function updateHeroPreview(dataUrl) {
  var img = document.getElementById("heroPreviewImg");
  var empty = document.getElementById("heroPreviewEmpty");
  if (dataUrl) {
    img.src = dataUrl;
    img.hidden = false;
    empty.hidden = true;
  } else {
    img.hidden = true;
    empty.hidden = false;
  }
}

function compressImage(file, maxDim, quality) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onerror = reject;
    reader.onload = function (e) {
      var img = new Image();
      img.onerror = reject;
      img.onload = function () {
        var width = img.width, height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function compressUntilFits(file) {
  var attempts = [[1600, 0.72], [1400, 0.6], [1100, 0.5], [900, 0.4], [700, 0.32]];
  for (var i = 0; i < attempts.length; i++) {
    var dataUrl = await compressImage(file, attempts[i][0], attempts[i][1]);
    if (dataUrl.length < 700000) return dataUrl;
  }
  throw new Error("Fotoğraf çok büyük, lütfen daha küçük/az detaylı bir fotoğraf deneyin.");
}

document.getElementById("fHeroFile").addEventListener("change", function (e) {
  var file = e.target.files[0];
  if (!file) return;
  hideFeedback(heroFeedback);
  showFeedback(heroFeedback, "success", "Fotoğraf işleniyor...");
  compressUntilFits(file)
    .then(function (dataUrl) {
      pendingHeroImage = dataUrl;
      updateHeroPreview(dataUrl);
      hideFeedback(heroFeedback);
    })
    .catch(function (err) {
      showFeedback(heroFeedback, "error", err.message || "Fotoğraf işlenemedi.");
    });
});

document.getElementById("saveHeroBtn").addEventListener("click", function () {
  var enabled = document.getElementById("fHeroEnabled").checked;
  var existing = (currentSettings.hero || {}).backgroundImage || "";
  var backgroundImage = pendingHeroImage !== null ? pendingHeroImage : existing;

  if (enabled && !backgroundImage) {
    showFeedback(heroFeedback, "error", "Önce bir fotoğraf seçin.");
    return;
  }

  saveSettingsField("hero", { enabled: enabled, backgroundImage: backgroundImage }, heroFeedback)
    .then(function () { pendingHeroImage = null; });
});

document.getElementById("removeHeroBtn").addEventListener("click", function () {
  pendingHeroImage = "";
  document.getElementById("fHeroEnabled").checked = false;
  document.getElementById("fHeroFile").value = "";
  updateHeroPreview("");
  saveSettingsField("hero", { enabled: false, backgroundImage: "" }, heroFeedback)
    .then(function () { pendingHeroImage = null; });
});

/* ---------- Photo gallery ---------- */
const galleryFeedback = document.getElementById("galleryFeedback");
const GALLERY_COLLECTION = collection(db, "gallery");

function loadGallery() {
  var grid = document.getElementById("galleryAdminGrid");
  var empty = document.getElementById("galleryAdminEmpty");
  getDocs(query(GALLERY_COLLECTION, orderBy("order", "asc"))).then(function (snap) {
    if (snap.empty) {
      grid.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    var items = [];
    snap.forEach(function (docSnap) { items.push({ id: docSnap.id, image: docSnap.data().image }); });

    grid.innerHTML = items.map(function (item) {
      return (
        '<div class="gallery-admin-item" data-id="' + item.id + '">' +
          '<img src="' + item.image + '" alt="" draggable="false">' +
          '<span class="gallery-admin-handle" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="9" cy="6" r="1.6" fill="currentColor"/><circle cx="15" cy="6" r="1.6" fill="currentColor"/><circle cx="9" cy="12" r="1.6" fill="currentColor"/><circle cx="15" cy="12" r="1.6" fill="currentColor"/><circle cx="9" cy="18" r="1.6" fill="currentColor"/><circle cx="15" cy="18" r="1.6" fill="currentColor"/></svg>' +
          "</span>" +
          '<button type="button" class="gallery-admin-remove" data-id="' + item.id + '" aria-label="Kaldır">&times;</button>' +
        "</div>"
      );
    }).join("");

    grid.querySelectorAll(".gallery-admin-remove").forEach(function (btn) {
      btn.addEventListener("click", function () {
        deleteDoc(doc(db, "gallery", btn.dataset.id)).then(loadGallery);
      });
    });

    initGallerySortable(grid);
  });
}

/* Press-and-hold drag reordering (mouse + touch) for the gallery grid. */
function initGallerySortable(grid) {
  var LONG_PRESS_MS = 200;
  var MOVE_THRESHOLD = 8;

  function persistOrder() {
    var els = Array.prototype.slice.call(grid.querySelectorAll(".gallery-admin-item"));
    Promise.all(els.map(function (el, idx) {
      return updateDoc(doc(db, "gallery", el.dataset.id), { order: idx });
    })).catch(function (err) {
      showFeedback(galleryFeedback, "error", "Sıralama kaydedilemedi: " + err.message);
    });
  }

  grid.querySelectorAll(".gallery-admin-item").forEach(function (item) {
    var pressTimer = null;
    var dragging = false;
    var pointerId = null;
    var startX = 0, startY = 0;

    function onMove(e) {
      if (e.pointerId !== pointerId) return;
      if (!dragging) {
        if (Math.abs(e.clientX - startX) > MOVE_THRESHOLD || Math.abs(e.clientY - startY) > MOVE_THRESHOLD) {
          clearTimeout(pressTimer);
        }
        return;
      }
      e.preventDefault();
      var elUnder = document.elementFromPoint(e.clientX, e.clientY);
      var target = elUnder && elUnder.closest(".gallery-admin-item");
      if (target && target !== item && grid.contains(target)) {
        var children = Array.prototype.slice.call(grid.children);
        if (children.indexOf(item) < children.indexOf(target)) {
          grid.insertBefore(item, target.nextSibling);
        } else {
          grid.insertBefore(item, target);
        }
      }
    }

    function onUp(e) {
      if (e.pointerId !== pointerId) return;
      clearTimeout(pressTimer);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      if (dragging) {
        dragging = false;
        item.classList.remove("dragging");
        item.style.touchAction = "";
        try { item.releasePointerCapture(pointerId); } catch (err) {}
        persistOrder();
      }
      pointerId = null;
    }

    item.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".gallery-admin-remove")) return;
      if (e.button !== undefined && e.button !== 0) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
      pressTimer = setTimeout(function () {
        dragging = true;
        item.classList.add("dragging");
        item.style.touchAction = "none";
        try { item.setPointerCapture(pointerId); } catch (err) {}
      }, LONG_PRESS_MS);
    });
  });
}

document.getElementById("fGalleryFile").addEventListener("change", function (e) {
  var file = e.target.files[0];
  if (!file) return;
  hideFeedback(galleryFeedback);
  showFeedback(galleryFeedback, "success", "Fotoğraf yükleniyor...");
  compressUntilFits(file)
    .then(function (dataUrl) {
      return getDocs(GALLERY_COLLECTION).then(function (snap) {
        return addDoc(GALLERY_COLLECTION, { image: dataUrl, order: snap.size, createdAt: new Date() });
      });
    })
    .then(function () {
      hideFeedback(galleryFeedback);
      e.target.value = "";
      loadGallery();
    })
    .catch(function (err) {
      showFeedback(galleryFeedback, "error", err.message || "Fotoğraf yüklenemedi.");
    });
});

/* ---------- Courier applications ---------- */
var allApplications = [];
var currentAppsFilter = "all";
var APPS_FILTER_LABELS = { all: "Tümü", pending: "Cevap Bekliyor", answered: "Cevaplandı" };

function statusLabel(status) {
  return status === "answered" ? "Cevaplandı" : "Cevap Bekliyor";
}

function loadApplications() {
  var loading = document.getElementById("appsLoading");
  var empty = document.getElementById("appsEmpty");
  loading.hidden = false;
  empty.hidden = true;
  hideFeedback(document.getElementById("appsFeedback"));
  document.getElementById("appsTableBody").innerHTML = "";

  var q = query(collection(db, "courier_applications"), orderBy("createdAt", "desc"));
  getDocs(q)
    .then(function (snap) {
      loading.hidden = true;
      allApplications = [];
      snap.forEach(function (docSnap) {
        allApplications.push(Object.assign({ id: docSnap.id }, docSnap.data()));
      });
      renderApplications();
    })
    .catch(function (err) {
      loading.hidden = true;
      empty.hidden = false;
      empty.textContent = "Başvurular yüklenemedi: " + err.message;
    });
}

function updateAppsFilterCounts() {
  var counts = { all: allApplications.length, pending: 0, answered: 0 };
  allApplications.forEach(function (a) { counts[a.status === "answered" ? "answered" : "pending"]++; });
  document.querySelectorAll(".apps-filter-btn").forEach(function (btn) {
    var key = btn.dataset.filter;
    btn.textContent = APPS_FILTER_LABELS[key] + " (" + counts[key] + ")";
  });
}

function renderApplications() {
  var tbody = document.getElementById("appsTableBody");
  var empty = document.getElementById("appsEmpty");

  updateAppsFilterCounts();

  var filtered = allApplications.filter(function (a) {
    if (currentAppsFilter === "all") return true;
    return (a.status === "answered" ? "answered" : "pending") === currentAppsFilter;
  });

  if (!filtered.length) {
    tbody.innerHTML = "";
    empty.hidden = false;
    empty.textContent = allApplications.length ? "Bu durumda başvuru yok." : "Henüz başvuru yok.";
    return;
  }
  empty.hidden = true;

  tbody.innerHTML = filtered.map(function (d) {
    var status = d.status === "answered" ? "answered" : "pending";
    var date = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toLocaleString("tr-TR") : "-";
    var phoneCell = d.phone ? '<a href="tel:' + escapeHtml(d.phone.replace(/[^0-9+]/g, "")) + '">' + escapeHtml(d.phone) + "</a>" : "-";
    var emailCell = d.email ? '<a href="mailto:' + escapeHtml(d.email) + '">' + escapeHtml(d.email) + "</a>" : "-";
    return (
      '<tr class="apps-row apps-row-' + status + '">' +
        "<td>" +
          '<button type="button" class="status-badge status-' + status + '" data-id="' + d.id + '" data-status="' + status + '">' +
            statusLabel(status) +
          "</button>" +
        "</td>" +
        "<td>" + escapeHtml(date) + "</td>" +
        "<td>" + escapeHtml(d.fullName || "-") + "</td>" +
        "<td>" + phoneCell + "</td>" +
        "<td>" + emailCell + "</td>" +
        "<td>" + escapeHtml(d.city || "-") + "</td>" +
        "<td>" + escapeHtml(d.vehicle || "-") + "</td>" +
        "<td>" + escapeHtml(d.license || "-") + "</td>" +
        "<td>" + escapeHtml(d.availability || "-") + "</td>" +
        "<td>" + escapeHtml((d.language || "-").toUpperCase()) + "</td>" +
        "<td>" + escapeHtml(d.message || "-") + "</td>" +
      "</tr>"
    );
  }).join("");

  tbody.querySelectorAll(".status-badge").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.dataset.id;
      var next = btn.dataset.status === "answered" ? "pending" : "answered";
      btn.disabled = true;
      updateDoc(doc(db, "courier_applications", id), { status: next, updatedAt: serverTimestamp() })
        .then(function () {
          var app = allApplications.find(function (a) { return a.id === id; });
          if (app) app.status = next;
          renderApplications();
        })
        .catch(function (err) {
          btn.disabled = false;
          showFeedback(document.getElementById("appsFeedback"), "error", "Durum güncellenemedi: " + err.message);
        });
    });
  });
}

document.getElementById("refreshAppsBtn").addEventListener("click", loadApplications);

document.querySelectorAll(".apps-filter-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".apps-filter-btn").forEach(function (b) { b.classList.remove("active"); });
    btn.classList.add("active");
    currentAppsFilter = btn.dataset.filter;
    renderApplications();
  });
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
