import { http, HttpResponse } from "msw";

// Define handlers for API mocking
export const handlers = [
  // Example handler for authentication
  http.post("/api/auth/login", () => {
    return HttpResponse.json({
      user: {
        id: "123",
        email: "test@example.com",
        name: "Test User",
      },
      token: "fake-jwt-token",
    });
  }),

  // Example handler for flashcards API
  http.get("/api/flashcards", () => {
    return HttpResponse.json([
      {
        id: "1",
        front: "What is React?",
        back: "A JavaScript library for building user interfaces",
      },
      {
        id: "2",
        front: "What is TypeScript?",
        back: "A strongly typed programming language that builds on JavaScript",
      },
    ]);
  }),

  // Example handler for generations API
  http.post("/api/generations", () => {
    return HttpResponse.json({
      id: "gen-123",
      status: "completed",
      result: {
        flashcards: [
          {
            id: "fc-1",
            front: "What is Astro?",
            back: "A modern frontend framework for building fast websites",
          },
        ],
      },
    });
  }),
];
