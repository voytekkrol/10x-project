/**
 * Test script for POST /api/flashcards endpoint
 *
 * Tests:
 * 1. Manual flashcard creation
 * 2. AI-generated flashcard creation (ai-full)
 * 3. AI-edited flashcard creation (ai-edited)
 * 4. Batch creation with mixed sources
 * 5. Validation errors
 * 6. Generation not found error
 */

const API_BASE_URL = "http://localhost:4321/api";

/**
 * Helper function to make API requests
 */
async function apiRequest(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const data = await response.json();

  return { status: response.status, data };
}

/**
 * Test 1: Create manual flashcard
 */
async function testManualFlashcard() {
  console.log("\n=== Test 1: Create Manual Flashcard ===");

  const payload = {
    flashcards: [
      {
        front: "What is TypeScript?",
        back: "TypeScript is a strongly typed programming language that builds on JavaScript.",
        source: "manual",
        generation_id: null,
      },
    ],
  };

  const { status, data } = await apiRequest("/flashcards", "POST", payload);

  console.log("Status:", status);
  console.log("Response:", JSON.stringify(data, null, 2));

  if (status === 201 && Array.isArray(data) && data.length === 1) {
    console.log("✅ Test 1 PASSED");
    return data[0];
  } else {
    console.log("❌ Test 1 FAILED");
    return null;
  }
}

/**
 * Test 2: Create AI-generated flashcard (requires generation_id)
 */
async function testAIFlashcard() {
  console.log("\n=== Test 2: Create AI-Generated Flashcard ===");

  // First, create a generation
  console.log("Creating generation...");
  const sourceText = "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. ".repeat(10);

  const genResponse = await apiRequest("/generations", "POST", {
    source_text: sourceText,
  });

  if (genResponse.status !== 201) {
    console.log("❌ Failed to create generation");
    console.log("Response:", JSON.stringify(genResponse.data, null, 2));
    return null;
  }

  const generationId = genResponse.data.id;
  console.log("Generation created with ID:", generationId);

  // Create AI-generated flashcard
  const payload = {
    flashcards: [
      {
        front: "What is TypeScript?",
        back: "TypeScript is a strongly typed programming language.",
        source: "ai-full",
        generation_id: generationId,
      },
    ],
  };

  const { status, data } = await apiRequest("/flashcards", "POST", payload);

  console.log("Status:", status);
  console.log("Response:", JSON.stringify(data, null, 2));

  if (status === 201 && Array.isArray(data) && data.length === 1) {
    console.log("✅ Test 2 PASSED");
    return { flashcard: data[0], generationId };
  } else {
    console.log("❌ Test 2 FAILED");
    return null;
  }
}

/**
 * Test 3: Create batch of AI flashcards (mix of ai-full and ai-edited)
 */
async function testBatchAIFlashcards(generationId) {
  console.log("\n=== Test 3: Create Batch AI Flashcards ===");

  const payload = {
    flashcards: [
      {
        front: "What is JavaScript?",
        back: "JavaScript is a programming language.",
        source: "ai-full",
        generation_id: generationId,
      },
      {
        front: "What is TypeScript?",
        back: "TypeScript is JavaScript with types (edited).",
        source: "ai-edited",
        generation_id: generationId,
      },
    ],
  };

  const { status, data } = await apiRequest("/flashcards", "POST", payload);

  console.log("Status:", status);
  console.log("Response:", JSON.stringify(data, null, 2));

  if (status === 201 && Array.isArray(data) && data.length === 2) {
    console.log("✅ Test 3 PASSED");
    return data;
  } else {
    console.log("❌ Test 3 FAILED");
    return null;
  }
}

/**
 * Test 4: Validation error - missing front text
 */
async function testValidationError() {
  console.log("\n=== Test 4: Validation Error (Missing Front Text) ===");

  const payload = {
    flashcards: [
      {
        front: "",
        back: "Some back text",
        source: "manual",
        generation_id: null,
      },
    ],
  };

  const { status, data } = await apiRequest("/flashcards", "POST", payload);

  console.log("Status:", status);
  console.log("Response:", JSON.stringify(data, null, 2));

  if (status === 400 && data.code === "VALIDATION_ERROR") {
    console.log("✅ Test 4 PASSED");
    return true;
  } else {
    console.log("❌ Test 4 FAILED");
    return false;
  }
}

/**
 * Test 5: Validation error - AI source without generation_id
 */
async function testAIWithoutGenerationId() {
  console.log("\n=== Test 5: Validation Error (AI Source Without generation_id) ===");

  const payload = {
    flashcards: [
      {
        front: "Test front",
        back: "Test back",
        source: "ai-full",
        generation_id: null,
      },
    ],
  };

  const { status, data } = await apiRequest("/flashcards", "POST", payload);

  console.log("Status:", status);
  console.log("Response:", JSON.stringify(data, null, 2));

  if (status === 400 && data.code === "VALIDATION_ERROR") {
    console.log("✅ Test 5 PASSED");
    return true;
  } else {
    console.log("❌ Test 5 FAILED");
    return false;
  }
}

/**
 * Test 6: Generation not found error
 */
async function testGenerationNotFound() {
  console.log("\n=== Test 6: Generation Not Found Error ===");

  const payload = {
    flashcards: [
      {
        front: "Test front",
        back: "Test back",
        source: "ai-full",
        generation_id: 999999,
      },
    ],
  };

  const { status, data } = await apiRequest("/flashcards", "POST", payload);

  console.log("Status:", status);
  console.log("Response:", JSON.stringify(data, null, 2));

  if (status === 404 && data.code === "RESOURCE_NOT_FOUND") {
    console.log("✅ Test 6 PASSED");
    return true;
  } else {
    console.log("❌ Test 6 FAILED");
    return false;
  }
}

/**
 * Test 7: Validation error - Multiple generation_ids in batch
 */
async function testMultipleGenerationIds() {
  console.log("\n=== Test 7: Validation Error (Multiple generation_ids in Batch) ===");

  const payload = {
    flashcards: [
      {
        front: "Test 1",
        back: "Test back 1",
        source: "ai-full",
        generation_id: 1,
      },
      {
        front: "Test 2",
        back: "Test back 2",
        source: "ai-full",
        generation_id: 2,
      },
    ],
  };

  const { status, data } = await apiRequest("/flashcards", "POST", payload);

  console.log("Status:", status);
  console.log("Response:", JSON.stringify(data, null, 2));

  if (status === 400 && data.code === "VALIDATION_ERROR") {
    console.log("✅ Test 7 PASSED");
    return true;
  } else {
    console.log("❌ Test 7 FAILED");
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log("Starting POST /api/flashcards endpoint tests...");
  console.log("API Base URL:", API_BASE_URL);

  try {
    await testManualFlashcard();
    const aiResult = await testAIFlashcard();
    
    if (aiResult) {
      await testBatchAIFlashcards(aiResult.generationId);
    }

    await testValidationError();
    await testAIWithoutGenerationId();
    await testGenerationNotFound();
    await testMultipleGenerationIds();

    console.log("\n=== All Tests Completed ===");
  } catch (error) {
    console.error("\n❌ Test suite failed with error:");
    console.error(error);
  }
}

// Run tests
runTests();

