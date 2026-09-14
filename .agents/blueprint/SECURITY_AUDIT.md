# Security Audit & Vulnerability Report (SECURITY_AUDIT.md) - Agentic Architect

This document tracks security assessments, vulnerability scans, OWASP Top 10 compliance audits, and remediation steps for **Agentic Architect**.

---

## 1. Security Scorecard & Health Summary

| Category | Status | Assessment |
| :--- | :--- | :--- |
| **Secrets & Credentials** | 🟩 Passed | All secrets isolated in `.env.local`; `.gitignore` strictly protects `.env*`; zero hardcoded `sk-`, `ghp_`, `AKIA`, `AIza` patterns in source |
| **NEXT_PUBLIC Secret Exposure** | 🟩 Passed | Zero `NEXT_PUBLIC_KEY/SECRET/TOKEN` misuse detected |
| **Path Traversal Defense** | 🟩 Passed | `path.resolve` + strict `path.relative` bounds check enforced in `codegen.ts:322-325`; rejects `..` traversal |
| **Safety Gates & Confirmation** | 🟩 Passed | `ConfirmActionDialog` gates all destructive ops, file writes, and heavy AI tasks |
| **Injection Defense (SQL/Command)** | 🟩 Passed | Zero raw SQL; Prisma ORM parameterized queries only; zero `exec()`/`spawn()` shell calls |
| **XSS & Content Security** | 🟩 Passed | Zero `dangerouslySetInnerHTML` or `innerHTML` usage; React automatic JSX escaping active |
| **HTTP Security Headers** | 🟩 Passed | **NEW 2026-09-14**: `CSP`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` added to `next.config.ts` |
| **CORS Policy** | 🟩 Passed | No wildcard `Access-Control-Allow-Origin: *`; no cookie-credentialed cross-origin requests |
| **Auth / IDOR** | 🟩 N/A | Single-user local dev tool; no auth layer or multi-tenancy — no IDOR attack surface |
| **Input Validation** | 🟩 Passed | Zod validation on all API routes; file parser validates MIME types (`pdf`, `txt`, `md`) |
| **Framework CVEs (Next.js)** | 🟩 Patched | **NEW 2026-09-14**: Upgraded `next` to `^16.3.5`; patched 1 Critical + 10 High CVEs (SSRF, RCE, DoS, Middleware bypass) |
| **Dependency CVEs (Prisma internals)** | 🟨 Tracked | 4 High CVEs in `@prisma/config` via `mysql2` + `deepmerge-ts` (CLI dev tooling only, not in production runtime). Fix requires Prisma downgrade to v6. Tracked below. |

*Status Legend: 🟩 Passed / Secure | 🟨 Warning / Tracked | 🟥 Critical Vulnerability | ⬜ N/A*

---

## 2. Vulnerability & Remediation Log

| Date | Severity | Component | Description | Remediation | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-09-14 | **Critical** | `next` up to 16.3.2 | 11 CVEs: SSRF in Server Actions, RCE on Windows (AVIF/Image API), Middleware bypass (Turbopack), DoS in Server Actions & Image API, Cache confusion, Unauthenticated endpoint disclosure | Upgraded `next` to `^16.3.5` via `npm install next@latest` | 🟩 Resolved |
| 2026-09-14 | High | `sharp` up to 0.35.4-rc.0 | CVE-2026-33327/28/35590/35591 (libvips), CVE in libheif — transitive via `next` | Resolved by `next@^16.3.5` upgrade | 🟩 Resolved |
| 2026-09-14 | High | `postcss` up to 8.5.22 (via `next`) | XSS via `</style>` in CSS stringify, Path traversal via sourceMappingURL | Resolved by `next@^16.3.5` upgrade | 🟩 Resolved |
| 2026-09-14 | Medium | `next.config.ts` | Missing HTTP security headers: no CSP, no X-Frame-Options, no X-Content-Type-Options | Added full security header suite to `next.config.ts` headers() function | 🟩 Resolved |
| 2026-09-14 | High | `mysql2` up to 3.23.0 (via `prisma@7`) | Auth Plugin Downgrade leaks plaintext credentials; zlib decompression-bomb DoS | **Tracked** — affects only Prisma CLI `@prisma/config` dev dependency chain. Not reachable from production runtime (app uses SQLite/libsql, not mysql2). Fix requires Prisma downgrade to v6.19.3 — rejected. Re-evaluate when Prisma v7 patches `@prisma/config`. | 🟨 Tracked |
| 2026-09-14 | High | `deepmerge-ts` up to 8.0.0 (via `prisma@7`) | Stack exhaustion DoS via recursive object graph merging | **Tracked** — same chain as mysql2; dev tooling only. See above. | 🟨 Tracked |
| 2026-09-09 | Low | `src/app/actions/tech-stack.ts` | GitHub Secret Scanner flagged placeholder sample key with `whsec_` prefix | Replaced with generic placeholder `"your-stripe-webhook-secret-here"` | 🟩 Resolved |
| 2026-09-09 | Medium | `src/components/playground-workspace.tsx` | Accidental click risk for AI codegen and disk write operations | Implemented `ConfirmActionDialog` confirmation gates | 🟩 Resolved |
| 2026-09-04 | High | Root `.env` | Active `OPENROUTER_API_KEY` in un-isolated `.env` | Key moved to `.env.local`; `.env.example` template created; `.env*` gitignored | 🟩 Resolved |
| 2026-09-04 | Medium | `codegen.ts` | `writeProjectFileToDisk` wrote to unverified user-supplied `targetPath` | Enforced strict `path.relative(targetDir, fullPath)` bounds validation at line 322-325 | 🟩 Resolved |

---

## 3. Dependency Audit History

| Date | Command | Result |
| :--- | :--- | :--- |
| 2026-09-14 | `npm install next@latest` | Resolved 1 Critical + 6 High CVEs (next, sharp, postcss chain) |
| 2026-09-14 | `npm install --legacy-peer-deps` + `overrides: { hono: ">=4.13.5" }` | Forced safe hono version; stabilized on Prisma v7.10.0 |
| 2026-09-14 | `npx tsc --noEmit` | 0 TypeScript errors after all upgrades |
| 2026-09-09 | `npm audit fix --legacy-peer-deps` | Resolved 8 transitive CVEs (brace-expansion, browserslist, fast-uri, hono, js-yaml, qs) |

### Remaining Tracked Advisories (not fixable without breaking downgrade)

All 4 remaining advisories are in the **`@prisma/config` via `mysql2` / `deepmerge-ts`** chain:

- **Root cause**: `prisma@7.x` CLI ships `@prisma/config` which bundles `mysql2` for multi-database introspection tooling.
- **Risk to this app**: **Zero** — the app uses SQLite via `@libsql/client` + `@prisma/adapter-libsql`. The `mysql2` code path is never executed.
- **Available fix**: Downgrade to `prisma@6.19.3` — rejected (v6 lacks features in the current schema; would be a regression).
- **Resolution path**: Monitor `prisma@7.x` patch releases. Re-run `npm audit` at next scheduled dependency review.
