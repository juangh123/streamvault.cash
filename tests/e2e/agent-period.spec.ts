import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test(`agent allowance renews after one period at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await page.getByRole('button', { name: 'Launch agent budget', exact: true }).click();
    await page.getByRole('button', { name: 'Run until budget exhausted', exact: true }).click();
    await expect(page.getByText(/This period's budget is used up/).first()).toBeVisible();
    await expect(page.getByText('$1.90', { exact: true }).first()).toBeVisible();

    // A premature retry must not release a second tranche or pay the service.
    await page.getByRole('button', { name: 'Run paid request', exact: true }).click();
    await expect(page.getByText('$1.90', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('$0.10', { exact: true }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Fast-forward 1 period', exact: true }).click();
    await page.getByRole('button', { name: 'Run paid request', exact: true }).click();
    // Historical log entries remain; the active warning must clear.
    await expect(page.getByText(/^This period's budget is used up\. Next claim block: \d+\.$/)).toHaveCount(0);
    await expect(page.getByText('$1.80', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('$0.11', { exact: true }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Cancel & reclaim', exact: true }).click();
    await expect(page.getByText(/Payer reclaimed 1.80 PUSD/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Run paid request', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Cancel & reclaim', exact: true })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
