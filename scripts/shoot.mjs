// Serves the site on :8123 and captures desktop/mobile fold + full-page screenshots into shots/.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const MOUNT_IDS = ['site-header', 'hero', 'phone', 'products', 'bento', 'experience', 'colleagues', 'site-footer'];
mkdirSync('shots', { recursive: true });
const server = spawn('python3', ['-m', 'http.server', '8123'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 800));
try {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  for (const [name, w, h] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
    page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
    page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exitCode = 1; });
    await page.goto('http://localhost:8123/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const smoke = await page.evaluate(ids => ids.map(id => {
      const el = document.getElementById(id);
      return { id, ok: !!(el && el.innerHTML.trim()) };
    }), MOUNT_IDS);
    const failed = smoke.filter(s => !s.ok);
    if (failed.length) {
      failed.forEach(f => console.error('[smoke] fail:', f.id, 'empty innerHTML'));
      process.exitCode = 1;
    } else {
      console.log('[smoke] ok');
    }
    await page.screenshot({ path: `shots/${name}-fold.png` });
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += h * 0.8) { await page.evaluate(v => scrollTo(0, v), y); await page.waitForTimeout(250); }
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(500);
    await page.screenshot({ path: `shots/${name}-full.png`, fullPage: true });
    // fullPage captures render the bento canvas blank; grab a viewport-sized shot of it instead.
    await page.evaluate(() => document.getElementById('bento')?.scrollIntoView());
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `shots/${name}-bento.png` });
    console.log(name, 'done, height', total);
  }
  await browser.close();
} finally { server.kill(); }
