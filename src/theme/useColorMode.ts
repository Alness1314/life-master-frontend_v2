import { useContext } from 'react'
import { ColorModeContext } from './colorModeContext'

export function useColorMode() {
  const context = useContext(ColorModeContext)
  if (!context) throw new Error('useColorMode debe utilizarse dentro de ColorModeProvider.')
  return context
}
