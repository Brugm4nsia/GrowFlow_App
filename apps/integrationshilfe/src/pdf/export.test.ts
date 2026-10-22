import { unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { dateiname, eindeutigeNamen, zipDateien } from './export'

describe('Export-Hilfen', () => {
  it('Dateiname nutzt Kürzel ohne Sonderzeichen', () => {
    expect(dateiname('Mia M.', '2026-09-01', '2026-09-30')).toBe('Verlaufsbericht_Mia-M_2026-09-01_2026-09-30.pdf')
    expect(dateiname('  ', '2026-09-01', '2026-09-30')).toContain('_Kind_')
    expect(dateiname('Jörg/Ö', '2026-09-01', '2026-09-30')).toBe('Verlaufsbericht_Jörg-Ö_2026-09-01_2026-09-30.pdf')
  })
  it('macht gleiche Namen eindeutig', () => {
    expect(eindeutigeNamen(['a.pdf', 'b.pdf', 'a.pdf'])).toEqual(['a.pdf', 'b.pdf', 'a_2.pdf'])
  })
  it('ZIP enthält je Datei einen Eintrag mit unverändertem Inhalt', async () => {
    const a = new Blob([new Uint8Array([1, 2, 3])], { type: 'application/pdf' })
    const b = new Blob([new Uint8Array([4, 5])], { type: 'application/pdf' })
    const zip = await zipDateien([{ name: 'a.pdf', blob: a }, { name: 'a.pdf', blob: b }])
    const entpackt = unzipSync(new Uint8Array(await zip.arrayBuffer()))
    expect(Object.keys(entpackt).sort()).toEqual(['a.pdf', 'a_2.pdf'])
    expect([...entpackt['a.pdf']]).toEqual([1, 2, 3])
    expect([...entpackt['a_2.pdf']]).toEqual([4, 5])
  })
})
