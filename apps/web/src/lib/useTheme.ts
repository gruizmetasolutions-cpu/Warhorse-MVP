import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem('wh_theme')
      if (stored === 'dark' || stored === 'light') return stored
      // Default to dark if not set (as requested by Warhorse styleguide)
      return 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('wh_theme', theme)
    } catch {
      // Ignore
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggleTheme }
}
