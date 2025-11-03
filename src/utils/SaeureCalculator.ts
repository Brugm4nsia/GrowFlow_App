// In Datei: src/utils/SaeureCalculator.ts
// VOLLSTÄNDIGER CODE

import { SaeureFormel } from "../types";

// === ATOMGEWICHTE (gerundet) ===
const AW_P = 30.97, AW_K = 39.10, AW_S = 32.06, AW_N = 14.01, AW_O = 16.00, AW_H = 1.01;

// === MOLEKULARGEWICHTE (g/mol) ===
const MW_H3PO4 = (AW_H * 3) + AW_P + (AW_O * 4);       // ~98.00
const MW_HNO3 = AW_H + AW_N + (AW_O * 3);             // ~63.02
const MW_H2SO4 = (AW_H * 2) + AW_S + (AW_O * 4);      // ~98.08
const MW_KOH = AW_K + AW_O + AW_H;                    // ~56.11
const MW_P2O5 = (AW_P * 2) + (AW_O * 5);              // ~141.94

// === UMRECHNUNGSFAKTOREN (Anteil des Reinstoffs in der Verbindung) ===
const F_P_in_H3PO4 = AW_P / MW_H3PO4;         // ~0.316
const F_N_in_HNO3 = AW_N / MW_HNO3;         // ~0.222
const F_S_in_H2SO4 = AW_S / MW_H2SO4;         // ~0.327
const F_K_in_KOH = AW_K / MW_KOH;           // ~0.697
const F_P_in_P2O5 = (AW_P * 2) / MW_P2O5;   // ~0.436

/**
 * Berechnet den Reinstoffgehalt (P, N, S, K) in mg/ml
 * basierend auf der Dichte und Konzentration der chemischen Formel.
 */
export function calculateSaeureReinststoffe(
  formel: SaeureFormel, 
  dichte_g_ml: number, 
  konzentration_prozent: number
): { [key: string]: number } {
  
  const ergebnis: { [key: string]: number } = {};
  
  // 1. Berechne mg/ml der Verbindung (z.B. reine H3PO4)
  // (Dichte g/ml * 1000 mg/g) * (Konz. % / 100) = mg/ml
  const mg_ml_verbindung = (dichte_g_ml * 1000) * (konzentration_prozent / 100);

  // 2. Berechne den Reinstoff-Anteil
  switch (formel) {
    case 'H3PO4':
      ergebnis['P'] = mg_ml_verbindung * F_P_in_H3PO4;
      break;
    case 'P2O5': // (Fall für Canna/Plagron)
      ergebnis['P'] = mg_ml_verbindung * F_P_in_P2O5;
      break;
    case 'HNO3':
      ergebnis['N'] = mg_ml_verbindung * F_N_in_HNO3;
      break;
    case 'H2SO4':
      ergebnis['S'] = mg_ml_verbindung * F_S_in_H2SO4;
      break;
    case 'KOH':
      ergebnis['K'] = mg_ml_verbindung * F_K_in_KOH;
      break;
    default:
      // Formel nicht erkannt
      break;
  }
  return ergebnis;
}