// In Datei: src/db.ts
// VOLLSTÄNDIGER CODE

import Dexie, { Table } from 'dexie';
import type {
  IPflanze, IUmgebung, IAktion, ILog, INaehrsalz,
  IStammlosung, IWasserprofil, ISaeureBase
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
    
    // Definitionen (unverändert)
    this.version(1).stores({
      pflanzen: '++id, umgebungId, stadium, name',
      umgebungen: '++id, name',
      aktionen: '++id, datum, status, *zielPflanzenIds, *zielUmgebungIds',
      logs: '++id, datum, typ, *zielPflanzenIds, *zielUmgebungIds',
      naehrsalze: '++id, name',
      stammlosungen: '++id, name',
      wasserprofile: '++id, name',
      saeurenBasen: '++id, name',
    });
    
    this.version(2).stores({
      pflanzen: '++id, umgebungId, stadium, name, status',
      umgebungen: '++id, name',
      aktionen: '++id, datum, status, *zielPflanzenIds, *zielUmgebungIds',
      logs: '++id, datum, typ, *zielPflanzenIds, *zielUmgebungIds',
      naehrsalze: '++id, name, isReadOnly',
      stammlosungen: '++id, name',
      wasserprofile: '++id, name',
      saeurenBasen: '++id, name',
    });
    
    this.version(3).stores({
      pflanzen: '++id, umgebungId, stadium, name, status',
      umgebungen: '++id, name',
      aktionen: '++id, datum, status, *zielPflanzenIds, *zielUmgebungIds',
      logs: '++id, datum, typ, *zielPflanzenIds, *zielUmgebungIds',
      naehrsalze: '++id, &name, isReadOnly',
      stammlosungen: '++id, name',
      wasserprofile: '++id, name',
      saeurenBasen: '++id, name',
    });
    
    // === NEUE VERSION 4 ===
    this.version(4).stores({
      pflanzen: '++id, umgebungId, stadium, name, status',
      umgebungen: '++id, name',
      aktionen: '++id, datum, status, *zielPflanzenIds, *zielUmgebungIds',
      logs: '++id, datum, typ, *zielPflanzenIds, *zielUmgebungIds',
      naehrsalze: '++id, &name, isReadOnly',
      stammlosungen: '++id, name',
      wasserprofile: '++id, name',
      // ÄNDERUNG: 'name' wird eindeutig, 'isReadOnly' hinzugefügt
      saeurenBasen: '++id, &name, isReadOnly', 
    });

    
    // === Migrations-Logik ===
    this.version(2).upgrade(tx => {
      tx.table('pflanzen').toCollection().modify(pflanze => {
        if (pflanze.status === undefined) pflanze.status = 'aktiv';
        if (pflanze.phasenDaten === undefined) pflanze.phasenDaten = { keimung: pflanze.startDatum };
      });
      tx.table('naehrsalze').toCollection().modify(salz => {
        if (salz.isReadOnly === undefined) salz.isReadOnly = false;
      });
    });
    
    this.version(3).upgrade(tx => {
      return tx.table('naehrsalze').toCollection().modify(() => {});
    });

    // NEU: Migration für Version 4
    this.version(4).upgrade(tx => {
      // Lösche alle alten (inkompatiblen) Säuren/Basen, 
      // damit die 'populate'-Funktion sie neu erstellen kann.
      return tx.table('saeurenBasen').clear();
    });
  }
}

export const db = new GrowFlowDB();