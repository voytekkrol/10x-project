import { test, expect } from "@playwright/test";
import { login, setupAxe } from "../setup/playwright.setup";

test.describe("Generate Page", () => {
  // Use beforeEach to login before each test
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should show generate form", async ({ page }) => {
    await page.goto("/generate");

    // Check that form elements are visible
    await expect(page.getByRole("heading", { name: "Generate Flashcards" })).toBeVisible();
    await expect(page.getByTestId("source-text-input")).toBeVisible();
    await expect(page.getByRole("button", { name: "Generate" })).toBeVisible();
  });

  test("should show validation error for empty source text", async ({ page }) => {
    await page.goto("/generate");

    // Click generate without entering text
    await page.getByRole("button", { name: "Generate" }).click();

    // Check for validation error
    await expect(page.getByText("Source text is required")).toBeVisible();
  });

  test("should generate flashcards from valid source text", async ({ page }) => {
    await page.goto("/generate");

    // Enter valid source text
    await page
      .getByTestId("source-text-input")
      .fill("Astro is a modern frontend framework for building fast websites.");

    // Click generate
    await page.getByRole("button", { name: "Generate" }).click();

    // Check for loading state
    await expect(page.getByTestId("generation-status")).toBeVisible();

    // Check for proposals list after generation completes
    await expect(page.getByTestId("proposals-list")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("proposal-card")).toBeVisible();
  });

  test("should save generated flashcards", async ({ page }) => {
    await page.goto("/generate");

    // Enter valid source text and generate
    await page
      .getByTestId("source-text-input")
      .fill("TypeScript is a strongly typed programming language that builds on JavaScript.");
    await page.getByRole("button", { name: "Generate" }).click();

    // Wait for generation to complete
    await expect(page.getByTestId("proposals-list")).toBeVisible({ timeout: 10000 });

    // Select flashcards to save
    await page.getByTestId("proposal-card").first().getByRole("checkbox").check();

    // Click save button
    await page.getByRole("button", { name: "Save Selected" }).click();

    // Check for success message
    await expect(page.getByText("Flashcards saved successfully")).toBeVisible();
  });

  test("should meet accessibility standards", async ({ page }) => {
    await page.goto("/generate");

    const accessibilityScanResults = await setupAxe(page).analyze();

    // Assert no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  // Visual regression test
  test("should match snapshot of generate page", async ({ page }) => {
    await page.goto("/generate");

    // Wait for any animations to complete
    await page.waitForTimeout(500);

    // Compare screenshot with baseline
    await expect(page).toHaveScreenshot("generate-page.png");
  });
});
