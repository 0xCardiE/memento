'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { MEMENTO_ABI } from '@/lib/wagmi';
import dynamic from 'next/dynamic';

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  545: process.env.NEXT_PUBLIC_MEMENTO_CONTRACT_FLOW_TESTNET as `0x${string}`, // Flow EVM Testnet
  747: process.env.NEXT_PUBLIC_MEMENTO_CONTRACT_FLOW_MAINNET as `0x${string}`, // Flow EVM Mainnet
};

function MintNFTInner() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [colors, setColors] = useState('');
  const [variations, setVariations] = useState('');
  const [mounted, setMounted] = useState(false);

  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // State for tracking recent mint
  const [recentMintId, setRecentMintId] = useState<number | null>(null);
  const [showRevealSection, setShowRevealSection] = useState(false);

  // Read contract data
  const { data: isMintingActive } = useReadContract({
    address: contractAddress,
    abi: MEMENTO_ABI,
    functionName: 'isMintingActive',
  }) as { data: boolean | undefined };

  const { data: remainingSupply } = useReadContract({
    address: contractAddress,
    abi: MEMENTO_ABI,
    functionName: 'getRemainingSupply',
  }) as { data: bigint | undefined };

  const { data: remainingTime } = useReadContract({
    address: contractAddress,
    abi: MEMENTO_ABI,
    functionName: 'getRemainingMintTime',
  }) as { data: bigint | undefined };

  const { data: totalMementos } = useReadContract({
    address: contractAddress,
    abi: MEMENTO_ABI,
    functionName: 'totalMementos',
  }) as { data: bigint | undefined };

  // Read the user's mementos to find their latest mint
  const { data: userMementos, refetch: refetchUserMementos } = useReadContract({
    address: contractAddress,
    abi: MEMENTO_ABI,
    functionName: 'getUserMementos',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contractAddress }
  }) as { data: bigint[] | undefined; refetch: () => void };

  // Get memento data for the recent mint
  const { data: recentMementoData, refetch: refetchRecentMemento } = useReadContract({
    address: contractAddress,
    abi: MEMENTO_ABI,
    functionName: 'getMemento',
    args: recentMintId !== null ? [BigInt(recentMintId)] : undefined,
    query: { enabled: recentMintId !== null && !!contractAddress }
  }) as { data: any[] | undefined; refetch: () => void };

  // Format time remaining
  const formatTimeRemaining = (seconds: bigint | undefined) => {
    if (!seconds) return 'Unknown';
    const totalSeconds = Number(seconds);
    if (totalSeconds <= 0) return 'Minting ended';
    
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Handle successful transaction
  useEffect(() => {
    if (isConfirmed && userMementos && userMementos.length > 0) {
      // Get the latest minted NFT ID (contract starts from 1)
      const latestMintId = Number(userMementos[userMementos.length - 1]);
      setRecentMintId(latestMintId);
      setShowRevealSection(true);
    }
  }, [isConfirmed, userMementos]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setColorExample = (colorText: string) => {
    setColors(colorText);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('Please connect your wallet first.');
      return;
    }

    if (!contractAddress) {
      alert('Contract not deployed on this network. Please switch to Flow EVM Testnet or Mainnet.');
      return;
    }

    if (!isMintingActive) {
      alert('Minting is no longer active. The 7-day window has ended or all 1000 NFTs have been minted.');
      return;
    }

    if (!colors.trim()) {
      alert('Please describe the color palette you want.');
      return;
    }

    if (!variations.trim()) {
      alert('Please share what you\'re thinking about lately.');
      return;
    }

    // Build the hidden geological prompt (same as HTML version)
    let fullPrompt = `Horizontal striped patterns with irregular, wavy boundaries between each layer, resembling geological strata, rock formations, or sedimentary deposits. Each piece uses a cohesive color palette with ${colors} and the layers have organic, flowing edges that create a natural, earthy appearance like cross-sections of canyon walls or mineral deposits`;
    
    if (variations.trim()) {
      fullPrompt += `. ${variations}`;
    }

    // Create user-friendly display prompt
    const displayPrompt = `Geological layers with ${colors}${variations ? ` (${variations})` : ''}`;

    try {
      writeContract({
        address: contractAddress,
        abi: MEMENTO_ABI,
        functionName: 'requestMemento',
        args: [displayPrompt, 'Geological pattern NFT generated with AI', fullPrompt],
        value: parseEther('6.66'),
      });
    } catch (err) {
      console.error('Error requesting memento:', err);
      alert('Error requesting memento. Please try again.');
    }
  };

  const handleRevealNFT = async () => {
    if (recentMintId !== null) {
      await refetchRecentMemento();
      await refetchUserMementos();
    }
  };

  if (!mounted) {
    return (
      <section className="max-w-4xl mx-auto">
        <div className="mint-header">
          <h2 className="text-3xl font-bold mb-4">Loading...</h2>
          <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
            Initializing minting interface
          </p>
        </div>
      </section>
    );
  }

  if (!isConnected) {
    return (
      <div className="mint-container">
        <div className="mint-header">
          <h1 className="text-4xl font-bold mb-4">🏔️ Memento Machina</h1>
          <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
            Connect your wallet to mint geological patterns
          </p>
        </div>
      </div>
    );
  }

  if (!contractAddress) {
    return (
      <div className="mint-container">
        <div className="mint-header">
          <h1 className="text-4xl font-bold mb-4">🚫 Unsupported Network</h1>
          <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
            Please switch to Flow EVM Testnet or Mainnet
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-4xl mx-auto">
      <div className="mint-header">
        <h2 className="text-3xl font-bold mb-4">Create Your Personal Memento</h2>
        <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
          Share your feelings and thoughts to create a unique AI-generated geological NFT
        </p>
      </div>

      {/* Success Message with Reveal Section */}
      {isConfirmed && showRevealSection && (
        <div className="card mb-8" style={{ 
          border: '1px solid #4ade80', 
          background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)'
        }}>
          <div className="text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-2xl font-bold mb-4" style={{ color: '#4ade80' }}>
              Payment Successful!
            </h3>
            <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
              Your NFT is now being generated in our decentralized network
            </p>
            
            <div className="bg-card p-6 rounded-lg mb-6" style={{ 
              border: '1px solid rgba(0, 212, 255, 0.2)',
              background: 'rgba(26, 26, 46, 0.8)'
            }}>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="text-2xl">🤖</div>
                <div className="text-2xl">→</div>
                <div className="text-2xl">🌐</div>
                <div className="text-2xl">→</div>
                <div className="text-2xl">🖼️</div>
              </div>
              
              <h4 className="text-lg font-bold mb-3" style={{ color: 'var(--accent-primary)' }}>
                How Your NFT is Created
              </h4>
              
              <div className="space-y-2 text-sm text-left">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">●</span>
                  <span>AI processes your prompt and generates unique artwork</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">●</span>
                  <span>Image is stored permanently on SWARM decentralized network</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">●</span>
                  <span>NFT metadata is updated on the blockchain</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 rounded-lg" style={{ 
                background: 'rgba(250, 204, 21, 0.1)',
                border: '1px solid rgba(250, 204, 21, 0.2)'
              }}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  ⏱️ <strong>Generation Time:</strong> This process typically takes 30-60 seconds
                </p>
              </div>
            </div>

            {recentMintId !== null && (
              <div className="mb-6">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Your NFT ID: <span className="font-bold" style={{ color: 'var(--accent-primary)' }}>#{recentMintId}</span>
                  </div>
                </div>

                {recentMementoData && recentMementoData[7] ? (
                  <div className="card p-4" style={{ background: 'rgba(74, 222, 128, 0.1)' }}>
                    <div className="text-center">
                      <div className="text-3xl mb-2">🎉</div>
                      <p className="text-lg font-bold" style={{ color: '#4ade80' }}>
                        Your NFT is Ready!
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Your unique geological pattern has been generated and stored on the decentralized network
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="card p-4" style={{ background: 'rgba(250, 204, 21, 0.1)' }}>
                    <div className="text-center">
                      <div className="text-3xl mb-2">⏳</div>
                      <p className="text-lg font-bold" style={{ color: '#facc15' }}>
                        Generation in Progress...
                      </p>
                      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                        Your NFT is being created. This usually takes 30-60 seconds.
                      </p>
                      
                      <button
                        onClick={handleRevealNFT}
                        className="btn btn-secondary"
                        style={{ 
                          background: 'var(--gradient-button)',
                          border: 'none',
                          color: 'white'
                        }}
                      >
                        <span>🔄</span>
                        Check if Ready
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Minting Status */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold" style={{ color: 'var(--accent-primary)' }}>
            Limited Collection Status
          </h3>
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${
            isMintingActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {isMintingActive ? '✅ Active' : '🚫 Ended'}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="stat-item">
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
              {remainingSupply ? Number(remainingSupply).toLocaleString() : '---'}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Remaining Supply
            </div>
          </div>
          
          <div className="stat-item">
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
              {totalMementos ? Number(totalMementos).toLocaleString() : '---'}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Already Minted
            </div>
          </div>
          
          <div className="stat-item">
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
              {formatTimeRemaining(remainingTime)}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Time Remaining
            </div>
          </div>
        </div>
        
        {!isMintingActive && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-center font-bold">
              🚫 Minting Period Has Ended
            </p>
            <p className="text-red-300 text-center text-sm mt-1">
              The 7-day minting window has closed or all 1000 NFTs have been minted.
            </p>
          </div>
        )}
      </div>

      <div className="mint-form">
        {/* Explanation */}
        <div className="card mb-8">
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--accent-primary)' }}>
            Your Personal Geological Portrait
          </h3>
          <div className="space-y-3" style={{ color: 'var(--text-secondary)' }}>
            <p><strong>Emotional landscapes</strong> - AI transforms your feelings into horizontal layered patterns that reflect your inner state.</p>
            <p><strong>Thought-inspired textures</strong> - Your random thoughts and reflections influence the natural wavy boundaries between layers.</p>
            <p><strong>Personal color story</strong> - The colors you choose to represent your mood create a unique geological time capsule.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Color Palette Input */}
          <div className="form-group">
            <label htmlFor="colors" className="form-label">
              How do you feel today if you can describe it with color?
            </label>
            <input 
              type="text" 
              id="colors" 
              className="form-input"
              placeholder="Deep ocean blues mixed with sunset oranges..."
              value={colors}
              onChange={(e) => setColors(e.target.value)}
              required
            />
            
            {/* Color Examples */}
            <div className="example-colors">
              <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                Popular feelings:
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Peaceful sage greens and soft lavenders',
                  'Energetic bright yellows and fiery reds',
                  'Nostalgic warm browns and golden hues',
                  'Dreamy purples and midnight blues',
                  'Grounded earth tones and forest greens'
                ].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setColorExample(example)}
                    className="color-example"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Variations Input */}
          <div className="form-group">
            <label htmlFor="variations" className="form-label">
              What are you thinking of lately or just some random thoughts?
            </label>
            <textarea
              id="variations"
              value={variations}
              onChange={(e) => setVariations(e.target.value)}
              placeholder="I've been thinking about ocean waves, the smell of rain, or that book I read last week..."
              className="form-textarea"
              rows={4}
              required
            />
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isPending || isConfirming || !isMintingActive}
              className="btn btn-primary btn-full"
              style={{ 
                fontSize: '1.1rem',
                padding: '1rem 2rem',
                background: isPending || isConfirming 
                  ? 'var(--text-muted)' 
                  : 'var(--gradient-button)'
              }}
            >
              {isPending && (
                <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
              )}
              {isConfirming && (
                <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
              )}
              {!isPending && !isConfirming && '🏔️'}
              <span>
                {isPending
                  ? 'Preparing Transaction...'
                  : isConfirming
                  ? 'Confirming Payment...'
                  : 'Create My Personal Memento (6.66 FLOW)'
                }
              </span>
            </button>
            
            {!isMintingActive && (
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                Minting period has ended or maximum supply reached
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="status-message status-error mt-8">
          <h3 className="text-xl font-bold mb-2">Transaction Failed</h3>
          <p className="text-sm">{error.message}</p>
        </div>
      )}
    </section>
  );
}

// Export as client-only component
export default dynamic(() => Promise.resolve(MintNFTInner), {
  ssr: false,
  loading: () => (
    <section className="max-w-4xl mx-auto">
      <div className="mint-header">
        <h2 className="text-3xl font-bold mb-4">Loading...</h2>
        <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
          Initializing minting interface
        </p>
      </div>
    </section>
  ),
}); 