import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page Object Model for a single Proposal Card
 * Represents a flashcard proposal that can be accepted, rejected, or edited
 */
export class ProposalCard {
  readonly page: Page;
  readonly index: number;
  
  // Card container
  readonly container: Locator;
  
  // Input fields
  readonly frontInput: Locator;
  readonly backInput: Locator;
  
  // Action buttons
  readonly acceptButton: Locator;
  readonly rejectButton: Locator;
  
  // Status indicators
  readonly statusBadge: Locator;

  constructor(page: Page, index: number) {
    this.page = page;
    this.index = index;
    
    // Card container with data attributes
    this.container = page.getByTestId(`proposal-card-${index}`);
    
    // Input fields
    this.frontInput = page.getByTestId(`proposal-${index}-front-input`);
    this.backInput = page.getByTestId(`proposal-${index}-back-input`);
    
    // Action buttons
    this.acceptButton = page.getByTestId(`proposal-${index}-accept-button`);
    this.rejectButton = page.getByTestId(`proposal-${index}-reject-button`);
    
    // Status badge (varies by status)
    this.statusBadge = this.container.locator('[class*="badge"]').first();
  }

  /**
   * Accept this proposal
   */
  async accept() {
    await this.acceptButton.click();
  }

  /**
   * Reject this proposal
   */
  async reject() {
    await this.rejectButton.click();
  }

  /**
   * Edit the front of the flashcard
   */
  async editFront(text: string) {
    await this.frontInput.click();
    await this.frontInput.fill("");
    await this.frontInput.fill(text);
    // Trigger blur to ensure onChange is fired
    await this.page.keyboard.press("Tab");
  }

  /**
   * Edit the back of the flashcard
   */
  async editBack(text: string) {
    await this.backInput.click();
    await this.backInput.fill("");
    await this.backInput.fill(text);
    // Trigger blur to ensure onChange is fired
    await this.page.keyboard.press("Tab");
  }

  /**
   * Edit both front and back of the flashcard
   */
  async edit(front: string, back: string) {
    await this.editFront(front);
    await this.editBack(back);
  }

  /**
   * Get the current front text
   */
  async getFrontText(): Promise<string> {
    return (await this.frontInput.inputValue()) || "";
  }

  /**
   * Get the current back text
   */
  async getBackText(): Promise<string> {
    return (await this.backInput.inputValue()) || "";
  }

  /**
   * Get the current status from data attribute
   */
  async getStatus(): Promise<string> {
    const status = await this.container.getAttribute("data-proposal-status");
    return status || "unknown";
  }

  /**
   * Check if the card is visible (not rejected)
   */
  async isVisible(): Promise<boolean> {
    return await this.container.isVisible();
  }

  /**
   * Wait for the card to be visible
   */
  async waitForVisible(timeout = 5000) {
    await this.container.waitFor({ state: "visible", timeout });
  }

  // ============================================================================
  // Assertions
  // ============================================================================

  /**
   * Expect card to be visible
   */
  async expectVisible() {
    await expect(this.container).toBeVisible();
  }

  /**
   * Expect card to be hidden (rejected)
   */
  async expectHidden() {
    await expect(this.container).toBeHidden();
  }

  /**
   * Expect specific status
   */
  async expectStatus(status: "pending" | "accepted" | "edited" | "rejected") {
    await expect(this.container).toHaveAttribute("data-proposal-status", status);
  }

  /**
   * Expect card to be in pending status
   */
  async expectPending() {
    await this.expectStatus("pending");
    await expect(this.acceptButton).toBeVisible();
    await expect(this.rejectButton).toBeVisible();
  }

  /**
   * Expect card to be accepted
   */
  async expectAccepted() {
    await this.expectStatus("accepted");
    await expect(this.container).toContainText("Accepted", { timeout: 5000 });
  }

  /**
   * Expect card to be edited
   */
  async expectEdited() {
    await this.expectStatus("edited");
    await expect(this.container).toContainText("Edited", { timeout: 5000 });
  }

  /**
   * Expect card to be rejected (hidden from view)
   */
  async expectRejected() {
    await this.expectHidden();
  }

  /**
   * Expect front text to match
   */
  async expectFrontText(text: string) {
    await expect(this.frontInput).toHaveValue(text);
  }

  /**
   * Expect back text to match
   */
  async expectBackText(text: string) {
    await expect(this.backInput).toHaveValue(text);
  }

  /**
   * Expect validation error on front field
   */
  async expectFrontError(errorMessage: string) {
    await expect(this.frontInput).toHaveAttribute("aria-invalid", "true");
    const errorId = `proposal-${this.index}-front-error`;
    await expect(this.page.getByText(errorMessage)).toBeVisible();
  }

  /**
   * Expect validation error on back field
   */
  async expectBackError(errorMessage: string) {
    await expect(this.backInput).toHaveAttribute("aria-invalid", "true");
    const errorId = `proposal-${this.index}-back-error`;
    await expect(this.page.getByText(errorMessage)).toBeVisible();
  }

  /**
   * Expect accept button to be visible
   */
  async expectAcceptButtonVisible() {
    await expect(this.acceptButton).toBeVisible();
  }

  /**
   * Expect reject button to be visible
   */
  async expectRejectButtonVisible() {
    await expect(this.rejectButton).toBeVisible();
  }

  /**
   * Expect action buttons to be hidden (after acceptance/rejection)
   */
  async expectActionButtonsHidden() {
    await expect(this.acceptButton).toBeHidden();
    await expect(this.rejectButton).toBeHidden();
  }
}

