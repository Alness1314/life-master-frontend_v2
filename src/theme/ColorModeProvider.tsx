import { useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { PaletteMode } from '@mui/material'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { ColorModeContext } from './colorModeContext'
import { getAppTheme } from './theme'

const THEME_KEY = 'life_master_theme'

function getInitialMode(): PaletteMode {
  const storedMode = localStorage.getItem(THEME_KEY)
  if (storedMode === 'light' || storedMode === 'dark') return storedMode
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ColorModeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode)

  const value = useMemo(() => ({
    mode,
    toggleColorMode: () => {
      setMode((currentMode) => {
        const nextMode = currentMode === 'light' ? 'dark' : 'light'
        localStorage.setItem(THEME_KEY, nextMode)
        return nextMode
      })
    },
  }), [mode])

  const theme = useMemo(() => getAppTheme(mode), [mode])

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}
