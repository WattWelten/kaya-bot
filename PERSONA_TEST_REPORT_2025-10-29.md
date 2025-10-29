# Persona-Test-Report
**Datum:** 29.10.2025
**Getestete Personas:** 35
**Gesamte Queries:** 105
**Erfolgsrate:** 88.6%

---

## Ergebnisse pro Persona

### senior (2/3 = 67%)
- ✅ "Ich bin Rentner und brauche Hilfe bei der Rente"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ❌ "Als Senior finde ich es schwer, das Amtsdeutsch zu..."
  - Erkannt als: pensioner
- ✅ "Ich bin alt und brauche Unterstützung"
  - Agent: kaya, Confidence: 22%, Sprache: german

### youth (3/3 = 100%)
- ✅ "Ich bin Schüler und suche einen Praktikumsplatz"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Als Jugendlicher brauche ich Hilfe bei der Ausbild..."
  - Agent: kaya, Confidence: 28%, Sprache: german
- ✅ "Ich bin jugendlich und interessiere mich für Jobs"
  - Agent: stellenportal, Confidence: 13%, Sprache: german

### family (2/3 = 67%)
- ✅ "Wir haben Kinder und brauchen Unterstützung"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Als Familie mit Baby brauchen wir Hilfe"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ❌ "Ich bin alleinerziehend mit meinem Kind"
  - Erkannt als: child

### migrant (2/3 = 67%)
- ✅ "Ich bin Flüchtling und brauche Hilfe bei der Integ..."
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Als Ausländer suche ich einen Sprachkurs"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ❌ "Ich möchte Deutsch lernen"
  - Erkannt als: low_education

### disabled (2/3 = 67%)
- ❌ "Ich bin behindert und brauche barrierefreie Zugäng..."
  - Erkannt als: mobility_needs
- ✅ "Als Rollstuhlfahrer benötige ich Hilfe"
  - Agent: kaya, Confidence: 13%, Sprache: german
- ✅ "Ich brauche Assistenz aufgrund meiner Behinderung"
  - Agent: kaya, Confidence: 22%, Sprache: german

### farmer (2/3 = 67%)
- ✅ "Ich bin Landwirt und habe Fragen zur Landwirtschaf..."
  - Agent: kaya, Confidence: 13%, Sprache: german
- ✅ "Als Bauer brauche ich Informationen zum Hof"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ❌ "Ich interessiere mich für Agrarthemen"
  - Erkannt als: event_tourist

### craftsman (3/3 = 100%)
- ✅ "Ich bin Handwerker und suche eine Meisterprüfung"
  - Agent: kaya, Confidence: 28%, Sprache: german
- ✅ "Als Handwerker brauche ich Hilfe bei der Ausbildun..."
  - Agent: kaya, Confidence: 28%, Sprache: german
- ✅ "Ich habe Fragen zur Handwerkskammer"
  - Agent: kaya, Confidence: 7%, Sprache: german

### student (3/3 = 100%)
- ✅ "Ich bin Student und brauche BAföG-Informationen"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Als Student suche ich ein Stipendium"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Ich studiere und habe Fragen zur Universität"
  - Agent: kaya, Confidence: 7%, Sprache: german

### unemployed (3/3 = 100%)
- ✅ "Ich bin arbeitslos und brauche Hilfe vom Jobcenter"
  - Agent: stellenportal, Confidence: 22%, Sprache: german
- ✅ "Als Arbeitsloser suche ich eine Bewerbung"
  - Agent: stellenportal, Confidence: 22%, Sprache: german
- ✅ "Ich brauche Unterstützung bei der Arbeitssuche"
  - Agent: kaya, Confidence: 23%, Sprache: german

### pensioner (3/3 = 100%)
- ✅ "Ich bin Pensionär und habe Fragen zur Rente"
  - Agent: kaya, Confidence: 13%, Sprache: german
- ✅ "Als Pensionär brauche ich Unterstützung im Ruhesta..."
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Ich bin im Ruhestand und brauche Hilfe"
  - Agent: kaya, Confidence: 15%, Sprache: german

### single_parent (3/3 = 100%)
- ✅ "Ich bin alleinerziehend und brauche Hilfe"
  - Agent: kaya, Confidence: 15%, Sprache: german
- ✅ "Als alleinerziehender Vater brauche ich Unterstütz..."
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Ich bin alleinerziehende Mutter mit meinem Kind"
  - Agent: kaya, Confidence: 13%, Sprache: german

### small_business (3/3 = 100%)
- ✅ "Ich bin Kleinunternehmer und habe Fragen zum Gewer..."
  - Agent: kaya, Confidence: 13%, Sprache: german
- ✅ "Als Selbständiger brauche ich Hilfe"
  - Agent: kaya, Confidence: 15%, Sprache: german
- ✅ "Ich habe eine Firma und brauche Informationen"
  - Agent: kaya, Confidence: 15%, Sprache: german

### child (3/3 = 100%)
- ✅ "Ich bin ein Kind und habe Fragen"
  - Agent: kaya, Confidence: 7%, Sprache: german
- ✅ "Als Schüler möchte ich spielen"
  - Agent: kaya, Confidence: 28%, Sprache: german
- ✅ "Ich bin jung und brauche Hilfe für die Schule"
  - Agent: kaya, Confidence: 15%, Sprache: german

### commuter (2/3 = 67%)
- ✅ "Ich bin Pendler und brauche Informationen zum Zug"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Als Pendler suche ich eine Fahrkarte"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ❌ "Ich pendle täglich mit dem Bus"
  - Erkannt als: mobility_needs

### housing_seeker (3/3 = 100%)
- ✅ "Ich suche eine Wohnung und brauche Hilfe"
  - Agent: kaya, Confidence: 23%, Sprache: german
- ✅ "Als Wohnungssuchender brauche ich Unterstützung"
  - Agent: kaya, Confidence: 30%, Sprache: german
- ✅ "Ich möchte eine Mietwohnung finden"
  - Agent: kaya, Confidence: 15%, Sprache: german

### care_dependent (3/3 = 100%)
- ✅ "Ich bin pflegebedürftig und brauche Unterstützung"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Als Pflegebedürftiger brauche ich Betreuung"
  - Agent: kaya, Confidence: 28%, Sprache: german
- ✅ "Ich benötige Hilfe in einem Pflegeheim"
  - Agent: kaya, Confidence: 13%, Sprache: german

### low_income (3/3 = 100%)
- ✅ "Ich bin arm und brauche Sozialhilfe"
  - Agent: kaya, Confidence: 15%, Sprache: german
- ✅ "Als Geringverdiener brauche ich Grundsicherung"
  - Agent: kaya, Confidence: 15%, Sprache: german
- ✅ "Ich habe finanzielle Probleme und brauche Hilfe"
  - Agent: kaya, Confidence: 15%, Sprache: german

### sports_interested (3/3 = 100%)
- ✅ "Ich interessiere mich für Sport und suche einen Ve..."
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Als Sportler brauche ich ein Training"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Ich möchte Fitness-Angebote finden"
  - Agent: kaya, Confidence: 15%, Sprache: german

### culture_interested (2/3 = 67%)
- ✅ "Ich interessiere mich für Kultur und suche ein Mus..."
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Als Kulturliebhaber möchte ich ins Theater"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ❌ "Ich besuche gerne Konzerte und Veranstaltungen"
  - Erkannt als: event_tourist

### plattdeutsch_speaker (3/3 = 100%)
- ✅ "Moin, ik snak Platt"
  - Agent: kaya, Confidence: 7%, Sprache: german
- ✅ "Ik bruuk Hülp in plattdeutsch"
  - Agent: kaya, Confidence: 13%, Sprache: german
- ✅ "Wohr kann ik wat niederdeutsch lern'n?"
  - Agent: kaya, Confidence: 7%, Sprache: german

### low_education (3/3 = 100%)
- ✅ "Ich kann nicht gut lesen und schreiben"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Als Person mit niedriger Bildung brauche ich einfa..."
  - Agent: kaya, Confidence: 15%, Sprache: german
- ✅ "Ich möchte einen Kurs zum Lernen finden"
  - Agent: kaya, Confidence: 22%, Sprache: german

### mobility_needs (3/3 = 100%)
- ✅ "Ich brauche Mobilität und Transport"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Als mobilitätseingeschränkte Person brauche ich ei..."
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Ich benötige Hilfe mit Auto, Bus oder Zug"
  - Agent: kaya, Confidence: 20%, Sprache: german

### tourist (1/3 = 33%)
- ❌ "Ich bin Tourist und möchte Informationen"
  - Erkannt als: sightseeing_tourist
- ❌ "Als Besucher suche ich Sehenswürdigkeiten"
  - Erkannt als: sightseeing_tourist
- ✅ "Ich bin Gast und mache Urlaub hier"
  - Agent: kaya, Confidence: 13%, Sprache: german

### camper (3/3 = 100%)
- ✅ "Ich bin Camper und suche einen Campingplatz"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Als Camper brauche ich einen Platz für mein Zelt"
  - Agent: kaya, Confidence: 15%, Sprache: german
- ✅ "Ich reise mit dem Wohnmobil und brauche Hilfe"
  - Agent: kaya, Confidence: 15%, Sprache: german

### accommodation_seeker (2/3 = 67%)
- ✅ "Ich suche eine Unterkunft für meinen Urlaub"
  - Agent: kaya, Confidence: 15%, Sprache: german
- ❌ "Als Tourist brauche ich ein Hotel"
  - Erkannt als: sightseeing_tourist
- ✅ "Ich suche eine Pension oder Ferienwohnung"
  - Agent: kaya, Confidence: 22%, Sprache: german

### unemployed_longterm (2/3 = 67%)
- ✅ "Ich bin seit Jahren arbeitslos"
  - Agent: kaya, Confidence: 7%, Sprache: german
- ✅ "Als Langzeitarbeitsloser brauche ich Hilfe"
  - Agent: kaya, Confidence: 15%, Sprache: german
- ❌ "Ich habe seit langem keinen Job mehr"
  - Erkannt als: youth

### entrepreneur (3/3 = 100%)
- ✅ "Ich bin Gründer und starte ein Unternehmen"
  - Agent: kaya, Confidence: 7%, Sprache: german
- ✅ "Als Startup-Gründer brauche ich Hilfe"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Ich möchte eine Existenzgründung machen"
  - Agent: kaya, Confidence: 15%, Sprache: german

### political_interested (3/3 = 100%)
- ✅ "Ich interessiere mich für Politik und den Kreistag"
  - Agent: ratsinfo, Confidence: 13%, Sprache: german
- ✅ "Als politisch Interessierter suche ich Information..."
  - Agent: kaya, Confidence: 15%, Sprache: german
- ✅ "Ich möchte etwas über Gremien und Sitzungen erfahr..."
  - Agent: ratsinfo, Confidence: 15%, Sprache: german

### sightseeing_tourist (3/3 = 100%)
- ✅ "Ich bin Tourist und suche Sehenswürdigkeiten"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Als Besucher möchte ich Attraktionen besichtigen"
  - Agent: aktionen_veranstaltungen, Confidence: 30%, Sprache: german
- ✅ "Ich mache eine Tour durch die Region"
  - Agent: kaya, Confidence: 7%, Sprache: german

### active_tourist (3/3 = 100%)
- ✅ "Ich bin aktiver Tourist und möchte wandern"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Als Aktiver suche ich Radwege"
  - Agent: kaya, Confidence: 15%, Sprache: german
- ✅ "Ich interessiere mich für Sport und Bewegung im Ur..."
  - Agent: kaya, Confidence: 13%, Sprache: german

### family_tourist (2/3 = 67%)
- ✅ "Wir machen einen Familienurlaub mit Kindern"
  - Agent: kaya, Confidence: 20%, Sprache: german
- ❌ "Als Familie suche ich Aktivitäten für Kinder"
  - Erkannt als: family
- ✅ "Ich brauche einen Spielplatz für meine Kinder"
  - Agent: kaya, Confidence: 22%, Sprache: german

### wellness_tourist (3/3 = 100%)
- ✅ "Ich suche Wellness und Entspannung"
  - Agent: kaya, Confidence: 28%, Sprache: german
- ✅ "Als Wellness-Tourist möchte ich ins Spa"
  - Agent: kaya, Confidence: 22%, Sprache: german
- ✅ "Ich brauche eine Massage"
  - Agent: kaya, Confidence: 15%, Sprache: german

### culinary_tourist (3/3 = 100%)
- ✅ "Ich interessiere mich für kulinarische Angebote"
  - Agent: kaya, Confidence: 7%, Sprache: german
- ✅ "Als Feinschmecker suche ich Restaurants"
  - Agent: kaya, Confidence: 15%, Sprache: german
- ✅ "Ich möchte die lokale Küche probieren"
  - Agent: kaya, Confidence: 23%, Sprache: german

### shopping_tourist (3/3 = 100%)
- ✅ "Ich bin Tourist und möchte einkaufen"
  - Agent: kaya, Confidence: 15%, Sprache: german
- ✅ "Als Besucher suche ich Shopping-Möglichkeiten"
  - Agent: kaya, Confidence: 15%, Sprache: german
- ✅ "Ich interessiere mich für Märkte und Geschäfte"
  - Agent: kaya, Confidence: 7%, Sprache: german

### event_tourist (3/3 = 100%)
- ✅ "Ich suche Veranstaltungen und Events"
  - Agent: aktionen_veranstaltungen, Confidence: 22%, Sprache: german
- ✅ "Als Tourist möchte ich Feste besuchen"
  - Agent: kaya, Confidence: 23%, Sprache: german
- ✅ "Ich interessiere mich für Konzerte"
  - Agent: kaya, Confidence: 7%, Sprache: german
