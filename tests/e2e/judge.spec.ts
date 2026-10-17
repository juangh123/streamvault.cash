import { expect, test } from '@playwright/test';

test('agent and payroll judge paths work without a wallet', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Agent allowance' })).toBeVisible();

  await page.getByRole('button', { name: 'Launch agent budget' }).click();
  await expect(page.getByText('$2.00').first()).toBeVisible();
  await page.getByRole('button', { name: 'Run paid request' }).click();
  await expect(page.getByText('Service verified. Insight returned.')).toBeVisible();

  await page.getByRole('button', { name: 'Run until budget exhausted' }).click();
  await expect(page.getByText(/This period's budget is used up/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Cancel & reclaim' }).click();
  await expect(page.getByText(/reclaimed/i).first()).toBeVisible();

  await page.getByRole('button', { name: 'Payroll' }).click();
  await page.getByRole('button', { name: /Launch Demo Stream/ }).click();
  await page.getByRole('button', { name: 'Fast-forward 1 period' }).click();
  await page.getByRole('button', { name: 'Claim', exact: true }).click();
  await expect(page.getByText('Last settlement')).toBeVisible();
  await expect(page.getByText('$975.00').first()).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  const widths = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth);
  expect(errors).toEqual([]);
});
