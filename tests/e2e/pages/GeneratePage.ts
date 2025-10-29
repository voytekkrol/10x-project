import { type Page, type Locator, expect } from "@playwright/test";
import { ProposalCard } from "./ProposalCard";

/**
 * Page Object Model for Generate Flashcards page
 */
export class GeneratePage {
  readonly page: Page;

  // Source Text Section
  readonly sourceTextInput: Locator;
  readonly generateButton: Locator;

  // Status Indicators
  readonly generationStatus: Locator;
  readonly rateLimitNotice: Locator;
  readonly generationError: Locator;

  // Proposals Section
  readonly proposalsList: Locator;
  readonly batchSaveButton: Locator;
  readonly saveSummary: Locator;
  readonly startFreshButton: Locator;

  // Page Elements
  readonly pageHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Source Text Section
    this.sourceTextInput = page.getByTestId("source-text-input");
    this.generateButton = page.getByTestId("generate-proposals-button");

    // Status Indicators
    this.generationStatus = page.getByTestId("generation-status");
    this.rateLimitNotice = page.getByRole("alert").filter({ hasText: "Rate Limit Reached" });
    this.generationError = page.getByRole("alert").filter({ hasText: "Generation Failed" });

    // Proposals Section
    this.proposalsList = page.locator('[data-testid^="proposal-card-"]');
    this.batchSaveButton = page.getByTestId("batch-save-button");
    this.saveSummary = page.getByTestId("save-summary");
    this.startFreshButton = page.getByTestId("start-fresh-button");

    // Page Elements
    this.pageHeading = page.getByRole("heading", { name: "Generate Flashcards" });
  }

  /**
   * Navigate to the generate page
   */
  async goto() {
    await this.page.goto("/generate");
  }

  /**
   * Fill source text and generate proposals
   */
  async generateFlashcards(sourceText: string) {
    await this.sourceTextInput.fill(sourceText);
    // Wait for React to update state and enable the button
    await expect(this.generateButton).toBeEnabled({ timeout: 5000 });
    await this.generateButton.click();
  }

  /**
   * Wait for generation to complete
   */
  async waitForGenerationComplete(timeout = 45000) {
    try {
      await this.generationStatus.waitFor({ state: "visible", timeout: 5000 });
    } catch {
      // Status might have already completed, check if proposals are visible
      const proposalCount = await this.getProposalCount();
      if (proposalCount > 0) {
        return; // Generation already complete
      }
      throw new Error("Generation status not visible and no proposals found");
    }
    await this.generationStatus.waitFor({ state: "hidden", timeout });
  }

  /**
   * Get a specific proposal card by index
   */
  getProposalCard(index: number): ProposalCard {
    return new ProposalCard(this.page, index);
  }

  /**
   * Get all proposal cards
   */
  async getAllProposalCards(): Promise<ProposalCard[]> {
    const count = await this.proposalsList.count();
    const cards: ProposalCard[] = [];
    for (let i = 0; i < count; i++) {
      cards.push(new ProposalCard(this.page, i));
    }
    return cards;
  }

  /**
   * Get count of proposal cards
   */
  async getProposalCount(): Promise<number> {
    return await this.proposalsList.count();
  }

  /**
   * Save all accepted/edited proposals
   */
  async saveFlashcards() {
    await this.batchSaveButton.click();
  }

  /**
   * Start fresh - reset the form
   */
  async startFresh() {
    await this.startFreshButton.click();
  }

  /**
   * Get the saveable count from the save button text
   */
  async getSaveableCount(): Promise<number> {
    const buttonText = await this.batchSaveButton.textContent();
    const match = buttonText?.match(/Save (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  // ============================================================================
  // Assertions
  // ============================================================================

  /**
   * Expect the page to be visible and loaded
   */
  async expectPageLoaded() {
    await expect(this.pageHeading).toBeVisible();
    await expect(this.sourceTextInput).toBeVisible();
    await expect(this.generateButton).toBeVisible();
  }

  /**
   * Expect generation to be in progress
   */
  async expectGenerating() {
    await expect(this.generationStatus).toBeVisible();
    await expect(this.generateButton).toBeDisabled();
  }

  /**
   * Expect generation to be complete with proposals
   */
  async expectProposalsGenerated(minCount = 1) {
    await expect(this.proposalsList.first()).toBeVisible({ timeout: 30000 });
    const count = await this.getProposalCount();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  /**
   * Expect generation error to be visible
   */
  async expectGenerationError(errorMessage?: string) {
    await expect(this.generationError).toBeVisible();
    if (errorMessage) {
      await expect(this.generationError).toContainText(errorMessage);
    }
  }

  /**
   * Expect rate limit notice to be visible
   */
  async expectRateLimited() {
    await expect(this.rateLimitNotice).toBeVisible();
    await expect(this.generateButton).toBeDisabled();
  }

  /**
   * Expect save button to show specific count
   */
  async expectSaveableCount(count: number) {
    await expect(this.batchSaveButton).toBeVisible();
    await expect(this.batchSaveButton).toContainText(`Save ${count}`);
  }

  /**
   * Expect save button to be disabled
   */
  async expectSaveDisabled() {
    await expect(this.batchSaveButton).toBeDisabled();
  }

  /**
   * Expect save summary to be visible
   */
  async expectSaveSummaryVisible() {
    await expect(this.saveSummary).toBeVisible({ timeout: 15000 });
  }

  /**
   * Expect save summary to show success
   */
  async expectSaveSuccess(successCount: number) {
    await expect(this.saveSummary).toBeVisible({ timeout: 15000 });
    await expect(this.saveSummary).toContainText("All Flashcards Saved!");
    await expect(this.saveSummary).toContainText(`${successCount}`);
  }

  /**
   * Expect save summary to show partial success
   */
  async expectPartialSave(successCount: number, totalCount: number) {
    await expect(this.saveSummary).toBeVisible();
    await expect(this.saveSummary).toContainText("Save Completed");
    await expect(this.saveSummary).toContainText(`Saved ${successCount} of ${totalCount}`);
  }

  /**
   * Expect validation error for source text
   */
  async expectSourceTextValidationError(message: string) {
    // Wait a bit for validation to trigger
    await this.page.waitForTimeout(500);
    await expect(this.sourceTextInput).toHaveAttribute("aria-invalid", "true");
    await expect(this.page.getByText(message, { exact: false })).toBeVisible();
  }

  /**
   * Expect empty state (no proposals yet)
   */
  async expectEmptyState() {
    await expect(this.page.getByText("Ready to Generate")).toBeVisible();
    await expect(this.page.getByText("Paste your source text above")).toBeVisible();
  }

  /**
   * Expect generate button to be disabled
   */
  async expectGenerateDisabled() {
    await expect(this.generateButton).toBeDisabled();
  }

  /**
   * Expect generate button to be enabled
   */
  async expectGenerateEnabled() {
    await expect(this.generateButton).toBeEnabled();
  }
}
