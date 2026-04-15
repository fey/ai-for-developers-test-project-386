import type { Locator, Page } from '@playwright/test';

export class EventTypesPage {
  constructor(private readonly page: Page) {}

  readonly title = (): Locator => this.page.getByTestId('event-types-title');

  readonly createLink = (): Locator => this.page.getByTestId('event-type-create-link');

  readonly list = (): Locator => this.page.getByTestId('event-types-list');

  readonly status = (): Locator => this.page.getByTestId('event-types-status');

  readonly cards = (): Locator => this.page.getByTestId('event-type-card');

  readonly editButtons = (): Locator => this.page.getByTestId('event-type-edit-button');

  readonly deleteButtons = (): Locator => this.page.getByTestId('event-type-delete-button');

  cardByName(name: string): Locator {
    return this.page.getByTestId('event-type-card').filter({ hasText: name });
  }

  async open(): Promise<void> {
    await this.page.goto('/admin/event-types');
  }
}
