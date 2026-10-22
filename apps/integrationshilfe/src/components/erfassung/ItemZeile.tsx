import { Box, Button, Collapse, Flex, HStack, SimpleGrid, Text, Wrap, WrapItem } from '@chakra-ui/react'
import { useState } from 'react'
import { gemeinsameStufe, setzeStufe, tippAktion, umschalten } from '../../domain/erfassung'
import { baustein, MASSNAHMEN, STUFEN, STUFEN_FARBE, WIRKSAMKEIT } from '../../domain/katalog'
import type { Item, Stufe, Wirksamkeit } from '../../domain/types'
import { AutoText } from '../AutoText'
import { KindAvatar } from '../KindAvatar'
import type { ErfassungsKontext } from './kontext'

export function WirksamkeitWahl({ wert, onWahl, label }: { wert?: Wirksamkeit; onWahl: (w: Wirksamkeit | undefined) => void; label: string }) {
  return (
    <HStack role="group" aria-label={label} spacing={2} wrap="wrap">
      {WIRKSAMKEIT.map((w) => (
        <Button
          key={w.id}
          size="md"
          minH="44px"
          variant={wert === w.id ? 'solid' : 'outline'}
          aria-pressed={wert === w.id}
          onClick={() => onWahl(wert === w.id ? undefined : w.id)}
        >
          {w.label}
        </Button>
      ))}
    </HStack>
  )
}

export function Chip({ aktiv, children, onClick }: { aktiv: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      aria-pressed={aktiv}
      variant={aktiv ? 'solid' : 'outline'}
      h="auto"
      minH="44px"
      py={2}
      px={3}
      whiteSpace="normal"
      textAlign="left"
      fontWeight={aktiv ? 600 : 500}
      fontSize="sm"
      lineHeight={1.3}
    >
      {children}
    </Button>
  )
}

export function ItemZeile({ item, ctx, alleMassnahmen }: { item: Item; ctx: ErfassungsKontext; alleMassnahmen: string[] }) {
  const [offen, setOffen] = useState(false)
  const betroffen = ctx.kinder.filter((k) => k.aktiveItems.includes(item.id))
  const werte = betroffen.map((k) => ctx.eintraege.get(k.id!)?.werte[item.id])
  const gemeinsam = gemeinsameStufe(werte)
  const uebernommen = werte.some((w) => w?.uebernommen)
  const hatDetails = werte.some((w) => w?.bausteine?.length || w?.notiz || w?.massnahme)
  const einzelnerWert = betroffen.length === 1 ? werte[0] : undefined

  const tippen = (s: Stufe) => {
    const aktion = tippAktion(werte, s)
    ctx.aendere((e) => setzeStufe(e, item.id, aktion === 'entfernen' ? undefined : s), betroffen)
  }
  const alleHaben = (pruef: (w: (typeof werte)[number]) => boolean) => werte.length > 0 && werte.every(pruef)

  return (
    <Box bg="bg.card" borderWidth="1px" borderColor="line" borderRadius="xl" p={3} data-testid={`item-${item.id}`}>
      <Flex justify="space-between" align="start" gap={2} mb={1}>
        <Box minW={0}>
          <Text fontWeight={700} lineHeight={1.3}>{item.label}</Text>
          <Text fontSize="sm" color="text.mute" lineHeight={1.3}>{item.hinweis}</Text>
        </Box>
        {ctx.kinder.length > 1 ? (
          <HStack spacing="-6px" flexShrink={0} aria-label={`Gilt für: ${betroffen.map((k) => k.name).join(', ')}`}>
            {betroffen.map((k) => <KindAvatar key={k.id} kind={k} size={22} />)}
          </HStack>
        ) : null}
      </Flex>

      <SimpleGrid columns={5} spacing={2} mt={2} role="group" aria-label={`${item.label}: Assistenzstufe`}>
        {STUFEN.map(({ stufe, titel }) => {
          const aktiv = gemeinsam === stufe
          const f = STUFEN_FARBE[stufe]
          return (
            <Button
              key={stufe}
              onClick={() => tippen(stufe)}
              aria-pressed={aktiv}
              aria-label={`Stufe ${stufe}: ${titel}`}
              h="52px"
              minW={0}
              px={0}
              fontSize="xl"
              fontWeight={700}
              borderRadius="lg"
              bg={aktiv ? f.bg : 'bg.card'}
              color={aktiv ? f.fg : 'text.main'}
              borderWidth={aktiv ? '3px' : '1px'}
              borderStyle={aktiv && uebernommen ? 'dashed' : 'solid'}
              borderColor={aktiv ? 'text.main' : 'line'}
              boxShadow={`inset 0 -7px 0 ${f.bg}`}
              _hover={{ bg: aktiv ? f.bg : 'bg.soft' }}
              _active={{ bg: f.bg }}
              position="relative"
            >
              {stufe}
            </Button>
          )
        })}
      </SimpleGrid>

      <Flex mt={2} justify="space-between" align="center" gap={2} minH="28px">
        <Text fontSize="sm" color="text.mute" aria-live="polite">
          {gemeinsam === undefined
            ? 'nicht beobachtet'
            : gemeinsam === 'unterschiedlich'
              ? 'Kinder unterschiedlich – Tipp setzt für alle'
              : `${gemeinsam} · ${STUFEN[gemeinsam].titel}${uebernommen ? ' · übernommen, zum Bestätigen antippen' : ''}`}
        </Text>
        <Button size="sm" variant="ghost" onClick={() => setOffen(!offen)} aria-expanded={offen} minH="40px" flexShrink={0}>
          {offen ? 'Weniger' : hatDetails ? 'Details ●' : 'Details'}
        </Button>
      </Flex>
      {ctx.kinder.length > 1 && gemeinsam === 'unterschiedlich' ? (
        <Text fontSize="sm" color="text.mute">
          {betroffen.map((k, i) => `${k.name}: ${werte[i]?.stufe ?? '–'}`).join(' · ')}
        </Text>
      ) : null}

      <Collapse in={offen} animateOpacity unmountOnExit>
        <Box pt={2} borderTopWidth="1px" borderColor="line" mt={2}>
          <Text fontSize="sm" fontWeight={600} mb={1}>Textbausteine</Text>
          <Wrap spacing={2} mb={3}>
            {item.bausteine.map((b) => (
              <WrapItem key={b}>
                <Chip
                  aktiv={alleHaben((w) => !!w?.bausteine?.includes(b))}
                  onClick={() =>
                    ctx.aendere((e) => {
                      const w = (e.werte[item.id] ??= {})
                      w.bausteine = umschalten(w.bausteine ?? [], b)
                    }, betroffen)
                  }
                >
                  {baustein(b, ctx.kinder.length === 1 ? ctx.kinder[0].name : '{Kind}')}
                </Chip>
              </WrapItem>
            ))}
          </Wrap>

          {ctx.einzeln ? (
            <Box mb={3}>
              <Text fontSize="sm" fontWeight={600} mb={1}>Kurznotiz</Text>
              <AutoText
                key={`${ctx.datum}-${betroffen[0]?.id}-${item.id}`}
                label={`Kurznotiz zu ${item.label}`}
                wert={einzelnerWert?.notiz ?? ''}
                zeilen={2}
                placeholder="Konkret beschreiben, was zu sehen/zu hören war"
                onSpeichern={(t) => ctx.aendere((e) => { (e.werte[item.id] ??= {}).notiz = t.trim() ? t : undefined }, betroffen)}
              />
            </Box>
          ) : (
            <Text fontSize="sm" color="text.mute" mb={3}>Kurznotizen sind persönlich – dafür ein einzelnes Kind auswählen.</Text>
          )}

          <Text fontSize="sm" fontWeight={600} mb={1}>Assistenzmethode</Text>
          <Wrap spacing={2} mb={2}>
            {[...MASSNAHMEN, ...alleMassnahmen].map((m) => (
              <WrapItem key={m}>
                <Chip
                  aktiv={alleHaben((w) => w?.massnahme === m)}
                  onClick={() =>
                    ctx.aendere((e) => {
                      const w = (e.werte[item.id] ??= {})
                      if (w.massnahme === m) { delete w.massnahme; delete w.wirksamkeit } else w.massnahme = m
                    }, betroffen)
                  }
                >
                  {m}
                </Chip>
              </WrapItem>
            ))}
          </Wrap>
          {alleHaben((w) => !!w?.massnahme) ? (
            <WirksamkeitWahl
              label="Wirksamkeit der Assistenzmethode"
              wert={einzelnerWert?.wirksamkeit ?? (alleHaben((w) => w?.wirksamkeit === werte[0]?.wirksamkeit) ? werte[0]?.wirksamkeit : undefined)}
              onWahl={(wk) => ctx.aendere((e) => { (e.werte[item.id] ??= {}).wirksamkeit = wk }, betroffen)}
            />
          ) : null}
        </Box>
      </Collapse>
    </Box>
  )
}
