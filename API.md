# 📡 API Reference Documentation (API.md)

**Project**: Agentic Architect  
**Version**: 1.0.0-MVP  
**Last Updated**: 2026-09-15  
**Base URL (Local)**: `http://localhost:3000`  
**Base URL (Production)**: `https://your-domain.vercel.app`

---

## 🔐 Authentication & Headers

The MVP does not use bearer token authentication. The AI chat endpoint (`/api/chat`) is protected server-side via the `OPENROUTER_API_KEY` environment variable (never exposed to the client). All data mutations are handled via **Next.js Server Actions** which run in a trusted server context.

```http
Content-Type: application/json
Accept: application/json
```

---

## 📦 Standard Response Envelope

### Server Actions (Internal)

Server Actions return typed TypeScript objects directly. No HTTP envelope is used for internal actions.

### AI Chat API (HTTP)

The `/api/chat` endpoint streams using the Vercel AI SDK Data Stream Protocol. When the AI key is missing, it returns a static JSON fallback:

#### Fallback Response (no API key):
```json
{
  "role": "assistant",
  "content": "⚡ Arkkitehtuurikaavio luotu vaatimustesi pohjalta! ...",
  "toolInvocations": [
    {
      "toolCallId": "call_<timestamp>",
      "toolName": "update_architecture",
      "args": { "nodes": [...], "edges": [...] },
      "result": { "nodes": [...], "edges": [...] },
      "state": "result"
    }
  ]
}
```

#### Error Response (HTTP 500):
```json
{
  "error": "Internal Server Error"
}
```

---

## 🚀 HTTP Endpoints

### 1. AI Architecture Co-Pilot Chat

#### `POST /api/chat`

Streams an AI architecture co-pilot response using Vercel AI SDK. The AI can call the `update_architecture` tool to mutate the React Flow canvas in real time.

- **Auth**: None (API key is server-side via `OPENROUTER_API_KEY`)
- **Model**: `openai/gpt-4o-mini` via OpenRouter
- **Max Duration**: 30 seconds (Vercel Edge timeout)
- **Fallback**: Returns a pre-built Smart Fallback architecture JSON if no API key is configured

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Suunnittele arkkitehtuuri e-commerce sovellukselle Stripe-maksuja varten"
    }
  ]
}
```

**Streaming Response (Vercel AI SDK Data Stream):**
The response is a streaming text/event-stream. The client consumes it via `useChat()` hook from `@ai-sdk/react`.

**Tool Call — `update_architecture`:**

When the AI decides to update the canvas, it invokes this tool with the following Zod-validated schema:

```typescript
{
  nodes: Array<{
    id: string;
    type?: string;           // "input" | "default" | "output"
    data: {
      label: string;
      description: string;  // Finnish language node description (mandatory)
      tech?: string;
    };
    position: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
    animated?: boolean;
  }>;
}
```

**Architecture Tier Conventions (Y-coordinates):**

| Tier | Layer | Y-Position | Node Types |
| :---: | :--- | :---: | :--- |
| 0 | Client / UI (Next.js, Mobile App) | `y = 50` | `"input"` |
| 1 | API Gateway / Auth | `y = 200` | `"default"` |
| 2 | Services / Business Logic | `y = 350` | `"default"` |
| 3 | Databases / External APIs | `y = 500` | `"output"` |

---

## 🔧 Server Actions (Internal API)

Server Actions are called directly from React components via Next.js `"use server"`. They are not HTTP endpoints but behave as typed RPC calls.

### File Parser

#### `parseFileAction(formData: FormData): Promise<string>`

Extracts raw text content from uploaded spec documents.

- **Supported Formats**: `.pdf`, `.txt`, `.md`
- **Implementation**: [`src/app/actions/file-parser.ts`](src/app/actions/file-parser.ts)
- **Returns**: Extracted plain text string
- **Error**: Throws if file type is unsupported or parsing fails

---

### Code Generation

#### `generatePrismaSchemaAction(architecture: string, prompt: string): Promise<string>`

Sends the architecture graph and original prompt to the AI and returns a syntactically valid Prisma SQLite schema.

- **Implementation**: [`src/app/actions/codegen.ts`](src/app/actions/codegen.ts)
- **Input `architecture`**: JSON-stringified React Flow nodes and edges
- **Returns**: Generated `schema.prisma` content as a string

#### `writePrismaSchemaToDiskAction(targetPath: string, schema: string): Promise<{ success: boolean; path?: string; error?: string }>`

Writes the generated Prisma schema to `{targetPath}/prisma/schema.prisma`.

- **Security**: `path.relative()` traversal check — rejects paths outside the target directory
- **Returns**: `{ success: true, path: "/abs/path/prisma/schema.prisma" }` or `{ success: false, error: "..." }`

---

### Project Management

#### `saveProjectAction(data: ProjectInput): Promise<Project>`

Persists a new architecture session to the SQLite database.

**Input Schema:**
```typescript
{
  name: string;
  prompt?: string;
  architecture?: string;   // JSON stringified React Flow graph
  prismaSchema?: string;   // Generated schema.prisma content
  targetPath?: string;     // Local filesystem target directory
  status?: string;         // Default: "PLANNING"
}
```

#### `updateProjectAction(id: string, data: Partial<ProjectInput>): Promise<Project>`

Updates fields on an existing saved project. Partial update supported.

#### `getProjectAction(id: string): Promise<Project | null>`

Fetches a single project by UUID. Returns `null` if not found.

#### `deleteProjectAction(id: string): Promise<void>`

Permanently deletes a project record from the SQLite database.

---

## 🗃️ Data Model

### `Project` (Prisma / SQLite)

```prisma
model Project {
  id           String   @id @default(uuid())
  createdAt    DateTime @default(now())
  name         String
  status       String   @default("PLANNING")
  prompt       String?
  architecture String?   // Stringified JSON: React Flow nodes & edges
  prismaSchema String?   // Generated schema.prisma code string
  targetPath   String?   // Target local directory path on disk
}
```

---

## 🚫 Known Limitations (MVP)

| Limitation | Notes |
| :--- | :--- |
| No pagination | `getProjects()` returns all projects; not an issue at MVP scale |
| No user auth | Single-user local tool; no multi-tenancy |
| SQLite only | Not suitable for concurrent multi-user production; upgrade to PostgreSQL for scale |
| 30s AI timeout | Vercel Edge Function max duration; complex architectures may hit this limit |
