import { expect, test, type Page } from '@playwright/test';

const MOBILE_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
] as const;

async function startCampaign(page: Page) {
  await page.getByRole('button', { name: /Jimmy Carter/i }).click();
  await page.getByRole('button', { name: /^Easy/i }).click();
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.getByText(/Playing as:\s*Jimmy Carter \(D\)/i)).toBeVisible();
  const skipTour = page.getByRole('button', { name: 'Skip tour' });
  if (await skipTour.isVisible()) await skipTour.click();
}

async function resolveWeek(page: Page, week: number) {
  await page.getByRole('button', { name: 'End Week' }).click();
  const historicalDialog = page.locator('.historical-event-overlay');
  await expect(historicalDialog).toBeVisible();
  await historicalDialog.locator('.historical-event-choices button').first().click();
  await historicalDialog.getByRole('button', { name: 'Commit to this decision' }).click();

  const interview = page.getByRole('heading', { name: 'Define your position' });
  if (await interview.isVisible()) {
    const interviewDialog = page.locator('.weekly-event-overlay');
    await interviewDialog.getByRole('button', { name: 'Support it' }).click();
    await interviewDialog.getByRole('button', { name: 'Go on the record' }).click();
  }

  if (week < 25) {
    const recap = page.locator('.weekly-recap-overlay');
    await expect(recap.getByRole('heading', { name: 'The week is in the books' })).toBeVisible();
    await recap.getByRole('button', { name: "Open next week's briefing" }).click();
  }
}

test('State Table Open reaches the selected campaign desk at every mobile viewport', async ({ page }) => {
  for (const viewport of MOBILE_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await startCampaign(page);

    await page.getByRole('button', { name: 'State table' }).click();
    const openState = page.getByRole('button', { name: /Open .* campaign desk/i }).first();
    await expect(openState).toBeVisible();
    const bounds = await openState.boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    await openState.click();

    const stateDesk = page.locator('.state-info-panel');
    await expect(stateDesk).toBeVisible();
    await expect.poll(async () => stateDesk.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top >= 0 && rect.top < window.innerHeight;
    })).toBe(true);
    await expect(page.locator(':focus')).toHaveClass(/state-info-panel/);
  }
});

for (const viewport of MOBILE_VIEWPORTS) {
  test(`${viewport.width}x${viewport.height} can complete the 25-week campaign without horizontal clipping`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Choose Your Candidate' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Jimmy Carter/i })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

    await startCampaign(page);

    const mapToggle = page.getByRole('button', { name: 'Map' });
    await expect(mapToggle).toBeInViewport();
    const mapToggleBounds = await mapToggle.boundingBox();
    expect(mapToggleBounds?.height).toBeGreaterThanOrEqual(44);

    await page.getByRole('button', { name: 'State table' }).click();
    const openState = page.getByRole('button', { name: /Open .* campaign desk/i }).first();
    await expect(openState).toBeVisible();
    const openStateBounds = await openState.boundingBox();
    expect(openStateBounds?.height).toBeGreaterThanOrEqual(44);
    await openState.click();

    const stateDesk = page.locator('.state-info-panel');
    await expect(stateDesk).toBeVisible();
    await expect.poll(async () => stateDesk.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.top >= 0 && bounds.top < window.innerHeight;
    })).toBe(true);
    await expect(page.locator(':focus')).toHaveClass(/state-info-panel/);

    const closeStateDesk = stateDesk.getByRole('button', { name: /Close .* campaign desk/i });
    const closeStateDeskBounds = await closeStateDesk.boundingBox();
    expect(closeStateDeskBounds?.height).toBeGreaterThanOrEqual(44);
    await closeStateDesk.click();
    await expect(page.getByRole('button', { name: 'End Week' })).toBeVisible();

    for (let week = 1; week <= 25; week += 1) {
      await resolveWeek(page, week);
    }

    await expect(page.getByRole('heading', { name: 'Election Night' })).toBeVisible();
    await expect(page.getByText('538 / 538 electoral votes')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
}
