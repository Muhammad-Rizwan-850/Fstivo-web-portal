'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateTheme, getUserPreferences } from '@/lib/actions/preferences-actions'
import { logger } from '@/lib/logger';

type Theme = 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadTheme()
  }, [])

  const loadTheme = async () => {
    try {
      const result = await getUserPreferences()
      if (result.success && result.preferences) {
        setTheme(result.preferences.theme)
        applyTheme(result.preferences.theme)
      }
    } catch (error) {
      logger.error('Error loading theme:', error)
    }
  }

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(newTheme)
    }
  }

  const handleThemeChange = async (newTheme: Theme) => {
    try {
      const result = await updateTheme(newTheme)
      if (result.success) {
        setTheme(newTheme)
        applyTheme(newTheme)
      }
    } catch (error) {
      logger.error('Error updating theme:', error)
    }
  }

  if (!mounted) {
    return null // Avoid hydration mismatch
  }

  const themes: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
    { value: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
    { value: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System' },
  ]

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
      {themes.map((t) => (
        <Button
          key={t.value}
          variant={theme === t.value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleThemeChange(t.value)}
          className="gap-2"
        >
          {t.icon}
          <span className="hidden sm:inline">{t.label}</span>
        </Button>
      ))}
    </div>
  )
}
