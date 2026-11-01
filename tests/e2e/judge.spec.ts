import { expect, test } from '@playwright/test';

test('Chipnet payroll requires a test category and never reuses Mainnet PUSD', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Payroll', exact: true }).click();
  await page.getByRole('button', { name: 'Live', exact: true }).click();
  await page.getByRole('combobox').first().selectOption('chipnet');
  await expect(page.getByText('Chipnet test only.', { exact: false })).toBeVisible();
  const category = page.getByRole('textbox', { name: 'Chipnet test token category' });
  await expect(category).toHaveValue('');
  await expect(page.getByRole('status')).toContainText('Chipnet requires an issued test token category');
  await category.fill('2469acc5afa4b10cb5b5c04afb89c3a3ffd61c5da9c01e26d00951cae2a02544');
  await expect(page.getByRole('status')).toBeVisible();
  await category.fill('bc'.repeat(32));
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByText('Connect separate payer and payee wallets from the header.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fund vault', exact: true })).toHaveCount(0);
});

test('agent and payroll judge paths work without a wallet', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.getByRole('link', { name: /Slides/ })).toHaveAttribute(
    'href',
    '/StreamVault-BCH-Blaze-2026.pdf',
  );
  await expect(page.getByRole('link', { name: /GitHub/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Pre-hackathon code/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Pre-hackathon demo/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy CashTokens address' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Agent allowance' })).toBeVisible();
  await expect(page.getByRole('combobox').first()).toHaveValue('mainnet');

  await page.getByRole('button', { name: 'Launch agent budget' }).click();
  await expect(page.getByText('$2.00').first()).toBeVisible();
  await page.getByRole('button', { name: 'Run paid request' }).click();
  await expect(page.getByText('Service verified. Insight returned.')).toBeVisible();

  await page.getByRole('button', { name: 'Run until budget exhausted' }).click();
  await expect(page.getByText(/This period's budget is used up/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Cancel & reclaim' }).click();
  await expect(page.getByText(/reclaimed/i).first()).toBeVisible();

  // Sandbox events must never appear in the Live view.
  await page.getByRole('button', { name: 'Live', exact: true }).click();
  await expect(page.getByText('Service verified. Insight returned.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sandbox', exact: true }).click();
  await expect(page.getByText('Service verified. Insight returned.').first()).toBeVisible();

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
