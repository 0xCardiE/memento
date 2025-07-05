'use client'

import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import MintNFT from '@/app/components/MintNFT'

function HomePage() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen bg-gradient">
      <div className="container py-8">
        <header className="mb-8">
          <div className="flex justify-between items-start header-responsive mb-8">
            <div className="header-content">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                🏔️ Memento Machina
              </h1>
              <p className="text-xl text-gray-600">
                Create beautiful layered rock formation patterns as NFTs on the blockchain
              </p>
            </div>
            <div>
              <ConnectButton />
            </div>
          </div>
        </header>

        <main>
          {isConnected ? (
            <div className="space-y-8">
              <MintNFT />
              
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">How it works</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="card bg-white shadow">
                    <div className="text-3xl mb-3">🎨</div>
                    <h3 className="font-bold mb-2">Design</h3>
                    <p className="text-gray-600">Choose colors and effects for your geological pattern</p>
                  </div>
                  <div className="card bg-white shadow">
                    <div className="text-3xl mb-3">💰</div>
                    <h3 className="font-bold mb-2">Mint</h3>
                    <p className="text-gray-600">Pay the mint fee to create your NFT</p>
                  </div>
                  <div className="card bg-white shadow">
                    <div className="text-3xl mb-3">🏔️</div>
                    <h3 className="font-bold mb-2">Own</h3>
                    <p className="text-gray-600">Your geological pattern is now a unique NFT forever</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">🔒</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-8">
                Connect your Web3 wallet to start minting your memories as NFTs
              </p>
            </div>
          )}
        </main>

        <footer className="mt-16 text-center text-gray-500">
          <p className="mb-4">Built with</p>
          <div className="flex justify-center items-center gap-4 flex-wrap">
            <a 
              href="https://flow.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-blue-600 transition-colors"
            >
              <img 
                src="/flow.png" 
                alt="Flow" 
                style={{ height: '20px' }}
              />
              <span className="font-semibold">Flow</span>
            </a>
            <span className="text-gray-400 font-bold">+</span>
            <a 
              href="https://hardhat.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-yellow-600 transition-colors"
            >
              <img 
                src="/hardhat.png" 
                alt="Hardhat" 
                style={{ height: '20px' }}
              />
              <span className="font-semibold">Hardhat 3</span>
            </a>
            <span className="text-gray-400 font-bold">+</span>
            <a 
              href="https://www.ethswarm.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-orange-600 transition-colors"
            >
              <img 
                src="/swarm.jpg" 
                alt="Swarm" 
                style={{ height: '20px' }}
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