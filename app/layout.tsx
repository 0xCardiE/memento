import type { Metadata } from 'next'
import '@rainbow-me/rainbowkit/styles.css'
import './globals.css'
import Web3Provider from '@/components/Web3Provider'

export const metadata: Metadata = {
  title: 'Mement Machina - Vol 1 - Mint Your Memories as NFTs',
  description: 'Create, mint, and collect meaningful memories as NFTs on the blockchain',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  )
} 