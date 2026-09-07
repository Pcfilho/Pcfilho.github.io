// Renders assets/og.png (1200x630) for link previews, in the site's visual system. Run: npm run og
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const portrait = readFileSync(new URL('../assets/hero-portrait.webp', import.meta.url)).toString('base64');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@800&family=Inter:wght@400;500&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; background: #000; color: rgba(255,255,255,.9); overflow: hidden; }
  .card { position: relative; width: 1200px; height: 630px; font-family: 'Inter', system-ui, sans-serif; }
  .bg { position: absolute; right: 40px; top: -20px; width: 700px; height: 700px; background: url(data:image/webp;base64,${portrait}) no-repeat center / contain; opacity: .95; }
  .grid { position: absolute; inset: 0; background: radial-gradient(rgba(255,255,255,.08) 1px, transparent 1px) 0 0 / 24px 24px; }
  .logo { position: absolute; left: 72px; top: 64px; width: 28px; height: 28px; background: #FF6A1A; }
  .logo::after { content: ''; position: absolute; right: -5px; bottom: -5px; width: 12px; height: 12px; background: #fff; }
  .name { position: absolute; left: 112px; top: 62px; font: 700 20px 'Inter Tight', sans-serif; color: #fff; }
  .h { position: absolute; left: 72px; bottom: 150px; font: 800 118px/0.95 'Inter Tight', sans-serif; letter-spacing: -.03em; color: #fff; text-shadow: 0 0 40px rgba(0,0,0,.7); }
  .sq { display: inline-block; width: 26px; height: 26px; background: #FF6A1A; margin-left: 8px; }
  .sub { position: absolute; left: 72px; bottom: 96px; font: 500 26px 'Inter', sans-serif; color: rgba(255,255,255,.9); }
  .sub span { color: rgba(255,255,255,.6); font-weight: 400; }
  .meta { position: absolute; left: 72px; bottom: 58px; font: 500 15px 'JetBrains Mono', monospace; letter-spacing: .02em; color: rgba(255,255,255,.4); }
</style></head><body>
<div class="card">
  <div class="grid"></div>
  <div class="bg"></div>
  <div class="logo"></div><div class="name">paulo.</div>
  <div class="h">Hi there<br>I am Paulo<span class="sq"></span></div>
  <div class="sub"><span>Shipping mobile apps since</span> 2020 · Senior React Native / Mobile Engineer</div>
  <div class="meta">pcfilho.github.io · Fortaleza, Brazil · GMT-3</div>
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
