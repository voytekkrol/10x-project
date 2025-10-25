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
    await expect(page).toHaveTitle(/Forgot Password/);
  });

  test("should redirect to generate page after successful login", async ({ page }) => {
    // Note: This test assumes a mocked authentication or test credentials
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("test@example.com", "password123");

    await loginPage.expectLoggedIn();
    await expect(page).toHaveTitle(/Generate/);
  });

  test("should meet accessibility standards", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const accessibilityScanResults = await setupAxe(page).analyze();

    // Assert no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
