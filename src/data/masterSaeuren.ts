// In Datei: src/data/masterSaeuren.ts
// VOLLSTÄNDIGER CODE

// === HIER IST DIE KORREKTUR: 'SaeureFormel' wurde aus dem Import entfernt ===
import { ISaeureBase } from "../types"; 
import { calculateSaeureReinststoffe } from "../utils/SaeureCalculator";

type MasterSaeure = Omit<ISaeureBase, 'id' | 'reinststoff_mg_ml'> & {
  reinststoff_mg_ml?: Partial<ISaeureBase['reinststoff_mg_ml']>;
};

// Deine 10 Master-Einträge
const masterSaeurenData: MasterSaeure[] = [
  {
    "name": "Phosphorsäure 85%",
    "typ": "saeure", "dichte": 1.685, "ch_formel": "H3PO4", "konzentration": 85,
    "isReadOnly": true
  },
  {
    "name": "Salpetersäure 59%",
    "typ": "saeure", "dichte": 1.365, "ch_formel": "HNO3", "konzentration": 59,
    "isReadOnly": true
  },
  {
    "name": "Schwefelsäure 78%",
    "typ": "saeure", "dichte": 1.7, "ch_formel": "H2SO4", "konzentration": 78,
    "isReadOnly": true
  },
  {
    "name": "Canna pH- Wuchs / Grow",
    "typ": "saeure", "dichte": 1.3, "ch_formel": "HNO3", "konzentration": 3,
    "isReadOnly": true
  },
  {
    "name": "Canna pH- Bloom PRO",
    "typ": "saeure", "dichte": 1.27, "ch_formel": "P2O5", "konzentration": 59,
    "isReadOnly": true
  },
  {
    "name": "Advanced Nutrients pH Down",
    "typ": "saeure", "dichte": 1.58, "ch_formel": "P2O5", "konzentration": 55,
    "isReadOnly": true
  },
  {
    "name": "Plagron PH Min",
    "typ": "saeure", "dichte": 1.43, "ch_formel": "P2O5", "konzentration": 43,
    "isReadOnly": true
  },
  {
    "name": "Canna pH+",
    "typ": "base", "dichte": 1.02, "ch_formel": "KOH", "konzentration": 5,
    "isReadOnly": true
  },
  {
    "name": "Kaliumhydroxid 50%",
    "typ": "base", "dichte": 1.5, "ch_formel": "KOH", "konzentration": 50,
    "isReadOnly": true
  },
  {
    "name": "Canna pH+ PRO",
    "typ": "base", "dichte": 1.19, "ch_formel": "KOH", "konzentration": 20,
    "isReadOnly": true
  }
];

// Berechne die reinststoff_mg_ml für jeden Eintrag
export const MASTER_SAEUREN: ISaeureBase[] = masterSaeurenData.map(item => ({
  ...item,
  reinststoff_mg_ml: calculateSaeureReinststoffe(
    item.ch_formel,
    item.dichte,
    item.konzentration
  ),
})) as ISaeureBase[];