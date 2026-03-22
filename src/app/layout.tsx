import type { Metadata } from 'next'
import './globals.css'
import AppProviders from './providers'
import AppLayout from '@/components/layout/AppLayout'

export const metadata: Metadata = {
  title: 'LogTech Observability',
  description: 'Datadog-style observability dashboard scaffold',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AppProviders>
          <AppLayout>{children}</AppLayout>
        </AppProviders>
      </body>
    </html>
  )
}
