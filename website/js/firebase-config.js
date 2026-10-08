/**
 * Firebase project configuration.
 *
 * Replace the placeholder values below with the config object from:
 * Firebase Console → Project settings → General → Your apps → SDK setup and configuration.
 *
 * This file is safe to expose publicly — these are client identifiers,
 * not secrets. Access to Firestore is controlled by firestore.rules.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyAMt1dGD-q_PydEtTVJ8HazPHjsIR5anLg",
  authDomain: "ch-lucky-global.firebaseapp.com",
  projectId: "ch-lucky-global",
  storageBucket: "ch-lucky-global.firebasestorage.app",
  messagingSenderId: "560722095095",
  appId: "1:560722095095:web:429ccb53c2b65d50e61cf2",
  measurementId: "G-HGS0YFNX80"
};

/**
 * reCAPTCHA v3 site key for Firebase App Check.
 * Get one at https://www.google.com/recaptcha/admin/create (type: reCAPTCHA v3),
 * then register it in Firebase Console → Build → App Check.
 * This is a public site key, safe to expose — same category as the config above.
 */
export const appCheckSiteKey = "REPLACE_WITH_RECAPTCHA_V3_SITE_KEY";
