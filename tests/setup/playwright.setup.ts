import { type BrowserContext, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

/**
 * Injects axe-core into the page for accessibility testing
 */
export async function setupAxe(page: Page) {
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .disableRules(["color-contrast"]); // Example of disabling a specific rule
}

/**
 * Utility to login a user for tests requiring authentication
 */
export async function login(page: Page, email = process.env.E2E_USERNAME, password = process.env.E2E_PASSWORD) {
  if (!email || !password) {
    throw new Error(
      `Missing E2E credentials. E2E_USERNAME: ${email ? "SET" : "MISSING"}, E2E_PASSWORD: ${password ? "SET" : "MISSING"}`
    );
  }

  await page.goto("/auth/login");

  // Wait for the form to be fully loaded and React to hydrate
  await page.waitForLoadState("domcontentloaded");

  // Wait for the email input to be visible and interactive
  const emailInput = page.locator("#email");
  await emailInput.waitFor({ state: "visible", timeout: 10000 });

  // Fill the form fields with proper waiting
  await emailInput.fill(email);
  await page.locator("#password").fill(password);

  // Click login button and wait for navigation
  await page.getByRole("button", { name: "Log in" }).click();

  // Wait for navigation away from login page
  await page.waitForURL(/\/generate/, { timeout: 10000 });

  // Wait for the page to be fully loaded and React to hydrate
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000); // Give React time to hydrate
}

/**
 * Creates a new browser context with storage state if provided
 */
export async function createContextWithSession(
  context: BrowserContext,
  user = { email: "test@example.com", password: "password" }
) {
  const page = await context.newPage();
  await login(page, user.email, user.password);

  // Save storage state to reuse across tests
  const storageState = await context.storageState();
  await page.close();

  return storageState;
}
