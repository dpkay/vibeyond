const puppeteer = require('puppeteer-core');

const BASE = 'http://localhost:5173';
const DIR = '/home/dpkay/vibeyond/screenshots';
const CHROME = '/home/dpkay/.cache/puppeteer/chrome/linux-145.0.7632.46/chrome-linux64/chrome';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1180, height: 820, deviceScaleFactor: 2 });
  await page.goto(`${BASE}/play`, { waitUntil: 'networkidle0', timeout: 15000 });
  await sleep(3000);

  // Strategy: read the current note from the VexFlow SVG, find the correct key, click it
  for (let round = 0; round < 15; round++) {
    // Wait for "playing" state
    await sleep(500);

    // Try to click all white keys one at a time with proper wait between
    // Find all clickable buttons in the keyboard area
    const buttons = await page.$$('button');

    // Click each white key one by one, checking for feedback
    for (const btn of buttons) {
      try {
        const box = await btn.boundingBox();
        if (!box) continue;
        // Only click buttons in the lower half (keyboard area)
        if (box.y < 400) continue;
        // Only click wider buttons (white keys) first
        if (box.width < 30) continue;

        await btn.click();
        await sleep(100);

        // Check if feedback overlay appeared (correct answer)
        const feedbackEl = await page.$('.fixed.inset-0.flex.items-center.justify-center.pointer-events-none.z-50');
        if (feedbackEl) {
          console.log(`Round ${round}: hit correct note!`);
          await sleep(1500); // Wait for feedback to complete
          break;
        }
      } catch (e) {
        // Button may have been removed, skip
      }
    }

    await sleep(500);

    // Check if celebration appeared
    const celebrationCheck = await page.$('h1');
    if (celebrationCheck) {
      const text = await page.evaluate(el => el.textContent, celebrationCheck);
      if (text && text.includes('Moon')) {
        console.log('Celebration screen detected!');
        await sleep(2000);
        await page.screenshot({ path: `${DIR}/review-celebration.png` });
        console.log('Captured celebration');
        break;
      }
    }
  }

  // If we still haven't reached celebration, try brute force more aggressively
  // by setting a very short session length first
  console.log('Attempting with short session...');

  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1180, height: 820, deviceScaleFactor: 2 });

  // Go to settings first and reduce session length to minimum (5)
  await page2.goto(`${BASE}/settings`, { waitUntil: 'networkidle0', timeout: 15000 });
  await sleep(2000);

  // Click minus button several times to reduce session length
  for (let i = 0; i < 10; i++) {
    const minusButtons = await page2.$$('button');
    for (const btn of minusButtons) {
      const text = await page2.evaluate(el => el.textContent, btn);
      if (text && text.includes('\u2212')) { // minus sign
        await btn.click();
        await sleep(200);
        break;
      }
    }
  }
  await sleep(500);

  // Now navigate to play
  await page2.goto(`${BASE}/play`, { waitUntil: 'networkidle0', timeout: 15000 });
  await sleep(3000);

  for (let round = 0; round < 30; round++) {
    await sleep(300);

    // Get all buttons in keyboard area
    const buttons = await page2.$$('button');
    for (const btn of buttons) {
      try {
        const box = await btn.boundingBox();
        if (!box) continue;
        if (box.y < 400) continue;
        await btn.click();
        await sleep(150);
      } catch (e) {}
    }

    await sleep(1200);

    // Check for celebration
    const headers = await page2.$$('h1');
    for (const h of headers) {
      const text = await page2.evaluate(el => el.textContent, h);
      if (text && text.includes('Moon')) {
        console.log('Celebration detected!');
        await sleep(3000); // Let animation play
        await page2.screenshot({ path: `${DIR}/review-celebration.png` });
        console.log('Captured celebration');
        await browser.close();
        process.exit(0);
      }
    }
  }

  console.log('Could not reach celebration screen');
  await browser.close();
})();
