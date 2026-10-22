import { Alert, AlertDescription, AlertIcon, Box, Input, Textarea } from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import { findeEtikett } from '../domain/katalog'

interface Props {
  wert: string
  onSpeichern: (t: string) => void
  placeholder?: string
  zeilen?: number
  einzeilig?: boolean
  label: string
  /** Etikett-Hinweis anzeigen (Standard: ja). */
  hinweis?: boolean
}

/** Textfeld mit Autosave (Debounce, Speichern beim Verlassen und beim Ausblenden). */
export function AutoText({ wert, onSpeichern, placeholder, zeilen = 3, einzeilig, label, hinweis = true }: Props) {
  const [text, setText] = useState(wert)
  const dirty = useRef(false)
  const timer = useRef<number>()
  const latest = useRef({ text, onSpeichern })
  latest.current = { text, onSpeichern }

  useEffect(() => {
    if (!dirty.current) setText(wert)
  }, [wert])

  const flush = () => {
    window.clearTimeout(timer.current)
    if (dirty.current) {
      dirty.current = false
      latest.current.onSpeichern(latest.current.text)
    }
  }
  // Beim Ausblenden (Tab-Wechsel, Datumswechsel) ungespeicherten Text sichern.
  useEffect(() => flush, []) // eslint-disable-line react-hooks/exhaustive-deps

  const aendern = (t: string) => {
    setText(t)
    latest.current.text = t
    dirty.current = true
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, 500)
  }
  const etikett = hinweis ? findeEtikett(text) : undefined
  const gemeinsam = { value: text, onChange: (e: { target: { value: string } }) => aendern(e.target.value), onBlur: flush, placeholder, 'aria-label': label }

  return (
    <Box>
      {einzeilig ? <Input {...gemeinsam} /> : <Textarea {...gemeinsam} rows={zeilen} />}
      {etikett ? (
        <Alert status="info" mt={2} borderRadius="md" fontSize="sm" alignItems="flex-start">
          <AlertIcon mt="2px" />
          <AlertDescription>
            <b>Formulierungs-Tipp:</b> „{etikett.wort}“ ist eine Wertung. {etikett.alternative}
          </AlertDescription>
        </Alert>
      ) : null}
    </Box>
  )
}
