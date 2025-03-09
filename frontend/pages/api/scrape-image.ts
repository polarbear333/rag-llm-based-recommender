// pages/api/scrape-image.ts
import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { asin } = req.query;

  try {
    let executablePath = null;

    if (process.platform === 'linux') {
      executablePath = await chromium.executablePath();
    } else if (process.platform === 'win32') {
      // Windows
      executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; // Or your Chromium path
    } else if (process.platform === 'darwin') {
      // macOS
      executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; // Or your Chromium path
    }

    if (!executablePath) {
      throw new Error('Could not determine executable path for your platform.');
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36');

    await page.goto(`https://www.amazon.com/dp/${asin}`, {
      waitUntil: 'networkidle2',
      timeout: 20000,
    });

    await page.waitForSelector(
      '#landingImage, img#js-masrw-main-image, img[data-a-image-name="landingImage"]',
      { timeout: 5000 }
    );

    const imageUrl = await page.evaluate(() => {
      const imgElement = document.querySelector<HTMLImageElement>(
        '#landingImage, img#js-masrw-main-image, img[data-a-image-name="landingImage"]'
      );
      return imgElement?.src || '';
    });

      await browser.close();

    if (!imageUrl) throw new Error('Image not found');
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
}