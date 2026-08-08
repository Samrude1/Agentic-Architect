# Memory — Interactive Architecture Playground, AI Co-Pilot & English Docs

Last updated: 2026-08-08 21:51:30

## What was built

- Built the AI Architecture Agent (`src/agents/architecture-agent.ts`) powered by OpenRouter API + Zod schema parsing.
- Built specification file parser Server Action (`src/app/actions/file-parser.ts`) supporting `.pdf`, `.txt`, and `.md` files via `pdf-parse`.
- Built the Interactive Playground / Ajatushautomo workspace (`src/app/playground/page.tsx` & `src/components/playground-workspace.tsx`).
- Integrated real-time Vercel AI SDK chat co-pilot (`src/app/api/chat/route.ts` & `src/components/chat-sidebar.tsx`) featuring `update_architecture` tool call that live-syncs AI suggestions to the React Flow canvas.
- Added Project Deletion (`deleteProject` Server Action & `DeleteProjectButton` component with confirmation).
- Added "Editoi Ajatushautomossa" functionality to load existing saved projects directly into the Playground with real-time database persistence.
- Imprinted UI visual patterns into `.agents/context/ui-registry.md`.
- Translated and rewritten `README.md` completely into professional English.
- Updated `.agents/skills/remember/SKILL.md` to include reading `README.md` during context restoration.

## Decisions made

- Shifted early-stage UX to an unconstrained, interactive Playground mode where users can ideate and refine architecture with AI before committing to project creation/saving.
- Kept OpenRouter API calls server-side using `OPENROUTER_API_KEY` in `.env` to protect secrets against client-side leakage.

## Problems solved

- **Base UI Button Accessibility Warning**: Added `nativeButton={false}` to the back navigation `<Button>` rendering a custom `<Link>` element in `src/app/projects/[id]/page.tsx`.
- **React setState during render console error**: Wrapped parent component `notifyNodesChange` and `notifyEdgesChange` callbacks in `queueMicrotask()` in `src/components/architecture-canvas.tsx` to prevent triggering parent state updates synchronously inside React's state reducer functions.
- **Vercel AI SDK v4 Tool Typing**: Resolved Vercel AI SDK tool payload typing for Turbopack.

## Current state

- The entire platform compiles cleanly with `npm run build` (Turbopack + TypeScript).
- Playground workspace, AI tool calls, file uploads, project deletion, project editing, and English documentation are fully working.

## Next session starts with

- Building out detailed component inspection modals (clicking on a node to view/edit component details) or introducing database schema code generation gates.

## Open questions

- None.
