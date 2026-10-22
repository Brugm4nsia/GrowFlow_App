import { zipSync } from 'fflate'
import type { BerichtDaten } from '../domain/auswertung'

/** Dateiname: Kürzel statt Klarname, Sonderzeichen entfernt. */
export function dateiname(kuerzel: string, von: string, bis: string): string {
  const sicher = kuerzel.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'Kind'
  return `Verlaufsbericht_${sicher}_${von}_${bis}.pdf`
}

/** Erzeugt das PDF im Browser. Renderer, Report und Schrift werden erst hier nachgeladen. */
export async function erzeugePdf(daten: BerichtDaten): Promise<Blob> {
  const [{ pdf }, { Report, registerFonts }, { FONT_URLS }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./Report'),
    import('./fonts'),
  ])
  registerFonts(FONT_URLS)
  return pdf(Report({ daten })).toBlob()
}

export interface PdfDatei {
  name: string
  blob: Blob
}

/** Macht Dateinamen eindeutig (zwei Kinder mit gleichem Kürzel). */
export function eindeutigeNamen(namen: string[]): string[] {
  const gesehen = new Map<string, number>()
  return namen.map((n) => {
    const k = gesehen.get(n) ?? 0
    gesehen.set(n, k + 1)
    return k === 0 ? n : n.replace(/\.pdf$/, `_${k + 1}.pdf`)
  })
}

export async function zipDateien(dateien: PdfDatei[]): Promise<Blob> {
  const namen = eindeutigeNamen(dateien.map((d) => d.name))
  const eintraege: Record<string, Uint8Array> = {}
  for (let i = 0; i < dateien.length; i++) eintraege[namen[i]] = new Uint8Array(await dateien[i].blob.arrayBuffer())
  // PDFs sind bereits komprimiert: Level 0 reicht und ist schnell.
  const zip = zipSync(eintraege, { level: 0 })
  return new Blob([zip], { type: 'application/zip' })
}

export function lade(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

export function kannTeilen(blob: Blob, name: string): boolean {
  try {
    const f = new File([blob], name, { type: blob.type })
    return !!navigator.canShare?.({ files: [f] })
  } catch {
    return false
  }
}

export async function teile(blob: Blob, name: string): Promise<boolean> {
  try {
    await navigator.share({ files: [new File([blob], name, { type: blob.type })], title: name })
    return true
  } catch {
    return false // abgebrochen oder nicht unterstützt
  }
}
