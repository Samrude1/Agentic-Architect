---
name: test
description: Writes, executes, and fixes automated tests for the project's codebase to ensure reliability and prevent regressions.
---

Code that isn't tested is code that is waiting to break. This skill ensures that features are verified automatically.

Run this skill when a new feature is completed, when refactoring code (e.g., after `/optimize`), or when requested to write tests for existing logic.

---

## Step 1 — Analyze the Target

Understand what you are testing:
- Read the target component, function, or API route.
- Identify the inputs (props, arguments, request body).
- Identify the expected outputs (render state, return value, response format).
- Identify edge cases (empty states, invalid inputs, network failures).

---

## Step 2 — Write the Tests

Write robust tests using the project's testing framework:
- **Unit Tests**: For isolated functions, utilities, or simple components. Mock external dependencies.
- **Integration Tests**: For API routes or complex components where interactions between pieces matter.
- **Test Descriptions**: Write clear `it` or `test` blocks (e.g., `it('should return 400 when email is invalid')`).

---

## Step 3 — Execute and Fix

Do not just write tests and assume they pass.
- Run the tests locally using the appropriate terminal command (e.g., `npm run test` or `npm run test:watch`).
- If a test fails, analyze the error:
  - If the code is wrong, fix the code.
  - If the test is wrong (e.g., bad mock, wrong assertion), fix the test.
- Repeat until green.

---

## Step 4 — Report

Provide a summary of the test coverage added. Do not dump the entire test file contents into the chat unless asked; just summarize what was verified and confirm that the suite passes.
