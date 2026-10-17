# Agentic Architect – Post-mortem & Kehitysraportti

> **Kohderyhmä & tavoite:**  
> Tämä raportti on laadittu **Agentic Architect** -kehitysympäristön jatkokehitystä varten. Tavoitteena on hioa alustasta **semiautomaattinen kehitystyökalu ei-niin-kokeneelle asiakkaalle**, jotta ladattu `.zip`-paketti toimii heti ("Zero-Config / Out-of-the-box") ilman manuaalista koodin debuggausta.

---

## 1. Yhteenveto: Miksi ohjelma kaatui heti käynnistyksessä?

Koeajossa sovellus purettiin `.zip`-paketista ja asennettiin riippuvuudet (`npm install`). Tämän jälkeen ohjelma kaatui kahteen kriittiseen estoon:

1. **Next.js Build / Kääntäjävirhe (Frontend):**
   ```text
   Module not found: Can't resolve '@/api/feedback'
   ./src/components/features/dashboard.tsx (6:1)
   ```
   Komponentissa oli tekoälyn jättämiä oletuskommentteja ja olemattomia moduulituonteja (`import { createFeedback } from '@/api/feedback'`). Koko tiedostoa tai moduulia ei ollut olemassa.
2. **Tietokannan alustusvirhe (Prisma CLI):**
   ```text
   error: Environment variable not found: DATABASE_URL.
   --> prisma\schema.prisma:3
   ```
   Paketissa oli vain `.env.example`, ja `.env.local` oli tyhjä (0 tavua). Lisäksi Prisma CLI vaatii oletuksena `.env`-tiedoston, ja se oli konfiguroitu vaatimaan asennetun paikallisen PostgreSQL-palvelimen (`localhost:5432`), jota ei-teknisellä asiakkaalla harvoin on asennettuna tai käynnissä.

---

## 2. Juurisyyanalyysi (Root Cause Analysis)

Miksi koodigeneraattori loi nämä virheet?

| Ongelma | Miten se ilmeni koodissa | Juurisyy arkkitehtuurissa |
| :--- | :--- | :--- |
| **Hallusinoidut / oletetut moduulit** | `import { Feedback } from '@/types'; // Assume these types...`<br>`import { createFeedback } from '@/api/feedback'; // Assume this API...` | **Siiloutunut generointi (Gate-eristys):** Frontend-komponentti generoitiin ilman, että sille syötettiin kontekstina todelliset syntyneet API-reitit ja tyyppitiedostot. LLM turvautui tyypilliseen "Assume"-malliin. |
| **API-polkujen epäsuhta** | Backend loi `src/app/api/endpoints/route.ts`, mutta Frontend haki `/api/feedback` ja yritti importoida moduulina `@/api/feedback`. | **Puuttuva sopimus (API Contract):** API-reittien nimeäminen ei ollut synkronissa komponentin kanssa. Lisäksi Next.js:ssä API-reitti on HTTP-päätepiste, ei moduuli jota importataan React-komponenttiin. |
| **Ulkopuolinen riippuvuus ilman asennusta** | Koodissa käytettiin `useSession()` ja `getSession()` (`next-auth/react`), mutta `next-auth` puuttui `package.json`:sta. | **Riippuvuuksien synkronoimattomuus:** Generaattori käytti kirjastoa, jota se ei lisännyt projektin `package.json`-tiedostoon, eikä NextAuthin auth-konfiguraatiota/reittiä ollut luotu lainkaan. |
| **Puuttuva PostCSS-käännöskirjasto (`autoprefixer`)** | `Error: Cannot find module 'autoprefixer'` kääntövaiheessa. `postcss.config.mjs` määritteli autoprefixerin, mutta sitä ei ollut `package.json`:ssa. | **Konfiguraation ja riippuvuuksien epäsuhta:** Tiedostopohja loi konfiguraation, mutta `package.json`-generaattori jätti tarvittavan liitännäisen lisäämättä `devDependencies`-kohtaan. |
| **Prisma-skeeman relaatiovirhe (P1012)** | `Comment.user` relaatiokenttä kaatui: `missing an opposite relation field on the model User`. | **Skeeman validaation puute:** Generaattori loi relaation toiseen malliin ilman vastakkaista kenttää (`comments Comment[]` `User`-mallissa). Validaatiota ei ajettu ennen pakkausta. |
| **Tietokannan kynnys** | Oletuksena `postgresql://`, jolloin `npx prisma db push` vaatii paikallisen Postgres-palvelimen, käyttäjätunnukset ja käynnissä olevan daemonin. | **Liian korkea vaatimustaso lokaalille testaukselle:** Aloittelijalle PostgreSQL on este. Kehityksen ja ensikäynnistyksen tulisi nojata nollakonfiguraation tietokantaan (esim. SQLite). |
| **Ympäristömuuttujien puuttuminen** | Vain `.env.example`, käyttäjän luoma `.env.local` oli tyhjä. Prisma ei lue `.env.local`-tiedostoa ilman lisäparametreja. | **Puuttuva `.env`-oletustiedosto:** `.zip`-paketissa ei ollut valmiiksi toimivaa `.env`-tiedostoa valmiilla oletusarvoilla. |

---

## 3. Vaatimus vs. Lopputulos (Prompt Gap Analysis)

Vertailu alkuperäisen liiketoimintapromptin ("PulseDesk") ja generoidun paketin välillä:

| Promptin Vaatimus | Suunnitelmataso (docs/ARCHITECTURE.md) | Toteutustaso koodissa (.zip) | Arvio |
| :--- | :--- | :--- | :--- |
| **1. Käyttäjät & Roolit** (Workspacet, Admin, Dev, Customer) | Mallinnettu skeemassa (`User`, `Workspace`, `UserRole`). | Ei työtilavalitsinta tai roolilogiikkaa käyttöliittymässä. | 🟡 *Tietomalli ok, logiikka puuttuu.* |
| **2. Palautteet & Roadmap** (Upvote, tilat, kommentointi) | Mallinnettu skeemassa ja API-kaaviossa. | Haku, filtterit, äänestys ja uusi palaute -modaali luotiin. Kommentit ja kortin avaus puuttuivat aluksi. | 🟢 *Hyvä ydin, master-detail vaati viimeistelyn.* |
| **3. AI-Analyysi & Klusterointi** (Sentimentti, teemat, pisteytys) | Kaaviossa luvattu *"Python AI Analysis Service"*. | **0% toteutettu.** Ei tekoälykutsuja eikä analyysireittejä. | 🔴 *Luvattu kaaviossa, jätetty koodista pois.* |
| **4. Integraatiot & Ilmoitukset** (Resend, Slack/GitHub webhookit) | Kaaviossa luvattu *"Notification Service / Slack / Resend"*. | **0% toteutettu.** Ei webhook- tai sähköpostikutsuja. | 🔴 *Täysin toteuttamatta.* |
| **5. Käyttöliittymä** (Tumma teema, analytiikkakortit, lista, modaali) | Kaaviossa kuvattu Next.js Web App. | Tumma tyylikäs teema, lista ja modaali luotiin. **Metriikka-/analytiikkakortit puuttuivat.** | 🟡 *Ulkoasu upea, metriikat puuttuivat.* |

---

## 4. Porttikohtaiset kehitysohjeet Agentic Architectiin (Gate 1 -> Gate 2 -> Gate 3 -> Gate 4)

Agentic Architectin arkkitehtuuri rakentuu vaiheittaisiin portteihin (Data Gates). Tässä on täsmälliset säännöt jokaiseen porttiin:

### 🚪 Gate 1: Tietokanta & Skeema (`gate1-schema-tab.tsx`)
1. **Zero-Config Default (SQLite):**
   - Paikalliseen kehitykseen oletukseksi aina SQLite (`provider = "sqlite"`, `DATABASE_URL="file:./dev.db"`).
   - Tarjoa tuotantoa varten rinnalla PostgreSQL-ohjeet / `.env.production`.
2. **Automaattinen skeemavalidaatio:**
   - Aja `prisma validate` tai skeemalintteri ennen kuin skeema hyväksytään eteenpäin.
   - Varmista, että jokaiseen `@relation`-kenttään generoidaan vastakkainen relaatiokenttä toiseen malliin (esim. `comments Comment[]`).

### 🚪 Gate 2: API & Rajapintasopimukset
1. **Generoi aina `src/types/index.ts`:**
   - Skeemasta luodaan automaattisesti TypeScript-rajapinnat (`Feedback`, `Comment`, `User`).
2. **Standardoidut resurssireitit:**
   - Luo reitit selkeästi resurssikohtaisesti: `src/app/api/<resurssi>/route.ts` (esim. `/api/feedback`), ei geneeristä `/api/endpoints`.
3. **Kevyt Auth-mock kehitystilaan:**
   - Älä importoi `next-auth/react` -kirjastoa palvelinreitteihin ilman täyttä asennusta.
   - Käytä kehitystilassa kevyttä sessiomockia (`const session = { user: { id: 'demo-user-1', name: 'Demo Käyttäjä', role: 'ADMIN' } }`), jotta sovellus toimii heti ilman kirjautumispalvelinta.

### 🚪 Gate 3: Käyttöliittymä (`gate3-ui-tab.tsx`)
1. **Kontekstin injektointi UI-agentille:**
   - Syötä UI-agentille **sekä** `src/types/index.ts` **että** lista luoduista API-reiteistä.
   - Kielletyt lauseet system promptiin: *"Älä koskaan kirjoita kommentteja 'Assume these types' tai 'Assume this API'. Käytä vain oikeita reittejä."*
2. **Master-Detail -vuorovaikutus:**
   - Jokaisen kortin ja listanäkymän tulee olla klikattavissa ja avata modaali tai sivupaneeli, jossa näkyvät lisätiedot, tilanvaihto ja kommentointi.
3. **Analytiikkakortit osaksi Dashboardia:**
   - Jos käyttäjän promptissa pyydetään analytiikkaa tai metriikoita, pakota luomaan 3–4 mittarikorttia sivun yläreunaan (esim. *Yhteensä palautteita*, *Avoimet kehitystoiveet*, *Kokonaisäänet*).

### 🚪 Gate 4: Vienti & .ZIP-Pakkaus (Export Pipeline)
1. **Pre-flight Dependency Check (Riippuvuuksien täsmäytys):**
   - Skannaa kaikki tiedostojen import-lauseet. Jos koodissa on `import ... from 'x'`, varmista että `x` löytyy `package.json`:sta.
   - Varmista, että Tailwind-projekteissa `autoprefixer` on aina mukana `devDependencies`-osiossa.
2. **Valmis `.env`-tiedosto:**
   - Pakkaa `.zip`-arkistoon valmis `.env`-tiedosto valmiilla paikallisilla asetuksilla (`DATABASE_URL="file:./dev.db"`).
3. **1-Click Käynnistysskripti:**
   - Lisää `package.json`:iin:
     ```json
     "scripts": {
       "setup": "npx prisma db push && npm run dev"
     }
     ```
   - Asiakkaan ohje tiivistyy kahteen riviin:
     ```bash
     npm install
     npm run setup
     ```

---

## 5. Miten monimutkaiset ominaisuudet (AI, Webhookit) hoidetaan ilman kaatumista?

Ei-kokenut asiakas ei pysty pystyttämään rinnakkaista Python-palvelinta tai Celery/Redis-jonoja.

**Ratkaisu Agentic Architectiin:**
- **In-App Mocking / Serverless Route:**
  - AI-analyysi toteutetaan Next.js Route Handlerina (\`/api/ai/analyze\`).
  - Jos \`OPENAI_API_KEY\` puuttuu, API palauttaa älykkäästi simuloitua sentimenttidataa ja teemaluokittelua ilmoittaen: *"AI Demo Mode: Lisää API-avain .env-tiedostoon saadaksesi reaaliaikaisen analyysin"*.
  - Näin sovellus toimii **100% varmuudella heti**, mutta käyttäjä näkee ominaisuuden toiminnassa!

---

## 6. Toteutuksen Tila (Implementoitu Agentic Architectiin)

✅ **Toteutettu onnistuneesti 17.10.2026**:
1. **Gate 1 Prisma Schema**:
   - Vaihdettu SQLite oletukseksi (\`provider = "sqlite"\`, \`file:./dev.db\`) LLM- ja fallback-generaattoreissa.
   - Lisätty tiukka relaatioiden kaksisuuntaisuussääntö (bidirectional relations).
2. **Gate 3 UI Generator**:
   - Injektoidaan jaetut TypeScript-sopimukset (\`src/types/index.ts\`) promptiin.
   - Kielletty haamuimportit (\`@/api/...\`, \`// Assume...\`) ja asentamattomat paketit (\`next-auth/react\`, \`@tanstack/react-query\`).
   - Vaaditaan 3–4 KPI-analytiikkakorttia trendi-indikaattoreilla.
   - Vaaditaan Master-Detail -vuorovaikutus (kortin klikkaus avaa tarkastelumodaalin).
3. **Gate 4 Luovutus / Vienti (.zip & Paikallinen kansio)**:
   - Pakettiin sisällytetään automaattisesti aktiivinen \`.env\` (\`DATABASE_URL="file:./dev.db"\`).
   - Pakettiin generoidaan \`src/types/index.ts\` suoraan Prisma-skeemasta.
   - \`package.json\`:iin lisätty \`"setup": "npx prisma db push && npm run dev"\` ja \`"autoprefixer": "^10.4.20"\`.
   - \`path-security.ts\`: sallittu \`.env\` ja \`src/types/index.ts\`.
   - \`README.md\` päivitetty selkeään kahden komennon asennusohjeeseen (\`npm install\` + \`npm run setup\`).
   - 100% testikattavuus (60/60 Vitest-testiä läpi, \`tsc --noEmit\` virheetön).

