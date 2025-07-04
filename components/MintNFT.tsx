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
  const [aiPrompt, setAiPrompt] = useState('')
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
    if (!isConnected || !title || !content || !aiPrompt || !mintPrice) return

    setIsLoading(true)
    try {
      writeContract({
        address: CONTRACT_ADDRESSES[hardhat.id] as `0x${string}`,
        abi: MEMENTO_ABI,
        functionName: 'mintMemento',
        args: [title, content, aiPrompt],
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
    setAiPrompt('')
  }

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto mt-10 card status-success">
        <h2 className="text-2xl font-bold text-green-800 mb-4">🎉 NFT Minted Successfully!</h2>
        <div className="text-green-700 mb-4 space-y-2">
          <p>Your memento has been minted! Transaction hash: <code className="text-xs">{hash}</code></p>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">🤖 What happens next?</h3>
            <ol className="text-sm space-y-1">
              <li>1. Our AI will generate your image based on your prompt</li>
              <li>2. The image will be uploaded to IPFS storage</li>
              <li>3. Your NFT will be revealed with the final artwork</li>
              <li>4. You'll be able to see your unique AI-generated image!</li>
            </ol>
            <p className="text-xs text-green-600 mt-2">
              ⏱️ Reveal process typically takes 1-5 minutes
            </p>
          </div>
        </div>
        <button
          onClick={resetForm}
          className="btn btn-success btn-full"
        >
          Mint Another Memento
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-10 card shadow-lg">
      <div className="card-header">
        <h2 className="card-title">Mint Your AI Memento NFT</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Total Mementos Minted: <span className="font-bold">{totalMementos ? totalMementos.toString() : '0'}</span>
          </p>
          <p className="text-sm text-gray-600 mb-3">
            Mint Price: <span className="font-bold">{mintPrice ? formatEther(mintPrice) : '0'} ETH (~$3)</span>
          </p>
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">🚀 Two-Step Process</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Step 1:</strong> Pay & describe your memory + AI prompt</p>
              <p><strong>Step 2:</strong> AI generates unique image & reveals your NFT</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Memory Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            placeholder="e.g., Summer at the Lake"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="content" className="form-label">
            Memory Description *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="form-textarea"
            rows={3}
            placeholder="Describe your memory in detail..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="aiPrompt" className="form-label">
            AI Image Prompt * 🎨
          </label>
          <textarea
            id="aiPrompt"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="form-textarea"
            rows={3}
            placeholder="e.g., A serene lake at sunset with mountains in the background, golden light reflecting on the water, peaceful and nostalgic atmosphere"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 Be descriptive! This will generate your unique NFT artwork
          </p>
        </div>

        <button
          onClick={handleMint}
          disabled={!isConnected || !title || !content || !aiPrompt || isLoading || isConfirming}
          className="btn btn-primary btn-full"
        >
          {isLoading || isConfirming ? 'Minting...' : `Mint NFT (${mintPrice ? formatEther(mintPrice) : '0'} ETH)`}
        </button>

        {error && (
          <div className="status-error">
            <p className="text-sm">Error: {error.message}</p>
          </div>
        )}
      </div>
    </div>
  )
} 