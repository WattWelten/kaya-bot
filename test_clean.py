#!/usr/bin/env python3
"""
KAYA Test - Neue saubere Struktur D:\Landkreis
"""

import asyncio
import aiohttp
import json

async def test_kaya_clean():
    """Teste KAYA mit neuer sauberer Struktur"""
    
    async with aiohttp.ClientSession() as session:
        print("=== KAYA TEST - NEUE SAUBERE STRUKTUR ===")
        print("Verzeichnis: D:\\Landkreis\\server")
        print()
        
        # Test-Nachrichten
        test_messages = [
            "Moin KAYA!",
            "Ich brauche ein Formular für Bauantrag",
            "Wann ist die nächste Kreistagssitzung?"
        ]
        
        for i, message in enumerate(test_messages, 1):
            print(f"Test {i}: {message}")
            
            try:
                async with session.post(
                    'http://localhost:3002/chat',
                    json={'message': message},
                    headers={'Content-Type': 'application/json'}
                ) as response:
                    
                    print(f"Status: {response.status}")
                    
                    if response.status == 200:
                        data = await response.json()
                        print(f"Agent: {data.get('agent', 'N/A')}")
                        print(f"KAYA: {data.get('response', 'Keine Antwort')[:150]}...")
                        print()
                    else:
                        error_text = await response.text()
                        print(f"FEHLER HTTP {response.status}: {error_text}")
                        print()
                        
            except Exception as e:
                print(f"VERBINDUNGSFEHLER: {e}")
                print()
        
        print("=== NEUE STRUKTUR ERFOLGREICH ===")

if __name__ == "__main__":
    asyncio.run(test_kaya_clean())
