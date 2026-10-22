import { Box, Button, SimpleGrid, Stack, Text, Wrap, WrapItem } from '@chakra-ui/react'
import { BARRIEREN, FOERDERFAKTOREN, LAERM_STUFEN } from '../../domain/katalog'
import type { Stufe } from '../../domain/types'
import { Chip, WirksamkeitWahl } from './ItemZeile'
import type { ErfassungsKontext } from './kontext'

export function UmweltTab({ ctx }: { ctx: ErfassungsKontext }) {
  const eints = ctx.kinder.map((k) => ctx.eintraege.get(k.id!))
  const alle = (f: (u: NonNullable<(typeof eints)[number]>['umwelt']) => boolean) => eints.every((e) => e && f(e.umwelt))
  const foerder = [...FOERDERFAKTOREN, ...ctx.einst.eigeneFoerder]
  const barrieren = [...BARRIEREN, ...ctx.einst.eigeneBarrieren]
  const laerm = eints.every((e) => e?.umwelt.laerm === eints[0]?.umwelt.laerm) ? eints[0]?.umwelt.laerm : undefined
  const reiz = eints.every((e) => e?.umwelt.reizschutz === eints[0]?.umwelt.reizschutz) ? eints[0]?.umwelt.reizschutz : undefined

  return (
    <Stack spacing={5}>
      <Text fontSize="sm" color="text.mute">Der Kontext gilt für den ganzen Tag. Mehrfachauswahl; nichts auswählen = nichts beobachtet.</Text>
      <Box>
        <Text fontWeight={700} mb={2}>Förderfaktoren</Text>
        <Wrap spacing={2}>
          {foerder.map((f) => (
            <WrapItem key={f}>
              <Chip aktiv={alle((u) => u.foerder.includes(f))} onClick={() => {
                const entfernen = alle((u) => u.foerder.includes(f))
                ctx.aendere((e) => { e.umwelt.foerder = entfernen ? e.umwelt.foerder.filter((x) => x !== f) : e.umwelt.foerder.includes(f) ? e.umwelt.foerder : [...e.umwelt.foerder, f] })
              }}>{f}</Chip>
            </WrapItem>
          ))}
        </Wrap>
      </Box>
      <Box>
        <Text fontWeight={700} mb={2}>Barrieren</Text>
        <Wrap spacing={2}>
          {barrieren.map((b) => (
            <WrapItem key={b}>
              <Chip aktiv={alle((u) => u.barrieren.includes(b))} onClick={() => {
                const entfernen = alle((u) => u.barrieren.includes(b))
                ctx.aendere((e) => { e.umwelt.barrieren = entfernen ? e.umwelt.barrieren.filter((x) => x !== b) : e.umwelt.barrieren.includes(b) ? e.umwelt.barrieren : [...e.umwelt.barrieren, b] })
              }}>{b}</Chip>
            </WrapItem>
          ))}
        </Wrap>
      </Box>
      <Box>
        <Text fontWeight={700} mb={2}>Lärmpegel im Klassenraum</Text>
        <SimpleGrid columns={5} spacing={2}>
          {LAERM_STUFEN.map((t, i) => (
            <Button key={t} variant={laerm === i ? 'solid' : 'outline'} aria-pressed={laerm === i} h="auto" minH="52px" py={2} px={1} fontSize="xs" whiteSpace="normal"
              onClick={() => ctx.aendere((e) => { e.umwelt.laerm = laerm === i ? undefined : (i as Stufe) })}>
              {t}
            </Button>
          ))}
        </SimpleGrid>
      </Box>
      <Box>
        <Text fontWeight={700} mb={2}>Wirksamkeit des Reizschutzes</Text>
        <WirksamkeitWahl label="Wirksamkeit des Reizschutzes" wert={reiz} onWahl={(w) => ctx.aendere((e) => { e.umwelt.reizschutz = w })} />
      </Box>
    </Stack>
  )
}
