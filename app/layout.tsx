import type { Metadata, Viewport } from 'next'
import '@rainbow-me/rainbowkit/styles.css'
import './globals.css'
import Web3Provider from '@/app/components/Web3Provider'

export const metadata: Metadata = {
  title: 'Memento Machina - Shared Sediments Vol 1',
  description: 'Add your thoughts to collaborative geological patterns in this AI art time capsule. Each piece starts from a shared foundation, stored forever on decentralized networks.',
  keywords: ['NFT', 'AI', 'Flow', 'Geological', 'Pattern', 'Blockchain', 'Swarm'],
  authors: [{ name: 'Memento Machina' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#00d4ff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="bg-gradient" suppressHydrationWarning={true}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Polyfill for SSR compatibility
              if (typeof global !== 'undefined' && typeof global.indexedDB === 'undefined') {
                global.indexedDB = null;
              }
              if (typeof window !== 'undefined' && typeof window.indexedDB === 'undefined') {
                window.indexedDB = null;
              }
            `,
          }}
        />
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  )
} 