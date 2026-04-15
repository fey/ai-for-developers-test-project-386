import { expect, test } from '@playwright/test';

test('smoke: application opens', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
});
