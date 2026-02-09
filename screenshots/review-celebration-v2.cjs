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

  // First reduce session to 5
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle0', timeout: 15000 });
  await sleep(2000);

  // Click minus 5 times
  for (let i = 0; i < 5; i++) {
    const minusBtns = await page.$$('button');
    for (const btn of minusBtns) {
      const text = await page.evaluate(el => el.textContent?.trim(), btn);
      if (text === '\u2212') {
        await btn.click();
        await sleep(300);
        break;
      }
    }
  }

  await sleep(500);
  await page.screenshot({ path: `${DIR}/review-settings-adjusted.png` });

  // Navigate to play via clicking back then play
  await page.goto(`${BASE}/play`, { waitUntil: 'networkidle0', timeout: 15000 });
  await sleep(3000);

  // Strategy: one key at a time, wait for feedback, then wait for advance
  for (let round = 0; round < 50; round++) {
    await sleep(400);

    // Check for celebration first
    const pageText = await page.evaluate(() => document.body.innerText);
    if (pageText.includes('reached the Moon')) {
      console.log(`Round ${round}: Celebration found!`);
      await sleep(3000);
      await page.screenshot({ path: `${DIR}/review-celebration.png` });
      console.log('Captured celebration!');
      await browser.close();
      process.exit(0);
    }

    // Get all buttons
    const buttons = await page.$$('button');
    let clicked = false;
    for (const btn of buttons) {
      try {
        const box = await btn.boundingBox();
        if (!box) continue;
        // Only keyboard area buttons (bottom portion)
        if (box.y < 500) continue;
        // Skip narrow buttons (black keys for now)
        if (box.width < 40) continue;

        await btn.click();
        clicked = true;
        await sleep(200);
        break; // Click one key at a time
      } catch (e) {}
    }

    if (!clicked) {
      // Try any button in lower half
      for (const btn of buttons) {
        try {
          const box = await btn.boundingBox();
          if (!box) continue;
          if (box.y < 400) continue;
          await btn.click();
          await sleep(200);
          break;
        } catch (e) {}
      }
    }

    // Wait for feedback to resolve
    await sleep(1500);
  }

  console.log('Did not reach celebration');
  await page.screenshot({ path: `${DIR}/review-celebration.png` });
  await browser.close();
})();
