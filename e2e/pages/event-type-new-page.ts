import type { Locator, Page } from '@playwright/test';

export class EventTypeNewPage {
  constructor(private readonly page: Page) {}

  readonly title = (): Locator => this.page.getByTestId('event-type-new-title');

  readonly form = (): Locator => this.page.getByTestId('event-type-new-form');

  readonly nameInput = (): Locator => this.page.getByTestId('event-type-new-name-input');

  readonly slugInput = (): Locator => this.page.getByTestId('event-type-new-slug-input');

  readonly descriptionInput = (): Locator => this.page.getByTestId('event-type-new-description-input');

  readonly durationInput = (): Locator => this.page.getByTestId('event-type-new-duration-input');

  readonly saveButton = (): Locator => this.page.getByTestId('event-type-new-save-button');
}
