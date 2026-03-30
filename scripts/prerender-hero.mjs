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

  /* NAVBAR header — computed from .css-5pnr1f */
  #hero-shell-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    width: 100%;
    height: 66px;
    z-index: 1100;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    flex-shrink: 0;
    background-color: rgba(24, 20, 26, 0.9);
    backdrop-filter: saturate(1.8) blur(20px);
    -webkit-backdrop-filter: saturate(1.8) blur(20px);
    box-shadow: rgba(0,0,0,0.2) 0px 2px 4px -1px, rgba(0,0,0,0.14) 0px 4px 5px 0px, rgba(0,0,0,0.12) 0px 1px 10px 0px;
    color: rgb(255, 255, 255);
    font-family: Inter, Helvetica, Arial, sans-serif;
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
  }
  /* Toolbar — computed: height 66px, padding 0 16px, align-items center */
  #hero-shell-nav .nav-toolbar {
    display: flex;
    align-items: center;
    position: relative;
    height: 66px;
    min-height: 56px;
    padding: 0 16px;
  }
  /* Wrapper — computed: justify-content space-between, width 100% */
  #hero-shell-nav .nav-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 66px;
    width: 100%;
  }
  /* Logo + hamburger container — computed: width 85px, justify space-between */
  #hero-shell-nav .nav-left {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 85px;
    height: 66px;
  }
  /* Link wrapping logo — computed: display block, width 32px, height 36px */
  #hero-shell-nav .nav-logo {
    display: block;
    width: 32px; height: 36px;
    text-decoration: underline;
    text-decoration-color: rgba(255, 45, 85, 0.4);
    color: rgb(255, 45, 85);
    cursor: pointer;
    z-index: 1100;
  }
  /* Logo SVG — computed: 32x32, display inline-block, fill none */
  #hero-shell-nav .nav-logo svg {
    width: 32px; height: 32px;
    display: inline-block;
    flex-shrink: 0;
    fill: none;
    overflow: hidden;
    user-select: none;
  }
  /* Hamburger button — computed: 32x32 */
  #hero-shell-nav .nav-menu {
    display: inline-flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; min-width: 32px;
    cursor: pointer; background: transparent; border: none; padding: 0;
    position: relative;
  }
  #hero-shell-nav .nav-bar {
    position: absolute; left: 0; width: 100%; height: 2px;
    background: rgba(240,240,240,1);
  }
  #hero-shell-nav .nav-bar:first-child { top: 8px; }
  #hero-shell-nav .nav-bar:last-child { top: 21px; }

  /* HERO CONTAINER — from HeroContainer styled component */
  #hero-shell {
    position: relative; width: 100%; min-height: 100vh;
    display: flex; align-items: flex-end; justify-content: center;
    overflow: hidden; background-color: #39055C;
  }
  #hero-shell .hero-bg {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0;
  }
  #hero-shell .hero-bg img {
    width: 100%; height: 100%; object-fit: cover; display: block;
  }
  #hero-shell .gradient-top {
    position: absolute; top: 0; left: 0; width: 100%; height: 24.3%;
    background: linear-gradient(180deg, #000 0%, rgba(0,0,0,0) 100%); z-index: 1;
  }
  #hero-shell .gradient-bottom {
    position: absolute; bottom: 0; left: 0; width: 100%; height: 50%;
    background: linear-gradient(0deg, #39055C 0%, rgba(0,0,0,0) 100%); z-index: 1;
  }

  /* HERO CONTENT — computed from 4th div: gap 24px, padding 0 24px 96px */
  #hero-shell .hero-content {
    position: relative; z-index: 2;
    display: flex; flex-direction: column; align-items: center; text-align: center;
    gap: 24px;
    padding: 0 24px 96px;
  }

  /* TITLE — computed: font-size 36px, line-height 43.2px, letter-spacing -0.5px */
  #hero-shell .hero-title {
    margin: 0;
    font-family: Inter, Helvetica, Arial, sans-serif;
    font-size: 36px;
    color: rgb(255, 255, 255);
    font-weight: 600;
    line-height: 43.2px;
    letter-spacing: -0.5px;
    -webkit-font-smoothing: antialiased;
  }

  /* CTA wrapper — fixed height to prevent title shift on async load */
  #hero-shell .hero-cta-wrapper {
    display: flex; flex-direction: column; align-items: center; gap: 24px;
    min-height: 52px; justify-content: flex-start;
  }

  /* BUTTON — computed: 240x52, border-radius 6px, font-size 14px, padding 6px 16px */
  #hero-shell .hero-btn {
    display: flex; align-items: center; justify-content: center;
    box-sizing: border-box; cursor: pointer;
    appearance: none; -webkit-appearance: none;
    border: none; outline: 0; text-decoration: none;
    font-family: Inter, Helvetica, Arial, sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: 24px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    white-space: nowrap;
    color: rgb(252, 252, 252);
    background-color: rgb(255, 45, 85);
    box-shadow: none;
    border-radius: 6px;
    gap: 24px;
    width: 240px; height: 52px;
    min-width: 64px;
    padding: 6px 16px;
    position: relative;
    vertical-align: middle;
    user-select: none;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    -webkit-font-smoothing: antialiased;
  }
  /* Button endIcon span — computed: 32x32, margin-left 0, margin-right -4px */
  #hero-shell .hero-btn-icon {
    display: flex;
    width: 32px; height: 32px;
    margin-left: 0; margin-right: -4px;
  }
  #hero-shell .hero-btn-icon svg { width: 32px; height: 32px; }

  /* Already have an account — hidden on mobile, shown on desktop */
  #hero-shell .hero-already-user {
    display: none;
    font-family: Inter, Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.75;
    color: rgb(255, 255, 255);
    align-items: center;
    gap: 4px;
    -webkit-font-smoothing: antialiased;
  }
  #hero-shell .hero-already-user a {
    color: #FF2D55;
    text-decoration: none;
    text-transform: uppercase;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  #hero-shell .hero-already-user a svg { width: 24px; height: 24px; }

  /* DESKTOP overrides */
  @media (min-width: 991px) {
    #hero-shell .hero-cta-wrapper {
      min-height: 112px;
    }
    #hero-shell .hero-content {
      gap: 60px; padding: 0 0 120px;
    }
    #hero-shell .hero-title {
      font-size: 3rem; line-height: 1.2;
    }
    #hero-shell .hero-btn {
      width: 270px; height: 60px;
      font-size: 19.89px; padding: 20px 40px;
      line-height: 31.82px; letter-spacing: 0.61px;
      border-radius: 16px;
      box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 8px;
    }
    #hero-shell .hero-already-user {
      display: flex;
    }
  }
</style>`

const heroHtml = `<script>
(function(){var p=location.pathname;var b=document.querySelector('base');if(b){var h=new URL(b.href).pathname.replace(/\\/$/,'');p=p.replace(h,'');}if(p!=='/'&&p!==''){var s=document.getElementById('hero-shell');var n=document.getElementById('hero-shell-nav');if(s)s.style.display='none';if(n)n.style.display='none';}})();
</script>
<div id="hero-shell-nav">
  <div class="nav-toolbar">
    <div class="nav-wrapper">
      <div class="nav-left">
        <a class="nav-logo" href="https://decentraland.org" aria-label="Decentraland home">${dclLogoSvg}</a>
        <button class="nav-menu" aria-label="toggle menu">
          <span class="nav-bar"></span>
          <span class="nav-bar"></span>
        </button>
      </div>
    </div>
  </div>
</div>
<div id="hero-shell">
  <div class="hero-bg">
    <picture>
      <source srcset="./hero_mobile.webp" media="(max-width: 599px)" />
      <source srcset="./landing_hero.webp" media="(min-width: 600px)" />
      <img src="./landing_hero.webp" alt="" />
    </picture>
  </div>
  <div class="gradient-top"></div>
  <div class="gradient-bottom"></div>
  <div class="hero-content">
    <h3 class="hero-title">Close the Feed. Come Hang Out.</h3>
    <div class="hero-cta-wrapper">
      <button class="hero-btn" type="button">HANG OUT NOW<span class="hero-btn-icon">${jumpInSvg}</span></button>
      <span class="hero-already-user">Already have an account? <a href="/download_success">DOWNLOAD <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg></a></span>
    </div>
  </div>
</div>`

const fontPreload = '<link rel="preload" as="font" type="font/woff2" href="https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2" crossorigin />'

let html = readFileSync(distPath, 'utf-8')
html = html.replace(
  /<!-- HERO_SHELL_START -->[\s\S]*?<!-- HERO_SHELL_END -->/,
  `<!-- HERO_SHELL_START -->${heroHtml}<!-- HERO_SHELL_END -->`
)
html = html.replace('</head>', `${fontPreload}\n${criticalCss}\n</head>`)
writeFileSync(distPath, html)

console.log('✅ Hero shell prerendered into dist/index.html')
console.log(`   HTML: ${(heroHtml.length / 1024).toFixed(1)} KB`)
console.log(`   CSS:  ${(criticalCss.length / 1024).toFixed(1)} KB`)
