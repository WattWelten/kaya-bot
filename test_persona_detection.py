#!/usr/bin/env python3
"""
Test der erweiterten Persona-Erkennung von KAYA
"""

import requests
import json

def test_kaya(query):
    """Teste KAYA mit einer Anfrage"""
    try:
        response = requests.post('http://localhost:3002/chat', 
                               json={'message': query},
                               timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return {
                'status': response.status_code,
                'agent': data.get('agent', 'unknown'),
                'response': data.get('response', 'Keine Antwort'),
                'persona': data.get('persona', 'allgemein'),
                'localContext': data.get('localContext', '')
            }
        else:
            return {'status': response.status_code, 'error': 'Server Fehler'}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}

def main():
    print("=== KAYA ERWEITERTE PERSONA-ERKENNUNG TEST ===")
    print()
    
    # Test 1: Familie mit Rechtschreibfehler
    print("Test 1: Ich brauche hilfe für mein kindergarden")
    result1 = test_kaya("Ich brauche hilfe für mein kindergarden")
    print(f"Status: {result1['status']}")
    print(f"Agent: {result1['agent']}")
    print(f"Persona: {result1.get('persona', 'N/A')}")
    print(f"KAYA: {result1['response'][:150]}...")
    print()
    
    # Test 2: Student mit unklarer Anfrage
    print("Test 2: Ich bin neu hier und weiß nicht was ich brauche")
    result2 = test_kaya("Ich bin neu hier und weiß nicht was ich brauche")
    print(f"Status: {result2['status']}")
    print(f"Agent: {result2['agent']}")
    print(f"Persona: {result2.get('persona', 'N/A')}")
    print(f"KAYA: {result2['response'][:150]}...")
    print()
    
    # Test 3: Senioren mit natürlicher Sprache
    print("Test 3: Meine Mutter braucht Hilfe im Alltag")
    result3 = test_kaya("Meine Mutter braucht Hilfe im Alltag")
    print(f"Status: {result3['status']}")
    print(f"Agent: {result3['agent']}")
    print(f"Persona: {result3.get('persona', 'N/A')}")
    print(f"KAYA: {result3['response'][:150]}...")
    print()
    
    # Test 4: Arbeitslose mit Umgangssprache
    print("Test 4: Ich hab meinen Job verloren")
    result4 = test_kaya("Ich hab meinen Job verloren")
    print(f"Status: {result4['status']}")
    print(f"Agent: {result4['agent']}")
    print(f"Persona: {result4.get('persona', 'N/A')}")
    print(f"KAYA: {result4['response'][:150]}...")
    print()
    
    # Test 5: Behinderte mit spezifischem Anliegen
    print("Test 5: Ich bin schwerbehindert und brauche einen Ausweis")
    result5 = test_kaya("Ich bin schwerbehindert und brauche einen Ausweis")
    print(f"Status: {result5['status']}")
    print(f"Agent: {result5['agent']}")
    print(f"Persona: {result5.get('persona', 'N/A')}")
    print(f"KAYA: {result5['response'][:150]}...")
    print()
    
    # Test 6: Migranten mit Sprachbarriere
    print("Test 6: I am foreigner and need help")
    result6 = test_kaya("I am foreigner and need help")
    print(f"Status: {result6['status']}")
    print(f"Agent: {result6['agent']}")
    print(f"Persona: {result6.get('persona', 'N/A')}")
    print(f"KAYA: {result6['response'][:150]}...")
    print()
    
    print("=== PERSONA-ERKENNUNG TEST ABGESCHLOSSEN ===")

if __name__ == "__main__":
    main()
