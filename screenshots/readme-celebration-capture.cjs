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
  await page.goto(`${BASE}/celebration-test.html`, { waitUntil: 'networkidle0', timeout: 15000 });
  await sleep(2000);
  await page.screenshot({ path: `${DIR}/readme-celebration.png` });
  console.log('Captured celebration');

  await browser.close();
  console.log('Done!');
})();
