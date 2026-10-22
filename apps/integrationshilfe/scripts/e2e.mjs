// Browser-Test im Handy-Viewport (vorinstalliertes Chromium, kein playwright install).
// Aufruf: npm run build && node scripts/e2e.mjs
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const OUT = 'scripts/out'
fs.mkdirSync(OUT, { recursive: true })
const PORT = 4173
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
const base = `http://localhost:${PORT}`
for (let i = 0; i < 50; i++) { try { await fetch(base); break } catch { await new Promise((r) => setTimeout(r, 200)) } }

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, acceptDownloads: true })
const page = await ctx.newPage()
const external = []
page.on('request', (r) => { if (!r.url().startsWith(base) && !r.url().startsWith('blob:') && !r.url().startsWith('data:')) external.push(r.url()) })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

const until = async (fn, msg, t = 4000) => { const t0 = Date.now(); for (;;) { if (await fn()) { console.log('ok  ', msg); return } if (Date.now() - t0 > t) throw new Error('FEHLER: ' + msg); await new Promise((r) => setTimeout(r, 100)) } }
const pressed = (loc) => async () => (await loc.getAttribute('aria-pressed')) === 'true'
const ok = (c, msg) => { if (!c) throw new Error('FEHLER: ' + msg); console.log('ok  ', msg) }
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` })

async function kindAnlegen(name, punkte) {
  await page.goto(base + '/kinder/neu')
  await page.getByLabel('Kürzel oder Vorname').fill(name)
  for (const p of punkte) await page.getByText(p, { exact: true }).click()
  await page.getByRole('button', { name: 'Speichern' }).click()
  await page.waitForURL(/\/kinder\/\d+$/)
}

try {
  await page.goto(base)
  await page.getByText('Erstes Kind anlegen').waitFor()
  await shot('01-leer')
  await kindAnlegen('Mia', ['Fokusdauer bei Einzelarbeit', 'Ablenkbarkeit durch Umweltreize', 'Stifthaltung und Schreibdruck', 'Frustrationstoleranz bei Kritik und Misserfolg', 'Regeleinhaltung'])
  await kindAnlegen('Ben', ['Fokusdauer bei Einzelarbeit', 'Regeleinhaltung', 'Hygiene und Toilettengang'])
  await shot('02-kind-gespeichert')

  await page.goto(base + '/')
  await page.getByRole('button', { name: 'Mia' }).waitFor()
  // Beide Kinder wählen
  await page.getByRole('button', { name: 'Mia' }).click().catch(() => {})
  const miaAn = await page.getByRole('button', { name: 'Mia' }).getAttribute('aria-pressed')
  const benAn = await page.getByRole('button', { name: 'Ben' }).getAttribute('aria-pressed')
  console.log('Auswahl Mia/Ben:', miaAn, benAn)
  if (miaAn !== 'true') await page.getByRole('button', { name: 'Mia' }).click()
  if (benAn !== 'true') await page.getByRole('button', { name: 'Ben' }).click()
  ok((await page.getByRole('button', { name: 'Mia' }).getAttribute('aria-pressed')) === 'true' && (await page.getByRole('button', { name: 'Ben' }).getAttribute('aria-pressed')) === 'true', 'zwei Kinder gewählt')

  const fokus = page.getByTestId('item-kog-fokus')
  await fokus.getByRole('button', { name: /^Stufe 2/ }).click()
  await until(pressed(fokus.getByRole('button', { name: /^Stufe 2/ })), 'Stufe 2 für beide gesetzt')
  await fokus.getByRole('button', { name: /^Stufe 2/ }).click()
  await until(async () => !(await pressed(fokus.getByRole('button', { name: /^Stufe 2/ }))()), 'erneuter Tipp nimmt zurück')
  await fokus.getByRole('button', { name: /^Stufe 1/ }).click()
  await page.getByTestId('item-kog-ablenkung').getByRole('button', { name: /^Stufe 0/ }).click()
  await shot('03-heute-mehrfach')

  // nur Mia: persönlicher Wert, Notiz mit Etikett-Hinweis
  await page.getByRole('button', { name: 'Ben' }).click()
  await page.getByTestId('item-kog-fokus').getByRole('button', { name: 'Details' }).click()
  await page.getByLabel('Kurznotiz zu Fokusdauer bei Einzelarbeit').fill('Mia war heute aggressiv')
  await page.getByText('Formulierungs-Tipp').waitFor()
  await shot('04-details-hinweis')
  await page.getByLabel('Kurznotiz zu Fokusdauer bei Einzelarbeit').fill('Mia blieb zehn Minuten bei der Aufgabe.')
  await page.getByText(/\d von \d erfasst/).waitFor()
  await page.waitForTimeout(900)
  // Tab-Wechsel (flush) und Reload: Daten müssen bleiben
  await page.getByRole('tab', { name: /Umwelt/ }).click()
  await page.getByRole('button', { name: 'Lärmschutz' }).click()
  await page.getByRole('tab', { name: /^Tag/ }).click()
  await page.getByLabel('Tagesnotiz').fill('Ruhiger Tag mit klarer Struktur.')
  await shot('05-tag')
  await page.getByRole('tab', { name: /Kognition/ }).click()  // flush Tagesnotiz durch Unmount
  await page.waitForTimeout(300)
  await page.reload()
  await page.getByTestId('item-kog-fokus').waitFor()
  await until(pressed(page.getByRole('button', { name: 'Mia' })), 'Auswahl nach Reload gemerkt')
  await until(pressed(page.getByTestId('item-kog-fokus').getByRole('button', { name: /^Stufe 1/ })), 'Wert nach Reload vorhanden')
  await page.getByTestId('item-kog-fokus').getByRole('button', { name: /Details/ }).click()
  ok((await page.getByLabel('Kurznotiz zu Fokusdauer bei Einzelarbeit').inputValue()).includes('zehn Minuten'), 'Notiz gespeichert')
  await page.getByRole('tab', { name: /^Tag/ }).click()
  ok((await page.getByLabel('Tagesnotiz').inputValue()).includes('klarer Struktur'), 'Tagesnotiz gespeichert (Flush bei Tab-Wechsel)')

  // Wie zuletzt am Folgetag
  const heute = new Date(); const morgen = new Date(heute.getTime() + 864e5)
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  await page.goto(`${base}/?datum=${iso(morgen)}&kind=1`)
  await page.getByRole('button', { name: 'Wie zuletzt' }).click()
  await page.getByText(/Werte übernommen/).first().waitFor()
  await page.getByRole('tab', { name: /Kognition/ }).click()
  await shot('06-wie-zuletzt')
  const f2 = page.getByTestId('item-kog-fokus').getByRole('button', { name: /^Stufe 1/ })
  await until(pressed(f2), 'Wie zuletzt übernimmt Wert')
  await page.getByRole('button', { name: 'Alle bestätigen' }).click()
  await page.getByRole('button', { name: 'Alle bestätigen' }).waitFor({ state: 'detached' })
  ok(true, 'übernommene Werte bestätigt')

  await page.goto(base + '/verlauf')
  await page.getByText(/Werktagen dokumentiert/).waitFor()
  await shot('07-verlauf')
  await page.goto(base + '/mehr'); await shot('08-mehr')
  await page.goto(base + '/kinder'); await shot('09-kinder')

  ok(external.length === 0, 'keine externen Requests (' + external.join(', ') + ')')
  ok(errors.length === 0, 'keine Konsolenfehler ' + errors.join(' | '))
  console.log('E2E PHASE 2 OK')
} catch (e) {
  console.error(e.message); await shot('fehler').catch(() => {}); process.exitCode = 1
} finally {
  await browser.close(); server.kill()
}
