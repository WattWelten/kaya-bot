# KAYA Agent & Persona Analysis

**Datum:** 26. Oktober 2025  
**Version:** v1.0.0 Production Review

---

## Aktuell verfügbare Agenten (8)

### Implementiert in kaya_character_handler_v2.js:
1. ✅ **buergerdienste** - Bürgerdienste & Dokumente
2. ✅ **kfz_zulassung** - KFZ-Zulassung
3. ✅ **führerschein** - Führerschein
4. ✅ **bauantrag** - Bauanträge
5. ✅ **gewerbe** - Gewerbe
6. ✅ **soziales** - Soziale Dienste
7. ✅ **kreistag** - Kreistag & Politik
8. ✅ **general** - Allgemeine Anfragen

---

## Aus Crawler-Daten analysiert (crawler-v2/PHASE_0_COMPLETE.md):

### Bereits gecrawlt (270 Seiten):
- **Bürgerdienste:** 89 Einträge ✅
- **Ratsinfo:** 28 Einträge ✅
- **Stellenportal:** 2 Einträge ✅
- **Kontakte:** 4 Einträge ✅
- **Jugend:** 60 Einträge ⚠️ (kein Agent!)
- **Soziales:** 48 Einträge ✅

### Website-Kategorien (oldenburg-kreis.de):
- ✅ landkreis-und-verwaltung: 71 Seiten
- ⚠️ **jugend-und-familie: 57 Seiten** (KEIN AGENT!)
- ⚠️ **gesundheit-und-soziales: 51 Seiten** (TEIL-AGENT!)
- ⚠️ **bildung-und-kultur: 46 Seiten** (KEIN AGENT!)
- ⚠️ **ordnung-und-verkehr: 45 Seiten** (nur KFZ/Führerschein)
- ⚠️ **wirtschaft-und-arbeit: 18 Seiten** (TEIL-AGENT!)
- ⚠️ **planen-und-bauen: 9 Seiten** (nur Bauantrag)

---

## FEHLENDE AGENTEN (Basierend auf Crawler-Daten):

### Kritisch wichtig (hohe Seitenanzahl):
1. ❌ **jugend** - Jugend & Familie (57 Seiten)
2. ❌ **bildung** - Bildung & Kultur (46 Seiten)
3. ❌ **verkehr** - Ordnung & Verkehr (45 Seiten, nur KFZ vorhanden)
4. ❌ **gesundheit** - Gesundheit & Soziales (51 Seiten)
5. ❌ **wirtschaft** - Wirtschaft & Arbeit (18 Seiten)

### Weitere wichtige Lücken:
6. ❌ **tierhaltung** - Veterinäramt & Tierhaltung
7. ❌ **wahlen** - Wahlen & Demokratie
8. ❌ **kultur** - Kultur & Tourismus
9. ❌ **umwelt** - Umwelt & Abfall
10. ❌ **katastrophenschutz** - Brand & Katastrophenschutz

---

## ZIELGRUPPEN-ANALYSE (Basierend auf Crawler-Daten)

### Bürger (Allgemein):
- ✅ Umzug & Anmeldung
- ✅ Personalausweis & Reisepass
- ❌ Wahlen (FELHLT!)
- ❌ Kultur & Veranstaltungen

### Familien:
- ⚠️ Jugend & Familie (partiell)
- ❌ Kindergärten & Schulen (FELHLT!)
- ❌ Elterngeld & Kindergeld
- ❌ Jugendarbeit & Freizeit

### Wirtschaft:
- ⚠️ Gewerbe (vorhanden)
- ❌ Wirtschaftsförderung (FELHLT!)
- ❌ EU-Anträge für Landwirte
- ❌ Schwarzarbeitsbekämpfung

### Landwirte:
- ✅ Landwirtschaft (vorhanden)
- ❌ Tierhaltung & Veterinär (FELHLT!)
- ❌ EU-Agrarförderung

### Handwerker:
- ⚠️ Handwerk (vorhanden)
- ❌ Meisterprüfung & Kammer (FEHLT!)

### Studenten:
- ✅ Studium & BAföG (vorhanden)
- ❌ Hochschulen & Semesterticket (FEHLT!)

### Senioren:
- ❌ Pflege & Betreuung (FEHLT!)
- ❌ Rente & Altersvorsorge

### Geflüchtete:
- ❌ Asyl & Aufenthalt (FEHLT!)
- ❌ Integration & Sprachkurse

### Touristen:
- ✅ Tourismus (vorhanden)
- ❌ Kultur & Plattdeutsch (FEHLT!)

---

## EMPFOHLENE NEUE AGENTEN (Priorität Hoch):

### 1. jugend - Jugend & Familie (57 Seiten!)
```
Keywords: ['jugend', 'jugendamt', 'kindergarten', 'kita', 'kind', 'kindergeld', 
           'elterngeld', 'jugendhilfe', 'erziehung', 'betreuung', 'jugendzentrum',
           'schulsozialarbeit', 'jugendpsychologie']
```

### 2. bildung - Bildung & Kultur (46 Seiten!)
```
Keywords: ['schule', 'schulamt', 'grundschule', 'gymnasium', 'realschule',
           'anmeldung schule', 'schuleingangsuntersuchung', 'kultur', 'kulturzentrum',
           'bibliothek', 'plattdeutsch', 'volkskultur', 'musikschule']
```

### 3. gesundheit - Gesundheit & Soziales (erweitern!)
```
Keywords: ['gesundheit', 'gesundheitsamt', 'impfung', 'impfpass', 'impfstelle',
           'seuchenbekämpfung', 'umwelthygiene', 'psychiatrie', 'sport',
           'sportstaette', 'wellness', 'praevention']
```

### 4. verkehr - Ordnung & Verkehr (erweitern!)
```
Keywords: ['verkehr', 'straße', 'radweg', 'verkehrssicherheit', 'parkplatz',
           'strafzettel', 'gehweg', 'busverkehr', 'oeffentlicher_nahverkehr',
           'buslinie', 'fahrplan', 'nordwestbahn']
```

### 5. umwelt - Umwelt & Abfall (neu!)
```
Keywords: ['umwelt', 'umweltschutz', 'abfall', 'müll', 'bio', 'papiertonne',
           'wertstoffhof', 'recycling', 'kompost', 'sperrmüll', 'altlasten',
           'naturschutz', 'landschaftsschutz', 'bundesstrasse', 'wasser',
           'kanalisation', 'grundwasser', 'wasserrecht']
```

### 6. tierhaltung - Veterinäramt & Tierhaltung
```
Keywords: ['tier', 'tierhaltung', 'hund', 'katze', 'veterinär', 'tierarzt',
           'tierheim', 'hundehaltung', 'leinenpflicht', 'hundesteuer', 'tierschutz']
```

### 7. wahlen - Wahlen & Demokratie
```
Keywords: ['wahl', 'wahlen', 'kreistag', 'kommunalwahl', 'bundestagswahl',
           'europawahl', 'wahltermin', 'wahlbeteiligung', 'wahlvorstand', 'wahlbenachrichtigung']
```

### 8. katastrophenschutz - Brand & Katastrophenschutz
```
Keywords: ['notfall', 'katastrophenschutz', 'brand', 'feuerwehr', 'rettungsdienst',
           'notruf', 'evakuierung', 'alarm', 'warnung', 'sirene']
```

### 9. pflege - Pflege & Betreuung
```
Keywords: ['pflege', 'pflegedienst', 'betreuung', 'ambulante_pflege', 'stationäre_pflege',
           'pflegeheim', 'pflegekraft', 'pflegevereinbarung']
```

### 10. asyl - Asyl & Aufenthalt
```
Keywords: ['asyl', 'flüchtling', 'aufenthalt', 'duldung', 'integration', 'sprachkurs',
           'aufenthaltsrecht', 'eingliederung', 'flüchtlingshilfe', 'migration']
```

---

## ERWEITERUNG der bestehenden Agenten:

### kfz_zulassung (erweitern):
- ✅ Zulassung & Kennzeichen
- ❌ Verkehrsstrafen & Bußgelder (FEHLT!)
- ❌ Parkgebühren & Parkplatz (FEHLT!)
- ❌ Fahrzeugsteuer (FEHLT!)

### soziales (erweitern):
- ✅ Sozialhilfe & Grundsicherung
- ✅ Wohngeld
- ❌ Pflegegeld (FEHLT!)
- ❌ Eingliederungshilfe (FEHLT!)

### bauantrag (erweitern):
- ✅ Bauantrag
- ❌ Baugrundstück (FEHLT!)
- ❌ Bauvorschriften (FEHLT!)
- ❌ Denkmalschutz (FEHLT!)

---

## ZUSAMMENFASSUNG:

### Fehlende Agenten (10):
1. jugend - Jugend & Familie
2. bildung - Bildung & Kultur
3. verkehr - Ordnung & Verkehr (erweitert)
4. umwelt - Umwelt & Abfall
5. tierhaltung - Veterinäramt
6. wahlen - Wahlen & Demokratie
7. katastrophenschutz - Brand & Katastrophenschutz
8. pflege - Pflege & Betreuung
9. asyl - Asyl & Aufenthalt
10. gesundheit - Gesundheitsamt (erweitert)

### Zu erweitern (3):
1. kfz_zulassung → verkehr (umfassend)
2. soziales → gesundheit (ergänzen)
3. bauantrag → planen_und_bauen (erweitern)

---

## NÄCHSTE SCHRITTE:

1. **Agenten 1-5 priorisieren** (Jugend, Bildung, Verkehr, Umwelt, Gesundheit)
2. **Keywords für jeden Agenten definieren**
3. **Response-Templates erstellen**
4. **Crawler-Daten nutzen** (bereits vorhanden!)
5. **In Character Handler integrieren**

