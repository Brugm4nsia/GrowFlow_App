import { Alert, AlertDescription, AlertIcon, Box, Stack, Text, Wrap, WrapItem } from '@chakra-ui/react'
import { ALLGEMEINE_BAUSTEINE, baustein, FORMULIERUNGS_ERINNERUNG, MASSNAHMEN } from '../../domain/katalog'
import { umschalten } from '../../domain/erfassung'
import { useEigeneBausteine } from '../../domain/hooks'
import { AutoText } from '../AutoText'
import { Chip, WirksamkeitWahl } from './ItemZeile'
import type { ErfassungsKontext } from './kontext'
import type { Wirksamkeit } from '../../domain/types'

export function TagTab({ ctx }: { ctx: ErfassungsKontext }) {
  const eigene = useEigeneBausteine().filter((b) => b.itemId === '').map((b) => b.text)
  const eints = ctx.kinder.map((k) => ctx.eintraege.get(k.id!))
  const alle = (f: (e: NonNullable<(typeof eints)[number]>) => boolean) => eints.every((e) => e && f(e))
  const methoden = [...MASSNAHMEN, ...ctx.einst.eigeneMassnahmen]
  const einzel = ctx.einzeln ? eints[0] : undefined
  const k0 = ctx.kinder[0]
  const wirk = (m: string): Wirksamkeit | undefined => (alle((e) => e.massnahmen.some((x) => x.methode === m)) ? eints[0]?.massnahmen.find((x) => x.methode === m)?.wirksamkeit : undefined)
  const key = `${ctx.datum}-${k0.id}`

  return (
    <Stack spacing={5}>
      <Alert status="info" borderRadius="md" fontSize="sm" alignItems="flex-start">
        <AlertIcon mt="2px" />
        <AlertDescription>{FORMULIERUNGS_ERINNERUNG}</AlertDescription>
      </Alert>

      <Box>
        <Text fontWeight={700} mb={1}>Assistenzmethoden heute</Text>
        <Text fontSize="sm" color="text.mute" mb={2}>Welche Maßnahme wurde eingesetzt – und wie wirksam war sie?</Text>
        <Wrap spacing={2}>
          {methoden.map((m) => (
            <WrapItem key={m}>
              <Chip aktiv={alle((e) => e.massnahmen.some((x) => x.methode === m))} onClick={() => {
                const entfernen = alle((e) => e.massnahmen.some((x) => x.methode === m))
                ctx.aendere((e) => { e.massnahmen = entfernen ? e.massnahmen.filter((x) => x.methode !== m) : e.massnahmen.some((x) => x.methode === m) ? e.massnahmen : [...e.massnahmen, { methode: m }] })
              }}>{m}</Chip>
            </WrapItem>
          ))}
        </Wrap>
        <Stack spacing={3} mt={3}>
          {methoden.filter((m) => alle((e) => e.massnahmen.some((x) => x.methode === m))).map((m) => (
            <Box key={m}>
              <Text fontSize="sm" fontWeight={600} mb={1}>Wirksamkeit: {m}</Text>
              <WirksamkeitWahl label={`Wirksamkeit: ${m}`} wert={wirk(m)} onWahl={(w) => ctx.aendere((e) => { const x = e.massnahmen.find((y) => y.methode === m); if (x) x.wirksamkeit = w })} />
            </Box>
          ))}
        </Stack>
      </Box>

      <Box>
        <Text fontWeight={700} mb={1}>Was ist heute gelungen?</Text>
        {ctx.einzeln ? (
          <AutoText key={`${key}-res`} label="Was ist heute gelungen?" wert={einzel?.ressourcen ?? ''} zeilen={2} placeholder="Ressourcen, Fortschritte, Gelungenes"
            onSpeichern={(t) => ctx.aendere((e) => { e.ressourcen = t.trim() ? t : undefined })} />
        ) : (
          <Text fontSize="sm" color="text.mute">Persönliche Texte: dafür ein einzelnes Kind auswählen.</Text>
        )}
      </Box>

      <Box>
        <Text fontWeight={700} mb={2}>Textbausteine zum Tag</Text>
        <Wrap spacing={2}>
          {[...ALLGEMEINE_BAUSTEINE, ...eigene].map((b) => (
            <WrapItem key={b}>
              <Chip aktiv={alle((e) => !!e.tagesbausteine?.includes(b))} onClick={() => ctx.aendere((e) => { e.tagesbausteine = umschalten(e.tagesbausteine ?? [], b) })}>
                {baustein(b, ctx.kinder.length === 1 ? k0.name : '{Kind}')}
              </Chip>
            </WrapItem>
          ))}
        </Wrap>
      </Box>

      <Box>
        <Text fontWeight={700} mb={1}>Tagesnotiz</Text>
        {ctx.einzeln ? (
          <AutoText key={`${key}-notiz`} label="Tagesnotiz" wert={einzel?.tagesnotiz ?? ''} zeilen={4} placeholder="Besonderheiten des Tages – konkret und sachlich"
            onSpeichern={(t) => ctx.aendere((e) => { e.tagesnotiz = t.trim() ? t : undefined })} />
        ) : (
          <Text fontSize="sm" color="text.mute">Persönliche Texte: dafür ein einzelnes Kind auswählen.</Text>
        )}
      </Box>
    </Stack>
  )
}
