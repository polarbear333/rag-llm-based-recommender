import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Amazon User Review',
  description: 'Created by Matthew Chan',
  generator: 'Matthew Chan',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
