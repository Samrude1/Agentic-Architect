# Tekoälyavusteisen Ohjelmistokehityksen Käyttöopas (Comprehensive User Guide)

Tämä on kattava ammattilaisen käyttöopas (Engineering Manual) Agentic Fullstack -templatelle. Tämän oppaan tarkoitus on avata `.agents`-hakemiston todellinen voima, purkaa sen osat ja antaa selkeät, toistettavat toimintaohjeet projektin jokaisessa elinkaaren vaiheessa. Tällä mallilla estetään tekoälyn hallusinointi ja varmistetaan, että koodipohja pysyy skaalautuvana ja kurinalaisena.

---

## 1. Järjestelmän Ydin: `.agents` -hakemiston Anatomia

Kaikki äly ja säännöstö asuu projektin juuren `.agents/` -kansiossa. Tämä on "tekoälyn aivot". Se pakottaa tekoälyn toimimaan kokeneen seniori-insinöörin tavoin. Hakemisto on jaettu neljään kriittiseen osaan:

1. **`context/` (Totuuden Lähde)**: Sisältää dokumentit, jotka määrittelevät *mitä* ollaan rakentamassa ja *millä säännöillä*. Tekoälyn tulee aina konsultoida näitä ennen koodausta.
2. **`workflows/` (Prosessit)**: Sisältää täsmälliset askelmerkit siihen, *missä järjestyksessä* erilaiset tehtävät (API, UI, Tietokanta) suoritetaan.
3. **`skills/` (Kognitiiviset Taidot)**: Sisältää tekoälyn "työkalut" ja kyvyt, joita se voi kutsua koodauksen aikana tai sen jälkeen (esim. suunnittelu, koodin arviointi, tilan tallennus).
4. **`feature-specs/` (Historiallinen Arkisto)**: Kun tekoäly laatii suunnitelman ja ihminen sen hyväksyy, se tallennetaan tänne numeroituna dokumenttina (esim. `01-feature.md`). Tämä on projektin muuttumaton spec-driven -audit trail.

---

## 2. Projektin Elinkaari: Aloitus, Tallennus ja Palautus

### Uuden projektin aloitus (Quick-Start)
1. **Pohjatyö**: Kloonaa repo. Kirjoita visiosi ja tavoitteesi tiedostoon `docs/future-project-vision.md`.
2. **Tekoälyn herätys ja alustus**: Avaa tekoäly-IDE:si chat ja anna ensimmäinen komento:
   > *"Moikka! Luodaan uusi sovellus. Aja `/init`."*
   Tekoäly lukee visiosi ja täyttää automaattisesti `.agents/context/` -kansion tiedostot (arkkitehtuuri, tavoitteet) vastaamaan sovellustasi.
3. **Ensimmäisen ominaisuuden rakennus**: Kun konteksti on alustettu, pyydä tekoälyä aloittamaan koodaus:
   > *"Aloitetaan ensimmäisen MVP-ominaisuuden rakentaminen. Käytä `.agents/workflows/new-feature-workflow.md` työnkulkua."*
4. **Arkkitehtuurin lukitus**: Tekoäly ajaa automaattisesti `/architect`-taidon. Se tekee Implementation Planin ja päivittää arkkitehtuuridokumentit. **Sinä hyväksyt.**
5. **Koodaus**: Hyväksynnän jälkeen tekoäly aloittaa konkreettisen koodauksen.

### Session tallentaminen (Työpäivän päätös)
Tekoälyllä ei ole omaa muistia eri sessioiden (chat-ikkunoiden) välillä. Ennen kuin suljet ohjelman, varmista jatkuvuus:
> *"Olen valmis tältä päivältä. Aja `/remember save`."*
Tekoäly kerää yhteenvedon tehdyistä asioista, ratkaisuista ja avoimista ongelmista, ja tallentaa ne `memory.md` -tiedostoon projektin juureen.

### Session palauttaminen (Työpäivän aloitus)
Kun palaat koneelle seuraavana päivänä tai aloitat uuden chatin:
> *"Jatketaan hommia. Aja `/remember restore`."*
Tekoäly lukee `memory.md` -tiedoston ja `.agents/context/` -hakemiston, ja on välittömästi perillä siitä, mitä oltiin tekemässä.

---

## 3. Työnkulut (`.agents/workflows/`)

Workflows-kansio on projektin sydän. Älä koskaan pyydä tekoälyä vain "tekemään jotain". Käske sitä aina noudattamaan tiettyä työnkulkua. Jokainen työnkulku määrittelee vaiheet suunnittelusta (Architect) toteutukseen ja katselmointiin (Review).

Tässä on katsaus kaikkiin saatavilla oleviin työnkulkuihin ja siihen, milloin niitä käytetään:

### `new-feature-workflow.md`
- **Mihin käytetään**: Kun rakennetaan kokonaan uusi, iso ominaisuus (esim. Käyttäjäprofiilin luonti, Ostoskori).
- **Mitä se tekee**: Tekoäly pakotetaan luomaan iso laaja Implementation Plan, päivittämään mahdolliset tietokantamallit ja rakentamaan ominaisuus end-to-end. Käyttää alityönkulkuna usein UI- ja API-työnkulkuja.

### `ui-component-workflow.md`
- **Mihin käytetään**: Kun tehdään puhtaasti frontend-komponentti (esim. uusi nappi, modaali, lomake).
- **Mitä se tekee**: Varmistaa, että tekoäly lukee `ui-context.md` -tiedoston, käyttää oikeita Tailwind-luokkia, eikä keksi uusia design-sääntöjä. Pakottaa myös `/imprint` -taidon käytön, jotta uudet design-valinnat tallentuvat rekisteriin.

### `api-development-workflow.md`
- **Mihin käytetään**: Uusien backend API-reittien rakentamiseen (Next.js Route Handlers tai FastAPI backend).
- **Mitä se tekee**: Varmistaa validointien (Zod), virheenkäsittelyiden ja tyypitysten oikeellisuuden ennen kuin API tuodaan frontendin käyttöön.

### `database-workflow.md`
- **Mihin käytetään**: Tietokantamuutoksiin (esim. Drizzle ORM, Prisma). Migraatioiden luonti, skeeman päivitys.
- **Mitä se tekee**: Estää tekoälyä rikkomasta tuotantokantaa. Se vaatii muutosten suunnittelun, `architecture.md` -tiedoston päivityksen ja oikeaoppisen migraatiotiedoston luomisen.

### `auth-security-workflow.md`
- **Mihin käytetään**: Autentikaation (Auth.js) säätöön, sessioiden hallintaan ja reittien suojaamiseen.
- **Mitä se tekee**: Varmistaa, että salasanat ja tokenit käsitellään oikein, Middleware suojaa oikeat reitit ja roolit (Role-Based Access) on implementoitu turvallisesti.

### `background-tasks-workflow.md`
- **Mihin käytetään**: Kun tarvitaan asynkronista suoritusta (AWS SQS, Lambdat, cron-työt).
- **Mitä se tekee**: Erottelee raskaan logiikan irti API-vastauksesta. Suunnittelee jonotuksen ja varmistaa, että tekoäly käyttää "Anti-SaaS" -infrastruktuuriamme (esim. AWS SQS) kolmannen osapuolen maksullisen palvelun sijaan.

### `ai-agent-workflow.md`
- **Mihin käytetään**: Projektin omien, ohjelmiston sisäisten tekoälyagenttien (FastAPI + LangGraph/CrewAI) kehittämiseen.
- **Mitä se tekee**: Keskittyy LLM-prompteihin, tekoälyn putkiin (pipelines) ja työkalujen integroimiseen Python-backendissa.

### `ci-cd-workflow.md`
- **Mihin käytetään**: Julkaisuputkien (GitHub Actions, Vercel) ja automaattisen testauksen konfigurointiin.
- **Mitä se tekee**: Kirjoittaa asennusskriptit ja testauksen säännöt, jotta koodi on tuotantovalmista ja oikein testattu.

### `security-audit-workflow.md`
- **Mihin käytetään**: Kun haluat tekoälyn etsivän aktiivisesti haavoittuvuuksia olemassa olevasta koodipohjasta.
- **Mitä se tekee**: Ajaa kolmivaiheisen auditoinnin (staattinen analyysi, infrastruktuuri, ja raportointi) etsien tietoturvapuutteita, turvattomia riippuvuuksia tai kovakoodattuja salaisuuksia.

### `legacy-project-onboarding.md`
- **Mihin käytetään**: Kun tuot tämän templaatin jo olemassa olevaan koodipohjaan.
- **Mitä se tekee**: Auttaa tekoälyä kartoittamaan nykyisen koodin tilan ja luomaan tarvittavat kontekstitiedostot jatkokehitystä varten.

### `code-optimization-workflow.md`
- **Mihin käytetään**: Kun koodia on tuotettu nopeasti (esim. AI:n tai juniorien toimesta) ja se vaatii siistimistä, tiivistämistä tai arkkitehtuurin mukaista refaktorointia (ns. spagetin siivoamista).
- **Mitä se tekee**: Tekoäly analysoi koodipohjan, tekee suunnitelman toistuvan tai sekavan koodin poistamiseksi ja refaktoroi koodin ammattimaiseksi ja selkeäksi rikkomatta toiminnallisuutta.

### `testing-workflow.md`
- **Mihin käytetään**: Koodin laadunvarmistukseen ja regressioiden estämiseen automaattisten testien avulla.
- **Mitä se tekee**: Ohjaa tekoälyn suunnittelemaan ja kirjoittamaan yksikkö-, integraatio- tai end-to-end-testejä luodulle ominaisuudelle ennen kuin se voidaan katsoa valmiiksi.

> **Esimerkki työnkulun pyytämisestä**:
> *"Tee uusi API-reitti käyttäjän datan hakemiseen. Käytä `api-development-workflow.md`."*

---

## 4. Taidot (`.agents/skills/`)

Skills-kansio eroaa Workflows-kansiosta siinä, että taidot ovat spesifejä *työkaluja* tai *kyvykkyyksiä*, joita tekoäly käyttää suorittaakseen workflows-vaiheita. Ne sisältävät `SKILL.md` tiedostoja, jotka opettavat tekoälylle, miten sen kuuluu reagoida eri tilanteisiin.

Voit joko pyytää tekoälyä ajamaan taidon ("Aja `/architect`"), tai tekoäly kutsuu niitä itse työnkulkujen vaatimana.

### `/init` (Projektin alustustaito)
- **Mitä se tekee**: Haastattelee sinua uuden projektin tavoitteista ja täyttää automaattisesti `.agents/context/` -kansion tiedostot (arkkitehtuuri, tietokanta, tyylit).
- **Miksi tärkeä**: Säästää aikaa uuden projektin boilerplate-tekstien täyttämisessä ja opettaa tekoälylle heti alussa projektisi oikean kontekstin.

### `/architect` (Suunnittelutaito)
- **Mitä se tekee**: Pakottaa tekoälyn miettimään ennen koodaamista. Pysäyttää hätiköinnin. Tekoäly luo `implementation_plan.md` -tiedoston ja odottaa ihmisen hyväksyntää.
- **Miksi tärkeä**: Ilman tätä tekoäly kirjoittaa spagettikoodia ja rikkoo arkkitehtuuria. Tämä on projektin hallinnan tärkein työkalu.

### `/imprint` (UI:n lukitustaito)
- **Mitä se tekee**: Analysoi juuri koodatun UI-komponentin ja poimii siitä talteen design-säännöt (värit, paddingit, varjot). Tallentaa nämä säännöt `ui-context.md` tai `ui-registry.md` -tiedostoon.
- **Miksi tärkeä**: Varmistaa, että sovellus näyttää yhtenäiseltä. Seuraava komponentti, jonka tekoäly tekee, näyttää samalta kuin edellinen.

### `/review` (Katselmointitaito)
- **Mitä se tekee**: Kun ominaisuus on koodattu, tekoäly ottaa "Senior Engineer" -hatun päähän ja arvostelee oman koodinsa. Se tekee Walkthrough-dokumentin, ja huomauttaa mahdollisista linttaus- ja arkkitehtuurivirheistä.
- **Miksi tärkeä**: Laadunvarmistus. Estää huonojen valintojen valumisen tuotantoon.

### `/remember` (Muistintallennustaito)
- **Mitä se tekee**: Tukee `save` ja `restore` argumentteja (kuten luvussa 2 kuvattu). Lukee tai kirjoittaa projektin sen hetkisen tilan `memory.md` -tiedostoon.
- **Miksi tärkeä**: Helpottaa työn jatkamista seuraavana päivänä ja uudessa chatissa.

### `/recover` (Vianpalautustaito)
- **Mitä se tekee**: Kun asiat menevät todella solmuun (tekoäly korjaa samaa virhettä kolmatta kertaa turhaan), ihminen voi komentaa `/recover`. Tekoäly pysähtyy, analysoi tilanteen objektiivisesti ja antaa diagnoosin (esim. "Targeted Fix", "Hard Reset" tai "Rethink").
- **Miksi tärkeä**: Katkaisee tekoälyn hallusinointikierteen ja ohjaa takaisin oikealle polulle.

### `/optimize` (Koodin optimointitaito)
- **Mitä se tekee**: Analysoi valitun tiedoston tai komponentin ja purkaa "spagettikoodin" modulaariseksi, noudattaen parhaita käytäntöjä.
- **Miksi tärkeä**: Palauttaa koodipohjan ammattimaisen laadun ja rakenteen nopeiden kokeilujen tai AI:n harhailujen jälkeen.

### `/test` (Testaustaito)
- **Mitä se tekee**: Kirjoittaa, ajaa ja korjaa automaattisia testejä koodipohjaan valitun testikehyksen (esim. Jest, Vitest) avulla.
- **Miksi tärkeä**: Varmistaa, että koodi oikeasti toimii ja kestää jatkokehityksen ilman regressioita.

---

## 5. Konteksti (`.agents/context/`)

Tämä on ohjelmistosi "perustuslaki". Koko tekoälyavusteinen kehitys rakentuu näiden dokumenttien varaan. Pidä huoli, että nämä ovat aina ajan tasalla.
- `project-overview.md`: Miksi tämä sovellus on olemassa ja kenelle sitä tehdään.
- `architecture.md`: Miten eri osat juttelevat toisilleen (Tech stack, API:t, taustatyöt).
- `database-schema.md`: Sovelluksen tietokantataulut, relaatiot ja tyypit.
- `ui-registry.md` / `ui-context.md`: Tyylit, väriteemat ja komponenttien visuaaliset säännöt.
- `env-context.md`: Projektin vaatimat ympäristömuuttujat ja salaisuuksien dokumentointi.
- `code-standards.md`: Linttaus-säännöt, nimeämiskäytännöt, tiedostorakenteet.

---

## Yhteenveto

**Agentic Fullstack -templatella kehittäminen ei ole pelkkää promptailua. Se on ohjelmistotuotannon johtamista.** Sinä olet Tech Lead ja tuoteomistaja, tekoäly on tiimisi. 
1. Määrittele suunta (`context/`).
2. Valitse työnkulku (`workflows/`).
3. Pakota tekoäly suunnittelemaan ja käyttämään taitojaan (`skills/`).
4. Hyväksy, anna koodata, ja tallenna tila (`/remember`).
