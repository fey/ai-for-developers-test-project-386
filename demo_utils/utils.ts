import { mkdir, rm } from 'node:fs/promises';
import type { Page } from '@playwright/test';

export const screenshotOutputDir = 'tmp/demo/screenshots';
export const videoOutputDir = 'tmp/demo/video';

export function getBaseUrl() {
  return process.env.BASE_URL ?? 'http://127.0.0.1:5173';
}

export function getViewport() {
  const width = Number.parseInt(process.env.SCREENSHOT_WIDTH ?? '1400', 10);
  const height = Number.parseInt(process.env.SCREENSHOT_HEIGHT ?? '1050', 10);
  return { width, height };
}

export async function resetDir(path: string) {
  await rm(path, { recursive: true, force: true });
  await mkdir(path, { recursive: true });
}

export async function pause(page: Page, ms: number) {
  await page.waitForTimeout(ms);
}
