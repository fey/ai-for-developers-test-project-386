import type { Locator, Page } from '@playwright/test';

export class EventsPage {
  constructor(private readonly page: Page) {}

  readonly title = (): Locator => this.page.getByTestId('events-title');
  readonly sidebar = (): Locator => this.page.getByTestId('admin-sidebar');
  readonly eventsNavItem = (): Locator => this.page.getByTestId('admin-nav-events');
  readonly eventTypesNavItem = (): Locator => this.page.getByTestId('admin-nav-event-types');

  readonly emptyState = (): Locator => this.page.getByTestId('events-empty-state');

  readonly bookingsList = (): Locator => this.page.getByTestId('bookings-list');

  bookingCardByClient(clientName: string): Locator {
    return this.page.locator(`[data-testid="booking-card"][data-client-name="${clientName}"]`);
  }

  bookingCardByClientAndNote(clientName: string, note: string): Locator {
    return this.bookingCardByClient(clientName).filter({ hasText: note });
  }

  async open(): Promise<void> {
    await this.page.goto('/admin/events');
  }
}
