import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test('Selene account paths arriving after connected update the payer without reloading', async ({ page }) => {
  const mock = readFileSync(new URL('../fixtures/wizardconnect-delayed.mjs', import.meta.url), 'utf8');
  await page.route('**/@wizardconnect_react.js*', route => route.fulfill({ contentType: 'text/javascript', body: mock }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Connect', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Deliver Selene account paths' })).toBeVisible();
  await expect(page.getByLabel('Pairing attempts')).toHaveText('1');
  await expect(page.getByRole('button', { name: 'Copy payer address', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Deliver Selene account paths' }).click();
  await expect(page.getByRole('button', { name: 'Copy payer address', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Disconnect payer', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy payee address', exact: true })).toHaveCount(0);
});
