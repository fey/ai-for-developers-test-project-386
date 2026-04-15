import { rename, rm } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

import { BookCatalogPage, BookEventTypePage } from '../e2e/pages/book-page';
import { EventTypesPage } from '../e2e/pages/event-types-page';
import { EventsPage } from '../e2e/pages/events-page';
import { HomePage } from '../e2e/pages/home-page';
import { getBaseUrl, getViewport, pause, resetDir, videoOutputDir } from './utils';

const baseURL = getBaseUrl();
const viewport = getViewport();
const stepDelayMs = Number.parseInt(process.env.DEMO_STEP_DELAY_MS ?? '900', 10);

async function main() {
  await resetDir(videoOutputDir);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL,
    locale: 'ru-RU',
    viewport,
    recordVideo: { dir: videoOutputDir, size: viewport },
  });

  const page = await context.newPage();
  const homePage = new HomePage(page);
  const bookCatalogPage = new BookCatalogPage(page);
  const bookEventTypePage = new BookEventTypePage(page);
  const eventsPage = new EventsPage(page);
  const eventTypesPage = new EventTypesPage(page);
  const eventTypeSlug = 'quick-call';
  const eventTypeName = 'Встреча 15 минут';
  const video = page.video();

  await homePage.open();
  await expect(homePage.heading()).toBeVisible();
  await pause(page, stepDelayMs);

  await homePage.clickCta();
  await expect(bookCatalogPage.title()).toBeVisible();
  await expect(bookCatalogPage.eventTypesList()).toBeVisible();
  await pause(page, stepDelayMs);

  await bookCatalogPage.openEventTypeBySlug(eventTypeSlug);
  await expect(page).toHaveURL(new RegExp(`/book/${eventTypeSlug}$`));
  await expect(bookEventTypePage.title()).toContainText(eventTypeName);
  await pause(page, stepDelayMs);

  await bookEventTypePage.selectFirstDateWithFreeSlots();
  await bookEventTypePage.selectFirstAvailableSlot();
  await pause(page, stepDelayMs);

  await bookEventTypePage.proceedToConfirmStep();
  await expect(bookEventTypePage.confirmHeading()).toBeVisible();
  await pause(page, stepDelayMs);

  await bookEventTypePage.returnToSelectStep();
  await expect(bookEventTypePage.continueButton()).toBeVisible();
  await pause(page, stepDelayMs);

  await bookEventTypePage.proceedToConfirmStep();
  await expect(bookEventTypePage.confirmHeading()).toBeVisible();
  await pause(page, stepDelayMs);

  const now = Date.now();
  const notes = `Demo notes ${now}`;
  await bookEventTypePage.fillContactForm(`Demo User ${now}`, `demo-${now}@example.com`);
  await bookEventTypePage.fillNotes(notes);
  await pause(page, stepDelayMs / 2);
  await bookEventTypePage.submitBooking();
  await expect(bookEventTypePage.successMessage()).toBeVisible();
  await expect(bookEventTypePage.successCard()).toContainText(notes);
  await pause(page, stepDelayMs);

  await bookEventTypePage.bookAgainButton().click();
  await expect(bookEventTypePage.continueButton()).toBeVisible();
  await pause(page, stepDelayMs);

  await eventsPage.open();
  await expect(eventsPage.title()).toBeVisible();
  await pause(page, stepDelayMs);

  await eventsPage.eventTypesNavItem().click();
  await expect(eventTypesPage.title()).toBeVisible();
  await pause(page, stepDelayMs * 2);

  await context.close();
  if (video) {
    const src = await video.path();
    const dst = `${videoOutputDir}/demo.webm`;
    await rm(dst, { force: true });
    await rename(src, dst);
  }
  await browser.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
