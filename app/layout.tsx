import type { Metadata } from 'next'
import '@rainbow-me/rainbowkit/styles.css'
import './globals.css'
import Web3Provider from '@/app/components/Web3Provider'

export const metadata: Metadata = {
  title: 'Memento Machina - Geological Pattern NFT Generator',
  description: 'Create beautiful layered rock formation patterns as NFTs on Flow blockchain with AI-generated artwork stored on Swarm',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  )
} 