const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const axios = require('axios');

puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Proxy route for downloads
app.get('/download', async (req, res) => {
    const { url, filename } = req.query;
    const isMP3 = filename.endsWith('.mp3');
    
    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            timeout: 60000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            headers: {
                'Connection': 'keep-alive',
                'Keep-Alive': 'timeout=60',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', isMP3 ? 'audio/mpeg' : 'video/mp4');
        if (response.headers['content-length']) {
            res.setHeader('Content-Length', response.headers['content-length']);
        }

        const stream = response.data;
        
        // Set up error handler
        stream.on('error', (error) => {
            console.error('Stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Download stream error' });
            }
        });

        // Monitor download progress
        let downloaded = 0;
        stream.on('data', (chunk) => {
            downloaded += chunk.length;
            if (response.headers['content-length']) {
                const total = parseInt(response.headers['content-length']);
                if (downloaded % Math.ceil(total * 0.05) < chunk.length) {
                    console.log(`Download progress: ${Math.round((downloaded / total) * 100)}%`);
                }
            }
        });

        // Pipe the response with a large buffer
        stream.pipe(res, { highWaterMark: 16 * 1024 * 1024 }); // 16MB buffer

    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error downloading file' });
        }
    }
});

app.post('/process-video', async (req, res) => {
    const { url } = req.body;
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-site-isolation-trials',
                '--disable-gpu'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
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

        // Close browser before sending response
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
    console.log(`Server running on port ${port}`);
});
