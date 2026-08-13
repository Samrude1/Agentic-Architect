# Memory — Codegen Phase & Local Disk Homebase Persistence

Last updated: 2026-08-13 18:52:00

## What was built

- **Prisma Schema Generator Server Action (`src/app/actions/codegen.ts`)**: Built `generatePrismaSchemaForProject` which synthesizes project requirements and architecture nodes into a clean SQLite-compatible Prisma schema using OpenRouter (GPT-4o mini) with a smart fallback generator. Added strict prompt rules requiring pure English model/field names.
- **Direct Disk Persistence Action (`writeProjectFileToDisk`)**: Implemented safe file writing to the project's configured homebase target directory with path traversal security validation (`fullPath.startsWith(targetDir)`).
- **Code Viewer & IDE Component (`src/components/code-viewer.tsx`)**: Built a tabbed code viewer component for Prisma schema previewing, editing, syntax highlighting, and 1-click disk synchronization to `prisma/schema.prisma`.
- **Playground Workspace Integration (`src/components/playground-workspace.tsx` & `src/app/playground/page.tsx`)**: Added Code Viewer tab switching ("Arkkitehtuuri" vs "Prisma Schema / Koodi") and linked workspace target homebase path updating (`updateProjectHomebaseDir`).

## Decisions made

- **Strict English Schemas**: AI schemas enforce standard English for all model names, fields, enums, and relations regardless of user prompt language (e.g., Finnish requirements translate to English models like `User`, `Project`, `Task`).
- **Disk Synchronization Policy**: File writes validate `targetPath` from Prisma project config and reject paths traversing outside the specified root directory.

## Problems solved

- **OpenRouter Schema Fallback**: Added robust fallback schema generator when OpenRouter API rate limits or network issues occur, ensuring schema generation never blocks the UI.

## Current state

- Project compiles cleanly with `npm run build` (Turbopack + TypeScript).
- Architecture visual editor, AI node description generation, Prisma schema codegen, and direct disk syncing are working end to end.

## Next session starts with

- **Full Backend API & Component Scaffold Generation**: Extending `codegen.ts` to generate Next.js Route Handlers (`src/app/api/`) and React UI components based on the generated Prisma schema and architecture nodes.
- **Diagram Export Enhancements**: Adding export features for PNG/SVG diagrams and Mermaid markdown documentation.

## Open questions

- None.
