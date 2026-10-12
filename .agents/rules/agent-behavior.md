# Agent Execution & Pragmatism Rules (agent-behavior.md)

Nämä säännöt ovat ensisijaisia ja sitovia kaikille tekoälymalleille ja agenteille tässä projektissa.

---

## 1. Suoraviivaisuus & Ei Ylitestausta (No Over-Engineering & No Micro-Testing)

- **Pienet muutokset heti maaliin:** Jos tehtävä koskee CSS-tyylejä, yksittäistä väriä, tekstimuutosta, markdown-tiedostoa tai pientä koodikorjausta, TEE SE HETI suoraan kohdetiedostoon yhdellä työkalukutsulla.
- **Kielto luoda väliaikaisia testiscriptäjä:** ÄLÄ luo väliaikaisia `test-*.mjs`, `take-screenshot.js`, `check-*.js` tai scratch-skriptejä pienten muutosten todisteluun.
- **Ei pakonomaista testisilmukkaa:** Älä käynnistä headless-selaimia, screenshoteja, `browser_subagent` -ajoja tai komentorivin testikomentoja taustalla, ellei käyttäjä nimenomaisesti pyydä testaamaan (`/test`, "aja testit" tai "tarkista selaimessa").

---

## 2. Päättäväinen Työkalujen Käyttö (Pragmatic & Decisive Tooling)

- **Tee kerralla valmiiksi:** Älä jaa yksinkertaista tehtävää viiteen eri väliaikaiseen vaiheeseen. Tee tarvittava tiedostomuutos heti ja raportoi tulos lyhyesti.
- **Ei turhaa byrokratiaa ja lupien kyselyä:** Kun käyttäjä antaa tehtävän X, vie se maaliin itsenäisesti ilman jatkuvaa välikyselyä tai varmistelua triviaaleista pikkukohdista.
- **Pidä repo puhtaana:** Älä jätä ylimääräisiä luonnostiedostoja, lokitestejä tai väliaikaisia kuvia projektikansioihin.

---

## 3. Kommunikaatio (Communication Style)

- **Vastaa suoraan ja ilman selittelyjä:** Vältä pitkiä liturgioita siitä, mitä aiot tehdä tai mitä filosofisia pohdintoja taustalla on.
- **Tee työ, ilmoita että se on tehty, ja kerro vain oleellinen.**
