'use client'

import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import MintNFT from '@/app/components/MintNFT'

function HomePage() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen bg-gradient">
      <div className="container py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">
              <span className="text-white">Memento</span>
              <span style={{ color: 'var(--accent-primary)' }}>Machina</span>
            </h1>
          </div>
          <ConnectButton />
        </header>

        {/* Hero Section */}
        <section className="hero mb-16">
          <div className="hero-title mb-4">
            Super Rare
          </div>
          <div className="hero-subtitle mb-8">
            Generate unique geological pattern NFTs with AI-powered artwork on Flow blockchain
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
              <div className="stat-number">∞</div>
              <div className="stat-label">Possibilities</div>
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
            <div className="space-y-12">
              {/* Latest Mints Section */}
              <section className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-8 text-center">Latest Mints</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* NFT Card 1 */}
                  <div className="nft-card">
                    <div className="nft-placeholder">
                      <div className="nft-placeholder-content">
                        <div className="nft-placeholder-icon">🏔️</div>
                        <div className="nft-placeholder-text">AI Generation Pending</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-400 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-400 rounded animate-pulse w-2/3"></div>
                    </div>
                  </div>
                  
                  {/* NFT Card 2 */}
                  <div className="nft-card">
                    <div className="nft-placeholder">
                      <div className="nft-placeholder-content">
                        <div className="nft-placeholder-icon">🏔️</div>
                        <div className="nft-placeholder-text">AI Generation Pending</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-400 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-400 rounded animate-pulse w-2/3"></div>
                    </div>
                  </div>
                  
                  {/* NFT Card 3 */}
                  <div className="nft-card">
                    <div className="nft-placeholder">
                      <div className="nft-placeholder-content">
                        <div className="nft-placeholder-icon">🏔️</div>
                        <div className="nft-placeholder-text">AI Generation Pending</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-400 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-400 rounded animate-pulse w-2/3"></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Mint Section */}
              <MintNFT />
              
              {/* How it works Section */}
              <section className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="card text-center">
                    <div className="text-4xl mb-4" style={{ color: 'var(--accent-primary)' }}>🎨</div>
                    <h3 className="font-bold mb-3">Design</h3>
                    <p>Choose colors and effects for your geological pattern using our AI prompt system</p>
                  </div>
                  <div className="card text-center">
                    <div className="text-4xl mb-4" style={{ color: 'var(--accent-primary)' }}>⚡</div>
                    <h3 className="font-bold mb-3">Mint</h3>
                    <p>Pay 6.66 FLOW to mint your NFT and trigger AI generation</p>
                  </div>
                  <div className="card text-center">
                    <div className="text-4xl mb-4" style={{ color: 'var(--accent-primary)' }}>🏔️</div>
                    <h3 className="font-bold mb-3">Own</h3>
                    <p>Your unique geological pattern NFT is generated and stored permanently</p>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-8xl mb-8 opacity-50">🔐</div>
              <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Connect your Web3 wallet to start creating unique geological pattern NFTs with AI-generated artwork
              </p>
              <ConnectButton />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="footer">
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
                style={{ height: '20px', filter: 'brightness(0) invert(1)' }}
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
                style={{ height: '20px', filter: 'brightness(0) invert(1)' }}
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
                src="/swarm.jpg" 
                alt="Swarm" 
                style={{ height: '20px', filter: 'brightness(0) invert(1)' }}
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