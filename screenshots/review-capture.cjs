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

  // Home screen
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1180, height: 820, deviceScaleFactor: 2 });
    await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 15000 });
    await sleep(3000);
    await page.screenshot({ path: `${DIR}/review-home.png` });
    console.log('Captured home');
    await page.close();
  }

  // Session screen
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1180, height: 820, deviceScaleFactor: 2 });
    await page.goto(`${BASE}/play`, { waitUntil: 'networkidle0', timeout: 15000 });
    await sleep(4000); // Allow VexFlow to render
    await page.screenshot({ path: `${DIR}/review-session.png` });
    console.log('Captured session');
    await page.close();
  }

  // Settings screen
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1180, height: 820, deviceScaleFactor: 2 });
    await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle0', timeout: 15000 });
    await sleep(3000);
    await page.screenshot({ path: `${DIR}/review-settings.png` });
    console.log('Captured settings');
    await page.close();
  }

  // Celebration screen - trigger by navigating to /play and completing the session
  // We'll try to capture by simulating clicks. But easier: we can open /play and
  // use page.evaluate to directly set the store state.
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1180, height: 820, deviceScaleFactor: 2 });
    await page.goto(`${BASE}/play`, { waitUntil: 'networkidle0', timeout: 15000 });
    await sleep(3000);

    // Try to rapidly click correct answers to trigger celebration
    // First, let's try to get the current note and click the right key
    // Alternative: inject state directly
    // Let's try clicking keys multiple times — on each turn the app shows a note,
    // we click all white keys rapidly to brute-force correct answers
    for (let round = 0; round < 15; round++) {
      // Click all white piano keys to ensure we hit the correct one
      const whiteKeys = await page.$$('button[class*="absolute top-0 bottom-0"]');
      for (const key of whiteKeys) {
        await key.click();
        await sleep(50);
      }
      await sleep(1500); // Wait for feedback to complete
    }

    await sleep(2000);
    await page.screenshot({ path: `${DIR}/review-celebration.png` });
    console.log('Captured celebration (if reached)');
    await page.close();
  }

  await browser.close();
  console.log('All done!');
})();
