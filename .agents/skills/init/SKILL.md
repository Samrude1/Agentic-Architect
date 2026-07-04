---
name: init
description: Bootstraps a new project from the template by interviewing the user and automatically populating all context files (architecture, project-overview, ui-registry, etc.).
---

The `Agentic-fullstack-template` is a generic foundation. When a developer clones it to start a new project, this skill transforms the generic template into a specific, documented project foundation.

Run this skill ONLY when starting a brand new project, or when the user explicitly calls `/init` or `/bootstrap`.

---

## Step 1 — Gather Initial Requirements

Do not start writing files immediately. First, gather the requirements.
1. **Check for existing specs**: Always look for and read `docs/future-project-vision.md` or any initial prompt the user provides. This usually contains the "big picture" of what is being built.
2. **Interview if needed**: If a vision document exists, use it as your foundation. Only ask the user clarifying questions about details that are missing from the document. If no document exists, ask the user to describe:
   - What is the core purpose of the app?
   - Who are the users?
   - What are the main features and user flows?
   - Are there any specific architectural constraints?

Wait for the user's response (or confirmation that you have enough info) before proceeding.

---

## Step 2 — Plan the Context

Based on the user's answers, formulate a plan to update the `.agents/context/` files.
- `project-overview.md`: Replace all `[bracketed]` boilerplate with the actual project details, goals, and scope.
- `architecture.md`: Define the specific stack choices, boundaries, and patterns suited for this project.
- `database-schema.md`: Draft the initial core tables and relationships.
- `ui-registry.md`: Define the primary design tokens (colors, fonts) if the user has a theme in mind.
- `env-context.md`: List the environment variables this specific project will need (e.g., Stripe keys, OpenAI keys).

---

## Step 3 — Populate the Files

Once the user approves the overall plan, aggressively overwrite the boilerplate in the `.agents/context/` folder with the new, specific information. 
Use your file editing tools to remove the generic `[Project Name]` placeholders and insert the real data.

---

## Step 4 — Handoff

Once the context is populated, the project is officially bootstrapped. 
Inform the user that the AI is now fully aware of the project's rules, goals, and architecture, and ask what feature they would like to build first (often triggering `/architect` for the first feature).
