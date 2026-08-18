import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = process.env.TRAILER_BASE_URL || 'http://127.0.0.1:5173';
const rawDir = resolve(root, 'artifacts', 'trailer', 'raw');
const outputDir = resolve(root, 'artifacts', 'trailer');
const mainCapture = resolve(rawDir, 'campaign.webm');
const electionCapture = resolve(rawDir, 'election-night.webm');
const finalOutput = resolve(outputDir, '1976-trailer-v3.mp4');
const staticSound = resolve(root, 'public', 'audio', 'tvstatic.wav');
const clickSound = resolve(root, 'public', 'audio', 'stateselect.wav');
const viewport = { width: 1280, height: 720 };

mkdirSync(rawDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function startCampaign(page, difficulty = 'Medium') {
  await page.getByRole('button', { name: /Jimmy Carter/i }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: new RegExp(`^${difficulty}`, 'i') }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Start Game' }).click();
  await page.getByText(/Playing as:\s*Jimmy Carter \(D\)/i).waitFor();
}

async function resolveWeek(page, linger = false) {
  await page.getByRole('button', { name: 'End Week' }).click();
  const historicalDialog = page.getByRole('dialog');
  await historicalDialog.locator('.historical-event-choices button').first().waitFor();
  if (linger) await page.waitForTimeout(3200);
  await historicalDialog.locator('.historical-event-choices button').first().click();
  if (linger) await page.waitForTimeout(1200);
  await historicalDialog.getByRole('button', { name: 'Commit to this decision' }).click();

  const interviewHeading = page.getByRole('heading', { name: 'Define your position' });
  if (await interviewHeading.isVisible()) {
    if (linger) await page.waitForTimeout(2200);
    const interviewDialog = page.getByRole('dialog');
    await interviewDialog.getByRole('button', { name: 'Support it' }).click();
    if (linger) await page.waitForTimeout(800);
    await interviewDialog.getByRole('button', { name: 'Go on the record' }).click();
  }
}

async function recordCampaignDesk() {
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir: rawDir, size: viewport },
  });
  const page = await context.newPage();
  await page.goto(baseUrl);
  await page.getByRole('heading', { name: '1976' }).waitFor();
  await page.waitForTimeout(2500);
  await startCampaign(page);
  await page.waitForTimeout(2800);
  await page.getByRole('button', { name: 'Open full forecast' }).click();
  await page.getByRole('dialog', { name: /Electoral Forecast/i }).waitFor();
  await page.waitForTimeout(3500);
  await page.getByRole('button', { name: 'Close forecast' }).click();
  await resolveWeek(page, true);
  const recap = page.getByRole('dialog');
  await recap.getByRole('heading', { name: 'The week is in the books' }).waitFor();
  await page.waitForTimeout(3200);
  const video = page.video();
  await context.close();
  if (!video) throw new Error('Campaign capture did not create a video.');
  await video.saveAs(mainCapture);
}

async function prepareFinalWeekSave() {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(baseUrl);
  await startCampaign(page, 'Easy');

  for (let week = 1; week <= 24; week += 1) {
    await resolveWeek(page);
    const recap = page.getByRole('dialog');
    await recap.getByRole('heading', { name: 'The week is in the books' }).waitFor();
    await recap.getByRole('button', { name: "Open next week's briefing" }).click();
  }

  const save = await page.evaluate(() => localStorage.getItem('1976-campaign-save-v1'));
  await context.close();
  if (!save) throw new Error('Unable to prepare the final campaign week.');
  return save;
}

async function recordElectionNight(save) {
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir: rawDir, size: viewport },
  });
  await context.addInitScript((serialized) => {
    localStorage.setItem('1976-campaign-save-v1', serialized);
  }, save);
  const page = await context.newPage();
  await page.goto(baseUrl);
  await page.getByRole('button', { name: 'Resume saved campaign' }).click();
  await page.getByText('Week 25 of 25').waitFor();
  await page.waitForTimeout(700);
  await resolveWeek(page, true);
  await page.getByRole('heading', { name: 'Election Night' }).waitFor();
  await page.getByText('538 / 538 electoral votes').waitFor();
  await page.waitForTimeout(3800);
  const video = page.video();
  await context.close();
  if (!video) throw new Error('Election capture did not create a video.');
  await video.saveAs(electionCapture);
}

function probeDuration(path) {
  const result = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    path,
  ], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || `Unable to probe ${path}`);
  return Number(result.stdout.trim());
}

function renderTrailer() {
  const mainDuration = probeDuration(mainCapture);
  const electionDuration = probeDuration(electionCapture);
  const introDuration = 3.8;
  const pivotDuration = 3.2;
  const endDuration = 5.2;
  const totalDuration = introDuration + mainDuration + pivotDuration + electionDuration + endDuration;
  const mainDelay = Math.round(introDuration * 1000);
  const pivotDelay = Math.round((introDuration + mainDuration) * 1000);
  const electionDelay = Math.round((introDuration + mainDuration + pivotDuration) * 1000);
  const endDelay = Math.round((introDuration + mainDuration + pivotDuration + electionDuration) * 1000);
  const titleFont = "font='Arial':fontcolor=white";
  const amber = '0xE0B84F';
  const navy = '0x0D1930';
  const fadeOut = (duration) => Math.max(0, duration - 0.65).toFixed(3);

  const videoFilter = [
    `[0:v]fps=30,scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1,fade=t=in:st=0:d=0.55:color=${navy},fade=t=out:st=${fadeOut(mainDuration)}:d=0.65:color=${navy}[main]`,
    `[1:v]fps=30,scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1,fade=t=in:st=0:d=0.55:color=${navy},fade=t=out:st=${fadeOut(electionDuration)}:d=0.65:color=${navy}[election]`,
    `[2:v]drawtext=font='Georgia':fontcolor=${amber}:fontsize=40:text='AMERICA':x=(w-text_w)/2:y=245,drawtext=font='Georgia':fontcolor=white:fontsize=118:text='1976':x=(w-text_w)/2:y=300,drawtext=${titleFont}:fontsize=24:text='THE PRESIDENCY IS UP FOR GRABS':x=(w-text_w)/2:y=445,fade=t=in:st=0:d=0.7:color=${navy},fade=t=out:st=3.1:d=0.7:color=${navy}[intro]`,
    `[3:v]drawtext=font='Georgia':fontcolor=white:fontsize=54:text='Every decision':x=(w-text_w)/2:y=265,drawtext=font='Georgia':fontcolor=${amber}:fontsize=64:text='changes the map.':x=(w-text_w)/2:y=340,fade=t=in:st=0:d=0.6:color=${navy},fade=t=out:st=2.6:d=0.6:color=${navy}[pivot]`,
    `[4:v]drawtext=font='Georgia':fontcolor=${amber}:fontsize=132:text='1976':x=(w-text_w)/2:y=165,drawtext=${titleFont}:fontsize=38:text='AS SEEN ON TV!':x=(w-text_w)/2:y=325,drawtext=${titleFont}:fontsize=24:text='PLAY FREE IN YOUR BROWSER':x=(w-text_w)/2:y=420,drawtext=font='Arial':fontcolor=white:fontsize=24:text='aribradshaw.itch.io/1976':x=(w-text_w)/2:y=474,fade=t=in:st=0:d=0.7:color=${navy},fade=t=out:st=4.5:d=0.7:color=${navy}[end]`,
    '[intro][main][pivot][election][end]concat=n=5:v=1:a=0[v]',
    `[5:a]atrim=0:0.65,volume=0.24,adelay=${mainDelay}|${mainDelay}[s0]`,
    `[5:a]atrim=0:0.65,volume=0.28,adelay=${electionDelay}|${electionDelay}[s1]`,
    `[6:a]atrim=0:0.35,volume=0.42,adelay=2750|2750[c0]`,
    `[6:a]atrim=0:0.35,volume=0.35,adelay=${pivotDelay}|${pivotDelay}[c1]`,
    `[6:a]atrim=0:0.35,volume=0.44,adelay=${endDelay}|${endDelay}[c2]`,
    `aevalsrc=0.038*sin(2*PI*55*t)+0.018*sin(2*PI*82.41*t)+0.008*sin(2*PI*110*t):s=48000:d=${totalDuration},afade=t=in:st=0:d=2.2,afade=t=out:st=${(totalDuration - 2.4).toFixed(3)}:d=2.4[drone]`,
    `anoisesrc=color=brown:amplitude=0.008:d=${totalDuration}:s=48000,lowpass=f=420,afade=t=in:st=0:d=2,afade=t=out:st=${(totalDuration - 2).toFixed(3)}:d=2[texture]`,
    '[drone][texture][s0][s1][c0][c1][c2]amix=inputs=7:duration=longest:normalize=0[mix]',
    '[mix]loudnorm=I=-18:LRA=7:TP=-1.5[a]',
  ].join(';');

  const result = spawnSync('ffmpeg', [
    '-y',
    '-i', mainCapture,
    '-i', electionCapture,
    '-f', 'lavfi', '-t', String(introDuration), '-i', `color=c=${navy}:s=1280x720:r=30`,
    '-f', 'lavfi', '-t', String(pivotDuration), '-i', `color=c=${navy}:s=1280x720:r=30`,
    '-f', 'lavfi', '-t', String(endDuration), '-i', `color=c=${navy}:s=1280x720:r=30`,
    '-i', staticSound,
    '-i', clickSound,
    '-filter_complex', videoFilter,
    '-map', '[v]',
    '-map', '[a]',
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-profile:v', 'high',
    '-level', '4.0',
    '-c:a', 'aac',
    '-b:a', '160k',
    '-movflags', '+faststart',
    '-shortest',
    finalOutput,
  ], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });

  if (result.status !== 0) throw new Error(result.stderr || 'FFmpeg failed to render the trailer.');
  return { mainDuration, electionDuration, totalDuration, finalOutput };
}

if (process.env.TRAILER_RENDER_ONLY !== '1') {
  try {
    await recordCampaignDesk();
    const finalWeekSave = await prepareFinalWeekSave();
    await recordElectionNight(finalWeekSave);
  } finally {
    await browser.close();
  }
} else {
  await browser.close();
}

console.log(JSON.stringify(renderTrailer(), null, 2));
