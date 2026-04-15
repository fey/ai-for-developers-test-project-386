import type { Locator, Page } from '@playwright/test';

export class HomePage {
  constructor(private readonly page: Page) {}

  readonly heading = (): Locator => this.page.getByTestId('home-title');

  readonly ctaButton = (): Locator => this.page.getByTestId('home-cta-button');

  readonly bookNavLink = (): Locator =>
    this.page.getByRole('link', { name: 'Записаться' });

  readonly adminNavLink = (): Locator =>
    this.page.getByRole('link', { name: 'Админка' });

  async open(): Promise<void> {
    await this.page.goto('/');
  }

  async clickCta(): Promise<void> {
    await this.ctaButton().click();
  }
}
