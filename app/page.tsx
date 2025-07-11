'use client'

import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import MintNFT from '@/app/components/MintNFT'
import LatestMints from '@/app/components/LatestMints'

function HomePage() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen bg-gradient">
      {/* Futuristic Background Effects */}
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      
      <div className="tech-nodes">
        <div className="tech-node"></div>
        <div className="tech-node"></div>
        <div className="tech-node"></div>
        <div className="tech-node"></div>
        <div className="tech-node"></div>
      </div>
      
      <div className="connection-lines">
        <div className="connection-line"></div>
        <div className="connection-line"></div>
        <div className="connection-line"></div>
      </div>
      
      <div className="container py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <img 
              src="logo.png" 
              alt="MementoMachina" 
              style={{ height: '70px', width: 'auto' }}
            />
          </div>
          <ConnectButton />
        </header>

        {/* Hero Section */}
        <section className="hero mb-16">
          <div className="hero-title mb-4">
          Shared Sediments
          </div>
          <div className="hero-subtitle mb-8">
            A collaborative time capsule capturing AI art in 2025. Add your thoughts to shared geological patterns, stored forever on decentralized networks.
          </div>
          
          {/* Stats */}
          <div className="stats mb-8">
            <div className="stat-item">
              <div className="stat-number">6.66</div>
              <div className="stat-label">Mint Price (FLOW)</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">AI</div>
              <div className="stat-label">Generated</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">Vol 1</div>
              <div className="stat-label">Time Capsule</div>
            </div>
          </div>

          {!isConnected && (
            <div className="hero-cta">
              <ConnectButton />
            </div>
          )}
        </section>

        <main>
          {isConnected ? (
            <div className="space-y-24">
              {/* Latest Mints Section */}
              <LatestMints />

              {/* Mint Section */}
              <MintNFT />
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-8xl mb-8 opacity-50">🔐</div>
              <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Connect your Web3 wallet to add your story to the Shared Sediments time capsule
              </p>
              <ConnectButton />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="footer">
          {/* OpenSea Collection Link */}
          <div className="text-center mb-6">
            <a 
              href="https://opensea.io/collection/shared-sediments"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:opacity-75 transition-opacity"
            >
              <img 
                src="/OpenSea.png" 
                alt="OpenSea" 
                height="50"
              />
            </a>
          </div>
          
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>Built with cutting-edge technology</p>
          <div className="footer-links">
            <a 
              href="https://flow.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              <img 
                src="/flow.png" 
                alt="Flow" 

              />
              <span className="font-semibold">Flow EVM</span>
            </a>
            <span className="footer-divider">+</span>
            <a 
              href="https://hardhat.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              <img 
                src="/hardhat.png" 
                alt="Hardhat" 

              />
              <span className="font-semibold">Hardhat</span>
            </a>
            <span className="footer-divider">+</span>
            <a 
              href="https://www.ethswarm.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              <img 
                src="/swarm.png" 
                alt="Swarm" 
            
              />
              <span className="font-semibold">Swarm</span>
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default function Page() {
  return <HomePage />
} 