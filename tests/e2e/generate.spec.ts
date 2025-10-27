import { test, expect } from "@playwright/test";
import { login, setupAxe } from "../setup/playwright.setup";
import { GeneratePage } from "./pages";

test.describe("Generate Page", () => {
  let generatePage: GeneratePage;

  // Use beforeEach to login before each test
  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies and storage to ensure clean state
    await context.clearCookies();
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Login for each test
    await login(page);
    generatePage = new GeneratePage(page);
    await generatePage.goto();

    // Wait for page to be fully loaded with proper React hydration
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500); // Extra time for React components to hydrate

    // Verify page is loaded
    await generatePage.expectPageLoaded();
  });

  test.afterEach(async ({ page, context }) => {
    // Clean up after each test
    await context.clearCookies();
  });

  test("should show generate form", async () => {
    // Check that form elements are visible (already verified in beforeEach)
    await expect(generatePage.sourceTextInput).toBeVisible();
    await expect(generatePage.generateButton).toBeVisible();
    // Button should be disabled when form is empty
    await generatePage.expectGenerateDisabled();
  });

  test("should show validation error for empty source text", async () => {
    // Enter some text but not enough (less than 1000 chars)
    const shortText = "This text is too short. ".repeat(10); // ~220 chars
    await generatePage.sourceTextInput.fill(shortText);

    // Wait a bit for validation to trigger
    await expect(generatePage.generateButton).toBeDisabled();
    await generatePage.expectSourceTextValidationError("Source text must be at least");
  });

  test("should generate flashcards from valid source text", async () => {
    const sourceText =
      "Astro is a modern frontend framework for building fast, content-focused websites. It uses server-side rendering by default and supports multiple UI frameworks. Astro ships less JavaScript to the client compared to traditional SPAs. The framework allows you to use your favorite UI library with islands architecture. Islands enable interactive UI while keeping the page mostly static. ".repeat(
        15
      );

    // Enter valid source text and generate
    await generatePage.generateFlashcards(sourceText);

    // Check for loading state
    await generatePage.expectGenerating();

    // Wait for generation to complete and check proposals
    await generatePage.waitForGenerationComplete(45000); // Increase timeout for API calls
    await generatePage.expectProposalsGenerated();
  });

  test("should accept, reject, and edit proposals", async ({ page }) => {
    const sourceText =
      "React is a JavaScript library for building user interfaces. Components are reusable UI pieces. Props pass data to components. State manages component data. Hooks add features to function components. The virtual DOM provides efficient rendering. React applications are built using a component tree. ".repeat(
        15
      );

    // Generate flashcards
    await generatePage.generateFlashcards(sourceText);
    await generatePage.waitForGenerationComplete(45000);
    await generatePage.expectProposalsGenerated();

    // Get proposal cards
    const proposal0 = generatePage.getProposalCard(0);
    const proposal1 = generatePage.getProposalCard(1);
    const proposal2 = generatePage.getProposalCard(2);

    // Accept first proposal
    await proposal0.expectPending();
    await proposal0.accept();
    await page.waitForTimeout(300); // Wait for state update
    await proposal0.expectAccepted();

    // Reject second proposal
    await proposal1.expectPending();
    await proposal1.reject();
    await page.waitForTimeout(300); // Wait for state update
    await proposal1.expectRejected();

    // Edit third proposal
    await proposal2.expectPending();
    await proposal2.edit("What is React?", "A JavaScript library for building UIs");
    await page.waitForTimeout(300); // Wait for state update
    await proposal2.expectEdited();

    // Verify saveable count (2: accepted + edited)
    await generatePage.expectSaveableCount(2);
  });

  test("should save accepted and edited flashcards", async ({ page }) => {
    const sourceText =
      "TypeScript is a strongly typed programming language that builds on JavaScript. TypeScript adds static types to JavaScript. Types help catch errors during development. TypeScript compiles to plain JavaScript. Interfaces define object shapes. Classes can be typed. Generics provide reusable type parameters. ".repeat(
        15
      );

    // Generate flashcards
    await generatePage.generateFlashcards(sourceText);
    await generatePage.waitForGenerationComplete(45000);
    await generatePage.expectProposalsGenerated();

    // Accept some proposals
    const proposal0 = generatePage.getProposalCard(0);
    const proposal1 = generatePage.getProposalCard(1);

    await proposal0.accept();
    await page.waitForTimeout(300);
    await proposal1.accept();
    await page.waitForTimeout(300);

    // Save flashcards
    await generatePage.saveFlashcards();

    // Check for success summary (with timeout for API call)
    await generatePage.expectSaveSummaryVisible();
    await generatePage.expectSaveSuccess(2);
  });

  test("should handle edited flashcards correctly", async ({ page }) => {
    const sourceText =
      "Python is a high-level programming language. Python is known for its simple syntax. Python is widely used in data science and web development. Python supports multiple programming paradigms. It has a large standard library. Python code is highly readable. The language emphasizes code readability. ".repeat(
        15
      );

    // Generate flashcards
    await generatePage.generateFlashcards(sourceText);
    await generatePage.waitForGenerationComplete(45000);
    await generatePage.expectProposalsGenerated();

    // Edit first proposal
    const proposal0 = generatePage.getProposalCard(0);
    await proposal0.edit("What is Python known for?", "Simple syntax and versatility");
    await page.waitForTimeout(300);
    await proposal0.expectEdited();

    // Save
    await generatePage.saveFlashcards();
    await generatePage.expectSaveSummaryVisible();

    // Verify the summary shows edited count
    await expect(generatePage.saveSummary).toContainText("AI-Edited");
  });

  test("should start fresh and reset form", async ({ page }) => {
    const sourceText =
      "JavaScript is a versatile programming language used for web development. It runs in browsers and on servers via Node.js. JavaScript supports both procedural and object-oriented programming. ES6 introduced classes, arrow functions, and modules. Promises and async/await handle asynchronous operations. The language has a rich ecosystem with npm packages. ".repeat(
        15
      );

    // Generate flashcards
    await generatePage.generateFlashcards(sourceText);
    await generatePage.waitForGenerationComplete(45000);
    await generatePage.expectProposalsGenerated();

    // Accept a proposal
    const proposal0 = generatePage.getProposalCard(0);
    await proposal0.accept();
    await page.waitForTimeout(300);

    // Save
    await generatePage.saveFlashcards();
    await generatePage.expectSaveSummaryVisible();

    // Start fresh
    await generatePage.startFresh();
    await page.waitForTimeout(300);

    // Verify form is reset
    await generatePage.expectEmptyState();
    await expect(generatePage.sourceTextInput).toHaveValue("");
  });

  test("should show generation status with elapsed time", async () => {
    const sourceText =
      "Vue.js is a progressive JavaScript framework for building user interfaces. It has an intuitive API and is easy to learn. Vue uses a virtual DOM for efficient updates. The framework supports single file components. Vue has great developer tooling. It can be incrementally adopted. ".repeat(
        15
      );

    // Start generation
    await generatePage.generateFlashcards(sourceText);

    // Verify generation status is visible
    await generatePage.expectGenerating();
    await expect(generatePage.generationStatus).toContainText("Generating flashcard proposals");
    await expect(generatePage.generationStatus).toContainText("Elapsed time:");

    // Wait for completion
    await generatePage.waitForGenerationComplete(45000);
  });

  test("should disable generate button while generating", async () => {
    const sourceText =
      "Angular is a platform for building web applications. It uses TypeScript for type safety. Angular provides dependency injection for modular architecture. The framework includes powerful CLI tools. Component architecture is central to Angular. RxJS is used for reactive programming patterns. ".repeat(
        15
      );

    // Fill in text to enable the button
    await generatePage.sourceTextInput.fill(sourceText);
    await generatePage.expectGenerateEnabled();

    // Start generation
    await generatePage.generateButton.click();

    // Verify button is disabled during generation
    await generatePage.expectGenerateDisabled();

    // Wait for completion
    await generatePage.waitForGenerationComplete(45000);
  });

  test("should meet accessibility standards", async ({ page }) => {
    const axeBuilder = await setupAxe(page);
    const accessibilityScanResults = await axeBuilder.analyze();

    // Assert no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  // Visual regression test
  test("should match snapshot of generate page", async ({ page }) => {
    // Wait for any animations to complete
    await page.waitForTimeout(500);

    // Compare screenshot with baseline
    await expect(page).toHaveScreenshot("generate-page.png");
  });

  test("should match snapshot with proposals", async ({ page }) => {
    const sourceText =
      "Svelte is a modern JavaScript framework that compiles components at build time. It eliminates the need for a virtual DOM. Svelte compiles to efficient imperative code. The framework has built-in state management. It produces smaller bundle sizes. Developer experience is excellent. ".repeat(
        15
      );

    // Generate flashcards
    await generatePage.generateFlashcards(sourceText);
    await generatePage.waitForGenerationComplete(45000);
    await generatePage.expectProposalsGenerated();

    // Wait for animations
    await page.waitForTimeout(1000);

    // Compare screenshot - Note: AI content varies, so we allow more pixel differences
    await expect(page).toHaveScreenshot("generate-page-with-proposals.png", {
      maxDiffPixels: 2000, // AI content varies, allow more tolerance
    });
  });
});
