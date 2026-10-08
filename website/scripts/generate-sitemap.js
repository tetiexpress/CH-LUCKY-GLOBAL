#!/usr/bin/env node
/**
 * Regenerates sitemap.xml from live Firestore data (settings/site + gallery),
 * so <lastmod> always reflects when site content actually changed.
 *
 * Both collections are publicly readable per firestore.rules, so this script
 * uses the plain Firestore REST API — no service account / credentials needed.
 *
 * Usage: node scripts/generate-sitemap.js
 * Run it after meaningfully updating site content via the admin panel, then
 * redeploy: firebase deploy --only hosting
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

const PROJECT_ID = "ch-lucky-global";
const DOMAIN = "https://chluckyglobal.com";
const OUT_FILE = path.join(__dirname, "..", "sitemap.xml");

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

function firestoreTimestampToDate(value) {
  if (!value) return null;
  if (value.timestampValue) return new Date(value.timestampValue);
  return null;
}

async function main() {
  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

  let lastmod = new Date().toISOString().slice(0, 10);
  try {
    const settingsDoc = await fetchJson(`${base}/settings/site`);
    const settingsUpdated = firestoreTimestampToDate(settingsDoc.fields && settingsDoc.fields.updatedAt);

    const galleryList = await fetchJson(`${base}/gallery`);
    const galleryDates = (galleryList.documents || [])
      .map((d) => firestoreTimestampToDate(d.fields && d.fields.createdAt))
      .filter(Boolean);

    const allDates = [settingsUpdated, ...galleryDates].filter(Boolean);
    if (allDates.length) {
      const mostRecent = new Date(Math.max(...allDates.map((d) => d.getTime())));
      lastmod = mostRecent.toISOString().slice(0, 10);
    }
    console.log(`Found ${galleryDates.length} gallery photo(s). Using lastmod: ${lastmod}`);
  } catch (err) {
    console.warn("Could not fetch live Firestore data, falling back to today's date.", err.message);
  }

  const languages = ["en", "sq", "tr"];
  const urls = [
    { loc: `${DOMAIN}/`, priority: "1.0", alt: true },
    ...languages.map((lang) => ({ loc: `${DOMAIN}/?lang=${lang}`, priority: "0.9", alt: true })),
  ];

  const hreflangBlock = () =>
    languages.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${DOMAIN}/?lang=${l}"/>`).join("\n") +
    `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${DOMAIN}/"/>`;

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${u.loc}</loc>\n${u.alt ? hreflangBlock() + "\n" : ""}` +
          `    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
      )
      .join("\n") +
    `\n</urlset>\n`;

  fs.writeFileSync(OUT_FILE, xml, "utf-8");
  console.log(`sitemap.xml written to ${OUT_FILE}`);
}

main();
