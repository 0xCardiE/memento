'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { MEMENTO_ABI, CONTRACT_ADDRESSES } from '@/lib/wagmi'
import { hardhat } from 'wagmi/chains'

export default function MintNFT() {
  const { address, isConnected } = useAccount()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { data: hash, writeContract, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Read the current mint price from the contract
  const { data: mintPrice } = useReadContract({
    address: CONTRACT_ADDRESSES[hardhat.id] as `0x${string}`,
    abi: MEMENTO_ABI,
    functionName: 'mintPrice',
  })

  // Read total mementos count
  const { data: totalMementos } = useReadContract({
    address: CONTRACT_ADDRESSES[hardhat.id] as `0x${string}`,
    abi: MEMENTO_ABI,
    functionName: 'totalMementos',
  })

  const handleMint = async () => {
    if (!isConnected || !title || !content || !mintPrice) return

    setIsLoading(true)
    try {
      writeContract({
        address: CONTRACT_ADDRESSES[hardhat.id] as `0x${string}`,
        abi: MEMENTO_ABI,
        functionName: 'mintMemento',
        args: [title, content, imageUrl],
        value: mintPrice as bigint,
      })
    } catch (error) {
      console.error('Error minting NFT:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setContent('')
    setImageUrl('')
  }

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-green-50 border border-green-200 rounded-lg">
        <h2 className="text-2xl font-bold text-green-800 mb-4">🎉 NFT Minted Successfully!</h2>
        <p className="text-green-700 mb-4">
          Your memento has been minted as an NFT! Transaction hash: <code className="text-sm bg-green-100 px-1 rounded">{hash}</code>
        </p>
        <button
          onClick={resetForm}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
        >
          Mint Another Memento
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Mint Your Memento NFT</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Total Mementos Minted: <span className="font-bold">{totalMementos ? totalMementos.toString() : '0'}</span>
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Mint Price: <span className="font-bold">{mintPrice ? formatEther(mintPrice) : '0'} ETH</span>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your memento title"
            required
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Content *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Describe your memento..."
            required
          />
        </div>

        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Image URL (optional)
          </label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <button
          onClick={handleMint}
          disabled={!isConnected || !title || !content || isLoading || isConfirming}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading || isConfirming ? 'Minting...' : `Mint NFT (${mintPrice ? formatEther(mintPrice) : '0'} ETH)`}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">Error: {error.message}</p>
          </div>
        )}
      </div>
    </div>
  )
} 