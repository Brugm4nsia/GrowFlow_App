// In Datei: src/types.ts
// VOLLSTÄNDIGER CODE

// === KERN-ENTITÄTEN ===
export type PflanzenStadium = 'keimung' | 'saemling' | 'wachstum' | 'bluete' | 'ernte' | 'trocknung';
export type AnbauMedium = 'erde' | 'hydro' | 'kokos';
export type UmgebungsArt = 'innen' | 'aussen';
export type AktionStatus = 'offen' | 'erledigt';
export type LogTyp = 'pflanze' | 'umgebung' | 'foto';
export type SaeureBaseTyp = 'saeure' | 'base';
export const PHASEN_REIHENFOLGE: PflanzenStadium[] = [
  'keimung', 'saemling', 'wachstum', 'bluete', 'ernte', 'trocknung',
];
export type PflanzenStatus = 'aktiv' | 'tot' | 'geoerntet';
export type PumpenEinheit = 'h' | 'min' | 'sek';
export type ZutatTyp = 'naehrsalz' | 'stammlosung' | 'saeure';

// === NEUE TYPEN FÜR DIE DROPDOWNS ===
export type TrainingTyp = 'lst' | 'fim' | 'scrog' | 'supercropping' | 'topping';
export type BeschneidenTyp = 'topping' | 'fim' | 'entlaubung' | 'lollipopping' | 'untere_aeste';

// Globaler Typ für Rechner-Ergebnisse
export type EndloesungErgebnis = {
  N_gesamt: number; NH4: number; NO3: number; P: number; K: number; Ca: number;
  Mg: number; S: number; Fe: number; Mn: number; Zn: number; Cu: number;
  B: number; Si: number; Mo: number;
  Na?: number; Cl?: number;
};

export interface IPflanze {
  id?: number; name: string; sorte: string; breeder: string; umgebungId: number; 
  stadium: PflanzenStadium; medium: AnbauMedium; startDatum: Date; status: PflanzenStatus;
  phasenDaten: {
    keimung?: Date; saemling?: Date; wachstum?: Date; bluete?: Date; ernte?: Date; trocknung?: Date;
  };
}
export interface IUmgebung {
  id?: number; name: string; art: UmgebungsArt; lichter?: string; belichtungszeit?: number; 
  maße?: { laenge: number; breite: number; hoehe: number; };
}

// === LOGBUCH & AKTIONEN ===
export interface IAktion {
  id?: number; 
  typ: 'wasser' | 'naehrstoffe' | 'ph' | 'training' | 'beschneiden' | 'schutz';
  datum: Date; 
  status: AktionStatus; 
  notiz?: string; 
  zielPflanzenIds: number[];
  zielUmgebungIds: number[]; 
  protokollId?: number; 
  
  details?: {
    wasserProfilId?: number;
    mengeL?: number;
    zutaten?: { id: number; menge: number; typ: ZutatTyp; }[];
    
    // === HIER IST DIE KORREKTUR ===
    trainingTyp?: TrainingTyp;
    beschneidenTyp?: BeschneidenTyp;
    
    berechnetesErgebnis_mg_l?: EndloesungErgebnis;
  };
}
export interface ILog {
  id?: number; typ: LogTyp; datum: Date; notiz?: string; linkAktionId?: number;
  zielPflanzenIds: number[]; zielUmgebungIds: number[]; foto?: Blob; 
  messwerte?: {
    hoehe?: number; tds_vorher?: number; tds_nachher?: number; ph_vorher?: number;
    ph_nachher?: number; ec_vorher?: number; ec_nachher?: number;
    wassertemperatur?: number; ppfd_pflanze?: number;
    luftfeuchtigkeit?: number; umgebungstemperatur?: number; lichtabstand?: number;
    ppfd_durchschnitt?: number; vpd?: number;
    pumpenintervall_on?: number; pumpenintervall_off?: number;
    pumpenintervall_on_einheit?: PumpenEinheit;
    pumpenintervall_off_einheit?: PumpenEinheit;
  };
}

// === NÄHRSTOFF-DATENBANK === (Unverändert)
export interface INaehrsalz {
  id?: number; name: string; beschreibung?: string;
  inhaltsstoffe: {
    NH4_prozent?: number; NO3_prozent?: number; P2O5_prozent?: number; K2O_prozent?: number;
    CaO_prozent?: number; MgO_prozent?: number; S_prozent?: number; SO4_prozent?: number;
    SO3_prozent?: number; SiO_prozent?: number; Fe_prozent?: number; Mn_prozent?: number;
    Cu_prozent?: number; Zn_prozent?: number; B_prozent?: number; Mo_prozent?: number;
  };
}
export interface IStammlosung {
  id?: number; name: string; endvolumenLiter: number;
  rezept: { naehrsalzId: number; gramm: number; }[];
  ergebnis_mg_ml: {
    N_gesamt: number; NH4: number; NO3: number; P: number; K: number; Ca: number;
    Mg: number; S: number; Fe: number; Mn: number; Zn: number; Cu: number;
    B: number; Si: number; Mo: number;
  };
}
export interface IWasserprofil {
  id?: number; name: string; beschreibung?: string;
  naehrstoffe_mg_l: {
    NO3?: number; NH4?: number; P?: number; K: number; Ca?: number;
    Mg?: number; SO4?: number; Na?: number; Cl?: number; Fe?: number;
    Mn?: number; Cu?: number; Zn?: number; B?: number; Mo?: number; Si?: number;
  };
  ec: number; ph: number; kh: number;
}
export interface ISaeureBase {
  id?: number; name: string; typ: SaeureBaseTyp; dichte: number;
  element_prozent: { [key: string]: number; };
  reinststoff_mg_ml: { [key: string]: number; };
}