// Renders assets/og.png (1200x630) for link previews as a brutalist business card. Run: npm run og
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const portrait = readFileSync(new URL('../assets/hero-portrait.webp', import.meta.url)).toString('base64');

// Colours mirror css/tokens.css (the card is rendered outside the site, so tokens are inlined).
const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@700;800&family=Inter:wght@400;500&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; background: #000; color: rgba(255,255,255,.9); overflow: hidden; }
  .card { position: relative; width: 1200px; height: 630px; font-family: 'Inter', system-ui, sans-serif;
    background: radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px) 0 0 / 24px 24px, #000; }
  .mark { position: absolute; width: 28px; height: 28px; }
  .mark::before, .mark::after { content: ''; position: absolute; background: rgba(255,255,255,.35); }
  .mark::before { width: 28px; height: 1px; } .mark::after { width: 1px; height: 28px; }
  .tl { left: 36px; top: 36px; } .tl::before, .tl::after { left: 0; top: 0; }
  .tr { right: 36px; top: 36px; } .tr::before, .tr::after { right: 0; top: 0; }
  .bl { left: 36px; bottom: 36px; } .bl::before, .bl::after { left: 0; bottom: 0; }
  .br { right: 36px; bottom: 36px; } .br::before, .br::after { right: 0; bottom: 0; }
  .logo { position: absolute; left: 96px; top: 84px; width: 26px; height: 26px; background: #FF6A1A; }
  .logo::after { content: ''; position: absolute; right: -5px; bottom: -5px; width: 11px; height: 11px; background: #fff; }
  .brand { position: absolute; left: 134px; top: 82px; font: 700 20px 'Inter Tight', sans-serif; color: #fff; }
  .name { position: absolute; left: 96px; top: 176px; font: 800 88px/1 'Inter Tight', sans-serif; letter-spacing: -.03em; color: #fff; white-space: nowrap; }
  .sq { display: inline-block; width: 20px; height: 20px; background: #FF6A1A; margin-left: 6px; }
  .role { position: absolute; left: 96px; top: 286px; font: 500 26px 'Inter', sans-serif; color: rgba(255,255,255,.9); }
  .meta { position: absolute; left: 96px; top: 328px; font: 400 18px 'Inter', sans-serif; color: rgba(255,255,255,.6); }
  .meta b { font-weight: 500; color: rgba(255,255,255,.9); }
  .photo { position: absolute; right: 96px; top: 84px; width: 240px; height: 240px; border: 1px solid rgba(255,255,255,.18);
    background: #000 url(data:image/webp;base64,${portrait}) no-repeat center 18% / 150%; }
  .rule { position: absolute; left: 96px; right: 96px; top: 400px; height: 1px; background: rgba(255,255,255,.18); }
  .contacts { position: absolute; left: 96px; right: 96px; top: 436px; display: grid; grid-template-columns: 1.25fr 1.25fr 1fr; gap: 24px; }
  .lbl { font: 500 12px 'JetBrains Mono', monospace; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.4); }
  .val { margin-top: 10px; font: 500 19px 'JetBrains Mono', monospace; color: rgba(255,255,255,.9); white-space: nowrap; }
  .site { position: absolute; left: 96px; bottom: 60px; font: 500 13px 'JetBrains Mono', monospace; letter-spacing: .04em; color: rgba(255,255,255,.4); }
</style></head><body>
<div class="card">
  <i class="mark tl"></i><i class="mark tr"></i><i class="mark bl"></i><i class="mark br"></i>
  <div class="logo"></div><div class="brand">paulo.</div>
  <div class="photo"></div>
  <div class="name">Paulo Barroso<span class="sq"></span></div>
  <div class="role">Senior React Native / Mobile Engineer</div>
  <div class="meta">Shipping mobile apps since <b>2020</b> · Fortaleza, Brazil · GMT-3</div>
  <div class="rule"></div>
  <div class="contacts">
    <div><div class="lbl">Email</div><div class="val">paulo.dev.85@gmail.com</div></div>
    <div><div class="lbl">LinkedIn</div><div class="val">/in/paulo-cesar-barroso</div></div>
    <div><div class="lbl">GitHub</div><div class="val">@Pcfilho</div></div>
  </div>
  <div class="site">pcfilho.github.io</div>
</div></body></html>`;

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
try {
  const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })).newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: new URL('../assets/og.png', import.meta.url).pathname, type: 'png' });
  console.log('og.png written');
} finally { await browser.close(); }
