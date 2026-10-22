import { exportDB, importInto, peakImportFile } from 'dexie-export-import'
import { db, type IntegrationshilfeDB } from './db'

const MAGIC = new TextEncoder().encode('IHENC1')
const SALT = 16
const IV = 12
const ITER = 250_000

async function schluessel(passwort: string, salt: Uint8Array, nutzung: KeyUsage[]): Promise<CryptoKey> {
  const roh = await crypto.subtle.importKey('raw', new TextEncoder().encode(passwort), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: ITER, hash: 'SHA-256' }, roh, { name: 'AES-GCM', length: 256 }, false, nutzung)
}

/** AES-GCM-Verschlüsselung (Schlüssel per PBKDF2 aus dem Passwort). Format: Magic | Salt | IV | Chiffre. */
export async function verschluessele(daten: Uint8Array, passwort: string): Promise<Blob> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT))
  const iv = crypto.getRandomValues(new Uint8Array(IV))
  const key = await schluessel(passwort, salt, ['encrypt'])
  const chiffre = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, daten as BufferSource))
  return new Blob([MAGIC as BufferSource, salt as BufferSource, iv as BufferSource, chiffre as BufferSource], { type: 'application/octet-stream' })
}

export class FalschesPasswort extends Error {
  constructor() {
    super('Passwort falsch oder Datei beschädigt.')
  }
}

export async function entschluessele(bytes: Uint8Array, passwort: string): Promise<Uint8Array> {
  const salt = bytes.slice(MAGIC.length, MAGIC.length + SALT)
  const iv = bytes.slice(MAGIC.length + SALT, MAGIC.length + SALT + IV)
  const chiffre = bytes.slice(MAGIC.length + SALT + IV)
  try {
    const key = await schluessel(passwort, salt, ['decrypt'])
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, chiffre as BufferSource))
  } catch {
    throw new FalschesPasswort()
  }
}

export function istVerschluesselt(bytes: Uint8Array): boolean {
  return MAGIC.every((b, i) => bytes[i] === b)
}

async function bytesVon(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer())
}

export function backupName(passwort: boolean, jetzt = new Date()): string {
  const d = `${jetzt.getFullYear()}-${String(jetzt.getMonth() + 1).padStart(2, '0')}-${String(jetzt.getDate()).padStart(2, '0')}`
  return `Backup_Integrationshilfe_${d}.${passwort ? 'ihbackup' : 'json'}`
}

export async function erzeugeBackup(passwort?: string, d: IntegrationshilfeDB = db): Promise<{ blob: Blob; name: string }> {
  const json = await exportDB(d)
  if (!passwort) return { blob: json, name: backupName(false) }
  return { blob: await verschluessele(await bytesVon(json), passwort), name: backupName(true) }
}

export type Pruefung = { ok: true; verschluesselt: boolean } | { ok: false; grund: string }

export async function pruefeBackup(datei: Blob): Promise<Pruefung> {
  const bytes = await bytesVon(datei)
  if (istVerschluesselt(bytes)) return { ok: true, verschluesselt: true }
  return pruefeJson(new Blob([bytes as BufferSource]))
}

async function pruefeJson(blob: Blob): Promise<Pruefung> {
  try {
    const meta = await peakImportFile(blob)
    const tabellen = meta.data.tables.map((t) => t.name)
    if (!['kinder', 'eintraege', 'einstellungen'].every((t) => tabellen.includes(t))) return { ok: false, grund: 'Die Datei stammt nicht aus dieser App.' }
    return { ok: true, verschluesselt: false }
  } catch {
    return { ok: false, grund: 'Die Datei ist kein gültiges Backup.' }
  }
}

/** Ersetzt ALLE Daten auf diesem Gerät durch den Inhalt des Backups. */
export async function stelleWiederHer(datei: Blob, passwort?: string, d: IntegrationshilfeDB = db): Promise<void> {
  const bytes = await bytesVon(datei)
  let json: Blob
  if (istVerschluesselt(bytes)) {
    if (!passwort) throw new FalschesPasswort()
    json = new Blob([(await entschluessele(bytes, passwort)) as BufferSource], { type: 'application/json' })
  } else {
    json = new Blob([bytes as BufferSource], { type: 'application/json' })
  }
  const p = await pruefeJson(json)
  if (!p.ok) throw new Error(p.grund)
  await importInto(d, json, { clearTablesBeforeImport: true, acceptNameDiff: true, acceptVersionDiff: false })
}
