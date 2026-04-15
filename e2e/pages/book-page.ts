import type { Locator, Page } from '@playwright/test';

export class BookCatalogPage {
  constructor(private readonly page: Page) {}

  readonly title = (): Locator => this.page.getByTestId('book-title');

  readonly eventTypesList = (): Locator => this.page.getByTestId('book-event-types-list');

  readonly eventTypeCards = (): Locator => this.page.getByTestId('book-event-type-card');

  readonly status = (): Locator => this.page.getByTestId('book-status');

  readonly emptyState = (): Locator => this.page.getByTestId('book-event-types-empty');

  eventTypeLinkBySlug(slug: string): Locator {
    return this.page.locator(`a[href="/book/${slug}"]`).first();
  }

  async open(): Promise<void> {
    await this.page.goto('/book');
  }

  async openEventTypeBySlug(slug: string): Promise<void> {
    await this.eventTypeLinkBySlug(slug).click();
  }
}

export class BookEventTypePage {
  constructor(private readonly page: Page) {}

  readonly title = (): Locator => this.page.getByTestId('book-title');

  readonly notFoundCard = (): Locator => this.page.getByTestId('book-not-found');

  readonly continueButton = (): Locator => this.page.getByTestId('continue-button');

  readonly submitButton = (): Locator => this.page.getByTestId('submit-button');

  readonly confirmHeading = (): Locator => this.page.getByTestId('confirm-heading');

  readonly changeButton = (): Locator => this.page.getByRole('button', { name: 'Изменить' });

  readonly successMessage = (): Locator => this.page.getByTestId('success-message');

  readonly conflictError = (): Locator => this.page.getByTestId('conflict-error');

  readonly bookAgainButton = (): Locator => this.page.getByTestId('book-again-button');

  readonly nameInput = (): Locator => this.page.getByTestId('name-input');

  readonly emailInput = (): Locator => this.page.getByTestId('email-input');

  readonly notesInput = (): Locator => this.page.getByTestId('notes-input');

  readonly calendarDays = (): Locator => this.page.getByTestId('calendar-day');

  readonly prevMonthButton = (): Locator => this.page.getByTestId('calendar-prev-month');

  readonly nextMonthButton = (): Locator => this.page.getByTestId('calendar-next-month');

  readonly slotButtons = (): Locator => this.page.getByTestId('slot-button');

  readonly confirmCard = (): Locator => this.page.getByTestId('confirm-card');

  readonly successCard = (): Locator => this.page.getByTestId('success-card');

  readonly slotsList = (): Locator => this.page.getByTestId('slots-list');

  readonly infoSelectedDate = (): Locator => this.page.getByTestId('info-selected-date');

  readonly infoSelectedTime = (): Locator => this.page.getByTestId('info-selected-time');

  calendarDayByDate(dateKey: string): Locator {
    return this.page.locator(`[data-testid="calendar-day"][data-date="${dateKey}"]`);
  }

  firstDayWithFreeSlots(): Locator {
    return this.page
      .locator('[data-testid="calendar-day"][data-free-count]:not([data-free-count="0"])')
      .first();
  }

  availableSlotButtons(): Locator {
    return this.page.locator('[data-testid="slot-button"][data-available="true"]');
  }

  slotButtonByTime(timeRange: string): Locator {
    return this.page.locator(`[data-testid="slot-button"][data-time="${timeRange}"]`);
  }

  async open(slug: string): Promise<void> {
    await this.page.goto(`/book/${slug}`);
  }

  async selectFirstDateWithFreeSlots(): Promise<void> {
    await this.firstDayWithFreeSlots().click();
  }

  async selectFirstAvailableSlot(): Promise<string> {
    const slot = this.availableSlotButtons().first();
    const timeAttr = await slot.getAttribute('data-time');
    await slot.click();
    return timeAttr ?? '';
  }

  async selectAvailableSlotByTime(timeRange: string): Promise<void> {
    await this.slotButtonByTime(timeRange).click();
  }

  async proceedToConfirmStep(): Promise<void> {
    await this.continueButton().click();
  }

  async returnToSelectStep(): Promise<void> {
    await this.changeButton().click();
  }

  async fillContactForm(name: string, email: string): Promise<void> {
    await this.nameInput().fill(name);
    await this.emailInput().fill(email);
  }

  async fillNotes(notes: string): Promise<void> {
    await this.notesInput().fill(notes);
  }

  async submitBooking(): Promise<void> {
    await this.submitButton().click();
  }
}
