// Inlined into dist/index.html by prerender-hero.mjs, right after the static hero shell.
// The shell is what a visitor sees and clicks until the React Hero mounts, and it stays
// up for good when the homepage chunk never loads. Detecting the desktop OS here, from
// the user agent alone, keeps that button a one-click download (icon + /download_success)
// instead of a blank "DOWNLOAD FOR" pointing at the /download interstitial.
// No modules and no modern syntax on purpose: it runs inline, before any bundle loads.
;(function () {
  var button = document.querySelector('#hero-shell .hero-download-btn')
  if (!button) return

  var nav = window.navigator
  var platform = (nav.userAgentData && nav.userAgentData.platform) || ''
  var ua = nav.userAgent || ''
  var os = null
  if (platform) {
    // Client Hints win when present: a desktop-mode or spoofed user agent can claim
    // Windows on a device whose platform says otherwise.
    if (/^windows$/i.test(platform)) os = 'Windows'
    else if (/^macos$/i.test(platform) && !(nav.maxTouchPoints > 1)) os = 'macOS'
  } else if (/windows/i.test(ua)) {
    os = 'Windows'
  } else if (/macintosh/i.test(ua) && !(nav.maxTouchPoints > 1)) {
    // iPadOS reports a Macintosh user agent; touch points tell it apart.
    os = 'macOS'
  }
  if (!os) return

  // Same href the React Hero builds (DownloadPlace.LANDING_HERO). Partner utm_* params are
  // forwarded as-is: /download_success applies the allowlist and normalization itself.
  var params = new URLSearchParams({ os: os, place: 'landing-hero' })
  new URLSearchParams(window.location.search).forEach(function (value, key) {
    if (key.indexOf('utm_') === 0) params.set(key, value)
  })
  button.setAttribute('href', '/download_success?' + params.toString())
  button.setAttribute('data-os', os)
})()
