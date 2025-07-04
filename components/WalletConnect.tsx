'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'

export default function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, error } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <div className="status-connected">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
        <button
          onClick={() => disconnect()}
          className="btn btn-error"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            className="btn btn-primary"
          >
            Connect {connector.name}
          </button>
        ))}
      </div>
      
      {error && (
        <div className="text-red-600 text-sm">
          Error: {error.message}
        </div>
      )}
    </div>
  )
} 