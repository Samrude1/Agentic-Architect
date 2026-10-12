# 📚 Projektin Dokumentaatiokeskus (Documentation Center)

Tämä kansio sisältää **Agentic Architect** -kokonaisuuden strategiset, arkkitehtoniset ja tekniset dokumentit. Tiedostot on numeroitu suositellussa lukujärjestyksessä.

---

## 🧭 Suositeltu Lukujärjestys

| Nro | Tiedosto | Kohdeyleisö | Lukuaika | Kuvaus & Pääteemat |
| :---: | :--- | :--- | :---: | :--- |
| **01** | [**01-executive-brief.md**](./01-executive-brief.md) | Johto, Tuoteomistajat, Arkkitehdit | ~5 min | **Aloita tästä.** Liiketoiminnallinen arvolupaus, ongelman määrittely ("vibe codingin" riskit), 2 pilaria, tuottavuusloikka ja visuaalisen alustan konsepti. |
| **02** | [**02-agentic-suite-overview.md**](./02-agentic-suite-overview.md) | Pääarkkitehdit, Tiiminvetäjät, Kehittäjät | ~10 min | **Kokonaisarkkitehtuuri.** Kahden pilarin symbioosi, 4-tasoinen React Flow -kangas, Co-Pilot AI -työkalut, 3 Data Gatea ja turvallinen sandboxed-levykirjoitus. |
| **03** | [**03-executive-report-fullstack-template.md**](./03-executive-report-fullstack-template.md) | Fullstack-kehittäjät, DevOps, Tietoturva | ~15 min | **Tekninen syväsukellus.** 18 agenttityökalun spesifikaatio, kognitiivinen tilanhallinta, OWASP Top 10 -tietoturva-auditointi (Grade A: 95/100) ja benchmarkit. |
| 📁 | [**adr/**](./adr/README.md) | Ohjelmistoarkkitehdit & Kehittäjät | — | **Arkkitehtuuripäätökset (ADR).** Formalisoidut teknologiavalinnat, perusteet ja historialliset ratkaisut (esim. Next.js 16, React 19, Prisma v7). |

---

## 🎯 Lukusuositus Roolin Mukaan

### 👔 Johdolle, Asiakkaalle & Päättäjille (Executive & Business)
1. Lue [**01-executive-brief.md**](./01-executive-brief.md) saadaksesi tiiviin yhteenvedon järjestelmän liiketoimintahyödyistä ja ROI:sta.

### 🏛️ Ohjelmistoarkkitehdeille & Tiiminvetäjille (Architects & Leads)
1. Lue [**01-executive-brief.md**](./01-executive-brief.md) (yleiskuva).
2. Siirry dokumenttiin [**02-agentic-suite-overview.md**](./02-agentic-suite-overview.md) tutustuaksesi tarkkaan arkkitehtuurimalliin ja datavirtoihin.
3. Katselmoi arkkitehtuuripäätökset kansiosta [**adr/**](./adr/README.md).

### 💻 Koodaajille & Tietoturva-auditoijille (Engineers & SecOps)
1. Aloita dokumentista [**02-agentic-suite-overview.md**](./02-agentic-suite-overview.md).
2. Tutki dokumentti [**03-executive-report-fullstack-template.md**](./03-executive-report-fullstack-template.md) (työkalut, testikattavuus ja tietoturvakontrollit).
3. Tarkista tekniset toteutussäännöt ja agenttikomennot juuren [README.md](../README.md) -tiedostosta.

---

> 💡 *Vinkki: Paikallisen kehitysympäristön pystytysohjeet ja pika-aloitus löytyvät projektin juuren [README.md](../README.md) -tiedostosta.*
