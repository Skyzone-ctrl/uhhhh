const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

async function downloadFromYt5s() {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: {
                width: 1024,
                height: 768
            },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-site-isolation-trials'
            ]
        });

        const page = await browser.newPage();

        // Set realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

        console.log('\nNavigating to yt5s.is...');
        await page.goto('https://yt5s.is/', {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        // Wait for the input field
        console.log('\nWaiting for input field...');
        await page.waitForSelector('input[type="text"]', { visible: true, timeout: 30000 });

        // Type YouTube URL in the input field
        console.log('\nTyping YouTube URL...');
        const youtubeUrl = 'https://www.youtube.com/watch?v=CNbmVEEW-mA'; // NOAH - Yang Terdalam
        await page.type('input[type="text"]', youtubeUrl);

        // Click the Start button
        console.log('\nClicking Start button...');
        await page.click('.btn-red');

        // Wait for results to appear
        console.log('\nWaiting for download options...');
        await page.waitForSelector('.download-links', { visible: true, timeout: 30000 });

        // Find and click the MP4 360p option
        console.log('\nLooking for MP4 360p option...');
        const downloadButtons = await page.$$('.download-links a');
        for (const button of downloadButtons) {
            const text = await button.evaluate(el => el.textContent);
            console.log('Found option:', text);
            if (text.includes('360p')) {
                console.log('Found 360p option, clicking...');
                await button.click();
                break;
            }
        }

        // Keep browser open for inspection
        console.log('\nScript complete. Browser will remain open for inspection.');
        console.log('Please check the browser window to see the actual page state.');

    } catch (error) {
        console.error('An error occurred:', error);
        if (browser) await browser.close();
    }
}

downloadFromYt5s();
