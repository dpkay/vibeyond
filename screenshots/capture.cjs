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
    await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 10000 });
    await sleep(2000);
    await page.screenshot({ path: `${DIR}/01-home.png` });
    console.log('Captured home');
    await page.close();
  }

  // Animal mission session
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1180, height: 820, deviceScaleFactor: 2 });
    await page.goto(`${BASE}/play/animal-octaves`, { waitUntil: 'networkidle0', timeout: 10000 });
    await sleep(3000);
    await page.screenshot({ path: `${DIR}/02-animal-session.png` });
    console.log('Captured animal session');
    await page.close();
  }

  // Notes mission session
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1180, height: 820, deviceScaleFactor: 2 });
    await page.goto(`${BASE}/play/notes:treble`, { waitUntil: 'networkidle0', timeout: 10000 });
    await sleep(3000);
    await page.screenshot({ path: `${DIR}/03-notes-session.png` });
    console.log('Captured notes session');
    await page.close();
  }

  await browser.close();
  console.log('All done!');
})();
