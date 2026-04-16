/**
 * Post-build script: injects a static Hero shell into dist/index.html.
 * All CSS values are copied from Chrome DevTools computed styles.
 *
 * Usage: node scripts/prerender-hero.mjs
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = resolve(__dirname, '..', 'dist', 'index.html')

if (!existsSync(distPath)) {
  console.error(`❌ Hero shell prerender failed: ${distPath} not found. Was the build step successful?`)
  process.exit(1)
}

// DCL logo SVG
const dclLogoSvg = `<svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M45 89.9999C69.8528 89.9999 89.9999 69.8528 89.9999 45C89.9999 20.1472 69.8528 0 45 0C20.1472 0 0 20.1472 0 45C0 69.8528 20.1472 89.9999 45 89.9999Z" fill="url(#dcl0)"/><path fill-rule="evenodd" clip-rule="evenodd" d="M18 80.9996C25.515 86.6471 34.875 89.9996 45 89.9996C55.125 89.9996 64.485 86.6471 72 80.9996H18Z" fill="#FF2D55"/><path fill-rule="evenodd" clip-rule="evenodd" d="M9 71.9996C11.565 75.397 14.603 78.435 18 80.9996H72C75.398 78.435 78.435 75.397 81 71.9996H9Z" fill="#FFA25A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M60.368 62.9997H3.758C5.153 66.2172 6.93 69.2322 9 71.9997H60.39V62.9997H60.368Z" fill="#FFC95B"/><path fill-rule="evenodd" clip-rule="evenodd" d="M31.883 29.25V63H60.008L31.883 29.25Z" fill="url(#dcl1)"/><path fill-rule="evenodd" clip-rule="evenodd" d="M3.758 63H31.883V29.25L3.758 63Z" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M60.368 47.25V72H81L60.368 47.25Z" fill="url(#dcl2)"/><path fill-rule="evenodd" clip-rule="evenodd" d="M39.757 72H60.367V47.25L39.757 72Z" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M60.368 40.5C66.58 40.5 71.618 35.463 71.618 29.25C71.618 23.037 66.58 18 60.368 18C54.154 18 49.118 23.037 49.118 29.25C49.118 35.463 54.154 40.5 60.368 40.5Z" fill="#FFC95B"/><path fill-rule="evenodd" clip-rule="evenodd" d="M31.882 22.5C34.989 22.5 37.507 19.981 37.507 16.875C37.507 13.768 34.989 11.25 31.882 11.25C28.776 11.25 26.257 13.768 26.257 16.875C26.257 19.981 28.776 22.5 31.882 22.5Z" fill="#FFC95B"/><defs><linearGradient id="dcl0" x1="45" y1="-18.64" x2="-18.64" y2="45" gradientUnits="userSpaceOnUse"><stop stop-color="#FF2D55"/><stop offset="1" stop-color="#FFBC5B"/></linearGradient><linearGradient id="dcl1" x1="31.873" y1="29.25" x2="31.873" y2="63" gradientUnits="userSpaceOnUse"><stop stop-color="#A524B3"/><stop offset="1" stop-color="#FF2D55"/></linearGradient><linearGradient id="dcl2" x1="60.36" y1="47.25" x2="60.36" y2="72" gradientUnits="userSpaceOnUse"><stop stop-color="#A524B3"/><stop offset="1" stop-color="#FF2D55"/></linearGradient></defs></svg>`

// JumpIn icon SVG — exact from decentraland-ui2 JumpInIcon
const jumpInSvg = `<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0.75" y="0.75" width="22.5" height="22.5" rx="5.25" stroke="#FCFCFC" stroke-opacity="0.3" stroke-width="1.5"></rect><path d="M18.7111 11.065L14.034 6.39027C13.2002 5.55695 11.7971 6.14637 11.7971 7.32523V8.86994C11.7564 8.86994 11.7361 8.86994 11.6954 8.86994H7.25895C6.50654 8.86994 5.89648 9.45936 5.89648 10.2114V13.7683C5.89648 14.5203 6.50654 15.1301 7.25895 15.1301H11.6751C11.7158 15.1301 11.7361 15.1301 11.7768 15.1301V16.6748C11.7768 17.8536 13.2002 18.4431 14.0137 17.6097L18.6908 12.935C19.2195 12.4065 19.2195 11.5732 18.7111 11.065Z" fill="#FCFCFC"></path></svg>`

// ============================================================
// ALL CSS values below copied 1:1 from Chrome DevTools Computed tab
// ============================================================
const criticalCss = `
<style data-hero-shell>
  body { margin: 0; background-color: #000; }

  /* NAVBAR — minimal style matching LandingNavbar not-signed-in */
  #hero-shell-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 1100;
    display: flex; align-items: center; justify-content: space-between;
    box-sizing: border-box;
    font-family: Inter, Helvetica, Arial, sans-serif;
    color: #f0f0f0; font-size: 16px;
    -webkit-font-smoothing: antialiased;
    height: 64px; padding: 12px 16px;
  }
  /* Mobile: show blur bg */
  #hero-shell-nav::before {
    content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: -1;
    background: rgba(22, 21, 24, 0.75);
    box-shadow: 0px 1.333px 24px rgba(0,0,0,0.12), 0px 8px 13.333px rgba(0,0,0,0.14), 0px 4px 6.667px rgba(0,0,0,0.2);
    backdrop-filter: saturate(1.8) blur(20px); -webkit-backdrop-filter: saturate(1.8) blur(20px);
  }
  #hero-shell-nav .nav-left { display: flex; align-items: center; gap: 16px; }
  #hero-shell-nav .nav-logo { display: flex; align-items: center; text-decoration: none; flex-shrink: 0; width: 40px; height: 40px; }
  #hero-shell-nav .nav-logo svg { width: 40px; height: 40px; }
  #hero-shell-nav .nav-logo-name { display: none; height: 20px; }
  #hero-shell-nav .nav-signin {
    all: unset; box-sizing: border-box; display: flex; align-items: center; justify-content: center;
    padding: 8px 22px; border: 1px solid #fcfcfc; border-radius: 6px;
    font-family: Inter, Helvetica, Arial, sans-serif; font-weight: 600; font-size: 15px;
    line-height: 24px; letter-spacing: 0.46px; text-transform: uppercase; color: #fcfcfc;
    cursor: pointer; white-space: nowrap;
  }
  @media (min-width: 992px) {
    #hero-shell-nav { height: 92px; padding: 16px 54px; }
    #hero-shell-nav::before {
      background: transparent; box-shadow: none; backdrop-filter: none; -webkit-backdrop-filter: none;
      transition: background 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
    }
    #hero-shell-nav .nav-logo { width: 40px; height: 40px; }
    #hero-shell-nav .nav-logo-name { display: block; }
  }

  /* HERO CONTAINER */
  #hero-shell {
    position: fixed; top: 0; left: 0; width: 100%; height: 100dvh;
    display: flex; align-items: flex-end; justify-content: center;
    overflow: hidden; background-color: #39055C; z-index: 1000;
  }
  #hero-shell .hero-bg {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0;
  }
  #hero-shell .hero-bg img,
  #hero-shell .hero-bg picture {
    object-fit: cover; display: block;
  }
  @media (max-width: 991px) {
    #hero-shell .hero-bg, #hero-shell .hero-bg picture, #hero-shell .hero-bg img {
      width: 100%; height: 100%;
    }
  }
  @media (min-width: 992px) {
    #hero-shell .hero-bg picture, #hero-shell .hero-bg img { width: 100%; height: 100%; }
  }
  #hero-shell .gradient-top {
    position: absolute; top: 0; left: 0; width: 100%; height: 24.3%;
    background: linear-gradient(180deg, #000 0%, rgba(0,0,0,0) 100%); z-index: 1;
  }
  #hero-shell .gradient-bottom {
    position: absolute; bottom: 0; left: 0; width: 100%; height: 60%;
    background: linear-gradient(0deg, rgb(57, 5, 92) 0%, rgba(0, 0, 0, 0) 100%); z-index: 1;
  }
  @media (max-width: 991px) {
    #hero-shell .gradient-bottom {
      height: 85%;
      background: linear-gradient(0deg, #39055C 0%, #39055C 30%, rgba(57,5,92,0) 100%);
    }
  }

  /* HERO CONTENT — mobile: iOS-style layout */
  #hero-shell .hero-content {
    position: relative; z-index: 2; box-sizing: border-box;
    display: flex; flex-direction: column; align-items: center; text-align: center;
    gap: 24px; max-width: 393px; width: 100%;
    padding: 0 24px 64px;
  }
  #hero-shell .hero-title {
    margin: 0; font-family: Inter, sans-serif;
    font-weight: 700; font-size: 40px; line-height: 48px;
    letter-spacing: 0.3752px;
    color: white; -webkit-font-smoothing: antialiased;
  }
  #hero-shell .hero-subtitle {
    margin: 0; font-family: Inter, sans-serif;
    font-weight: 500; font-size: 20px; line-height: 28px;
    letter-spacing: 0.1876px;
    color: #fcfcfc; text-shadow: 0 2px 4px rgba(0,0,0,0.25);
    -webkit-font-smoothing: antialiased;
  }
  /* Mobile: "Send Yourself the Link" button */
  #hero-shell .hero-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: calc(100% - 32px); max-width: 345px; height: 46px;
    border-radius: 12px; background-color: #FF2D55; border: none;
    font-family: Inter, sans-serif; font-weight: 700;
    font-size: 16px; color: #fcfcfc; text-transform: uppercase;
    cursor: pointer; box-shadow: rgba(0,0,0,0.4) 0px 2px 8px;
    -webkit-font-smoothing: antialiased;
  }
  #hero-shell .hero-btn svg { width: 20px; height: 20px; }
  /* Coming Soon row */
  #hero-shell .hero-coming-soon {
    display: flex; align-items: center; justify-content: center; gap: 8px; height: 46px;
  }
  #hero-shell .hero-coming-soon svg { width: 24px; height: 32px; }
  #hero-shell .hero-coming-soon span {
    font-family: Inter, sans-serif; font-weight: 500; font-size: 18px; color: #fcfcfc;
    letter-spacing: 0.16884px; line-height: 27px; -webkit-font-smoothing: antialiased;
  }
  /* Desktop CTA buttons — hidden on mobile */
  #hero-shell .hero-cta-wrapper { display: none; }
  #hero-shell .hero-buttons-row { display: flex; gap: 24px; align-items: flex-start; }
  #hero-shell .hero-download-btn {
    display: flex; align-items: center; justify-content: center; gap: 16px;
    width: 382.156px; height: 64px; padding: 0 80px;
    background-color: #FF2D55; border: none; border-radius: 16px;
    font-family: Inter, sans-serif; font-weight: 600; font-size: 19.89px;
    color: #fcfcfc; text-transform: uppercase; letter-spacing: 0.61px;
    text-decoration: none; cursor: pointer; box-sizing: border-box;
    white-space: nowrap;
    outline: 3px solid transparent; outline-offset: 4px;
    transition: outline-color 0.15s ease;
    -webkit-font-smoothing: antialiased;
  }
  #hero-shell .hero-download-btn:hover { outline-color: white; }
  #hero-shell .hero-download-btn .hero-os-icon {
    display: block; width: 32px; height: 32px; flex-shrink: 0;
  }
  #hero-shell .hero-epic-btn {
    display: flex; align-items: center; justify-content: center; gap: 24px;
    height: 64px; padding: 0 40px;
    background-color: white; border: 3px solid white; border-radius: 16px;
    font-family: Inter, sans-serif; font-weight: 600; font-size: 19.89px;
    color: #242129; text-transform: uppercase; letter-spacing: 0.61px;
    text-decoration: none; cursor: pointer; box-sizing: border-box;
    outline: 3px solid transparent; outline-offset: 4px;
    transition: outline-color 0.15s ease;
    -webkit-font-smoothing: antialiased;
  }
  #hero-shell .hero-epic-btn:hover { outline-color: white; }
  #hero-shell .hero-epic-btn img { width: 40px; height: 40px; filter: brightness(0); }
  /* Download info row */
  #hero-shell .hero-download-info {
    display: none; align-items: center; gap: 16px; justify-content: center;
  }
  #hero-shell .hero-download-info .hero-stats {
    display: flex; align-items: center; gap: 12px; min-width: 210px;
    font-family: Inter, sans-serif; font-size: 16px; font-weight: 400;
    line-height: 1.5; letter-spacing: 0.00938em; color: white; white-space: nowrap;
    -webkit-font-smoothing: antialiased;
  }
  #hero-shell .hero-download-info .hero-separator {
    width: 1px; height: 20px; background: rgba(255,255,255,0.5);
  }
  #hero-shell .hero-download-info .hero-platforms {
    display: flex; align-items: center; gap: 16px;
  }
  #hero-shell .hero-download-info .hero-platforms a {
    display: flex; line-height: 0;
  }
  #hero-shell .hero-download-info .hero-platforms img,
  #hero-shell .hero-download-info .hero-platforms .hero-platform-placeholder {
    width: 24px; height: 24px; filter: brightness(0) invert(1);
  }
  #hero-shell .hero-download-info .hero-platforms .hero-platform-placeholder {
    display: inline-block; filter: none; opacity: 0;
  }

  /* DESKTOP overrides */
  @media (min-width: 992px) {
    #hero-shell .hero-content {
      gap: 60px; padding: 0 0 120px; max-width: none;
    }
    #hero-shell .hero-title {
      font-family: Inter, Helvetica, Arial, sans-serif;
      font-size: 60px; font-weight: 600; line-height: 1.2; letter-spacing: -0.5px;
      box-sizing: border-box; text-size-adjust: 100%;
    }
    #hero-shell .hero-subtitle { display: none; }
    /* Hide mobile iOS elements, show desktop CTA */
    #hero-shell .hero-btn:not(.hero-download-btn):not(.hero-epic-btn) { display: none; }
    #hero-shell .hero-coming-soon { display: none; }
    #hero-shell .hero-cta-wrapper { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    #hero-shell .hero-download-info { display: flex; }
  }
</style>`

const heroHtml = `<div id="hero-shell-nav">
  <div class="nav-left">
    <a class="nav-logo" href="https://decentraland.org" aria-label="Decentraland home">${dclLogoSvg}</a>
  </div>

</div>
<div id="hero-shell">
  <div class="hero-bg">
    <picture>
      <source srcset="./hero_mobile.webp" media="(max-width: 599px)" />
      <source srcset="./hero_tablet.webp" media="(min-width: 600px) and (max-width: 991px)" />
      <source srcset="./hero_desktop.webp" media="(min-width: 992px)" />
      <img src="./hero_mobile.webp" alt="" />
    </picture>
  </div>
  <div class="gradient-top"></div>
  <div class="gradient-bottom"></div>
  <div class="hero-content">
    <h3 class="hero-title">Close the Feed. Come Hang Out.</h3>
    <p class="hero-subtitle">Switch to desktop to download.</p>
    <button class="hero-btn" type="button">Send Yourself the Link<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg></button>
    <div class="hero-coming-soon">
      <svg width="24" height="32" viewBox="-52.01 0 560.035 560.035" xmlns="http://www.w3.org/2000/svg" fill="white"><path d="M380.844 297.529c.787 84.752 74.349 112.955 75.164 113.314-.622 1.988-11.754 40.191-38.756 79.652-23.343 34.117-47.568 68.107-85.731 68.811-37.499.691-49.557-22.236-92.429-22.236-42.859 0-56.256 21.533-91.753 22.928-36.837 1.395-64.889-36.891-88.424-70.883-48.093-69.53-84.846-196.475-35.496-282.165 24.516-42.554 68.328-69.501 115.882-70.192 36.173-.69 70.315 24.336 92.429 24.336 22.1 0 63.59-30.096 107.208-25.676 18.26.76 69.517 7.376 102.429 55.552-2.652 1.644-61.159 35.704-60.523 106.559M310.369 89.418C329.926 65.745 343.089 32.79 339.498 0 311.308 1.133 277.22 18.785 257 42.445c-18.121 20.952-33.991 54.487-29.709 86.628 31.421 2.431 63.52-15.967 83.078-39.655"/></svg>
      <span>Coming Soon</span>
    </div>
    <div class="hero-cta-wrapper">
      <div class="hero-buttons-row">
        <a class="hero-download-btn" href="/download">DOWNLOAD FOR <span class="hero-os-icon"></span></a>
        <a class="hero-epic-btn" href="https://store.epicgames.com/en-US/p/decentraland-b692fb" target="_blank" rel="noopener noreferrer">DOWNLOAD ON <img src="./epic_icon.svg" alt="Epic Games" /></a>
      </div>
    </div>
    <div class="hero-download-info">
      <div class="hero-stats"><svg width="24" height="24" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#vc)"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.957.762L6.234 1.293a5.5 5.5 0 01-.404.275 2.5 2.5 0 01-.298.124c-.117.035-.237.053-.48.091l-.887.136c-.7.107-1.05.161-1.326.325a1.75 1.75 0 00-.595.595c-.164.278-.217.628-.325 1.326l-.136.886a7 7 0 01-.09.48 2.5 2.5 0 01-.125.298 5.5 5.5 0 01-.274.404L.762 6.957c-.419.571-.628.856-.71 1.165a1.75 1.75 0 000 .841c.08.312.29.598.71 1.165l.531.724c.145.197.218.297.274.404.05.095.091.195.124.3.035.115.053.236.091.478l.136.887c.107.7.161 1.05.325 1.325.144.246.349.451.595.596.278.163.628.217 1.326.325l.886.136c.243.037.365.056.48.091.104.031.203.073.299.124.107.057.206.128.404.275l.724.531c.57.419.856.628 1.165.71a1.75 1.75 0 00.841 0c.312-.081.598-.29 1.165-.71l.724-.531a5.5 5.5 0 01.404-.275c.095-.05.195-.091.298-.124.116-.035.237-.053.48-.091l.887-.136c.7-.107 1.05-.161 1.325-.325.246-.144.451-.349.596-.596.163-.277.217-.628.325-1.325l.136-.887c.037-.242.055-.365.091-.48.031-.103.072-.203.124-.298.057-.107.128-.206.274-.404l.531-.724c.419-.571.629-.856.71-1.165a1.75 1.75 0 000-.841c-.08-.312-.29-.598-.71-1.165l-.531-.724a5.5 5.5 0 01-.275-.404 2.5 2.5 0 01-.124-.298 7 7 0 01-.091-.48l-.136-.887c-.107-.7-.162-1.05-.325-1.326a1.75 1.75 0 00-.596-.595c-.278-.164-.628-.218-1.325-.325l-.887-.136a7 7 0 01-.48-.091 2.5 2.5 0 01-.298-.124 5.5 5.5 0 01-.404-.274L10.129.762c-.571-.419-.856-.628-1.165-.71a1.75 1.75 0 00-.841 0c-.312.081-.598.29-1.165.71zm5.697 5.783a.75.75 0 00-1.178-.925L7.938 9.96 6.047 8.506a.75.75 0 00-.963 1.137l2.48 1.935a.75.75 0 001.074-.107l4.019-4.938-.003-.01z" fill="#fff"/></g><defs><clipPath id="vc"><rect width="17.1" height="17.1" fill="#fff"/></clipPath></defs></svg> Total Downloads: +400K</div>
      <div class="hero-separator"></div>
      <div class="hero-platforms">
        <a href="#"><span class="hero-platform-placeholder"></span></a>
        <a href="#"><img src="./ios-logo.svg" alt="iOS" /></a>
        <a href="#"><img src="./google_play_icon.svg" alt="Android" /></a>
      </div>
    </div>
  </div>
</div>
<script>
(function(){var p=location.pathname;if(p.length>1&&p[p.length-1]==='/'){p=p.slice(0,-1);}if(p!=='/'&&p!==''){var s=document.getElementById('hero-shell');var n=document.getElementById('hero-shell-nav');var st=document.querySelector('[data-hero-shell]');if(s)s.remove();if(n)n.remove();if(st)st.remove();}})();
</script>`

const fontPreload = '<link rel="preload" as="font" type="font/woff2" href="https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2" crossorigin />'

let html = readFileSync(distPath, 'utf-8')

// Extract CDN URLs from the <link rel="preload"> tags Vite already wrote.
// This avoids duplicating the base URL logic and guarantees the <picture> in the
// hero shell loads from the same origin as the preload, preventing a double fetch
// where the zone origin returns text/html instead of the actual image.
const mobileImgMatch = html.match(/<link[^>]*href="([^"]*hero_mobile\.webp)"[^>]*>/)
const tabletImgMatch = html.match(/<link[^>]*href="([^"]*hero_tablet\.webp)"[^>]*>/)
const desktopImgMatch = html.match(/<link[^>]*href="([^"]*hero_desktop\.webp)"[^>]*>/)
const heroMobileUrl = mobileImgMatch?.[1] ?? './hero_mobile.webp'
const heroTabletUrl = tabletImgMatch?.[1] ?? './hero_tablet.webp'
const heroDesktopUrl = desktopImgMatch?.[1] ?? './hero_desktop.webp'

// Extract base URL from any CDN asset path for non-preloaded assets
// Extract base URL from the <base> tag or <script src> that Vite writes
const baseTagMatch = html.match(/<base[^>]*href="([^"]*)"/)
const scriptSrcMatch = html.match(/<script[^>]*src="([^"]*?)assets\//)
const cdnBase = baseTagMatch?.[1] ?? scriptSrcMatch?.[1] ?? '/'

const finalHeroHtml = heroHtml
  .replace(/\.\/hero_mobile\.webp/g, `${cdnBase}hero_mobile.webp`)
  .replace(/\.\/hero_tablet\.webp/g, `${cdnBase}hero_tablet.webp`)
  .replace(/\.\/hero_desktop\.webp/g, `${cdnBase}hero_desktop.webp`)
  .replace('./dcl_name.svg', `${cdnBase}dcl_name.svg`)
  .replace('./epic_icon.svg', `${cdnBase}epic_icon.svg`)
  .replace('./ios-logo.svg', `${cdnBase}ios-logo.svg`)
  .replace('./google_play_icon.svg', `${cdnBase}google_play_icon.svg`)

// Place the hero shell BEFORE #root, not inside it.  This is critical for LCP:
// if the shell is inside #root, either createRoot destroys it (losing the LCP
// image) or reparenting it with root.before() invalidates it as a LCP candidate
// in Chrome's algorithm.  By placing it as a sibling before #root, the image
// paints as LCP and is never touched by React until Hero's useEffect removes it.
html = html.replace(
  /<!-- HERO_SHELL_START -->[\s\S]*?<!-- HERO_SHELL_END -->/,
  '<!-- HERO_SHELL_START --><!-- HERO_SHELL_END -->'
)
html = html.replace(
  '<div id="root">',
  `${finalHeroHtml}\n<div id="root">`
)
html = html.replace('</head>', `${fontPreload}\n${criticalCss}\n</head>`)

// Rewrite favicon href to CDN so it doesn't 404 on decentraland.zone
// (the zone server's catch-all returns HTML for /favicon.ico)
html = html.replace('href="/favicon.ico"', `href="${cdnBase}favicon.ico"`)

writeFileSync(distPath, html)

console.log('✅ Hero shell prerendered into dist/index.html')
console.log(`   HTML: ${(heroHtml.length / 1024).toFixed(1)} KB`)
console.log(`   CSS:  ${(criticalCss.length / 1024).toFixed(1)} KB`)
