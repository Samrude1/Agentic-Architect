# Known & Resolved Bugs (KNOWN_BUGS.md)

This file logs detected, investigated, and resolved bugs as part of the `/debug` (`app-debug`) diagnostic workflow.

---

## 🟢 Resolved Issues

| Date | Component | Symptom | Root Cause | Resolution |
| :--- | :--- | :--- | :--- | :--- |
| 2026-10-07 | Security Audit & Data Gates | "Security"-välilehti ei auennut suoraan tallennetulla raportilla; uusi auditointi ilmoitti vanhat puutteet uudelleen. | 1. Security-nappi käynnisti aina uuden LLM-tarkastuksen vahvistusdialogilla. 2. Chat Co-Pilot teki suunnitelman, mutta ei siirtänyt sitä Gate 1/2 generaattoreille. 3. Gate 1 generoi vanhaa SQLiteä ja plaintext `password`-kenttää. | 1. Lisätty levyltä/välimuistista lataus (`getLatestAuditReportAction`). 2. Päivitetty generaattorisäännöt (PostgreSQL, `passwordHash`, RBAC). 3. Tallennettu ja auditoitu Grade A (95/100). |

---

## 🔴 Open Architecture Debt / Improvements for Next Session

1. **Automaattinen kontekstisilta Chat Co-Pilotin ja Data Gatejen välille**:
   - *Ongelma*: Kun käyttäjä painaa "🚀 Anna agentille korjattavaksi", chat sopii suunnitelmasta, mutta käyttäjän pitää vielä erikseen klikkailla Gate 1 ja Gate 2 generointeja, ellei agentilla ole suoraa työkalua päivittää Gate-koodia.
   - *Suositeltu parannus*: Lisätään Co-Pilotille työkalu `update_gate_code` tai syötetään `latestAuditReport` automaattisesti Gate 1:n ja Gate 2:n `generate`-kutsujen kontekstiin.

