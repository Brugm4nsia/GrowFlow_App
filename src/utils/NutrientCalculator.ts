// In Datei: src/utils/NutrientCalculator.ts
// VOLLSTÄNDIGER CODE

import { db } from '../db';
// === HIER IST DER FIX ===
// Unnötige Typen entfernt (IWasserprofil, INaehrsalz, ISaeureBase)
import type { IStammlosung, EndloesungErgebnis, ZutatTyp } from '../types'; 
export type { EndloesungErgebnis } from '../types';

// === ATOMGEWICHTE & UMRECHNUNGSFAKTOREN ===
const AW_P = 30.97, AW_K = 39.10, AW_Ca = 40.08, AW_Mg = 24.31, AW_S = 32.06;
const AW_N = 14.01, AW_O = 16.00, AW_H = 1.01, AW_Si = 28.08;
const MW_P2O5 = (AW_P * 2) + (AW_O * 5), MW_K2O = (AW_K * 2) + AW_O, MW_CaO = AW_Ca + AW_O;
const MW_MgO = AW_Mg + AW_O, MW_SO3 = AW_S + (AW_O * 3), MW_SO4 = AW_S + (AW_O * 4);
const MW_NH4 = AW_N + (AW_H * 4), MW_NO3 = AW_N + (AW_O * 3), MW_SiO = AW_Si + AW_O;
const F_P_aus_P2O5 = (AW_P * 2) / MW_P2O5, F_K_aus_K2O = (AW_K * 2) / MW_K2O;
const F_Ca_aus_CaO = AW_Ca / MW_CaO, F_Mg_aus_MgO = AW_Mg / MW_MgO;
const F_S_aus_SO4 = AW_S / MW_SO4, F_S_aus_SO3 = AW_S / MW_SO3;
const F_N_aus_NH4 = AW_N / MW_NH4, F_N_aus_NO3 = AW_N / MW_NO3, F_Si_aus_SiO = AW_Si / MW_SiO;

// === HELPER ===
const createEmptyErgebnis = (): EndloesungErgebnis => ({
  N_gesamt: 0, NH4: 0, NO3: 0, P: 0, K: 0, Ca: 0, Mg: 0, S: 0,
  Fe: 0, Mn: 0, Zn: 0, Cu: 0, B: 0, Si: 0, Mo: 0, Na: 0, Cl: 0,
});
const addMg = (total: EndloesungErgebnis, quelle: Partial<EndloesungErgebnis>) => {
  for (const key in quelle) {
    const k = key as keyof EndloesungErgebnis;
    if (total.hasOwnProperty(k) && quelle[k]) { total[k]! += quelle[k]!; }
  }
};

// === FUNKTION 1: Stammlösungs-Rechner ===
export async function calculateStockSolution(
  rezept: { naehrsalzId: number; gramm: number }[],
  endvolumenLiter: number
): Promise<IStammlosung['ergebnis_mg_ml']> {
  
  const total_mg: IStammlosung['ergebnis_mg_ml'] = {
    N_gesamt: 0, NH4: 0, NO3: 0, P: 0, K: 0, Ca: 0, Mg: 0, S: 0,
    Fe: 0, Mn: 0, Zn: 0, Cu: 0, B: 0, Si: 0, Mo: 0,
  };
  if (endvolumenLiter <= 0) return total_mg;

  const alleSalze = await db.naehrsalze.toArray();
  const salzMap = new Map(alleSalze.map(s => [s.id, s]));

  for (const zutat of rezept) {
    const salzInfo = salzMap.get(zutat.naehrsalzId);
    if (!salzInfo) continue; 
    const mg = zutat.gramm * 1000;
    const i = salzInfo.inhaltsstoffe;

    const mg_N_aus_NH4 = (mg * (i.NH4_prozent || 0) / 100);
    const mg_N_aus_NO3 = (mg * (i.NO3_prozent || 0) / 100);
    total_mg.NH4 += mg_N_aus_NH4;
    total_mg.NO3 += mg_N_aus_NO3;
    total_mg.N_gesamt += mg_N_aus_NH4 + mg_N_aus_NO3;

    total_mg.P += (mg * (i.P2O5_prozent || 0) / 100) * F_P_aus_P2O5;
    total_mg.K += (mg * (i.K2O_prozent || 0) / 100) * F_K_aus_K2O;
    total_mg.Ca += (mg * (i.CaO_prozent || 0) / 100) * F_Ca_aus_CaO;
    total_mg.Mg += (mg * (i.MgO_prozent || 0) / 100) * F_Mg_aus_MgO;

    if (i.S_prozent && i.S_prozent > 0) {
      total_mg.S += (mg * i.S_prozent / 100);
    } else if (i.SO4_prozent && i.SO4_prozent > 0) {
      total_mg.S += (mg * i.SO4_prozent / 100) * F_S_aus_SO4;
    } else if (i.SO3_prozent && i.SO3_prozent > 0) {
      total_mg.S += (mg * i.SO3_prozent / 100) * F_S_aus_SO3;
    }

    total_mg.Fe += mg * (i.Fe_prozent || 0) / 100;
    total_mg.Mn += mg * (i.Mn_prozent || 0) / 100;
    total_mg.Zn += mg * (i.Zn_prozent || 0) / 100;
    total_mg.Cu += mg * (i.Cu_prozent || 0) / 100;
    total_mg.B += mg * (i.B_prozent || 0) / 100;
    total_mg.Mo += mg * (i.Mo_prozent || 0) / 100;
    total_mg.Si += (mg * (i.SiO_prozent || 0) / 100) * F_Si_aus_SiO;
  }
  
  const endvolumen_mL = endvolumenLiter * 1000;
  (Object.keys(total_mg) as Array<keyof typeof total_mg>).forEach(key => {
    total_mg[key] = total_mg[key] / endvolumen_mL;
  });
  return total_mg;
}


// === FUNKTION 2: ENDLÖSUNGS-RECHNER ===

interface EndloesungInputIDs {
  zielvolumenLiter: number;
  wasserProfilId?: number;
  zutaten: { id: number; menge: number; typ: ZutatTyp }[];
}

export async function calculateFinalSolution(
  inputs: EndloesungInputIDs
): Promise<EndloesungErgebnis> { 
  
  const totalMg = createEmptyErgebnis();
  const { zielvolumenLiter } = inputs;
  if (zielvolumenLiter <= 0) return totalMg;

  // 1. Wasserprofil laden (async)
  if (inputs.wasserProfilId) {
    const wasserProfil = await db.wasserprofile.get(inputs.wasserProfilId);
    if (wasserProfil) {
      const w = wasserProfil.naehrstoffe_mg_l;
      const mg_N_aus_NH4 = (w.NH4 || 0) * F_N_aus_NH4;
      const mg_N_aus_NO3 = (w.NO3 || 0) * F_N_aus_NO3;
      const wasser_mg: Partial<EndloesungErgebnis> = {
        N_gesamt: mg_N_aus_NH4 + mg_N_aus_NO3,
        NH4: mg_N_aus_NH4, NO3: mg_N_aus_NO3, P: w.P || 0, K: w.K || 0, Ca: w.Ca || 0,
        Mg: w.Mg || 0, S: w.SO4 ? w.SO4 * F_S_aus_SO4 : 0, Fe: w.Fe || 0, Mn: w.Mn || 0, 
        Zn: w.Zn || 0, Cu: w.Cu || 0, B: w.B || 0, Mo: w.Mo || 0, Si: w.Si || 0,
        Na: w.Na || 0, Cl: w.Cl || 0,
      };
      (Object.keys(wasser_mg) as Array<keyof typeof wasser_mg>).forEach(key => {
        wasser_mg[key] = (wasser_mg[key] || 0) * zielvolumenLiter;
      });
      addMg(totalMg, wasser_mg);
    }
  }

  // 2. Alle Zutaten laden (async)
  for (const item of inputs.zutaten) {
    
    if (item.typ === 'stammlosung') {
      const loesung = await db.stammlosungen.get(item.id);
      if (loesung) {
        const e = loesung.ergebnis_mg_ml;
        addMg(totalMg, {
          N_gesamt: e.N_gesamt * item.menge, NH4: e.NH4 * item.menge, NO3: e.NO3 * item.menge,
          P: e.P * item.menge, K: e.K * item.menge, Ca: e.Ca * item.menge, Mg: e.Mg * item.menge, 
          S: e.S * item.menge, Fe: e.Fe * item.menge, Mn: e.Mn * item.menge, Zn: e.Zn * item.menge, 
          Cu: e.Cu * item.menge, B: e.B * item.menge, Si: e.Si * item.menge, Mo: e.Mo * item.menge
        });
      }
    }
    
    if (item.typ === 'naehrsalz') {
      const salz = await db.naehrsalze.get(item.id);
      if (salz) {
        const mg = item.menge * 1000;
        const i = salz.inhaltsstoffe;
        const mg_N_aus_NH4 = (mg * (i.NH4_prozent || 0) / 100);
        const mg_N_aus_NO3 = (mg * (i.NO3_prozent || 0) / 100);
        let mg_S = 0;
        if (i.S_prozent && i.S_prozent > 0) mg_S = (mg * i.S_prozent / 100);
        else if (i.SO4_prozent && i.SO4_prozent > 0) mg_S = (mg * i.SO4_prozent / 100) * F_S_aus_SO4;
        else if (i.SO3_prozent && i.SO3_prozent > 0) mg_S = (mg * i.SO3_prozent / 100) * F_S_aus_SO3;
        addMg(totalMg, {
          NH4: mg_N_aus_NH4, NO3: mg_N_aus_NO3, N_gesamt: mg_N_aus_NH4 + mg_N_aus_NO3,
          P: (mg * (i.P2O5_prozent || 0) / 100) * F_P_aus_P2O5,
          K: (mg * (i.K2O_prozent || 0) / 100) * F_K_aus_K2O,
          Ca: (mg * (i.CaO_prozent || 0) / 100) * F_Ca_aus_CaO,
          Mg: (mg * (i.MgO_prozent || 0) / 100) * F_Mg_aus_MgO, S: mg_S,
          Fe: mg * (i.Fe_prozent || 0) / 100, Mn: mg * (i.Mn_prozent || 0) / 100,
          Zn: mg * (i.Zn_prozent || 0) / 100, Cu: mg * (i.Cu_prozent || 0) / 100,
          B: mg * (i.B_prozent || 0) / 100, Mo: mg * (i.Mo_prozent || 0) / 100,
          Si: (mg * (i.SiO_prozent || 0) / 100) * F_Si_aus_SiO,
        });
      }
    }
    
    if (item.typ === 'saeure') {
      const saeure = await db.saeurenBasen.get(item.id);
      if (saeure) {
        const e = saeure.reinststoff_mg_ml;
        addMg(totalMg, { P: (e.P || 0) * item.menge, K: (e.K || 0) * item.menge });
      }
    }
  }
  
  // 3. Gesamt-mg durch Liter teilen -> mg/l
  (Object.keys(totalMg) as Array<keyof typeof totalMg>).forEach(key => {
    totalMg[key] = (totalMg[key] || 0) / zielvolumenLiter;
  });

  return totalMg;
}