'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { MEMENTO_ABI, CONTRACT_ADDRESSES } from '@/lib/wagmi'
import { flowTestnet } from '../lib/wagmi'

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

  // Read the current generation price from the contract
  const { data: generationPrice } = useReadContract({
    address: CONTRACT_ADDRESSES[flowTestnet.id] as `0x${string}`,
    abi: MEMENTO_ABI,
    functionName: 'generationPrice',
  })

  // Read total mementos count
  const { data: totalMementos } = useReadContract({
    address: CONTRACT_ADDRESSES[flowTestnet.id] as `0x${string}`,
    abi: MEMENTO_ABI,
    functionName: 'totalMementos',
  })

  const handleSubmit = async () => {
    if (!isConnected || !title || !content || !aiPrompt || !generationPrice) return

    setIsLoading(true)
    try {
      writeContract({
        address: CONTRACT_ADDRESSES[flowTestnet.id] as `0x${string}`,
        abi: MEMENTO_ABI,
        functionName: 'requestMemento',
        args: [title, content, aiPrompt],
        value: generationPrice as bigint,
      })
    } catch (error) {
      console.error('Error requesting memento:', error)
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
        <h2 className="text-2xl font-bold text-green-800 mb-4">🎉 NFT Request Submitted!</h2>
        <div className="text-green-700 mb-4 space-y-2">
          <p>Your memento request has been submitted! Transaction hash: <code className="text-xs">{hash}</code></p>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">🤖 What happens next?</h3>
            <ol className="text-sm space-y-1">
              <li>1. 🎨 AI generates your custom artwork</li>
              <li>2. 📦 Image is stored on SWARM network</li>
              <li>3. ⛓️ Your NFT is updated with the final image</li>
              <li>4. 🌐 View at: bzz.link/bzz/[hash]</li>
            </ol>
            <p className="text-xs text-green-600 mt-2">
              ⏱️ Processing usually takes 1-2 minutes
            </p>
          </div>
        </div>
        <button
          onClick={resetForm}
          className="btn btn-success btn-full"
        >
          Submit Another Request
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-10 card shadow-lg">
      <div className="card-header">
        <h2 className="card-title">🎨 Request AI Memory NFT</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Total Mementos: <span className="font-bold">{totalMementos ? totalMementos.toString() : '0'}</span>
          </p>
          <p className="text-sm text-gray-600 mb-3">
            Generation Price: <span className="font-bold">{generationPrice ? formatEther(generationPrice) : '0'} ETH (~$3)</span>
          </p>
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">⚡ AI Generation Process</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>1.</strong> Pay and submit your memory + AI prompt</p>
              <p><strong>2.</strong> Backend AI generates your unique artwork</p>
              <p><strong>3.</strong> Image stored on SWARM network</p>
              <p><strong>4.</strong> NFT updated with final bzz.link URL</p>
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
            placeholder="e.g., Summer at Grandma's Lake"
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
            placeholder="Describe this special memory in detail..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="aiPrompt" className="form-label">
            AI Art Prompt * 🎨
          </label>
          <textarea
            id="aiPrompt"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="form-textarea"
            rows={3}
            placeholder="e.g., A peaceful lake at sunset with wooden dock, mountains in background, warm golden light, nostalgic atmosphere, photorealistic style"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 Be specific and descriptive! This creates your unique DALL-E artwork
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isConnected || !title || !content || !aiPrompt || isLoading || isConfirming}
          className="btn btn-primary btn-full"
        >
          {isLoading || isConfirming ? 'Submitting...' : `Submit Request (${generationPrice ? formatEther(generationPrice) : '0'} ETH)`}
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