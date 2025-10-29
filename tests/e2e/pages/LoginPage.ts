import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page Object Model for Login page
 */
export class LoginPage {
  private page: Page;
  private emailInput: Locator;
  private passwordInput: Locator;
  private loginButton: Locator;
  private forgotPasswordLink: Locator;
  private errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Password");
    this.loginButton = page.getByRole("button", { name: "Log in" });
    this.forgotPasswordLink = page.getByRole("link", { name: "Forgot password?" });
    this.errorMessage = page.getByTestId("auth-error");
  }

  async goto() {
    await this.page.goto("/auth/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    // Wait a bit for React state to update and show validation errors
    await this.page.waitForTimeout(500);
  }

  async loginAndWaitForNavigation(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    // Wait for successful navigation to generate page
    await this.page.waitForURL(/\/generate/, { timeout: 15000 });
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectValidationError(field: "email" | "password", message: string) {
    // First wait for the error message to be visible
    await expect(this.page.getByText(message)).toBeVisible();

    // Then check aria-invalid attribute
    if (field === "email") {
      await expect(this.emailInput).toHaveAttribute("aria-invalid", "true");
    } else {
      await expect(this.passwordInput).toHaveAttribute("aria-invalid", "true");
    }
  }

  async expectLoggedIn() {
    await this.page.waitForURL("/**/generate");
  }
}
