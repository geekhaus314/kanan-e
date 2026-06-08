import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Kanan Enterprises - Premium E-Commerce',
  description: 'Wholesale & Retail E-Commerce Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
