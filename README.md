# YouTube Downloader

A fast and efficient YouTube video downloader with optimized download speeds.

## Deployment to Render

1. Push your code to a Git repository (GitHub, GitLab, etc.)

2. Log in to [Render](https://render.com)

3. Click "New +" and select "Web Service"

4. Connect your Git repository

5. Configure the service:
   - Name: `yt-downloader` (or your preferred name)
   - Environment: `Node`
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Instance Type: Select appropriate instance (at least 512 MB RAM recommended)

6. Add Environment Variables:
   ```
   NODE_VERSION=18.0.0
   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
   PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
   ```

7. Click "Create Web Service"

The deployment will automatically:
- Install required system dependencies for Puppeteer
- Set up Chrome for web scraping
- Configure the environment for optimal performance
- Start the service with the optimized download settings

## Features
- Concurrent chunk downloading for faster speeds
- HTTP/2 support
- Compression enabled
- Optimized buffer sizes
- Support for both MP3 and MP4 downloads
