# Known & Resolved Bugs (KNOWN_BUGS.md)

This file logs detected, investigated, and resolved bugs as part of the `/debug` (`app-debug`) diagnostic workflow.

---

## 🟢 Resolved Issues

| Date | Component | Symptom | Root Cause | Resolution |
| :--- | :--- | :--- | :--- | :--- |
| 2026-10-12 | Chat Co-Pilot & Security Remediation | Co-Pilot vastasi alle sekunnissa hallusinoiden, kankaalle ei tullut Auth Serviceä eikä Gate 1/2 koodi päivittynyt. | 1. API:ssa oli pikavastausoikotie, joka palautti kovakoodattua tekstiä kutsumatta tekoälyä. 2. Työkalut oli määritelty vanhalla `parameters`-kentällä `inputSchema`:n sijaan. 3. `chat-sidebar.tsx` etsi `part.toolName`, joka on AI SDK 7 staattisissa osissa `undefined` (tyyppi on `tool-${name}`). 4. Käsintehty SSE rikkoi protokollan. | 1. Siirrytty käyttämään aitoa OpenRouter GPT-4o-mini kutsua `apply_security_remediation`-työkalulla ja AI SDK 7 `toUIMessageStreamResponse()` -virralla. 2. `chat-sidebar.tsx` parsii nyt työkalut universaalisti `isToolUIPart` ja `getToolName` -funktioilla. 3. Kankaalle viedään Auth Service + PostgreSQL ja Gate 1/Gate 2 saavat suojatun koodin ja ilmoitusbannerin. Kaikki 52 yksikkötestiä läpäisty. |

---

## 🔴 Open Bugs

*Ei avoimia kriittisiä bugeja.*

---

## 🟡 Open Architecture Debt / Improvements for Next Session

1. **Automaattinen kontekstisilta Chat Co-Pilotin ja Data Gatejen välille**:
   - *Ongelma*: Kun käyttäjä painaa "🚀 Anna agentille korjattavaksi", chat sopii suunnitelmasta, mutta käyttäjän pitää vielä erikseen klikkailla Gate 1 ja Gate 2 generointeja, ellei agentilla ole suoraa työkalua päivittää Gate-koodia.
   - *Suositeltu parannus*: Lisätään Co-Pilotille työkalu `update_gate_code` tai syötetään `latestAuditReport` automaattisesti Gate 1:n ja Gate 2:n `generate`-kutsujen kontekstiin.

