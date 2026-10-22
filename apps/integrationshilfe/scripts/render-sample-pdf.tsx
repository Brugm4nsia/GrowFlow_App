// Node-Render mit fiktiven Fixtures:  npx tsx scripts/render-sample-pdf.tsx  → scripts/out/*.pdf
import React from 'react'
void React
import path from 'node:path'
import fs from 'node:fs'
import { renderToFile } from '@react-pdf/renderer'
import { Report, registerFonts } from '../src/pdf/Report'
import { baueBerichtDaten, profilVon } from '../src/domain/auswertung'
import { DEMO_KINDER, erzeugeEintraege } from '../src/domain/fixtures'
import { KATALOG } from '../src/domain/katalog'

const F = path.resolve('node_modules/@fontsource/inter/files')
registerFonts({ regular: `${F}/inter-latin-400-normal.woff`, semibold: `${F}/inter-latin-600-normal.woff`, bold: `${F}/inter-latin-700-normal.woff` })
fs.mkdirSync('scripts/out', { recursive: true })

const [lena, tim] = DEMO_KINDER
const alle = profilVon('voll').bereiche
const basis = { items: KATALOG, ersteller: { name: 'Beispiel Ersteller:in', funktion: 'Integrationshelfer:in', traeger: 'Beispiel-Träger e. V.' }, heute: '2026-10-05' }
const opt = (profilId: string, extra = {}) => ({ profilId, bereiche: profilVon(profilId).bereiche, diagnose: false, aktenzeichen: false, tagestexte: profilVon(profilId).tagestexte, ...extra })

const faelle: [string, Parameters<typeof baueBerichtDaten>[0]][] = [
  ['voll-monat', { ...basis, kind: lena, eintraege: erzeugeEintraege(lena, '2026-09-01', '2026-09-30', { seed: 1, besserung: true, langeNotiz: true }), von: '2026-09-01', bis: '2026-09-30', optionen: opt('voll', { diagnose: true, aktenzeichen: true, bereiche: alle }) }],
  ['wenig-daten', { ...basis, kind: tim, eintraege: erzeugeEintraege(tim, '2026-09-14', '2026-09-18', { seed: 2, luecken: 0.3 }), von: '2026-09-14', bis: '2026-09-18', optionen: opt('voll') }],
  ['ein-bereich', { ...basis, kind: lena, eintraege: erzeugeEintraege(lena, '2026-09-01', '2026-09-30', { seed: 3 }), von: '2026-09-01', bis: '2026-09-30', optionen: opt('ergo') }],
  ['leer', { ...basis, kind: tim, eintraege: [], von: '2026-01-01', bis: '2026-01-31', optionen: opt('voll') }],
  ['halbjahr', { ...basis, kind: lena, eintraege: erzeugeEintraege(lena, '2026-02-01', '2026-07-31', { seed: 4, besserung: true }), von: '2026-02-01', bis: '2026-07-31', optionen: opt('amt') }],
]
const nur = process.argv[2]
for (const [name, p] of faelle) {
  if (nur && nur !== name) continue
  await renderToFile(<Report daten={baueBerichtDaten(p)} />, path.resolve(`scripts/out/${name}.pdf`))
  console.log('geschrieben:', name)
}
