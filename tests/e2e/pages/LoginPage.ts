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
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectValidationError(field: "email" | "password", message: string) {
    if (field === "email") {
      await expect(this.emailInput).toHaveAttribute("aria-invalid", "true");
    } else {
      await expect(this.passwordInput).toHaveAttribute("aria-invalid", "true");
    }
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectLoggedIn() {
    await this.page.waitForURL("/**/generate");
  }
}
