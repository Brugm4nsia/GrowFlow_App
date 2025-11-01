// In Datei: src/db.ts
// VOLLSTÄNDIGER CODE

import Dexie, { Table } from 'dexie';
import type {
  IPflanze,
  IUmgebung,
  IAktion,
  ILog,
  INaehrsalz,
  IStammlosung,
  IWasserprofil,
  ISaeureBase
} from './types';

export class GrowFlowDB extends Dexie {
  pflanzen!: Table<IPflanze>;
  umgebungen!: Table<IUmgebung>;
  aktionen!: Table<IAktion>;
  logs!: Table<ILog>;
  naehrsalze!: Table<INaehrsalz>;
  stammlosungen!: Table<IStammlosung>;
  wasserprofile!: Table<IWasserprofil>;
  saeurenBasen!: Table<ISaeureBase>;

  constructor() {
    super('growFlowDB'); 
    
    // === Version 1 (Das FINALE Schema) ===
    // Wir definieren das Schema, so wie es jetzt (am Ende) sein soll.
    // Zukünftige Änderungen werden version(2), version(3) usw. sein.
    this.version(1).stores({
      // Hinzugefügt: 'status' für das Filtern auf der Pflanzen-Seite
      pflanzen: '++id, umgebungId, stadium, name, status', 
      
      umgebungen: '++id, name',
      
      // Unverändert: Gut indiziert
      aktionen: '++id, datum, status, *zielPflanzenIds, *zielUmgebungIds',
      logs: '++id, datum, typ, *zielPflanzenIds, *zielUmgebungIds',

      // Alle Datenbank-Tabellen
      naehrsalze: '++id, name',
      stammlosungen: '++id, name',
      wasserprofile: '++id, name',
      saeurenBasen: '++id, name',
    });
    
    // === WICHTIG: Migrationslogik für deine EIGENE Entwicklung ===
    // Dieser Code hilft DIR, deine lokale Datenbank zu aktualisieren,
    // ohne sie manuell löschen zu müssen.
    this.version(1).upgrade(tx => {
      // Fange alle Pflanzen ab, die 'status' oder 'phasenDaten' nicht haben
      return tx.table('pflanzen').toCollection().modify(pflanze => {
        if (pflanze.status === undefined) {
          pflanze.status = 'aktiv';
        }
        if (pflanze.phasenDaten === undefined) {
          pflanze.phasenDaten = { keimung: pflanze.startDatum };
        }
      });
      // (Zukünftige Migrationen kommen hier drunter)
    });
  }
}

export const db = new GrowFlowDB();