#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * This script sets up the testing environment by:
 * 1. Installing Playwright browsers
 * 2. Creating necessary test directories if they don't exist
 * 3. Creating baseline screenshots for visual testing
 */

console.log("\n📋 Setting up testing environment...\n");

// Install Playwright browsers
try {
  console.log("🔧 Installing Playwright browsers (Chromium)...");
  execSync("npx playwright install chromium --with-deps", { stdio: "inherit" });
  console.log("✅ Playwright browsers installed successfully!");
} catch (error) {
  console.error("❌ Failed to install Playwright browsers:", error.message);
  process.exit(1);
}

// Ensure test directories exist
const directories = [
  "tests",
  "tests/unit",
  "tests/e2e",
  "tests/setup",
  "tests/mocks",
  "tests/unit/components",
  "tests/unit/utils",
  "tests/e2e/pages",
];

console.log("🔧 Creating test directories...");
for (const dir of directories) {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  Created: ${dir}`);
  }
}
console.log("✅ Test directories created!");

console.log("\n🚀 Testing environment setup complete!");
console.log("\nYou can now run tests using:");
console.log("  - npm run test          # Unit tests");
console.log("  - npm run test:e2e      # E2E tests");
console.log("  - npm run test:coverage # Test coverage");
