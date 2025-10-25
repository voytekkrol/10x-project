/**
 * OpenRouter Integration Test Script
 *
 * End-to-end integration test for the complete flashcard generation flow:
 * 1. Generate flashcards from source text (POST /api/generations)
 * 2. Save selected flashcards (POST /api/flashcards)
 * 3. Retrieve flashcards (GET /api/flashcards)
 * 4. Update flashcard (PUT /api/flashcards/:id)
 * 5. Delete flashcard (DELETE /api/flashcards/:id)
 *
 * Usage: node test-openrouter-integration.js [BASE_URL]
 * Example: node test-openrouter-integration.js http://localhost:4321
 */

const BASE_URL = process.argv[2] || "http://localhost:4321";

console.log("\n=== OpenRouter Integration Test ===\n");
console.log(`Base URL: ${BASE_URL}\n`);

// Test data
const TEST_SOURCE_TEXT = `
The Theory of Relativity, developed by Albert Einstein, consists of two parts: 
Special Relativity (1905) and General Relativity (1915). 

Special Relativity introduced revolutionary concepts: time and space are not absolute 
but relative to the observer's motion. The theory includes the famous equation E=mc², 
showing that energy and mass are interchangeable.

General Relativity extended these ideas to include gravity, describing it not as a force 
but as a curvature of spacetime caused by mass and energy. This theory predicted phenomena 
like gravitational waves and black holes, which have since been observed.
`.trim();

// Test configuration
const TESTS = {
  generation: {
    name: "Generate Flashcards",
    method: "POST",
    endpoint: "/api/generations",
    body: {
      source_text: TEST_SOURCE_TEXT,
    },
  },
  saveFlashcards: {
    name: "Save Flashcards",
    method: "POST",
    endpoint: "/api/flashcards",
    body: null, // Will be populated from generation response
  },
  listFlashcards: {
    name: "List Flashcards",
    method: "GET",
    endpoint: "/api/flashcards",
  },
  updateFlashcard: {
    name: "Update Flashcard",
    method: "PUT",
    endpoint: null, // Will be populated after save
    body: {
      front: "Updated: What is E=mc²?",
      back: "Updated: Einstein's equation showing mass-energy equivalence",
    },
  },
  deleteFlashcard: {
    name: "Delete Flashcard",
    method: "DELETE",
    endpoint: null, // Will be populated after save
  },
};

console.log("📋 Integration Test Flow:\n");
console.log("1. Generate flashcards from source text about Theory of Relativity");
console.log("2. Save all generated flashcard proposals to database");
console.log("3. List saved flashcards with pagination");
console.log("4. Update one flashcard (edit content)");
console.log("5. Delete one flashcard\n");

console.log("═══════════════════════════════════════════════════════════\n");

async function runIntegrationTest() {
  console.log("🚀 Starting integration test...\n");

  let generationId = null;
  let savedFlashcards = [];

  try {
    // Step 1: Generate flashcards
    console.log("Step 1: Generating flashcards...");
    console.log(`POST ${BASE_URL}${TESTS.generation.endpoint}`);

    const genResponse = await fetch(`${BASE_URL}${TESTS.generation.endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TESTS.generation.body),
    });

    if (!genResponse.ok) {
      throw new Error(`Generation failed: ${genResponse.status} ${genResponse.statusText}`);
    }

    const genData = await genResponse.json();
    generationId = genData.id;

    console.log(`✅ Generated ${genData.proposals.length} flashcards`);
    console.log(`   Generation ID: ${generationId}`);
    console.log(`   Model: ${genData.model}`);
    console.log(`   Duration: ${genData.durationMs}ms`);
    console.log(`   Proposals Preview:`);
    genData.proposals.slice(0, 2).forEach((p, i) => {
      console.log(`     ${i + 1}. Front: ${p.front.substring(0, 60)}...`);
      console.log(`        Back: ${p.back.substring(0, 60)}...`);
    });
    console.log("");

    // Step 2: Save flashcards
    console.log("Step 2: Saving flashcards to database...");
    const flashcardsToSave = genData.proposals.map((p) => ({
      front: p.front,
      back: p.back,
      source: "ai-full",
      generation_id: generationId,
    }));

    const saveResponse = await fetch(`${BASE_URL}${TESTS.saveFlashcards.endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flashcards: flashcardsToSave }),
    });

    if (!saveResponse.ok) {
      throw new Error(`Save failed: ${saveResponse.status} ${saveResponse.statusText}`);
    }

    savedFlashcards = await saveResponse.json();
    console.log(`✅ Saved ${savedFlashcards.length} flashcards`);
    console.log(`   First flashcard ID: ${savedFlashcards[0].id}`);
    console.log("");

    // Step 3: List flashcards
    console.log("Step 3: Listing flashcards...");
    const listResponse = await fetch(`${BASE_URL}${TESTS.listFlashcards.endpoint}?generation_id=${generationId}`);

    if (!listResponse.ok) {
      throw new Error(`List failed: ${listResponse.status} ${listResponse.statusText}`);
    }

    const listData = await listResponse.json();
    console.log(`✅ Retrieved ${listData.data.length} flashcards`);
    console.log(`   Pagination: Page ${listData.pagination.page} of ${listData.pagination.total_pages}`);
    console.log("");

    // Step 4: Update flashcard
    if (savedFlashcards.length > 0) {
      console.log("Step 4: Updating first flashcard...");
      const updateId = savedFlashcards[0].id;

      const updateResponse = await fetch(`${BASE_URL}/api/flashcards/${updateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(TESTS.updateFlashcard.body),
      });

      if (!updateResponse.ok) {
        throw new Error(`Update failed: ${updateResponse.status} ${updateResponse.statusText}`);
      }

      const updatedCard = await updateResponse.json();
      console.log(`✅ Updated flashcard ${updateId}`);
      console.log(`   New front: ${updatedCard.front}`);
      console.log("");
    }

    // Step 5: Delete flashcard
    if (savedFlashcards.length > 1) {
      console.log("Step 5: Deleting last flashcard...");
      const deleteId = savedFlashcards[savedFlashcards.length - 1].id;

      const deleteResponse = await fetch(`${BASE_URL}/api/flashcards/${deleteId}`, {
        method: "DELETE",
      });

      if (!deleteResponse.ok) {
        throw new Error(`Delete failed: ${deleteResponse.status} ${deleteResponse.statusText}`);
      }

      console.log(`✅ Deleted flashcard ${deleteId}`);
      console.log("");
    }

    console.log("═══════════════════════════════════════════════════════════\n");
    console.log("✅ Integration test completed successfully!\n");
    console.log("Summary:");
    console.log(`- Generated: ${genData.proposals.length} flashcards`);
    console.log(`- Saved: ${savedFlashcards.length} flashcards`);
    console.log(`- Updated: 1 flashcard`);
    console.log(`- Deleted: 1 flashcard`);
    console.log(`- Model used: ${genData.model}`);
    console.log(`- Total duration: ${genData.durationMs}ms\n`);
  } catch (error) {
    console.error("\n❌ Integration test failed!\n");
    console.error("Error:", error.message);

    if (error.cause) {
      console.error("Cause:", error.cause);
    }

    console.log("\n💡 Troubleshooting:");
    console.log("1. Ensure the development server is running (npm run dev)");
    console.log("2. Check OPENROUTER_API_KEY is set in environment");
    console.log("3. Verify Supabase connection is working");
    console.log("4. Check network connectivity");
    console.log("5. Review server logs for detailed errors\n");

    process.exit(1);
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === "undefined") {
  console.error("❌ Error: fetch is not available");
  console.log("\nThis script requires Node.js 18+ with native fetch support.");
  console.log("Alternatively, install node-fetch:");
  console.log("  npm install node-fetch");
  console.log('  Then add: import fetch from "node-fetch";\n');
  process.exit(1);
}

console.log("═══════════════════════════════════════════════════════════\n");
console.log("⚙️  Configuration:\n");
console.log(`Base URL: ${BASE_URL}`);
console.log(`Node Version: ${process.version}`);
console.log(`Fetch Available: Yes\n`);

console.log("═══════════════════════════════════════════════════════════\n");

// Run the test
runIntegrationTest();
