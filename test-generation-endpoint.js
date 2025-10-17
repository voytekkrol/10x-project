/**
 * Simple test script for POST /api/generations endpoint
 * Run with: node test-generation-endpoint.js
 *
 * Prerequisites:
 * 1. Start the dev server: npm run dev
 * 2. Ensure Supabase is configured with valid credentials
 */

const testSourceText = `
TypeScript is a strongly typed programming language that builds on JavaScript, 
giving you better tooling at any scale. TypeScript adds additional syntax to 
JavaScript to support a tighter integration with your editor. Catch errors 
early in your editor. TypeScript code converts to JavaScript, which runs 
anywhere JavaScript runs: In a browser, on Node.js or Deno and in your apps. 
TypeScript understands JavaScript and uses type inference to give you great 
tooling without additional code. TypeScript is designed for the development 
of large applications and transpiles to JavaScript. As it is a superset of 
JavaScript, existing JavaScript programs are also valid TypeScript programs. 
TypeScript may be used to develop JavaScript applications for both client-side 
and server-side execution. The TypeScript compiler is itself written in 
TypeScript and compiled to JavaScript. It is licensed under the Apache License 2.0.
TypeScript supports definition files that can contain type information of existing 
JavaScript libraries, much like C++ header files can describe the structure of 
existing object files. This enables other programs to use the values defined in 
the files as if they were statically typed TypeScript entities.
`.trim();

async function testGenerationEndpoint() {
  try {
    console.log("🧪 Testing POST /api/generations endpoint...\n");
    console.log(`📝 Source text length: ${testSourceText.length} characters\n`);

    const response = await fetch("http://localhost:4321/api/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_text: testSourceText,
      }),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}\n`);

    const data = await response.json();
    console.log("📦 Response Data:");
    console.log(JSON.stringify(data, null, 2));

    if (response.status === 201) {
      console.log("\n✅ SUCCESS! Flashcard proposals generated successfully!");
      console.log(`   - Generation ID: ${data.id}`);
      console.log(`   - Model: ${data.model}`);
      console.log(`   - Proposals count: ${data.proposals?.length || 0}`);
      console.log(`   - Duration: ${data.generated_duration}ms`);
    } else {
      console.log("\n❌ FAILED! Expected status 201, got:", response.status);
    }
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error("\nMake sure:");
    console.error("  1. Dev server is running (npm run dev)");
    console.error("  2. Server is accessible at http://localhost:4321");
    console.error("  3. Supabase credentials are configured");
  }
}

// Test with invalid input (too short)
async function testValidationError() {
  try {
    console.log("\n\n🧪 Testing validation error (text too short)...\n");

    const response = await fetch("http://localhost:4321/api/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_text: "Too short",
      }),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}\n`);

    const data = await response.json();
    console.log("📦 Response Data:");
    console.log(JSON.stringify(data, null, 2));

    if (response.status === 400 && data.code === "VALIDATION_ERROR") {
      console.log("\n✅ Validation working correctly!");
    } else {
      console.log("\n❌ Expected 400 validation error");
    }
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
  }
}

// Run tests
(async () => {
  await testGenerationEndpoint();
  await testValidationError();
})();
