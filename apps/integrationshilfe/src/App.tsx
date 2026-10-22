import { Box, Flex, Text } from '@chakra-ui/react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { IcBericht, IcHeute, IcKinder, IcMehr, IcVerlauf } from './components/icons'
import { Heute } from './pages/Heute'
import { Verlauf } from './pages/Verlauf'
import { Bericht } from './pages/Bericht'
import { KinderListe } from './pages/KinderListe'
import { KindFormular } from './pages/KindFormular'
import { Mehr } from './pages/Mehr'

const NAV = [
  { to: '/', label: 'Heute', icon: IcHeute, end: true },
  { to: '/verlauf', label: 'Verlauf', icon: IcVerlauf },
  { to: '/bericht', label: 'Bericht', icon: IcBericht },
  { to: '/kinder', label: 'Kinder', icon: IcKinder },
  { to: '/mehr', label: 'Mehr', icon: IcMehr },
]

export function App() {
  return (
    <Flex direction="column" minH="100dvh">
      <Box as="main" flex="1" pb="calc(76px + env(safe-area-inset-bottom))">
        <Routes>
          <Route path="/" element={<Heute />} />
          <Route path="/verlauf" element={<Verlauf />} />
          <Route path="/bericht" element={<Bericht />} />
          <Route path="/kinder" element={<KinderListe />} />
          <Route path="/kinder/neu" element={<KindFormular />} />
          <Route path="/kinder/:id" element={<KindFormular />} />
          <Route path="/mehr" element={<Mehr />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
      <Flex
        as="nav"
        aria-label="Hauptnavigation"
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="bg.card"
        borderTopWidth="1px"
        borderColor="line"
        pb="env(safe-area-inset-bottom)"
        zIndex={20}
        justify="center"
      >
        <Flex w="full" maxW="760px">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} style={{ flex: 1 }}>
              {({ isActive }) => (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  minH="60px"
                  gap="2px"
                  color={isActive ? 'accent' : 'text.mute'}
                  fontWeight={isActive ? 700 : 500}
                  borderTopWidth="3px"
                  borderTopColor={isActive ? 'accent' : 'transparent'}
                >
                  <Icon boxSize="24px" />
                  <Text fontSize="12px">{label}</Text>
                </Flex>
              )}
            </NavLink>
          ))}
        </Flex>
      </Flex>
    </Flex>
  )
}
