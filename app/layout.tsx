import type { Metadata } from 'next'
import '@rainbow-me/rainbowkit/styles.css'
import './globals.css'
import Web3Provider from '@/app/components/Web3Provider'

export const metadata: Metadata = {
  title: 'Memento Machina - AI-Powered Geological Pattern NFTs',
  description: 'Create unique geological pattern NFTs with AI-generated artwork on Flow blockchain. Mint beautiful layered rock formations stored permanently on Swarm network.',
  keywords: ['NFT', 'AI', 'Flow', 'Geological', 'Pattern', 'Blockchain', 'Swarm'],
  authors: [{ name: 'Memento Machina' }],
  viewport: 'width=device-width, initial-scale=1',
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
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  )
} 