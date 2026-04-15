import type { Locator, Page } from '@playwright/test';

export class EventTypeEditPage {
  constructor(private readonly page: Page) {}

  readonly title = (): Locator => this.page.getByTestId('event-type-edit-title');

  readonly form = (): Locator => this.page.getByTestId('event-type-edit-form');

  readonly nameInput = (): Locator => this.page.getByTestId('event-type-edit-name-input');

  readonly slugInput = (): Locator => this.page.getByTestId('event-type-edit-slug-input');

  readonly descriptionInput = (): Locator => this.page.getByTestId('event-type-edit-description-input');

  readonly durationInput = (): Locator => this.page.getByTestId('event-type-edit-duration-input');

  readonly saveButton = (): Locator => this.page.getByTestId('event-type-edit-save-button');
}
