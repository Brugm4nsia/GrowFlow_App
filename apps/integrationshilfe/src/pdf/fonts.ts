// Nur für den Browser (Vite ?url). Im Node-Test werden Dateipfade an registerFonts übergeben.
import regular from '@fontsource/inter/files/inter-latin-400-normal.woff?url'
import semibold from '@fontsource/inter/files/inter-latin-600-normal.woff?url'
import bold from '@fontsource/inter/files/inter-latin-700-normal.woff?url'

export const FONT_URLS = { regular, semibold, bold }
