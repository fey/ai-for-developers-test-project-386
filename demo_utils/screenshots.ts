import { chromium, expect } from '@playwright/test';

import { BookCatalogPage, BookEventTypePage } from '../e2e/pages/book-page';
import { EventTypesPage } from '../e2e/pages/event-types-page';
import { EventsPage } from '../e2e/pages/events-page';
import { HomePage } from '../e2e/pages/home-page';
import { getBaseUrl, getViewport, resetDir, screenshotOutputDir } from './utils';

const baseURL = getBaseUrl();
const viewport = getViewport();

async function main() {
  await resetDir(screenshotOutputDir);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL,
    locale: 'ru-RU',
    viewport,
  });

  const page = await context.newPage();
  const homePage = new HomePage(page);
  const bookCatalogPage = new BookCatalogPage(page);
  const bookEventTypePage = new BookEventTypePage(page);
  const eventsPage = new EventsPage(page);
  const eventTypesPage = new EventTypesPage(page);
  const eventTypeSlug = 'quick-call';
  const eventTypeName = 'Встреча 15 минут';

  await homePage.open();
  await expect(homePage.heading()).toBeVisible();
  await page.screenshot({ path: `${screenshotOutputDir}/01-home.png`, fullPage: true });

  await homePage.clickCta();
  await expect(bookCatalogPage.title()).toBeVisible();
  await expect(bookCatalogPage.eventTypesList()).toBeVisible();
  await page.screenshot({ path: `${screenshotOutputDir}/02-book-catalog.png`, fullPage: true });

  await bookCatalogPage.openEventTypeBySlug(eventTypeSlug);
  await expect(page).toHaveURL(new RegExp(`/book/${eventTypeSlug}$`));
  await expect(bookEventTypePage.title()).toContainText(eventTypeName);
  await page.screenshot({ path: `${screenshotOutputDir}/03-book-event-type.png`, fullPage: true });

  await bookEventTypePage.selectFirstDateWithFreeSlots();
  await bookEventTypePage.selectFirstAvailableSlot();
  await bookEventTypePage.proceedToConfirmStep();
  await expect(bookEventTypePage.confirmHeading()).toBeVisible();
  await page.screenshot({ path: `${screenshotOutputDir}/04-book-confirm.png`, fullPage: true });

  const now = Date.now();
  const notes = `Demo notes ${now}`;
  await bookEventTypePage.fillContactForm(`Demo User ${now}`, `demo-${now}@example.com`);
  await bookEventTypePage.fillNotes(notes);
  await bookEventTypePage.submitBooking();
  await expect(bookEventTypePage.successMessage()).toBeVisible();
  await expect(bookEventTypePage.successCard()).toContainText(notes);
  await page.screenshot({ path: `${screenshotOutputDir}/05-book-success.png`, fullPage: true });

  await bookEventTypePage.bookAgainButton().click();
  await expect(bookEventTypePage.continueButton()).toBeVisible();
  await page.screenshot({ path: `${screenshotOutputDir}/06-book-after-book-again.png`, fullPage: true });

  await eventsPage.open();
  await expect(eventsPage.title()).toBeVisible();
  await page.screenshot({ path: `${screenshotOutputDir}/07-admin-events.png`, fullPage: true });

  await eventsPage.eventTypesNavItem().click();
  await expect(eventTypesPage.title()).toBeVisible();
  await page.screenshot({ path: `${screenshotOutputDir}/08-admin-event-types.png`, fullPage: true });

  await context.close();
  await browser.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
