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

  const viewport = { width: 1024, height: 768, deviceScaleFactor: 2 };

  // 1. Notes mission with accidentals
  {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto(`${BASE}/play/notes:treble:acc`, { waitUntil: 'networkidle0', timeout: 15000 });
    await sleep(3000);
    await page.screenshot({ path: `${DIR}/01-notes-accidentals.png` });
    console.log('Captured notes with accidentals');
    await page.close();
  }

  // 2. Animal octave mission
  {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto(`${BASE}/play/animal-octaves`, { waitUntil: 'networkidle0', timeout: 15000 });
    await sleep(3000);
    await page.screenshot({ path: `${DIR}/02-animal-session.png` });
    console.log('Captured animal session');
    await page.close();
  }

  // 3. Home screen
  {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 15000 });
    await sleep(3000);
    await page.screenshot({ path: `${DIR}/03-home.png` });
    console.log('Captured home');
    await page.close();
  }

  // 4. Celebration screen
  {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto(`${BASE}/celebrate`, { waitUntil: 'networkidle0', timeout: 15000 });
    await sleep(3000);
    await page.screenshot({ path: `${DIR}/04-celebration.png` });
    console.log('Captured celebration');
    await page.close();
  }

  await browser.close();
  console.log('All done!');
})();
