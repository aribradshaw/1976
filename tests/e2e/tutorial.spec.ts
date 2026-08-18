import { expect, test, type Page } from '@playwright/test';

const TUTORIAL_KEY = '1976-election-sim.campaign-tour-complete:v1';

async function startCampaign(page: Page) {
  await page.getByRole('button', { name: /Jimmy Carter/i }).click();
  await page.getByRole('button', { name: /^Easy/i }).click();
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.getByText(/Playing as:\s*Jimmy Carter \(D\)/i)).toBeVisible();
}

async function expectCalloutFits(page: Page) {
  await expect(page.locator('.tutorial-callout')).toBeVisible();
  const fits = await page.locator('.tutorial-callout').evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.left >= 0 && bounds.right <= window.innerWidth + 1
      && bounds.top >= 0 && bounds.bottom <= window.innerHeight + 1
      && document.documentElement.scrollWidth <= window.innerWidth + 1;
  });
  expect(fits).toBe(true);
}

test('guides a first campaign across every mobile target and persists Skip', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((key) => localStorage.removeItem(key), TUTORIAL_KEY);
  await page.goto('/');
  await startCampaign(page);

  const tour = page.getByRole('dialog', { name: 'Read the race at a glance' });
  await expect(tour).toBeVisible();
  await expect(page.locator('[data-tutorial-target="campaign-header"]')).toBeInViewport();
  await expectCalloutFits(page);

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('dialog', { name: 'The map is your battlefield' })).toBeVisible();
  await expect(page.locator('.map-view-switcher')).toBeInViewport();
  await expectCalloutFits(page);

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('dialog', { name: 'Choose campaign actions' })).toBeVisible();
  await expect(page.locator('.right-panel .action-panel > h3')).toBeInViewport();
  await expectCalloutFits(page);

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('dialog', { name: 'Resolve the week' })).toBeVisible();
  await expect(page.locator('.right-panel .end-turn-btn')).toBeInViewport();
  await expectCalloutFits(page);

  await page.getByRole('button', { name: 'Skip tour' }).click();
  await expect(page.locator('.tutorial-callout')).toBeHidden();
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), TUTORIAL_KEY)).toBe('true');

  await page.reload();
  await page.getByRole('button', { name: 'Resume saved campaign' }).click();
  await expect(page.locator('.tutorial-callout')).toBeHidden();
  await page.getByRole('button', { name: 'Tour', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Read the race at a glance' })).toBeVisible();
});
