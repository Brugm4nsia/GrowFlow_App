import { Box, Heading, HStack, type BoxProps } from '@chakra-ui/react'
import type { ReactNode } from 'react'

export function Seite({ titel, aktion, children, ...rest }: { titel: string; aktion?: ReactNode; children: ReactNode } & BoxProps) {
  return (
    <Box as="section" maxW="760px" mx="auto" px={4} pt={4} pb={6} {...rest}>
      <HStack justify="space-between" mb={3} align="center" minH="40px">
        <Heading as="h1" size="lg" fontWeight={700}>
          {titel}
        </Heading>
        {aktion}
      </HStack>
      {children}
    </Box>
  )
}

export function Karte({ children, ...rest }: { children: ReactNode } & BoxProps) {
  return (
    <Box bg="bg.card" borderWidth="1px" borderColor="line" borderRadius="xl" p={4} {...rest}>
      {children}
    </Box>
  )
}
