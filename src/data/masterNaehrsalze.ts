// In Datei: src/data/masterNaehrsalze.ts
// VOLLSTÄNDIGER CODE

import { INaehrsalz } from "../types";

// Ein 'Master'-Salz hat keine DB-ID, aber ein 'isReadOnly'-Flag
type MasterNaehrsalz = Omit<INaehrsalz, 'id'>;

// Helper, um deine Tabellen-Daten (Strings, Kommas) sicher in Zahlen umzuwandeln
function parseVal(val: string | number): number | undefined {
  if (typeof val === 'number') return val;
  if (val === 'n.a.' || val === '' || val === undefined) return undefined;
  
  // Ersetze Komma mit Punkt
  const num = parseFloat(String(val).replace(',', '.'));
  return isNaN(num) ? undefined : num;
}

// Deine 16 überprüften Einträge im korrekten App-Format
// (P205% -> P2O5_prozent, SiO2% -> SiO_prozent)
export const MASTER_NAEHRSALZE: MasterNaehrsalz[] = [
  {
    "name": "Hakaphos® Basis 5",
    "beschreibung": "",
    "isReadOnly": true,
    "inhaltsstoffe": { "NH4_prozent": parseVal("1"), "NO3_prozent": parseVal("4"), "P2O5_prozent": parseVal("20"), "K2O_prozent": parseVal("30"), "MgO_prozent": parseVal("5"), "SO3_prozent": parseVal("16,3"), "Fe_prozent": parseVal("0,15"), "Mn_prozent": parseVal("0,15"), "Cu_prozent": parseVal("0,06"), "Zn_prozent": parseVal("0,06"), "Mo_prozent": parseVal("0,004"), "B_prozent": parseVal("0,03") }
  },
  {
    "name": "Hakaphos® Basis 2",
    "beschreibung": "",
    "isReadOnly": true,
    "inhaltsstoffe": { "NO3_prozent": parseVal("3"), "P2O5_prozent": parseVal("6"), "K2O_prozent": parseVal("40"), "MgO_prozent": parseVal("4"), "SO3_prozent": parseVal("31,3"), "Fe_prozent": parseVal("0,15"), "Mn_prozent": parseVal("0.05"), "Cu_prozent": parseVal("0.02"), "Zn_prozent": parseVal("0,02"), "Mo_prozent": parseVal("0,001"), "B_prozent": parseVal("0.01") }
  },
  {
    "name": "Hakaphos® Basis 3",
    "beschreibung": "",
    "isReadOnly": true,
    "inhaltsstoffe": { "NO3_prozent": parseVal("3"), "P2O5_prozent": parseVal("15"), "K2O_prozent": parseVal("36"), "MgO_prozent": parseVal("4"), "SO3_prozent": parseVal("22.5"), "Fe_prozent": parseVal("0,2"), "Mn_prozent": parseVal("0.05"), "Cu_prozent": parseVal("0.02"), "Zn_prozent": parseVal("0,02"), "Mo_prozent": parseVal("0,001"), "B_prozent": parseVal("0.01") }
  },
  {
    "name": "Hakaphos® Blau 15-10-15(+2)",
    "beschreibung": "",
    "isReadOnly": true,
    "inhaltsstoffe": { "NH4_prozent": parseVal("11.0"), "NO3_prozent": parseVal("4.0"), "P2O5_prozent": parseVal("10"), "K2O_prozent": parseVal("15"), "MgO_prozent": parseVal("2"), "SO3_prozent": parseVal("30.0"), "Fe_prozent": parseVal("0.05"), "Mn_prozent": parseVal("0.05"), "Cu_prozent": parseVal("0.02"), "Zn_prozent": parseVal("0.02"), "Mo_prozent": parseVal("0,001"), "B_prozent": parseVal("0.01") }
  },
  {
    "name": "Hakaphos® Rot 8-12-24(+4)",
    "beschreibung": "",
    "isReadOnly": true,
    "inhaltsstoffe": { "NH4_prozent": parseVal("5"), "NO3_prozent": parseVal("3"), "P2O5_prozent": parseVal("12"), "K2O_prozent": parseVal("24"), "MgO_prozent": parseVal("4"), "SO3_prozent": parseVal("31"), "Fe_prozent": parseVal("0.05"), "Mn_prozent": parseVal("0.05"), "Cu_prozent": parseVal("0.02"), "Zn_prozent": parseVal("0,02"), "Mo_prozent": parseVal("0,001"), "B_prozent": parseVal("0.01") }
  },
  {
    "name": "Hakaphos® Soft Elite 24-6-12(+2)",
    "beschreibung": "",
    "isReadOnly": true,
    "inhaltsstoffe": { "NH4_prozent": parseVal("10.8"), "NO3_prozent": parseVal("13.2"), "P2O5_prozent": parseVal("6"), "K2O_prozent": parseVal("12"), "MgO_prozent": parseVal("2"), "SiO_prozent": parseVal("0"), "SO4_prozent": parseVal("4"), "Fe_prozent": parseVal("0.08"), "Mn_prozent": parseVal("0.05"), "Cu_prozent": parseVal("0.02"), "Zn_prozent": parseVal("0.02"), "Mo_prozent": parseVal("0,001"), "B_prozent": parseVal("0.01") }
  },
  {
    "name": "Hakaphos® Spezial 16-8-22(+3)",
    "beschreibung": "",
    "isReadOnly": true,
    "inhaltsstoffe": { "NH4_prozent": parseVal("6,3"), "NO3_prozent": parseVal("9,7"), "P2O5_prozent": parseVal("8"), "K2O_prozent": parseVal("22"), "MgO_prozent": parseVal("3"), "SO3_prozent": parseVal("12,5"), "Fe_prozent": parseVal("0,15"), "Mn_prozent": parseVal("0.05"), "Cu_prozent": parseVal("0.02"), "Zn_prozent": parseVal("0,02"), "Mo_prozent": parseVal("0,005"), "B_prozent": parseVal("0,03") }
  },
  {
    "name": "Fetrilon Combi 1",
    "beschreibung": "",
    "isReadOnly": true,
    "inhaltsstoffe": { "NH4_prozent": parseVal("3,3"), "NO3_prozent": parseVal("0"), "P2O5_prozent": parseVal("0"), "K2O_prozent": parseVal("0"), "CaO_prozent": parseVal("0"), "MgO_prozent": parseVal("0"), "SiO_prozent": parseVal("0"), "SO4_prozent": parseVal("4"), "SO3_prozent": parseVal("0"), "Fe_prozent": parseVal("4"), "Mn_prozent": parseVal("4"), "Cu_prozent": parseVal("1,5"), "Zn_prozent": parseVal("1,5"), "Mo_prozent": parseVal("0,1"), "B_prozent": parseVal("0,5") }
  },
  {
    "name": "Haifa Cal™ GG",
    "beschreibung": "",
    "isReadOnly": true,
    "inhaltsstoffe": { "NH4_prozent": parseVal("1,1"), "NO3_prozent": parseVal("14,4"), "P2O5_prozent": parseVal("0"), "K2O_prozent": parseVal("0"), "CaO_prozent": parseVal("26.5") }
  },
  {
    "name": "Haifa MAP™",
    "beschreibung": "",
    "isReadOnly": true,
    "inhaltsstoffe": { "NH4_prozent": parseVal("12"), "NO3_prozent": parseVal("0"), "P2O5_prozent": parseVal("61"), "K2O_prozent": parseVal("0") }
  },
  {
    "name": "Haifa MKP",
    "beschreibung": "",
    "isReadOnly": true,
    "inhaltsstoffe": { "NH4_prozent": parseVal("0"), "NO3_prozent": parseVal("0"), "P2O5_prozent": parseVal("52"), "K2O_prozent": parseVal("34") }
  },
  {
    "name": "Haifa SOP Bio",
    "beschreibung": "",
    "isReadOnly": true,
    "inhaltsstoffe": { "NH4_prozent": parseVal("0"), "NO3_prozent": parseVal("0"), "P2O5_prozent": parseVal("0"), "K2O_prozent": parseVal("52"), "SO3_prozent": parseVal("45") }
  },
  {
    "name": "Haifa Vitaphos-K",
    "beschreibung": "",
    "isReadOnly": true,
    "inhaltsstoffe": { "NH4_prozent": parseVal("0"), "NO3_prozent": parseVal("4"), "P2O5_prozent": parseVal("31"), "K2O_prozent": parseVal("49") }
  },
  {
    "name": "Mag-N",
    "beschreibung": "",
    "isReadOnly": true,
    "inhaltsstoffe": { "NH4_prozent": parseVal("0"), "NO3_prozent": parseVal("11"), "P2O5_prozent": parseVal("0"), "K2O_prozent": parseVal("0"), "MgO_prozent": parseVal("16") }
  },
  {
    "name": "Peters Professional Combi Sol 6-18-36",
    "beschreibung": "",
    "isReadOnly": true,
    "inhaltsstoffe": { "NH4_prozent": parseVal("0"), "NO3_prozent": parseVal("6"), "P2O5_prozent": parseVal("18"), "K2O_prozent": parseVal("36"), "MgO_prozent": parseVal("3"), "Fe_prozent": parseVal("0,25"), "Mn_prozent": parseVal("0,06"), "Cu_prozent": parseVal("0,015"), "Zn_prozent": parseVal("0,015"), "Mo_prozent": parseVal("0,01"), "B_prozent": parseVal("0.02") }
  },
  {
    "name": "YaraTera Calcinit",
    "beschreibung": "",
    "isReadOnly": true,
    "inhaltsstoffe": { "NH4_prozent": parseVal("1.1"), "NO3_prozent": parseVal("14.4"), "P2O5_prozent": parseVal("0"), "K2O_prozent": parseVal("0"), "CaO_prozent": parseVal("26") }
  }
];