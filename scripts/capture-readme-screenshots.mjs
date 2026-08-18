import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const baseUrl = process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:5173';
const outputDir = new URL('../docs/screenshots/', import.meta.url);
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto(baseUrl);
await page.evaluate(() => localStorage.clear());
await page.reload();

await page.screenshot({ path: fileURLToPath(new URL('title-screen.png', outputDir)), fullPage: true });
await page.getByRole('button', { name: /Jimmy Carter/i }).click();
await page.getByRole('button', { name: /^Medium/i }).click();
await page.getByRole('button', { name: 'Start Game' }).click();
await page.getByRole('button', { name: 'State table' }).click();
await page.screenshot({ path: fileURLToPath(new URL('strategy-board.png', outputDir)), fullPage: true });

await page.getByRole('button', { name: 'Map' }).click();
await page.getByRole('button', { name: 'End Week' }).click();
await page.screenshot({ path: fileURLToPath(new URL('historical-decision.png', outputDir)), fullPage: true });

await browser.close();
