# Code Optimization Workflow

This workflow is designed to clean up, condense, and optimize the codebase. It is especially useful when code has been generated quickly (e.g., by AI or junior developers) and has become bloated, fragile, or spaghetti-like. The goal is to enforce best practices, eliminate redundancy, and ensure professional-grade code quality.

1. **Analyze** (`/optimize`):
   - Review the target codebase, files, or components.
   - Identify code smells, spaghetti code, DRY (Don't Repeat Yourself) violations, and bloated logic.
   - Ensure the code follows the established architecture (`.agents/context/architecture.md`) and best coding practices.

2. **Architect & Plan** (`/architect`):
   - Do not just start rewriting code immediately. Formulate a clear plan for what needs to be refactored, consolidated, or condensed.
   - Create or update the `implementation_plan.md` artifact outlining the structural changes.
   - Wait for approval before proceeding.

3. **Optimize & Condense**:
   - Refactor the code to be clean, professional, and maintainable.
   - Break down massive functions or components into smaller, logical, and reusable pieces.
   - Remove dead code, redundant comments, and unnecessary dependencies.
   - Improve naming conventions for variables and functions for better readability.

4. **Review & Verify** (`/review`):
   - Ensure that the refactoring did not break existing functionality (regression checking).
   - Verify that the code is actually smaller, faster, or easier to read.
   - Ensure that it aligns with the overall architecture.

5. **Imprint** (`/imprint`):
   - If the optimization resulted in a new standard pattern or utility, record it in the relevant context files (`architecture.md` or `ui-registry.md`) to prevent future bad patterns from emerging.
