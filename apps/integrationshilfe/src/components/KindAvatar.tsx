import { Box } from '@chakra-ui/react'
import type { Kind } from '../domain/types'

export function kuerzel(name: string): string {
  const t = name.trim()
  return (t.slice(0, 2) || '?').replace(/^./, (c) => c.toUpperCase())
}

export function KindAvatar({ kind, size = 28 }: { kind: Pick<Kind, 'name' | 'farbe'>; size?: number }) {
  return (
    <Box
      aria-hidden
      w={`${size}px`}
      h={`${size}px`}
      borderRadius="full"
      bg={kind.farbe}
      color="white"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      fontSize={`${Math.round(size * 0.42)}px`}
      fontWeight={700}
      flexShrink={0}
    >
      {kuerzel(kind.name)}
    </Box>
  )
}
