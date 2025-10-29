import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { setupAxe } from "../setup/playwright.setup";

test.describe("Authentication", () => {
  test("should show validation errors on empty form submission", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("", "");

    await loginPage.expectValidationError("email", "Email is required");
    await loginPage.expectValidationError("password", "Password is required");
  });

  test("should show validation error on invalid email format", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("invalid-email", "password123");

    await loginPage.expectValidationError("email", "Invalid email format");
  });

  test("should navigate to forgot password page", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.clickForgotPassword();

    await expect(page).toHaveURL(/.*\/auth\/forgot-password/);
    await expect(page).toHaveTitle(/Reset Password/);
  });

  test("should redirect to generate page after successful login", async ({ page }) => {
    // Note: This test requires E2E credentials to be set in environment
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Use the method that waits for navigation
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    if (!email || !password) {
      test.skip(true, "E2E credentials not configured. Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test");
    }
    await loginPage.loginAndWaitForNavigation(email, password);

    await expect(page).toHaveTitle(/Generate/);
    await expect(page).toHaveURL(/\/generate/);
  });

  test("should meet accessibility standards", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const axeBuilder = await setupAxe(page);
    const accessibilityScanResults = await axeBuilder.analyze();

    // Assert no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
