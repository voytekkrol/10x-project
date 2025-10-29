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
 * Uses TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables
 */
export async function login(
  page: Page,
  email = process.env.TEST_USER_EMAIL,
  password = process.env.TEST_USER_PASSWORD
) {
  if (!email || !password) {
    const emailSet = process.env.TEST_USER_EMAIL ? "SET" : "MISSING";
    const passwordSet = process.env.TEST_USER_PASSWORD ? "SET" : "MISSING";
    throw new Error(
      `Missing E2E credentials. TEST_USER_EMAIL: ${emailSet}, TEST_USER_PASSWORD: ${passwordSet}`
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
