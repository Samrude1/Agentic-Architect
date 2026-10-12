# 📚 Agentic Engineering Suite — Dokumentaatiokeskus

Tämä kansio sisältää **Agentic Engineering Suite** -kokonaisuuden strategiset, arkkitehtoniset ja tekniset dokumentit. 

Kokonaisuus koostuu kahdesta toisiaan täydentävästä osasta:
1. **Osa 1 (Kehitysmoottori & Metodologia)**: Ammattilaisen kognitiivinen kehityskehys, 18 taitoa ja muistiprotokolla.
2. **Osa 2 (Visuaalinen Tuotealusta)**: Moottorin avulla rakennettu *Agentic Architect* -työkalu (4-tasoinen kangas, 3 Data Gatea ja turvalevykirjoitus).

Tiedostot on numeroitu loogisessa lukujärjestyksessä **makrotasolta (johdon visio) mikrotasolle (tekninen syväsukellus)**:

---

## 🧭 Suositeltu Lukujärjestys

| Nro | Tiedosto | Asiakirjan Tyyppi | Kohdeyleisö | Kuvaus & Pääteemat |
| :---: | :--- | :--- | :--- | :--- |
| **01** | [**01-master-brief-agentic-suite.md**](./01-master-brief-agentic-suite.md) | **Master Executive Brief** | CEO, CTO, Sijoittajat, Päättäjät | **Kokoava pääteos (Part 1 + Part 2).**<br>• Mikä on Agentic Engineering Suite?<br>• "Vibe codingin" riskit vs. deterministinen arkkitehtuuri.<br>• Miten kehitysmoottori (Osa 1) ja visuaalinen studio (Osa 2) toimivat yhdessä.<br>• Liiketoimintahyödyt, ROI, -70 % token-säästöt ja tiekartta. |
| **02** | [**02-part1-agentic-development-system.md**](./02-part1-agentic-development-system.md) | **Tekninen Raportti: Osa 1 (Moottori)** | CTO, Lead Architect, Kehittäjät | **Kehitysjärjestelmä & Metodologia.**<br>• `.agents/`-arkkitehtuuri ja tilanhallinta.<br>• "Context Rot" -ongelman ratkaisu (`/resume` & `/save`).<br>• 18 taitoa (`.agents/skills/`), CLI ja autonominen laatusykli.<br>• Shift-Left OWASP -tietoturvastandardit. |
| **03** | [**03-part2-agentic-architect-platform.md**](./03-part2-agentic-architect-platform.md) | **Tekninen Raportti: Osa 2 (Tuote)** | CTO, Tuotejohto, Arkkitehdit | **Agentic Architect -tuotealusta.**<br>• 4-tasoinen interaktiivinen React Flow -kangas.<br>• 3 Data Gatea (Prisma Schema, Next.js API, React 19 UI).<br>• Live Workspace Bridge & topologiatietoisuus.<br>• Diff-esikatselu ja turvallinen sandboxed-levykirjoitus. |
| 📁 | [**adr/**](./adr/README.md) | **Arkkitehtuuripäätökset (ADR)** | Arkkitehdit & Insinöörit | Formalisoidut teknologiavalinnat ja perustelut (esim. Next.js 16, React 19, Prisma v7). |

---

## 🎯 Lukusuositus Roolin Mukaan

### 👔 Johdolle, Asiakkaalle & Päättäjille (Executive & Business)
1. Aloita ja lue [**01-master-brief-agentic-suite.md**](./01-master-brief-agentic-suite.md). Se antaa täydellisen 10 minuutin tiivistelmän tuotteen strategiasta, ROI:sta ja liiketoiminta-arvosta.

### 🏛️ Ohjelmistoarkkitehdeille & Tiiminvetäjille (Architects & Leads)
1. Lue [**01-master-brief-agentic-suite.md**](./01-master-brief-agentic-suite.md) saadaksesi kokonaiskuvan kahden pilarin symbioosista.
2. Siirry dokumenttiin [**02-part1-agentic-development-system.md**](./02-part1-agentic-development-system.md) tutustuaksesi kehitysjärjestelmän arkkitehtuuriin ja muistiprotokollaan.
3. Katselmoi tuotearkkitehtuuri dokumentista [**03-part2-agentic-architect-platform.md**](./03-part2-agentic-architect-platform.md) sekä arkkitehtuuripäätökset kansiosta [**adr/**](./adr/README.md).

### 💻 Koodaajille & Tietoturva-auditoijille (Engineers & SecOps)
1. Lue [**02-part1-agentic-development-system.md**](./02-part1-agentic-development-system.md) (työkalut, testikattavuus ja laatuportit).
2. Tutki [**03-part2-agentic-architect-platform.md**](./03-part2-agentic-architect-platform.md) (kankaan koodirakenne, Zod-skeemat ja levykirjoitus).
3. Tarkista tekniset toteutussäännöt ja agenttikomennot juuren [README.md](../README.md) -tiedostosta.

---

> 💡 *Vinkki: Paikallisen kehitysympäristön pystytysohjeet ja pika-aloitus löytyvät projektin juuren [README.md](../README.md) -tiedostosta.*
