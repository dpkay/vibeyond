import { chromium } from 'playwright';

const BASE = 'http://localhost:5174';
const DIR = '/home/dpkay/vibeyond/screenshots';

// iPad Air landscape dimensions
const VIEWPORT = { width: 1180, height: 820 };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });

// 1. Home screen
const home = await ctx.newPage();
await home.goto(BASE, { waitUntil: 'networkidle' });
await home.waitForTimeout(1500); // let animations settle
await home.screenshot({ path: `${DIR}/01-home.png`, fullPage: false });
console.log('Captured home screen');

// 2. Session screen (play)
const session = await ctx.newPage();
await session.goto(`${BASE}/play`, { waitUntil: 'networkidle' });
await session.waitForTimeout(2000); // let VexFlow render + animations
await session.screenshot({ path: `${DIR}/02-session.png`, fullPage: false });
console.log('Captured session screen');

// 3. Try pressing a piano key to see feedback
const keys = await session.$$('button');
const pianoKey = keys.find(async (k) => {
  const text = await k.textContent();
  return text && text.includes('C4');
});
if (pianoKey) {
  await pianoKey.click();
  await session.waitForTimeout(300);
  await session.screenshot({ path: `${DIR}/03-session-feedback.png`, fullPage: false });
  console.log('Captured feedback');
}

// 4. Settings screen
const settings = await ctx.newPage();
await settings.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
await settings.waitForTimeout(1000);
await settings.screenshot({ path: `${DIR}/04-settings.png`, fullPage: false });
console.log('Captured settings screen');

await browser.close();
console.log('Done!');
