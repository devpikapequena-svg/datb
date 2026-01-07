'use client'

import { Suspense } from 'react'
import './globals.css'
import { cn } from '@/lib/utils'
import { Inter } from 'next/font/google'
import { CartProvider } from '@/context/CartContext'
import { PwaRegister } from '@/components/PwaRegister'
import MobileAutoRedirect from '@/components/MobileAutoRedirect' // ✅ ADD

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn('min-h-screen bg-background font-sans antialiased')}>
      <PwaRegister />

      {/* ✅ se abrir no celular fora do /mobile, joga pro /mobile/login */}
      <MobileAutoRedirect />

      {children}
    </div>
  )
}

// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <title>Database</title>
        <meta name="description" content="Dashboard" />
        <meta name="robots" content="index, follow" />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('gesturestart', function (e) {
                e.preventDefault();
              });
            `,
          }}
        />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />

        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon192.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#050505" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Database" />
      </head>

      <body className={cn('overflow-y-scroll font-sans bg-[#050505] text-white', inter.variable)}>
        <CartProvider>
          <Suspense fallback={null}>
            <LayoutContent>{children}</LayoutContent>
          </Suspense>
        </CartProvider>
      </body>
    </html>
  )
}
