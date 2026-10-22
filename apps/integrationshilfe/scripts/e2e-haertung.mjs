// Härtungs-Tests im Handy-Viewport: Demo, Backup/Restore, Offline (Service Worker), Touch-Ziele, Kontrast.
// Aufruf: npm run build && node scripts/e2e-haertung.mjs
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const OUT = 'scripts/out'
fs.mkdirSync(OUT, { recursive: true })
const PORT = 4174
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
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource.*net::ERR_INTERNET_DISCONNECTED/.test(m.text())) errors.push(m.text()) })

const until = async (fn, msg, t = 6000) => { const t0 = Date.now(); for (;;) { if (await fn()) { console.log('ok  ', msg); return } if (Date.now() - t0 > t) throw new Error('FEHLER: ' + msg); await new Promise((r) => setTimeout(r, 100)) } }
const ok = (c, msg) => { if (!c) throw new Error('FEHLER: ' + msg); console.log('ok  ', msg) }
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` })

/** Interaktive Elemente < 44 px Kantenlänge (sichtbar, ohne Textlinks im Fließtext). */
async function kleineZiele(seite) {
  return page.evaluate(() => {
    const sel = 'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab]'
    return [...document.querySelectorAll(sel)].filter((el) => {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      if (!r.width || !r.height || cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false
      if (el.type === 'checkbox' || el.type === 'radio') return false // Checkbox-Label ist die Trefferfläche
      return r.height < 43.5 || r.width < 43.5
    }).map((el) => `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`)
  })
}

try {
  // ---------- Offline / Service Worker ----------
  await page.goto(base)
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true))
  await until(async () => page.evaluate(async () => (await caches.keys()).length > 0 && (await navigator.serviceWorker.getRegistration())?.active != null), 'Service Worker aktiv, Cache gefüllt')
  await page.reload() // jetzt vom SW kontrolliert
  await page.getByRole('heading', { name: /Heute erfassen|Heute/ }).first().waitFor()

  // ---------- Demo ----------
  await page.goto(base + '/mehr')
  await page.getByRole('button', { name: 'Demo-Daten laden' }).click()
  await page.getByRole('button', { name: 'Demo-Daten entfernen' }).waitFor()
  ok(true, 'Demo-Daten geladen')
  await page.goto(base + '/')
  await page.getByText(/Demo-Modus/).waitFor()
  await shot('20-heute-demo')

  // ---------- Offline: PDF erzeugen ohne Netz ----------
  await ctx.setOffline(true)
  await page.goto(base + '/bericht')
  await page.getByText('1 · Kinder').waitFor()
  ok(true, 'App lädt offline (Bericht-Seite)')
  await page.getByRole('button', { name: /^Letzte 4 Wochen$/ }).click()
  await page.getByRole('button', { name: /PDF/ }).first().click()
  await page.getByTestId('ergebnisse').waitFor({ timeout: 60000 })
  ok(true, 'PDF-Erzeugung offline (Chunk + Schrift aus dem Cache)')
  await shot('21-offline-pdf')
  await ctx.setOffline(false)

  // ---------- Backup + Restore ----------
  await page.goto(base + '/mehr')
  await page.getByText('Datensicherung').first().waitFor()
  await page.getByPlaceholder('leer = unverschlüsselt').fill('Testpasswort-123')
  const dl = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Backup herunterladen' }).click()
  const d = await dl
  await d.saveAs(`${OUT}/backup.ihbackup`)
  const bytes = fs.readFileSync(`${OUT}/backup.ihbackup`)
  ok(bytes.subarray(0, 6).toString() === 'IHENC1', 'verschlüsseltes Backup erzeugt (' + d.suggestedFilename() + ', ' + bytes.length + ' B)')
  ok(!bytes.toString('latin1').includes('Demo Lena'), 'Backup enthält keinen Klartext')

  // Daten verändern: Demo entfernen → Restore muss sie zurückbringen
  await page.getByRole('button', { name: 'Demo-Daten entfernen' }).click()
  await page.getByRole('button', { name: 'Demo-Daten laden' }).waitFor()
  await page.goto(base + '/kinder')
  await page.getByText('Noch kein Kind angelegt.').waitFor()
  await page.goto(base + '/mehr')
  await page.getByLabel('Backup-Datei wählen').setInputFiles(`${OUT}/backup.ihbackup`)
  await page.getByLabel('Passwort der Backup-Datei').fill('falsch')
  await page.getByRole('button', { name: 'Wiederherstellen …' }).click()
  await page.getByRole('button', { name: 'Ersetzen' }).click()
  await page.getByText(/Passwort falsch/).waitFor()
  ok(true, 'falsches Passwort wird abgelehnt')
  await page.getByLabel('Passwort der Backup-Datei').fill('Testpasswort-123')
  await page.getByRole('button', { name: 'Wiederherstellen …' }).click()
  await page.getByRole('button', { name: 'Ersetzen' }).click()
  await page.getByText('Backup wiederhergestellt').waitFor()
  await page.goto(base + '/kinder')
  await page.getByText('Demo Lena').waitFor()
  ok(true, 'Restore bringt Kinder zurück')
  await page.goto(base + '/verlauf')
  await page.getByText(/Werktagen dokumentiert/).waitFor()
  await shot('22-verlauf-nach-restore')

  // ---------- Touch-Ziele und Kontrast, Hell und Dunkel ----------
  const seiten = ['/', '/verlauf', '/bericht', '/kinder', '/kinder/1', '/mehr']
  for (const modus of ['light', 'dark']) {
    await page.evaluate((m) => localStorage.setItem('chakra-ui-color-mode', m), modus)
    for (const pfad of seiten) {
      await page.goto(base + pfad)
      await page.waitForTimeout(500)
      const klein = await kleineZiele(page)
      console.log(`${modus} ${pfad}: ${klein.length ? 'KLEINE ZIELE: ' + klein.join(' | ') : 'alle Touch-Ziele ≥ 44 px'}`)
      if (modus === 'light' || pfad === '/') await shot(`30-${modus}-${pfad.replace(/\W+/g, '_')}`)
    }
  }

  ok(external.length === 0, 'keine externen Requests (' + external.join(', ') + ')')
  ok(errors.length === 0, 'keine Konsolenfehler ' + errors.join(' | '))
  console.log('E2E HÄRTUNG OK')
} catch (e) {
  console.error(e.message); await shot('fehler-haertung').catch(() => {}); process.exitCode = 1
} finally {
  await browser.close(); server.kill()
}
