# Intensiver Persona- und Agent-Test - Report 2025-10-29

**Datum:** 2025-10-29T12:06:58.901Z
**Status:** ✅ Test abgeschlossen

---

## Zusammenfassung

| Metrik | Wert |
|--------|------|
| Gesamt-Tests | 69 |
| Erfolgreiche Routings | 69 (100%) |
| Fehlgeschlagene Routings | 0 |
| Durchschnittliche Response-Zeit | 2ms |
| Min Response-Zeit | 1ms |
| Max Response-Zeit | 13ms |

## Agent-Verteilung

| Agent | Anzahl |
|-------|--------|
| buergerdienste | 16 |
| politik_landkreis | 10 |
| rechnung_ebilling | 9 |
| jugend | 6 |
| stellenportal | 5 |
| soziales | 5 |
| aktionen_veranstaltungen | 4 |
| ratsinfo | 3 |
| kontakte | 3 |
| jobcenter | 2 |
| senioren | 2 |
| inklusion | 2 |
| digitalisierung | 1 |
| gleichstellung | 1 |

## Persona-Verteilung

| Persona | Anzahl |
|---------|--------|
| general | 17 |
| political_interested | 7 |
| unemployed | 5 |
| entrepreneur | 4 |
| small_business | 4 |
| migrant | 4 |
| senior | 3 |
| housing_seeker | 3 |
| commuter | 2 |
| student | 2 |
| youth | 2 |
| family | 2 |
| single_parent | 2 |
| low_income | 2 |
| tourist | 2 |
| culture_interested | 2 |
| unemployed_longterm | 1 |
| pensioner | 1 |
| disabled | 1 |
| disabled_worker | 1 |
| plattdeutsch_speaker | 1 |
| low_education | 1 |

## Fokus-Ergebnisse: Landrat / politik_landkreis

| Query | Persona | Erwartet | Tatsächlich | Erfolg |
|-------|---------|----------|-------------|--------|
| Wer ist der Landrat? | political_interested | politik_landkreis | politik_landkreis | ✅ |
| Wer ist der Landrat? | general | politik_landkreis | politik_landkreis | ✅ |
| Wer ist der Landrat? | senior | politik_landkreis | politik_landkreis | ✅ |
| Dr. Christian Pundt | political_interested | politik_landkreis | politik_landkreis | ✅ |
| Dr. Christian Pundt | general | politik_landkreis | politik_landkreis | ✅ |
| Kreistagsmitglieder | political_interested | politik_landkreis | politik_landkreis | ✅ |
| Kreistagsmitglieder | general | politik_landkreis | politik_landkreis | ✅ |
| Kreisorgane | political_interested | politik_landkreis | politik_landkreis | ✅ |
| Landrat Kontakt | general | politik_landkreis | politik_landkreis | ✅ |
| Politik im Landkreis | political_interested | politik_landkreis | politik_landkreis | ✅ |

## Fokus-Ergebnisse: XRechnung / rechnung_ebilling

| Query | Persona | Erwartet | Tatsächlich | Erfolg |
|-------|---------|----------|-------------|--------|
| XRechnung senden | entrepreneur | rechnung_ebilling | rechnung_ebilling | ✅ |
| XRechnung senden | small_business | rechnung_ebilling | rechnung_ebilling | ✅ |
| XRechnung senden | general | rechnung_ebilling | rechnung_ebilling | ✅ |
| E-Rechnung Landkreis Oldenburg | entrepreneur | rechnung_ebilling | rechnung_ebilling | ✅ |
| E-Rechnung Landkreis Oldenburg | small_business | rechnung_ebilling | rechnung_ebilling | ✅ |
| Leitweg-ID 03458-0-051 | small_business | rechnung_ebilling | rechnung_ebilling | ✅ |
| Leitweg-ID 03458-0-051 | general | rechnung_ebilling | rechnung_ebilling | ✅ |
| eBilling | entrepreneur | rechnung_ebilling | rechnung_ebilling | ✅ |
| XRechnung | general | rechnung_ebilling | rechnung_ebilling | ✅ |

## Detaillierte Ergebnisse pro Agent

### aktionen_veranstaltungen (4/4 erfolgreich, 100.0%)

| Query | Persona | Tatsächlich | Erfolg | Response-Zeit |
|-------|---------|-------------|--------|----------------|
| Aktion Saubere Landschaft | tourist | aktionen_veranstaltungen | ✅ | 3ms |
| Aktion Saubere Landschaft | culture_interested | aktionen_veranstaltungen | ✅ | 2ms |
| Veranstaltungen | tourist | aktionen_veranstaltungen | ✅ | 2ms |
| Veranstaltungen | culture_interested | aktionen_veranstaltungen | ✅ | 2ms |

### buergerdienste (16/16 erfolgreich, 100.0%)

| Query | Persona | Tatsächlich | Erfolg | Response-Zeit |
|-------|---------|-------------|--------|----------------|
| KFZ anmelden | general | buergerdienste | ✅ | 3ms |
| KFZ anmelden | migrant | buergerdienste | ✅ | 1ms |
| KFZ anmelden | commuter | buergerdienste | ✅ | 3ms |
| Personalausweis beantragen | general | buergerdienste | ✅ | 2ms |
| Personalausweis beantragen | migrant | buergerdienste | ✅ | 3ms |
| Personalausweis beantragen | housing_seeker | buergerdienste | ✅ | 3ms |
| Gewerbe anmelden | entrepreneur | buergerdienste | ✅ | 3ms |
| Gewerbe anmelden | small_business | buergerdienste | ✅ | 2ms |
| Ordnungsamt | general | buergerdienste | ✅ | 2ms |
| Bauantrag stellen | general | buergerdienste | ✅ | 2ms |
| ... | ... | ... | ... | ... |

### digitalisierung (1/1 erfolgreich, 100.0%)

| Query | Persona | Tatsächlich | Erfolg | Response-Zeit |
|-------|---------|-------------|--------|----------------|
| Digitalisierung | general | digitalisierung | ✅ | 2ms |

### gleichstellung (1/1 erfolgreich, 100.0%)

| Query | Persona | Tatsächlich | Erfolg | Response-Zeit |
|-------|---------|-------------|--------|----------------|
| Gleichstellung | general | gleichstellung | ✅ | 2ms |

### inklusion (2/2 erfolgreich, 100.0%)

| Query | Persona | Tatsächlich | Erfolg | Response-Zeit |
|-------|---------|-------------|--------|----------------|
| Inklusion | disabled | inklusion | ✅ | 1ms |
| Inklusion | disabled_worker | inklusion | ✅ | 2ms |

### jobcenter (2/2 erfolgreich, 100.0%)

| Query | Persona | Tatsächlich | Erfolg | Response-Zeit |
|-------|---------|-------------|--------|----------------|
| Arbeitslosengeld | unemployed | jobcenter | ✅ | 3ms |
| Arbeitslosengeld | unemployed_longterm | jobcenter | ✅ | 2ms |

### jugend (6/6 erfolgreich, 100.0%)

| Query | Persona | Tatsächlich | Erfolg | Response-Zeit |
|-------|---------|-------------|--------|----------------|
| Jugendamt | youth | jugend | ✅ | 1ms |
| Jugendamt | family | jugend | ✅ | 2ms |
| Jugendamt | single_parent | jugend | ✅ | 2ms |
| Kindergeld | family | jugend | ✅ | 1ms |
| Kindergeld | single_parent | jugend | ✅ | 1ms |
| Jugendliche | youth | jugend | ✅ | 1ms |

### kontakte (3/3 erfolgreich, 100.0%)

| Query | Persona | Tatsächlich | Erfolg | Response-Zeit |
|-------|---------|-------------|--------|----------------|
| Kontakt Landkreis | general | kontakte | ✅ | 2ms |
| Kontakt Landkreis | migrant | kontakte | ✅ | 2ms |
| Telefonnummer | general | kontakte | ✅ | 2ms |

### politik_landkreis (10/10 erfolgreich, 100.0%)

| Query | Persona | Tatsächlich | Erfolg | Response-Zeit |
|-------|---------|-------------|--------|----------------|
| Wer ist der Landrat? | political_interested | politik_landkreis | ✅ | 13ms |
| Wer ist der Landrat? | general | politik_landkreis | ✅ | 4ms |
| Wer ist der Landrat? | senior | politik_landkreis | ✅ | 3ms |
| Dr. Christian Pundt | political_interested | politik_landkreis | ✅ | 3ms |
| Dr. Christian Pundt | general | politik_landkreis | ✅ | 3ms |
| Kreistagsmitglieder | political_interested | politik_landkreis | ✅ | 2ms |
| Kreistagsmitglieder | general | politik_landkreis | ✅ | 2ms |
| Kreisorgane | political_interested | politik_landkreis | ✅ | 1ms |
| Landrat Kontakt | general | politik_landkreis | ✅ | 2ms |
| Politik im Landkreis | political_interested | politik_landkreis | ✅ | 2ms |

### ratsinfo (3/3 erfolgreich, 100.0%)

| Query | Persona | Tatsächlich | Erfolg | Response-Zeit |
|-------|---------|-------------|--------|----------------|
| Kreistagssitzung | political_interested | ratsinfo | ✅ | 1ms |
| Kreistagssitzung | general | ratsinfo | ✅ | 1ms |
| Tagesordnung | political_interested | ratsinfo | ✅ | 1ms |

### rechnung_ebilling (9/9 erfolgreich, 100.0%)

| Query | Persona | Tatsächlich | Erfolg | Response-Zeit |
|-------|---------|-------------|--------|----------------|
| XRechnung senden | entrepreneur | rechnung_ebilling | ✅ | 2ms |
| XRechnung senden | small_business | rechnung_ebilling | ✅ | 2ms |
| XRechnung senden | general | rechnung_ebilling | ✅ | 2ms |
| E-Rechnung Landkreis Oldenburg | entrepreneur | rechnung_ebilling | ✅ | 3ms |
| E-Rechnung Landkreis Oldenburg | small_business | rechnung_ebilling | ✅ | 3ms |
| Leitweg-ID 03458-0-051 | small_business | rechnung_ebilling | ✅ | 2ms |
| Leitweg-ID 03458-0-051 | general | rechnung_ebilling | ✅ | 3ms |
| eBilling | entrepreneur | rechnung_ebilling | ✅ | 1ms |
| XRechnung | general | rechnung_ebilling | ✅ | 1ms |

### senioren (2/2 erfolgreich, 100.0%)

| Query | Persona | Tatsächlich | Erfolg | Response-Zeit |
|-------|---------|-------------|--------|----------------|
| Seniorenbetreuung | senior | senioren | ✅ | 2ms |
| Seniorenbetreuung | pensioner | senioren | ✅ | 2ms |

### soziales (5/5 erfolgreich, 100.0%)

| Query | Persona | Tatsächlich | Erfolg | Response-Zeit |
|-------|---------|-------------|--------|----------------|
| Sozialhilfe | unemployed | soziales | ✅ | 1ms |
| Sozialhilfe | low_income | soziales | ✅ | 2ms |
| Sozialhilfe | senior | soziales | ✅ | 1ms |
| Bürgergeld | unemployed | soziales | ✅ | 1ms |
| Bürgergeld | low_income | soziales | ✅ | 2ms |

### stellenportal (5/5 erfolgreich, 100.0%)

| Query | Persona | Tatsächlich | Erfolg | Response-Zeit |
|-------|---------|-------------|--------|----------------|
| Stellenangebote | unemployed | stellenportal | ✅ | 2ms |
| Stellenangebote | student | stellenportal | ✅ | 2ms |
| Stellenangebote | general | stellenportal | ✅ | 2ms |
| Bewerbung | unemployed | stellenportal | ✅ | 2ms |
| Bewerbung | student | stellenportal | ✅ | 2ms |

## Empfehlungen

✅ **Alle Erfolgskriterien erfüllt!**

---

**Report erstellt:** 2025-10-29T12:06:58.902Z
