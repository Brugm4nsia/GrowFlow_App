import { Badge, Box, Button, Flex, HStack, Switch, FormControl, FormLabel, Text, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { KindAvatar } from '../components/KindAvatar'
import { IcPlus } from '../components/icons'
import { Karte, Seite } from '../components/Seite'
import { useKinder } from '../domain/hooks'
import { anzeigeDatum } from '../domain/datum'

export function KinderListe() {
  const [archiv, setArchiv] = useState(false)
  const kinder = useKinder(archiv)

  return (
    <Seite
      titel="Kinder"
      aktion={
        <Button as={RouterLink} to="/kinder/neu" leftIcon={<IcPlus />} size="md">
          Neues Kind
        </Button>
      }
    >
      <VStack align="stretch" spacing={3}>
        {kinder === undefined ? null : kinder.length === 0 ? (
          <Karte>
            <Text fontWeight={600}>Noch kein Kind angelegt.</Text>
            <Text color="text.mute" mt={1}>
              Lege ein Kind mit Kürzel oder Vorname an (Pseudonym empfohlen) und wähle 5–10 Beobachtungspunkte aus.
            </Text>
            <Button as={RouterLink} to="/kinder/neu" mt={3} leftIcon={<IcPlus />}>
              Erstes Kind anlegen
            </Button>
          </Karte>
        ) : (
          kinder.map((k) => (
            <Box key={k.id} as={RouterLink} to={`/kinder/${k.id}`} display="block" _hover={{ textDecoration: 'none' }}>
              <Karte opacity={k.archiviert ? 0.7 : 1} _hover={{ borderColor: 'accent' }} minH="64px">
                <Flex align="center" gap={3}>
                  <KindAvatar kind={k} size={40} />
                  <Box flex="1" minW={0}>
                    <HStack>
                      <Text fontWeight={700} noOfLines={1}>
                        {k.name}
                      </Text>
                      {k.archiviert ? <Badge>archiviert</Badge> : null}
                    </HStack>
                    <Text fontSize="sm" color="text.mute" noOfLines={1}>
                      {[k.klasse && `Klasse ${k.klasse}`, k.schulart, `${k.aktiveItems.length} Beobachtungspunkte`].filter(Boolean).join(' · ')}
                    </Text>
                    {k.bewilligungBis ? (
                      <Text fontSize="sm" color="text.mute">
                        Bewilligung bis {anzeigeDatum(k.bewilligungBis)}
                      </Text>
                    ) : null}
                  </Box>
                </Flex>
              </Karte>
            </Box>
          ))
        )}
      </VStack>
      <FormControl display="flex" alignItems="center" mt={5} minH="44px">
        <Switch id="archiv" isChecked={archiv} onChange={(e) => setArchiv(e.target.checked)} mr={3} />
        <FormLabel htmlFor="archiv" mb={0}>
          Archivierte Kinder anzeigen
        </FormLabel>
      </FormControl>
    </Seite>
  )
}
