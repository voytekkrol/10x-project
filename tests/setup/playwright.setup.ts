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
export async function login(page: Page, email = "test@example.com", password = "password") {
  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/**/generate");
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
