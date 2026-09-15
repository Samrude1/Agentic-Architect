# Use Next.js App Router + Prisma + SQLite + OpenRouter as Core Stack

- **Status**: Accepted
- **Deciders**: Solo Developer (Samrude1)
- **Date**: 2026-09-01

---

## Context and Problem Statement

Agentic Architect is a solo-developer productivity tool for visualizing software architecture and scaffolding fullstack codebases. The core technology stack decision needed to balance: rapid development velocity, strong TypeScript type safety across the full stack, AI streaming capabilities, local-first data persistence for MVP, and zero operational complexity for a single developer maintaining the entire system.

---

## Decision Drivers

- **Solo developer velocity**: Minimize operational overhead; avoid managing separate API servers, cloud databases, or authentication services for MVP.
- **Full-stack TypeScript type safety**: Share types seamlessly between the React frontend, Server Actions, and the database layer.
- **AI streaming support**: The core feature (interactive AI chat and canvas mutations) requires robust streaming infrastructure.
- **Local-first persistence**: MVP targets local developer workstations; no cloud database provisioning needed at launch.
- **Production upgrade path**: The stack must support upgrading to PostgreSQL and a cloud deployment without architectural rewrites.

---

## Considered Options

1. **Next.js 16 App Router + Prisma + libSQL (SQLite) + Vercel AI SDK + OpenRouter** *(Chosen)*
2. **Vite SPA + Express.js API + MongoDB Atlas + OpenAI SDK**
3. **Remix + Drizzle ORM + PostgreSQL + Anthropic SDK**

---

## Decision Outcome

Chosen option: **Option 1 — Next.js 16 App Router + Prisma + libSQL + Vercel AI SDK + OpenRouter**, because it uniquely satisfies all decision drivers simultaneously:

- **Next.js App Router** collapses frontend and backend into a single codebase with Server Actions, eliminating a separate API server.
- **Prisma + libSQL** provides a local SQLite file for MVP with zero infrastructure, while the Prisma adapter layer allows seamless migration to Turso (cloud SQLite) or PostgreSQL for production scale.
- **Vercel AI SDK v7** provides production-grade streaming primitives (`streamText`, `useChat`, tool calling) with first-class Next.js integration.
- **OpenRouter** acts as a universal AI gateway — enables switching between GPT-4o-mini, Claude, Gemini, etc., without SDK changes.
- **Smart Fallback mode** (`generateSmartPromptArchitecture`) ensures the app is always functional even without an API key — critical for demos and onboarding.

### Positive Consequences
- Single `npm run dev` starts the entire application — no Docker, no separate API server, no database daemon.
- Zod v4 schemas shared across Server Actions, the AI tool calling contract, and the React Flow architecture validator.
- `@xyflow/react` v12 integrates seamlessly with React 19's Concurrent Mode for smooth canvas rendering.
- Vitest runs in the same TypeScript environment as the application — no separate Jest config or Babel transforms.
- Upgrading to PostgreSQL requires only changing `DATABASE_URL` and swapping the Prisma adapter — zero schema rewrites.

### Negative Consequences / Trade-offs
- **SQLite concurrency**: Not suitable for multi-user production. *Mitigation*: Planned upgrade to Turso or Supabase (PostgreSQL) before any multi-user launch.
- **Vercel Edge 30s timeout**: Long AI-generated architectures with many nodes may approach the timeout limit. *Mitigation*: Use `gpt-4o-mini` (fast) as default; `maxDuration = 30` set in route config.
- **Next.js vendor lock-in**: Some features (Server Actions, streaming) are Next.js-specific. *Mitigation*: Core business logic is isolated in framework-agnostic files (`architecture-agent.ts`, `codegen.ts`, `project.ts`).

---

## Pros and Cons of the Options

### Option 1: Next.js + Prisma + SQLite + Vercel AI SDK (Chosen)
- ✅ Zero infrastructure for local development
- ✅ Shared TypeScript types across full stack
- ✅ Built-in streaming support via Vercel AI SDK
- ✅ `@xyflow/react` React 19 compatibility verified
- ✅ Graceful Smart Fallback for keyless operation
- ❌ SQLite not suitable for concurrent multi-user scale
- ❌ Some Next.js vendor lock-in on streaming primitives

### Option 2: Vite SPA + Express + MongoDB Atlas
- ✅ Full framework flexibility
- ✅ MongoDB schema-less for rapid iteration
- ❌ Requires separate API server process (more dev complexity)
- ❌ No built-in streaming; manual EventSource/SSE setup
- ❌ Cloud database required even for local dev (Atlas free tier)
- ❌ No Server Actions — all state mutations go through REST fetch calls

### Option 3: Remix + Drizzle + PostgreSQL
- ✅ Excellent streaming support via Remix loaders
- ✅ Drizzle is lightweight and type-safe
- ❌ PostgreSQL requires a local Docker container or cloud DB for development
- ❌ Smaller ecosystem for React Flow + AI SDK integration
- ❌ Less documentation and community support for Remix + Vercel AI SDK at time of decision
