'use strict';

// ─── Visit tracker ─────────────────────────────────────────────────────────────
// Posts one record per page view to a Google Apps Script endpoint, which appends
// a row to a Google Sheet. Location is resolved client-side from a free, no-key
// IP geolocation API. See analytics/README.md for the backend setup.
//
// Privacy note: this records coarse location (country/region/city) and the
// visitor's IP. If you want to anonymise, drop the `ip` field in Code.gs.
(function () {
  // ── Config ──────────────────────────────────────────────────────────────────
  // Paste your deployed Apps Script "Web app" URL here (ends in /exec).
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbwO7HH67R_zslTVHF2ij4EiFj3P7j_1pNUKcxdczAcWGk9DKB9ZabwYwiF_cqFFEyW4/exec';

  // Bail out cleanly until the endpoint is configured.
  if (!ENDPOINT || ENDPOINT.indexOf('PASTE_') === 0) return;

  // Don't track local development.
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;

  // ── Geo lookup (cached per session to avoid hammering the API) ───────────────
  function getGeo() {
    try {
      const cached = sessionStorage.getItem('geo');
      if (cached) return Promise.resolve(JSON.parse(cached));
    } catch (_) {}

    return fetch('https://ipwho.is/')
      .then(r => r.json())
      .then(d => {
        const geo = {
          ip: d.ip || '',
          country: d.country || '',
          region: d.region || '',
          city: d.city || '',
          lat: d.latitude || '',
          lon: d.longitude || '',
          isp: (d.connection && d.connection.isp) || '',
          org: (d.connection && d.connection.org) || '',
          domain: (d.connection && d.connection.domain) || '',
        };
        try { sessionStorage.setItem('geo', JSON.stringify(geo)); } catch (_) {}
        return geo;
      })
      .catch(() => ({})); // never block tracking on a geo failure
  }

  // ── Send one page-view record ────────────────────────────────────────────────
  function track(geo) {
    const payload = {
      ts: new Date().toISOString(),
      path: location.pathname + location.search,
      referrer: document.referrer || '',
      title: document.title || '',
      lang: navigator.language || '',
      tz: (Intl.DateTimeFormat().resolvedOptions().timeZone) || '',
      screen: window.screen ? `${screen.width}x${screen.height}` : '',
      ua: navigator.userAgent || '',
      ip: geo.ip || '',
      country: geo.country || '',
      region: geo.region || '',
      city: geo.city || '',
      lat: geo.lat || '',
      lon: geo.lon || '',
      isp: geo.isp || '',
      org: geo.org || '',
      domain: geo.domain || '',
    };

    const body = JSON.stringify(payload);
    // sendBeacon survives page unloads and sidesteps CORS preflight.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }));
    } else {
      fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body });
    }
  }

  // ── Fire on first load + on SPA navigations ──────────────────────────────────
  function record() { getGeo().then(track); }

  record();

  // This site navigates client-side via history.pushState (blog/articles).
  // Wrap it so those count as page views too.
  const _push = history.pushState;
  history.pushState = function () {
    const ret = _push.apply(this, arguments);
    record();
    return ret;
  };
  window.addEventListener('popstate', record);
})();
