import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "../mocks/server";

// Extend Vitest's expect method with methods from @testing-library/jest-dom
import "@testing-library/jest-dom/vitest";

// Start the MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

// Clean up after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Close the MSW server after all tests
afterAll(() => {
  server.close();
});
