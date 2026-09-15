# 🚨 Production Operations Runbook (RUNBOOK.md)

**Project**: Agentic Architect  
**Version**: 1.0.0-MVP  
**Last Updated**: 2026-09-15  
**Owner**: Solo Developer / [@Samrude1](https://github.com/Samrude1)

This document provides operational instructions, incident recovery procedures, health verification checks, and emergency rollback protocols for the Agentic Architect application.

---

## 1. System Health Verification

### Quick Health Check

The application uses Next.js App Router with SQLite (libSQL). There is no dedicated `/api/health` endpoint in the MVP. To verify the app is running correctly:

```bash
# Check that the Next.js server is responding
curl -i http://localhost:3000

# In production (Vercel):
curl -I https://your-production-domain.vercel.app
```

**Expected HTTP 200 Response Headers:**
```
HTTP/2 200
content-type: text/html; charset=utf-8
x-powered-by: Next.js
```

### Observability Checklist

| Resource | Where to Check |
| :--- | :--- |
| **Dev Server Logs** | Terminal running `npm run dev` |
| **Build Logs** | `npm run build` output |
| **Database File** | `./dev.db` (SQLite file in project root) |
| **Prisma Studio** | `npx prisma studio` — visual DB browser |
| **API Key Status** | OpenRouter dashboard: [openrouter.ai](https://openrouter.ai/) |
| **Vercel Deployments** | [vercel.com/dashboard](https://vercel.com/dashboard) |

---

## 2. Emergency Incident Response (Severity 1: Outage)

### Step 1: Triage & Identify Scope

1. Check browser console for JavaScript errors or failed network requests.
2. Check the terminal running `npm run dev` for Next.js server errors or unhandled exceptions.
3. Confirm `DATABASE_URL` in `.env.local` is correct: `file:./dev.db`.
4. Confirm the SQLite file exists: `ls dev.db` (or `dir dev.db` on Windows).
5. Confirm OpenRouter API key is valid and has quota remaining at [openrouter.ai](https://openrouter.ai/).

### Step 2: Instant Rollback Procedure

#### Vercel (Production Deployment):
1. Open [Vercel Dashboard](https://vercel.com/dashboard).
2. Select the **Agentic Architect** project.
3. Navigate to **Deployments** tab.
4. Locate the previous known-good deployment.
5. Click **⋯ → Promote to Production** or **Instant Rollback**.
   *(Recovery time: < 30 seconds)*

#### Git Rollback (Local or Self-Hosted):
```bash
# Identify the last stable commit
git log --oneline -10

# Revert to the previous commit
git checkout main
git revert HEAD --no-edit
git push origin main
```

#### Emergency Local Reset:
```bash
# Reset to last stable commit (WARNING: discards uncommitted changes)
git stash
git checkout <stable-commit-hash>
npm install
npm run dev
```

---

## 3. Database Maintenance & Disaster Recovery

### Backup Procedure (SQLite / Local)

The application uses a local SQLite file (`dev.db`). Back it up manually before any major changes:

```bash
# Create a timestamped backup
cp dev.db dev.db.backup-$(date +%Y%m%d-%H%M%S)
```

### Database Reset & Re-migration

If the database schema is out of sync or corrupted:

```bash
# Step 1: Delete the database file
rm dev.db

# Step 2: Re-run all migrations from scratch
npx prisma migrate dev

# Step 3: Verify schema alignment
npx prisma migrate status

# Step 4: (Optional) Open Prisma Studio to inspect
npx prisma studio
```

### Prisma Schema Drift Check

```bash
npx prisma migrate status
```
**Expected output**: `All migrations have been applied.`

If migrations are pending, run: `npx prisma migrate dev`

---

## 4. Secret & Credential Rotation

If `OPENROUTER_API_KEY` is leaked or compromised:

1. **Revoke immediately** at [openrouter.ai/keys](https://openrouter.ai/keys).
2. **Generate a new key** on the same page.
3. **Update `.env.local`** in your local environment:
   ```bash
   # .env.local
   OPENROUTER_API_KEY="sk-or-v1-<new-key>"
   ```
4. **Update Vercel environment variables** (if deployed):
   - Go to Vercel Dashboard → Project → **Settings → Environment Variables**.
   - Update `OPENROUTER_API_KEY` with the new value.
   - Trigger a new deployment: `git commit --allow-empty -m "chore: rotate api key" && git push`.
5. **Verify**: Open the app and confirm the Co-Pilot chat responds correctly.

> **Note**: The `route.ts` handler includes a safety check: if the key is missing or contains the placeholder string `your-openrouter-key`, the app automatically falls back to the Smart Fallback architecture generator. The app is **never broken** by a missing API key — it degrades gracefully.

---

## 5. Common Issues & Quick Fixes

| Symptom | Likely Cause | Fix |
| :--- | :--- | :--- |
| Blank canvas after prompt input | OpenRouter quota exceeded or invalid key | Check key at [openrouter.ai](https://openrouter.ai/); Smart Fallback will still render a diagram |
| `PrismaClientInitializationError` | Missing or corrupt `dev.db` | Run `npx prisma migrate dev` |
| `ENOENT` on file write | Invalid `targetPath` in Data Gates | Verify the path exists and is an absolute path to a writable directory |
| Build fails with type errors | TypeScript strict mode issue | Run `npx tsc --noEmit` to identify and fix type errors |
| `pdf-parse` fails on PDF upload | Corrupted PDF or unsupported encoding | Test with a text-layer PDF; scanned images are not supported |
| Port 3000 already in use | Another process on port 3000 | Run `npm run dev -- --port 3001` |

---

## 6. Contact & Escalation

- **Lead Engineer / Solo Owner**: [@Samrude1](https://github.com/Samrude1)
- **Hosting Platform**: [Vercel Support](https://vercel.com/help)
- **OpenRouter Support**: [openrouter.ai](https://openrouter.ai/)
- **Issue Tracker**: [GitHub Issues](https://github.com/Samrude1/Agentic-Architect/issues)
