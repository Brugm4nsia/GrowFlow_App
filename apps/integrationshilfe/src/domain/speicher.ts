/** Bittet den Browser, die Daten dauerhaft zu speichern (schützt vor automatischem Löschen bei Speichermangel). */
export async function fordereDauerhaftenSpeicher(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) {
      if (await navigator.storage.persisted?.()) return true
      return await navigator.storage.persist()
    }
  } catch {
    /* nicht unterstützt */
  }
  return false
}

export async function speicherStatus(): Promise<{ dauerhaft: boolean | null; genutzt?: number; kontingent?: number }> {
  try {
    const dauerhaft = (await navigator.storage?.persisted?.()) ?? null
    const est = await navigator.storage?.estimate?.()
    return { dauerhaft, genutzt: est?.usage, kontingent: est?.quota }
  } catch {
    return { dauerhaft: null }
  }
}
