# Memory — Project Dashboard MVP

Last updated: 2026-07-28 20:05:00

## What was built

- Configured Prisma with SQLite (`prisma/schema.prisma`).
- Created `Project` model with `id`, `name`, `status`, `prompt`.
- Created Server Actions for fetching and creating projects (`src/app/actions/project.ts`).
- Built Project Dashboard UI (`src/app/page.tsx`) listing created projects.
- Built New Project Dialog (`src/components/new-project-dialog.tsx`) to insert new projects into DB.
- Imprinted visual patterns to `.agents/context/ui-registry.md`.

## Decisions made

- Used **SQLite** with `@libsql/client` driver adapter for local development. This avoids native C++ compilation errors on Windows that occur when using `better-sqlite3` with Prisma v7.
- Used Shadcn/UI for components, sticking strictly to the visual registry for consistency.

## Problems solved

- **Prisma v7 driver adapter on Windows**: Prisma v7 requires driver adapters, but `better-sqlite3` fails to compile natively without C++ tools on Windows. Switched to `libsql` which is WebAssembly/native-compile-free, allowing Prisma to initialize properly.
- **DialogTrigger Type Error**: Shadcn's updated Dialog based on `@base-ui/react/dialog` doesn't support `asChild`. Switched to `render={<Button />}` prop to fix TypeScript errors during build.

## Current state

- Project Dashboard MVP is completely functional.
- The user can create new projects, and they render on the dashboard.
- The `npm run build` succeeds flawlessly with zero type errors.

## Next session starts with

- Run `/architect` to design and implement the **Visual Architecture Canvas (React Flow)** inside a single project view, turning the initial project prompt into architectural nodes.

## Open questions

- None.
