'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Lazy load wagmi config only on client side
const getWagmiConfig = () => {
  if (typeof window === 'undefined') return null
  
  try {
    const { getConfig } = require('@/lib/wagmi')
    return getConfig()
  } catch (error) {
    console.error('Failed to load wagmi config:', error)
    return null
  }
}

function Web3ProviderInner({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  }))
  const [mounted, setMounted] = useState(false)
  const [wagmiConfig, setWagmiConfig] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    
    // Load wagmi config only on client side
    if (typeof window !== 'undefined') {
      const config = getWagmiConfig()
      setWagmiConfig(config)
    }
  }, [])

  if (!mounted || !wagmiConfig) {
    return (
      <div className="min-h-screen bg-gradient">
        <div className="container py-8">
          <div className="text-center py-16">
            <div className="text-6xl mb-6 opacity-50">⚡</div>
            <h2 className="text-2xl font-bold mb-4">Loading...</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Initializing Web3 connection</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// Export the component with no SSR
export default dynamic(() => Promise.resolve(Web3ProviderInner), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient">
      <div className="container py-8">
        <div className="text-center py-16">
          <div className="text-6xl mb-6 opacity-50">⚡</div>
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Initializing Web3 connection</p>
        </div>
      </div>
    </div>
  ),
}) 