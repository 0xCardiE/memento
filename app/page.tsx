'use client'

import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import MintNFT from '@/components/MintNFT'

function HomePage() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen bg-gradient">
      <div className="container py-8">
        <header className="mb-8">
          <div className="flex justify-between items-start header-responsive mb-8">
            <div className="header-content">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                MementoVol1 🎨
              </h1>
              <p className="text-xl text-gray-600">
                Transform your precious memories into unique NFTs on the blockchain
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
                    <div className="text-3xl mb-3">✍️</div>
                    <h3 className="font-bold mb-2">Create</h3>
                    <p className="text-gray-600">Write your memory with a title and description</p>
                  </div>
                  <div className="card bg-white shadow">
                    <div className="text-3xl mb-3">💰</div>
                    <h3 className="font-bold mb-2">Mint</h3>
                    <p className="text-gray-600">Pay the mint fee to create your NFT</p>
                  </div>
                  <div className="card bg-white shadow">
                    <div className="text-3xl mb-3">🎊</div>
                    <h3 className="font-bold mb-2">Own</h3>
                    <p className="text-gray-600">Your memory is now a unique NFT forever</p>
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
          <p>Built with Next.js 15, Hardhat 3, and Wagmi</p>
        </footer>
      </div>
    </div>
  )
}

export default function Page() {
  return <HomePage />
} 