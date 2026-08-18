import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

type ContrastFailure = {
  state: string;
  target: string;
  summary: string;
  html: string;
};

async function auditContrast(
  page: Page,
  state: string,
  failures: ContrastFailure[],
  include?: string,
) {
  let audit = new AxeBuilder({ page }).withRules(['color-contrast']);
  if (include) audit = audit.include(include);
  const results = await audit.analyze();

  for (const violation of results.violations) {
    for (const node of violation.nodes) {
      failures.push({
        state,
        target: node.target.join(' '),
        summary: node.failureSummary || violation.description,
        html: node.html,
      });
    }
  }
}

async function startCampaign(page: Page) {
  await page.getByRole('button', { name: /Jimmy Carter/i }).click();
  await page.getByRole('button', { name: /^Easy/i }).click();
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.getByText(/Playing as:\s*Jimmy Carter \(D\)/i)).toBeVisible();
  const skipTour = page.getByRole('button', { name: 'Skip tour' });
  if (await skipTour.isVisible()) await skipTour.click();
}

async function resolveDecision(page: Page) {
  const historicalDialog = page.getByRole('dialog');
  await historicalDialog.locator('.historical-event-choices button').first().click();
  await historicalDialog.getByRole('button', { name: 'Commit to this decision' }).click();

  const interviewHeading = page.getByRole('heading', { name: 'Define your position' });
  if (await interviewHeading.isVisible()) {
    const interviewDialog = page.getByRole('dialog');
    await interviewDialog.getByRole('button', { name: 'Support it' }).click();
    await interviewDialog.getByRole('button', { name: 'Go on the record' }).click();
  }
}

test('all major public game states meet WCAG AA text contrast', async ({ page }) => {
  test.setTimeout(120_000);
  const failures: ContrastFailure[] = [];
  await page.goto('/');
  await auditContrast(page, 'title screen', failures);

  await page.getByRole('button', { name: 'Settings' }).click();
  await auditContrast(page, 'settings dialog', failures, '.settings-modal');
  await page.getByRole('button', { name: 'Close settings' }).click();

  await startCampaign(page);
  await auditContrast(page, 'campaign board', failures);

  await page.getByRole('button', { name: 'State table' }).click();
  await auditContrast(page, 'state table', failures);

  const oregonRow = page.getByRole('row', { name: /Oregon OR/i });
  await oregonRow.getByRole('button', { name: /Open Oregon campaign desk/i }).click();
  await auditContrast(page, 'state report and action planner', failures);

  await page.getByRole('button', { name: 'Open full forecast' }).click();
  await auditContrast(page, 'electoral forecast', failures, '.projected-votes-modal');
  await page.getByRole('button', { name: 'Close forecast' }).click();
  await page.locator('.close-state-info-btn').click();

  await page.getByRole('button', { name: 'End Week' }).click();
  await auditContrast(page, 'historical decision', failures, '.historical-event-card');
  const firstChoice = page.getByRole('dialog').locator('.historical-event-choices button').first();
  await firstChoice.click();
  await auditContrast(page, 'selected historical decision', failures, '.historical-event-card');
  await page.getByRole('dialog').getByRole('button', { name: 'Commit to this decision' }).click();

  const interviewDialog = page.getByRole('dialog');
  await expect(interviewDialog.getByRole('heading', { name: 'Define your position' })).toBeVisible();
  await auditContrast(page, 'weekly interview', failures, '.weekly-event-modal');
  await interviewDialog.getByRole('button', { name: 'Support it' }).click();
  await interviewDialog.getByRole('button', { name: 'Go on the record' }).click();

  const recap = page.getByRole('dialog');
  await expect(recap.getByRole('heading', { name: 'The week is in the books' })).toBeVisible();
  await auditContrast(page, 'weekly recap', failures, '.weekly-recap-card');
  await recap.getByRole('button', { name: "Open next week's briefing" }).click();

  for (let week = 2; week <= 25; week += 1) {
    await page.getByRole('button', { name: 'End Week' }).click();
    await resolveDecision(page);
    if (week < 25) {
      const weeklyRecap = page.getByRole('dialog');
      await weeklyRecap.getByRole('button', { name: "Open next week's briefing" }).click();
    }
  }

  await expect(page.getByRole('heading', { name: 'Election Night' })).toBeVisible();
  await expect(page.getByText('538 / 538 electoral votes')).toBeVisible();
  await auditContrast(page, 'election night', failures, '.election-night');

  const electionPanel = page.locator('.election-night');
  const latestCall = page.locator('.election-night__call').first();
  const [panelBox, callBox] = await Promise.all([
    electionPanel.boundingBox(),
    latestCall.boundingBox(),
  ]);
  expect(panelBox).not.toBeNull();
  expect(callBox).not.toBeNull();
  expect(callBox!.x).toBeGreaterThanOrEqual(panelBox!.x);
  expect(callBox!.y).toBeGreaterThanOrEqual(panelBox!.y);
  expect(callBox!.x + callBox!.width).toBeLessThanOrEqual(panelBox!.x + panelBox!.width);
  expect(callBox!.y + callBox!.height).toBeLessThanOrEqual(panelBox!.y + panelBox!.height);

  await page.goto('/#/devlog');
  await expect(page.getByRole('heading', { name: 'Building the race for 270' })).toBeVisible();
  await auditContrast(page, 'public DevLog', failures);

  await page.setViewportSize({ width: 390, height: 844 });
  await auditContrast(page, 'mobile public DevLog', failures);

  expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
});
