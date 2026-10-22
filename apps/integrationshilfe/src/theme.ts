import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

// Ruhige, kontrastreiche Palette; Blau als einzige Akzentfarbe.
export const theme = extendTheme({
  config,
  fonts: {
    heading: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    body: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  colors: {
    brand: {
      50: '#E8F0FA', 100: '#D6E6F5', 200: '#9CC1E4', 300: '#5E9BD1', 400: '#2F73B5',
      500: '#1E4E8C', 600: '#1B4A82', 700: '#163C69', 800: '#112E51', 900: '#0B1F37',
    },
  },
  semanticTokens: {
    colors: {
      'bg.app': { default: '#F7F9FC', _dark: '#10161F' },
      'bg.card': { default: '#FFFFFF', _dark: '#18212D' },
      'bg.soft': { default: '#EDF2F7', _dark: '#202B3A' },
      'text.main': { default: '#1A202C', _dark: '#F1F5F9' },
      'text.mute': { default: '#4A5568', _dark: '#B6C2D2' },
      'line': { default: '#CBD5E0', _dark: '#3A4859' },
      // Rahmen interaktiver Elemente (Eingabefelder, Stufen-Buttons): mindestens 3:1 Kontrast (WCAG 1.4.11).
      'border.ui': { default: '#718096', _dark: '#8A9BB0' },
      'accent': { default: '#1E4E8C', _dark: '#8DB8E8' },
    },
  },
  styles: {
    global: {
      body: { bg: 'bg.app', color: 'text.main', lineHeight: 1.5 },
      'button, [role="button"], a': { touchAction: 'manipulation' },
    },
  },
  components: {
    Button: {
      baseStyle: { fontWeight: 600, borderRadius: 'lg', _focusVisible: { boxShadow: '0 0 0 3px #5E9BD1' } },
      defaultProps: { colorScheme: 'brand' },
      // Touch-Ziele: auch kleine Buttons mindestens 44 px.
      sizes: { sm: { h: '44px', minW: '44px', fontSize: 'sm', px: 3 }, md: { h: '48px', minW: '48px' }, lg: { h: '52px', fontSize: 'md' } },
    },
    Input: { defaultProps: { focusBorderColor: 'brand.400' }, variants: { outline: { field: { borderColor: 'border.ui' } } }, sizes: { md: { field: { h: '48px', fontSize: '16px' } } } },
    Textarea: { defaultProps: { focusBorderColor: 'brand.400' }, baseStyle: { fontSize: '16px' }, variants: { outline: { borderColor: 'border.ui' } } },
    Select: { defaultProps: { focusBorderColor: 'brand.400' }, variants: { outline: { field: { borderColor: 'border.ui' } } }, sizes: { md: { field: { h: '48px', fontSize: '16px' } } } },
    Tabs: { defaultProps: { colorScheme: 'brand' } },
    Checkbox: { defaultProps: { colorScheme: 'brand' } },
  },
})
