# Memory — Agentic Architect Project Memory

Last updated: 2026-10-04 16:35:00 +03:00

## What was built & fixed in this session

1. **Koodipohjan Monoliittien Purkaminen (`/app-optimize`)**:
   - `playground-workspace.tsx` (~1,141 riviä → ~750 riviä): Purettu kolmeen erilliseen alikomponenttiin: `src/components/workspace/workspace-header.tsx`, `completion-banner.tsx`, ja `agent-working-hud.tsx`. Siivottu kuolleet ikonit ja importit.
   - `codegen.ts` (~1,056 riviä → 460 riviä): Purettu mallipohjageneraattorit (~600 riviä) uuteen erilliseen moduuliin `src/lib/codegen/smart-templates.ts`.
   - Varmistettu 100% taaksepäin yhteensopivuus, tyyppiturvallisuus ja nopeutettu agentin työskentelyä murto-osaan aiemmasta token-kulutuksesta.

2. **Turvallisuus & Tiedostojärjestelmän Suojaus (`src/lib/path-security.ts`, `src/app/actions/codegen.ts`, `src/app/actions/project.ts`)**:
   - **Allowed Write Paths**: Luotu tiukka allowlist (`ALLOWED_WRITE_PATHS`) sallituille tiedostoille (`prisma/schema.prisma`, `src/app/api/endpoints/route.ts`, `src/components/features/dashboard.tsx`, `.env.local.example`).
   - **Kotikansion (Homebase) Validointi**: Estetään levyjuuret (`C:\`, `/`), suora käyttäjän kotikansio (`os.homedir()`) ja kriittiset järjestelmäkansiot (`Windows`, `System32`, `Program Files`, `/usr`, `/etc`).
   - **Path Traversal & Bounds**: Varmistettu `path.relative`- ja kanonisen polun tarkistus, jottei mikään kirjoitus pääse karkaamaan projektikansion ulkopuolelle.
   - **Automaattinen Varmuuskopiointi (`.agentic-backup/`)**: Jos tiedosto on jo olemassa levyltä ja sen sisältö poikkeaa uudesta, luodaan automaattisesti aikaleimattu varmuuskopio hakemistoon `.agentic-backup/<aikaleima>/...` ennen ylikirjoitusta.

3. **Interaktiivinen Diff-esikatselu (`src/components/diff-preview-dialog.tsx`, `src/lib/diff.ts`)**:
   - **LCS Line Diff**: Rakennettu nopea ja tarkka LCS-pohjainen rivieroitus (`computeLineDiff`).
   - **Diff Preview Dialog**: Korvattu sokeat vahvistusdialogit interaktiivisella Diff-näkymällä (lisäykset vihreällä `+`, poistot punaisella `-`, tilastot `+X / -Y`, ja varmuuskopiolupaus).
   - Tunnistaa automaattisesti: Uusi tiedosto / Olemassa oleva muuttuu / Identtinen levyn kanssa.

4. **Responsiivinen Yläpalkki (Header Overhaul)**:
   - Ratkaistu yläpalkin nappien päällekkäisyys kapeilla ja jaetuilla näytöillä (`< lg`).
   - Siirretty apuohjelmat (*Vie Kaavio*, *Security Check*, *Optimize Code*, *Avaimet & .env*) mobiili- ja tablettikoossa siistiin **Työkalut** (`MoreHorizontal`) -pudotusvalikkoon.
   - Välilehtien tekstit tiivistetty (`Kaavio`, `Gate 1`, `Gate 2`, `Gate 3`) ja estetty rivittyminen / päällekkäisyys.
   - Projektin otsikolle ja Kotikansio-kortille lisätty responsiivinen katkeaminen (`truncate`).

5. **Diff Preview -onnistumisilmoitus & Sizing**:
   - Diff Preview -modaalin leveyttä kasvatettu (`w-[94vw] sm:max-w-4xl md:max-w-5xl`), jolloin pitkät tiedostopolut ja koodirivit mahtuvat kokonaisuudessaan ilman leikkautumista.
   - Lisätty tiedoston kirjoituksen jälkeen selkeä **Valmis / Onnistui** -näkymä vihreällä tarkistusmerkillä, tiedostopolulla ja suoralla toimintopainikkeella seuraavaan Gate-vaiheeseen hiljaisen sulkeutumisen sijaan.

6. **Koodin Vakaus & Testaus**:
   - Yksikkötestit laajennettu: **46/46 testiä läpäisty** 11 testitiedostossa (`npx vitest run`).
   - TypeScript-käännös: **0 virhettä** (`npx tsc --noEmit`).
   - ESLint: **0 virhettä** (`npm run lint`).
   - Tuotantopaketti: **Onnistunut Turbopack-build** (`npm run build`).

## Decisions made

- **Kaksivaiheinen tallennus**: Ennen minkään koodin kirjoitusta levylle näytetään aina rivitason Diff-esikatselu, jossa käyttäjä näkee tarkalleen mitä luodaan tai muuttuu.
- **Varmuuskopiointi aina ennen ylikirjoitusta**: Olemassa olevaa tiedostoa ei koskaan korvata ilman `.agentic-backup`-kopiota.
- **Palvelinpuolen Allowlist**: API ja Server Actions sallivat ainoastaan sallitut suhteelliset polut riippumatta käyttöliittymän kutsutavasta.
- **Responsiivinen pudotusvalikko**: Kapeilla näytöillä työkalut ryhmitellään pudotusvalikkoon, jotta tilapalkin välilehdet ja tallennuspainike pysyvät aina esteettöminä ja näkyvillä.
- **Koodin modulaarisuus & nopea kehityssykli**: Yli 1 000 rivin tiedostot pilkottu alikomponentteihin ja malleihin, jotta agentin työskentely pysyy kevyenä ja token-tehokkaana.

## Current state

- Koodipohja optimoitu ja monoliitit purettu.
- Dev-palvelin käynnissä ja valmis Gate 1:n (Prisma Schema) läpivientiin!
