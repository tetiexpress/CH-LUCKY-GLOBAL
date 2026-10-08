/* ===== CH Lucky Global — Firebase init & courier application submission ===== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-check.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { firebaseConfig, appCheckSiteKey } from "./firebase-config.js";

var db = null;
var isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey.indexOf("REPLACE_WITH") !== 0;

if (isConfigured) {
  try {
    var app = initializeApp(firebaseConfig);
    if (appCheckSiteKey && appCheckSiteKey.indexOf("REPLACE_WITH") !== 0) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true
      });
    }
    db = getFirestore(app);
  } catch (err) {
    console.error("Firebase initialization failed:", err);
    isConfigured = false;
  }
}

/**
 * Submits a courier application to the "courier_applications" Firestore collection.
 * Returns a Promise that resolves on success and rejects with an Error on failure.
 */
window.chSubmitApplication = function (data) {
  if (!isConfigured || !db) {
    return Promise.reject(new Error("firebase-not-configured"));
  }
  return addDoc(collection(db, "courier_applications"), Object.assign({}, data, {
    createdAt: serverTimestamp(),
    source: "website",
    status: "pending"
  }));
};

/**
 * Fetches the public "settings/site" document (contact info, social links,
 * hero background, map). Resolves to null if unavailable or not configured.
 */
window.chGetSettings = function () {
  if (!isConfigured || !db) return Promise.resolve(null);
  return getDoc(doc(db, "settings", "site"))
    .then(function (snap) { return snap.exists() ? snap.data() : null; })
    .catch(function (err) {
      console.error("Failed to load site settings:", err);
      return null;
    });
};

/**
 * Fetches all public gallery photos, ordered for display. Resolves to an
 * empty array if unavailable or not configured.
 */
window.chGetGallery = function () {
  if (!isConfigured || !db) return Promise.resolve([]);
  return getDocs(query(collection(db, "gallery"), orderBy("order", "asc")))
    .then(function (snap) {
      var items = [];
      snap.forEach(function (docSnap) { items.push(Object.assign({ id: docSnap.id }, docSnap.data())); });
      return items;
    })
    .catch(function (err) {
      console.error("Failed to load gallery:", err);
      return [];
    });
};

window.CH_FIREBASE_READY = isConfigured;
