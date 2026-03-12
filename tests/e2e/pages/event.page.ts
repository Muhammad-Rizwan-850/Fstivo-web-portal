import { Page, Locator } from '@playwright/test';

export class EventPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly locationInput: Locator;
  readonly categorySelect: Locator;
  readonly priceInput: Locator;
  readonly capacityInput: Locator;
  readonly submitButton: Locator;
  readonly buyTicketsButton: Locator;
  readonly wishlistButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.locator('input[name="title"]');
    this.descriptionInput = page.locator('textarea[name="description"]');
    this.startDateInput = page.locator('input[name="start_date"], input[name="startDate"]');
    this.endDateInput = page.locator('input[name="end_date"], input[name="endDate"]');
    this.locationInput = page.locator('input[name="location"]');
    this.categorySelect = page.locator('select[name="category"], [name="category"]');
    this.priceInput = page.locator('input[name="price"]');
    this.capacityInput = page.locator('input[name="capacity"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.buyTicketsButton = page.locator('button:has-text("Buy Tickets")');
    this.wishlistButton = page.locator('[aria-label*="wishlist"]');
  }

  async fillEventForm(data: {
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    location: string;
    category?: string;
    price?: string;
    capacity?: string;
  }) {
    await this.titleInput.fill(data.title);
    await this.descriptionInput.fill(data.description);
    await this.startDateInput.fill(data.startDate);
    
    if (data.endDate) {
      await this.endDateInput.fill(data.endDate);
    }
    
    await this.locationInput.fill(data.location);
    
    if (data.category) {
      await this.categorySelect.selectOption(data.category);
    }
    
    if (data.price) {
      await this.priceInput.fill(data.price);
    }
    
    if (data.capacity) {
      await this.capacityInput.fill(data.capacity);
    }
  }

  async submitEvent() {
    await this.submitButton.click();
  }

  async addToWishlist() {
    await this.wishlistButton.click();
  }
}
