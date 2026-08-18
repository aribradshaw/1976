import { expect, test, type Page } from '@playwright/test';

const SAVE_KEY = '1976-campaign-save-v1';

interface SavedCampaign {
  state: {
    currentWeek: number;
    simulationSeed: number;
  };
}

async function startCampaign(page: Page, difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium') {
  await page.getByRole('button', { name: /Jimmy Carter/i }).click();
  await expect(page.getByRole('heading', { name: 'Select Difficulty' })).toBeVisible();
  await page.getByRole('button', { name: new RegExp(`^${difficulty}`, 'i') }).click();
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.getByText(/Playing as:\s*Jimmy Carter \(D\)/i)).toBeVisible();
}

async function readSavedCampaign(page: Page): Promise<SavedCampaign> {
  return page.evaluate((saveKey) => {
    const serialized = localStorage.getItem(saveKey);
    if (!serialized) throw new Error('Expected an autosaved campaign.');
    return JSON.parse(serialized) as SavedCampaign;
  }, SAVE_KEY);
}

test('opens at the 1976 title screen and starts a selected candidate and difficulty', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/1976/i);
  await expect(page.getByRole('heading', { name: '1976' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Choose Your Candidate' })).toBeVisible();
  await expect(page.getByText(/Spotify/i)).toHaveCount(0);

  await startCampaign(page, 'Hard');
  await expect(page.getByText('Week 1 of 25')).toBeVisible();
});

test('applies the network election-desk visual system to setup and gameplay', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('16px "Source Sans 3 Variable"'),
      document.fonts.load('16px "Source Serif 4 Variable"'),
    ]);
  });

  const titleStyles = await page.locator('.candidate-btn').first().evaluate((element) => {
    const root = getComputedStyle(document.documentElement);
    const card = getComputedStyle(element);
    const interfaceSelectors = ['.game-title', '.game-subtitle', '.game-description', '.candidate-name', '.candidate-party', '.candidate-strategy', '.game-version', '.settings-btn-corner'];
    const interfaceFamilies = [...new Set(interfaceSelectors.map(selector => {
      const target = document.querySelector(selector);
      return target ? getComputedStyle(target).fontFamily.split(',')[0].replaceAll('"', '') : '';
    }).filter(Boolean))];
    return {
      navy: root.getPropertyValue('--tv-navy').trim(),
      amber: root.getPropertyValue('--tv-amber').trim(),
      spacing: [1, 2, 3, 4, 5, 6].map(step => root.getPropertyValue(`--tv-space-${step}`).trim()),
      interfaceFamilies,
      fontsLoaded: document.fonts.check('16px "Source Sans 3 Variable"') && document.fonts.check('16px "Source Serif 4 Variable"'),
      radius: card.borderRadius,
      shadow: card.boxShadow,
    };
  });
  expect(titleStyles).toEqual({
    navy: '#17294c',
    amber: '#c4922d',
    spacing: ['4px', '8px', '12px', '16px', '24px', '32px'],
    interfaceFamilies: ['Source Sans 3 Variable'],
    fontsLoaded: true,
    radius: '0px',
    shadow: 'none',
  });

  await startCampaign(page);
  await expect(page.getByRole('heading', { name: '1976: As Seen on TV!' })).toBeVisible();
  const interfaceFilter = await page.locator('.game-interface').evaluate((element) => getComputedStyle(element).filter);
  expect(interfaceFilter).toBe('none');
  await expect(page.locator('.news-ticker-label')).toHaveText('WIRE');

  await page.setViewportSize({ width: 911, height: 900 });
  await page.goto('/');
  await expect(page.locator('.tv-controls')).toBeHidden();
  const hasReceiverOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(hasReceiverOverflow).toBe(false);
  const devlogLink = page.getByRole('link', { name: /development log/i });
  await expect(devlogLink).toBeVisible();
  await expect(devlogLink).toHaveAttribute('href', 'https://github.com/aribradshaw/1976/blob/main/DEVLOG.md');
});

test('title receiver fits short desktop and mobile viewports without scrolling or clipping faces', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 700 },
    { width: 911, height: 700 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');

    const fit = await page.evaluate(() => {
      const cards = [...document.querySelectorAll<HTMLElement>('.candidate-btn')];
      const images = [...document.querySelectorAll<HTMLImageElement>('.candidate-image')];
      const lastCardBottom = Math.max(...cards.map(card => card.getBoundingClientRect().bottom));
      return {
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        verticalOverflow: document.documentElement.scrollHeight > window.innerHeight + 1,
        cardsInsideViewport: lastCardBottom <= window.innerHeight + 1,
        portraitsUseTopFocalPoint: images.every(image => getComputedStyle(image).objectPosition.split(' ')[1] === '0%'),
      };
    });

    expect(fit).toEqual({
      horizontalOverflow: false,
      verticalOverflow: false,
      cardsInsideViewport: true,
      portraitsUseTopFocalPoint: true,
    });
  }
});

test('removes legacy music authorization state and exposes no connection controls', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('spotify_token', 'legacy-token');
    localStorage.setItem('spotify_auth_state', 'legacy-state');
    localStorage.setItem('spotify_code_verifier', 'legacy-verifier');
  });
  await page.goto('/');

  await expect.poll(() => page.evaluate(() => ({
    token: localStorage.getItem('spotify_token'),
    state: localStorage.getItem('spotify_auth_state'),
    verifier: localStorage.getItem('spotify_code_verifier'),
  }))).toEqual({ token: null, state: null, verifier: null });
  await expect(page.getByText(/Spotify/i)).toHaveCount(0);

  await page.getByRole('button', { name: 'Settings' }).click();
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await expect(settings.getByText(/Spotify/i)).toHaveCount(0);
  await expect(settings.getByText('Sound Effects Volume:')).toBeVisible();
});

test('resolves an end-week historical decision, interview, and recap', async ({ page }) => {
  await page.goto('/');
  await startCampaign(page);

  await page.getByRole('button', { name: 'End Week' }).click();
  const historicalDialog = page.getByRole('dialog');
  await expect(historicalDialog).toBeVisible();
  await expect(historicalDialog.getByRole('button', { name: 'Commit to this decision' })).toBeDisabled();
  const dialogFamilies = await historicalDialog.evaluate((dialog) => ({
    headline: getComputedStyle(dialog.querySelector('h2')!).fontFamily,
    choice: getComputedStyle(dialog.querySelector('.historical-event-choices button')!).fontFamily,
  }));
  expect(dialogFamilies.headline).toContain('Source Serif 4 Variable');
  expect(dialogFamilies.choice).toContain('Source Sans 3 Variable');

  await historicalDialog.locator('.historical-event-choices button').first().click();
  await historicalDialog.getByRole('button', { name: 'Commit to this decision' }).click();

  const interviewDialog = page.getByRole('dialog');
  await expect(interviewDialog.getByRole('heading', { name: 'Define your position' })).toBeVisible();
  await interviewDialog.getByRole('button', { name: 'Support it' }).click();
  await interviewDialog.getByRole('button', { name: 'Go on the record' }).click();

  const recapDialog = page.getByRole('dialog');
  await expect(recapDialog.getByRole('heading', { name: 'The week is in the books' })).toBeVisible();
  await expect(recapDialog.getByText(/Campaign Nightly.*Week 1/i)).toBeVisible();
});

test('autosaves and resumes the exact campaign seed and week after reload', async ({ page }) => {
  await page.goto('/');
  await startCampaign(page);

  await expect.poll(() => readSavedCampaign(page)).toMatchObject({
    state: { currentWeek: 1 },
  });
  const beforeReload = await readSavedCampaign(page);
  expect(beforeReload.state.simulationSeed).toBeGreaterThan(0);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Resume saved campaign' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume saved campaign' }).click();
  await expect(page.getByText(`Week ${beforeReload.state.currentWeek} of 25`)).toBeVisible();

  const afterResume = await readSavedCampaign(page);
  expect(afterResume.state.currentWeek).toBe(beforeReload.state.currentWeek);
  expect(afterResume.state.simulationSeed).toBe(beforeReload.state.simulationSeed);
});

test('primary setup controls work with the keyboard', async ({ page }) => {
  await page.goto('/');

  const carter = page.getByRole('button', { name: /Jimmy Carter/i });
  await carter.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Select Difficulty' })).toBeVisible();

  const hard = page.getByRole('button', { name: /^Hard/i });
  await hard.focus();
  await page.keyboard.press('Space');
  await expect(hard).toHaveClass(/selected/);

  const start = page.getByRole('button', { name: 'Start Game' });
  await start.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Playing as:\s*Jimmy Carter \(D\)/i)).toBeVisible();
});

test('accessibility preferences apply immediately and persist after reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  const settings = page.getByRole('dialog', { name: 'Settings' });

  await settings.getByText('Reduce motion', { exact: true }).click();
  await settings.getByText('CRT visual effects', { exact: true }).click();
  await expect(settings.getByLabel('Reduce motion')).toBeChecked();
  await expect(settings.getByLabel('CRT visual effects')).not.toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-crt-effects', 'false');
  await settings.getByRole('button', { name: 'Close settings' }).click();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-crt-effects', 'false');
});

test('mobile campaign exposes a usable state-table alternative without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await startCampaign(page);

  await page.getByRole('button', { name: 'State table' }).click();
  await expect(page.getByRole('table', { name: /State forecast/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open' }).first()).toBeVisible();
  const hasPageOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(hasPageOverflow).toBe(false);
});

test('completes all 25 weeks and reaches a fully called 538-EV election night', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await startCampaign(page, 'Easy');

  for (let week = 1; week <= 25; week += 1) {
    await page.getByRole('button', { name: 'End Week' }).click();
    const historicalDialog = page.getByRole('dialog');
    await historicalDialog.locator('.historical-event-choices button').first().click();
    await historicalDialog.getByRole('button', { name: 'Commit to this decision' }).click();

    const interviewHeading = page.getByRole('heading', { name: 'Define your position' });
    if (await interviewHeading.isVisible()) {
      const interviewDialog = page.getByRole('dialog');
      await interviewDialog.getByRole('button', { name: 'Support it' }).click();
      await interviewDialog.getByRole('button', { name: 'Go on the record' }).click();
    }

    if (week < 25) {
      const recap = page.getByRole('dialog');
      await expect(recap.getByRole('heading', { name: 'The week is in the books' })).toBeVisible();
      await recap.getByRole('button', { name: "Open next week's briefing" }).click();
    }
  }

  await expect(page.getByRole('heading', { name: 'Election Night' })).toBeVisible();
  await expect(page.getByText('538 / 538 electoral votes')).toBeVisible();
  await expect(page.getByText('The race is called')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run another campaign' })).toBeVisible();
});
