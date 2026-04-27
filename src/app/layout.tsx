// src/app/layout.tsx
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from 'react-hot-toast'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Vexor Workspace — Internal OS',
  description: 'Internal team management system for Vexor IT Solutions',
  icons: { icon: '/favicon.ico' },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SessionProvider session={session}>
          <ThemeProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#1a1d28',
                  color: '#f0f2ff',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: '10px',
                  fontFamily: 'Sora, sans-serif',
                  fontSize: '13px',
                },
                success: { iconTheme: { primary: '#22c55e', secondary: '#0f1117' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#0f1117' } },
              }}
            />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
