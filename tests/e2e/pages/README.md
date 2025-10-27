# Page Object Models (POM)

This directory contains Page Object Model classes for E2E testing with Playwright.

## Overview

Page Object Model is a design pattern that creates an object repository for web UI elements. It helps make tests more maintainable and reduces code duplication.

## Available Page Objects

### LoginPage

Represents the login page with authentication functionality.

**Location:** `LoginPage.ts`

**Usage:**
```typescript
import { LoginPage } from "./pages";

const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.login("user@example.com", "password");
await loginPage.expectLoggedIn();
```

### GeneratePage

Represents the flashcard generation page with all its functionality.

**Location:** `GeneratePage.ts`

**Usage:**
```typescript
import { GeneratePage } from "./pages";

const generatePage = new GeneratePage(page);
await generatePage.goto();
await generatePage.generateFlashcards("Your source text here");
await generatePage.waitForGenerationComplete();
await generatePage.expectProposalsGenerated();
```

**Key Features:**
- Source text input and validation
- Generate proposals functionality
- Access to proposal cards
- Batch save operations
- Status checking (generating, errors, rate limits)
- Save summary verification

**Main Methods:**
- `goto()` - Navigate to the generate page
- `generateFlashcards(text)` - Fill source text and generate
- `waitForGenerationComplete()` - Wait for AI generation to finish
- `getProposalCard(index)` - Get specific proposal card
- `getAllProposalCards()` - Get all proposal cards
- `saveFlashcards()` - Save accepted/edited proposals
- `startFresh()` - Reset the form

**Assertion Methods:**
- `expectPageLoaded()` - Verify page is loaded
- `expectGenerating()` - Verify generation in progress
- `expectProposalsGenerated(minCount)` - Verify proposals generated
- `expectGenerationError(message)` - Verify generation error
- `expectRateLimited()` - Verify rate limit notice
- `expectSaveSuccess(count)` - Verify save success
- `expectEmptyState()` - Verify empty state

### ProposalCard

Represents a single flashcard proposal card with editing and action capabilities.

**Location:** `ProposalCard.ts`

**Usage:**
```typescript
import { GeneratePage } from "./pages";

const generatePage = new GeneratePage(page);
const proposal = generatePage.getProposalCard(0);

// Accept proposal
await proposal.accept();
await proposal.expectAccepted();

// Reject proposal
await proposal.reject();
await proposal.expectRejected();

// Edit proposal
await proposal.edit("Front text", "Back text");
await proposal.expectEdited();

// Get current values
const front = await proposal.getFrontText();
const back = await proposal.getBackText();
const status = await proposal.getStatus();
```

**Key Features:**
- Accept/reject proposals
- Edit front and back text
- Check proposal status
- Validation error handling

**Main Methods:**
- `accept()` - Accept the proposal
- `reject()` - Reject the proposal
- `edit(front, back)` - Edit both sides
- `editFront(text)` - Edit front only
- `editBack(text)` - Edit back only
- `getFrontText()` - Get current front text
- `getBackText()` - Get current back text
- `getStatus()` - Get current status (pending/accepted/edited/rejected)

**Assertion Methods:**
- `expectVisible()` - Verify card is visible
- `expectHidden()` - Verify card is hidden
- `expectStatus(status)` - Verify specific status
- `expectPending()` - Verify pending status
- `expectAccepted()` - Verify accepted status
- `expectEdited()` - Verify edited status
- `expectRejected()` - Verify rejected (hidden)
- `expectFrontText(text)` - Verify front text
- `expectBackText(text)` - Verify back text

## Test Data Attributes

All interactive elements use `data-test-id` attributes for reliable selection:

### GeneratePage selectors:
- `source-text-input` - Source text textarea
- `generate-proposals-button` - Generate button
- `generation-status` - Generation status indicator
- `batch-save-button` - Save all button
- `save-summary` - Save summary container
- `start-fresh-button` - Reset button

### ProposalCard selectors:
- `proposal-{index}-front-input` - Front text input
- `proposal-{index}-back-input` - Back text input
- `proposal-{index}-accept-button` - Accept button
- `proposal-{index}-reject-button` - Reject button
- `proposal-card-{index}` - Card container

### ProposalCard data attributes:
- `data-proposal-status` - Current status (pending/accepted/edited/rejected)

## Example Test Scenario

```typescript
test("complete flashcard generation workflow", async ({ page }) => {
  const generatePage = new GeneratePage(page);
  
  // Navigate and verify page
  await generatePage.goto();
  await generatePage.expectPageLoaded();
  
  // Generate flashcards
  const sourceText = "Your educational content here...";
  await generatePage.generateFlashcards(sourceText);
  await generatePage.expectGenerating();
  await generatePage.waitForGenerationComplete();
  await generatePage.expectProposalsGenerated(3);
  
  // Work with proposals
  const proposal0 = generatePage.getProposalCard(0);
  const proposal1 = generatePage.getProposalCard(1);
  const proposal2 = generatePage.getProposalCard(2);
  
  // Accept first
  await proposal0.accept();
  await proposal0.expectAccepted();
  
  // Reject second
  await proposal1.reject();
  await proposal1.expectRejected();
  
  // Edit third
  await proposal2.edit("Custom front", "Custom back");
  await proposal2.expectEdited();
  
  // Save
  await generatePage.expectSaveableCount(2);
  await generatePage.saveFlashcards();
  await generatePage.expectSaveSuccess(2);
  
  // Start fresh
  await generatePage.startFresh();
  await generatePage.expectEmptyState();
});
```

## Guidelines

1. **Use Locators**: Always use Playwright locators (getByRole, getByLabel, getByTestId)
2. **Separate Actions from Assertions**: Keep action methods and assertion methods separate
3. **Wait Strategies**: Use explicit waits with meaningful timeouts
4. **Type Safety**: Leverage TypeScript for better IDE support and type checking
5. **Reusability**: Keep page objects focused and composable
6. **Maintainability**: Update page objects when UI changes, not individual tests

## References

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)

