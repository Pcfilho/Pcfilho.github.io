// Builds assets/hero-portrait.webp (1000px) and @2x (2000px) from assets/hero-portrait-src.png.
import { chromium } from 'playwright-core';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';

const SRC = 'assets/hero-portrait-src.png';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const b64 = readFileSync(SRC).toString('base64');

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
let dataUrl;
try {
  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas>');
  dataUrl = await page.evaluate(async (src) => {
    const img = new Image(); img.src = src; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.getElementById('c'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, W, H); const p = d.data;
    // grayscale + contrast curve: lift the subject, push the grey studio background to black
    for (let i = 0; i < p.length; i += 4) {
      let y = 0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2];
      y = (y - 46) * 1.28; if (y < 0) y = 0; if (y > 255) y = 255;
      p[i] = p[i + 1] = p[i + 2] = y;
    }
    g.putImageData(d, 0, 0);
    // radial vignette
    const v = g.createRadialGradient(W / 2, H * 0.42, W * 0.22, W / 2, H * 0.42, W * 0.62);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    // bottom fade to transparent (destination-out) over the last 35%
    g.globalCompositeOperation = 'destination-out';
    const f = g.createLinearGradient(0, H * 0.65, 0, H);
    f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = f; g.fillRect(0, H * 0.65, W, H * 0.35);
    return c.toDataURL('image/png');
  }, `data:image/png;base64,${b64}`);
} finally {
  await browser.close();
}

const tmp = 'assets/_hero-tmp.png';
try {
  writeFileSync(tmp, Buffer.from(dataUrl.split(',')[1], 'base64'));
  execSync(`cwebp -q 82 -resize 1000 0 ${tmp} -o assets/hero-portrait.webp`, { stdio: 'inherit' });
  execSync(`cwebp -q 80 -resize 2000 0 ${tmp} -o assets/hero-portrait@2x.webp`, { stdio: 'inherit' });
} finally {
  if (existsSync(tmp)) unlinkSync(tmp);
}
console.log('portrait built');
