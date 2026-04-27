'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  useEffect(() => {
    if (session) {
      fetch('/api/settings').then(res => res.json()).then(data => {
        if (data.settings?.lightMode) {
          document.documentElement.classList.add('light')
        } else {
          document.documentElement.classList.remove('light')
        }
      })
    }
  }, [session])

  return <>{children}</>
}
