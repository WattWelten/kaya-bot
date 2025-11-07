/**
 * Kommune-Konfiguration
 * Lädt Kommune-Name aus Environment Variable
 */

export function getKommuneName(): string {
  return import.meta.env.VITE_KOMMUNE_NAME || 'Landkreis Oldenburg';
}

export const kommuneConfig = {
  name: getKommuneName(),
  shortName: import.meta.env.VITE_KOMMUNE_SHORT_NAME || 'KAYA'
};

