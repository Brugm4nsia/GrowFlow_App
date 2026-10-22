// dexie-export-import erwartet ein Browser-globales `self`.
;(globalThis as { self?: unknown }).self ??= globalThis

// Minimaler FileReader-Ersatz (Node hat keinen) – nur, was dexie-export-import nutzt.
if (typeof (globalThis as { FileReader?: unknown }).FileReader === 'undefined') {
  class FileReaderPoly {
    result: string | ArrayBuffer | null = null
    error: unknown = null
    onload: ((e: unknown) => void) | null = null
    onerror: ((e: unknown) => void) | null = null
    private fertig(p: Promise<string | ArrayBuffer>) {
      p.then((r) => { this.result = r; this.onload?.({ target: this }) }, (e) => { this.error = e; this.onerror?.({ target: this }) })
    }
    readAsArrayBuffer(b: Blob) { this.fertig(b.arrayBuffer()) }
    readAsText(b: Blob) { this.fertig(b.text()) }
  }
  ;(globalThis as { FileReader?: unknown }).FileReader = FileReaderPoly
}
