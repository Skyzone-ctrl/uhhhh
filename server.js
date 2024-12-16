const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const axios = require('axios');
const compression = require('compression');

puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 3000;

// Configure compression for better performance
app.use(compression({
    level: 6,
    threshold: 0,
    filter: (req) => {
        return true; // Always compress responses
    }
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Proxy route for downloads
app.get('/download', async (req, res) => {
    const { url, filename } = req.query;
    const isMP3 = filename.endsWith('.mp3');
    
    try {
        // Get file size first
        const headResponse = await axios.head(url);
        const fileSize = parseInt(headResponse.headers['content-length'], 10);
        const chunkSize = 1024 * 1024; // 1MB chunks
        const chunks = Math.ceil(fileSize / chunkSize);
        
        // Set response headers
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', isMP3 ? 'audio/mpeg' : 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', fileSize);

        // Download chunks concurrently
        const downloadChunk = async (start, end) => {
            const response = await axios({
                method: 'get',
                url: url,
                responseType: 'stream',
                timeout: 120000,
                headers: {
                    'Accept-Encoding': 'gzip,deflate,compress',
                    'Connection': 'keep-alive',
                    'Range': `bytes=${start}-${end}`,
                    'Cache-Control': 'no-cache',
                    'DNT': '1'
                },
                httpVersion: 'http2',
                keepAlive: true,
                maxSockets: 10,
                maxRate: isMP3 ? 10 * 1024 * 1024 : 15 * 1024 * 1024 // 10MB/s for MP3, 15MB/s for MP4
            });
            return response.data;
        };

        // Process chunks in parallel with a limit
        const CONCURRENT_CHUNKS = 3;
        let processedBytes = 0;

        for (let i = 0; i < chunks; i += CONCURRENT_CHUNKS) {
            const chunkPromises = [];
            
            for (let j = 0; j < CONCURRENT_CHUNKS && i + j < chunks; j++) {
                const start = (i + j) * chunkSize;
                const end = Math.min(start + chunkSize - 1, fileSize - 1);
                chunkPromises.push(downloadChunk(start, end));
            }

            const chunkStreams = await Promise.all(chunkPromises);
            
            for (const stream of chunkStreams) {
                await new Promise((resolve, reject) => {
                    stream.pipe(res, { end: false });
                    stream.on('end', resolve);
                    stream.on('error', reject);
                });
                processedBytes += chunkSize;
            }
        }

        res.end();
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Error downloading file' });
    }
});

app.post('/process-video', async (req, res) => {
    const { url } = req.body;
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-site-isolation-trials',
                '--disable-dev-shm-usage'
            ]
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

        // Navigate to ssyoutube.tube
        await page.goto('https://ssyoutube.tube/', {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        // Input YouTube URL
        await page.waitForSelector('#hero_link', { visible: true, timeout: 30000 });
        await page.type('#hero_link', url);
        await page.click('.hero_btn');

        // Wait for results
        await page.waitForSelector('#results', { visible: true, timeout: 30000 });

        // Extract video information
        const videoInfo = await page.evaluate(() => {
            const titleElement = document.querySelector('.vtitle');
            const durationElement = document.querySelector('.res_left p:nth-child(3)');
            const thumbnailElement = document.querySelector('.res_left img');

            return {
                title: titleElement ? titleElement.textContent.trim() : '',
                duration: durationElement ? durationElement.textContent.trim() : '',
                thumbnail: thumbnailElement ? thumbnailElement.src : ''
            };
        });

        // Wait for video links to load
        await page.waitForSelector('.res_table', { visible: true, timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get MP4 link (360p)
        const mp4Link = await page.evaluate(() => {
            const rows = document.querySelectorAll('.res_table tbody tr');
            for (const row of rows) {
                if (row.textContent.includes('360p')) {
                    const downloadBtn = row.querySelector('.dbtn');
                    return downloadBtn ? downloadBtn.href : null;
                }
            }
            return null;
        });

        // Switch to MP3 tab
        const mp3Tab = await page.$('#tab-item-hndlr-2');
        await mp3Tab.click();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get MP3 link (128kbps)
        const mp3Link = await page.evaluate(() => {
            const rows = document.querySelectorAll('.res_table tbody tr');
            for (const row of rows) {
                if (row.textContent.includes('128Kbps')) {
                    const downloadBtn = row.querySelector('.dbtn');
                    return downloadBtn ? downloadBtn.href : null;
                }
            }
            return null;
        });

        await browser.close();

        // Extract filenames from URLs
        const mp4Filename = `${videoInfo.title.replace(/[^a-z0-9]/gi, '_')}_360p.mp4`;
        const mp3Filename = `${videoInfo.title.replace(/[^a-z0-9]/gi, '_')}_128kbps.mp3`;

        res.json({
            title: videoInfo.title,
            duration: videoInfo.duration,
            thumbnail: videoInfo.thumbnail,
            mp4Url: mp4Link,
            mp3Url: mp3Link,
            mp4Filename: mp4Filename,
            mp3Filename: mp3Filename
        });

    } catch (error) {
        console.error('Error:', error);
        if (browser) await browser.close();
        res.status(500).json({ error: 'Error processing video' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
