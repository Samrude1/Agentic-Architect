# Environment Variables & Secrets Context

This document tracks all environment variables required by this project. AI agents should update this document whenever a new external service, API key, or configuration setting is introduced.

**Security Warning**: NEVER store actual secrets, passwords, or API keys in this file. This document only describes the *keys* and their *purpose*, so developers know how to configure their `.env` files.

## Required Environment Variables

| Variable Name | Required | Purpose | Example Value (DO NOT USE REAL SECRETS) |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | Connection string for the primary database | `postgres://user:pass@localhost:5432/db` |
| `[VARIABLE_NAME]` | `[Yes/No]` | `[What this controls]` | `[Dummy example]` |

---

*(Note: When setting up a new project, use this list to create your `.env.local` or configure your CI/CD environment.)*
