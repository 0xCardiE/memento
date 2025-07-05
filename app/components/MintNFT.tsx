'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useReadContract, useWatchContractEvent } from 'wagmi';
import { parseEther } from 'viem';
import { MEMENTO_ABI } from '@/lib/wagmi';
import dynamic from 'next/dynamic';

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  545: process.env.NEXT_PUBLIC_MEMENTO_CONTRACT_FLOW_TESTNET as `0x${string}`, // Flow EVM Testnet
  747: process.env.NEXT_PUBLIC_MEMENTO_CONTRACT_FLOW_MAINNET as `0x${string}`, // Flow EVM Mainnet
};

// Array of 21 color feeling combinations
const COLOR_COMBINATIONS = [
  'Peaceful sage greens and soft lavenders',
  'Energetic bright yellows and fiery reds',
  'Nostalgic warm browns and golden hues',
  'Dreamy purples and midnight blues',
  'Grounded earth tones and forest greens',
  'Vibrant coral pinks and sunset oranges',
  'Calm ocean blues and seafoam greens',
  'Mysterious deep purples and charcoal grays',
  'Cheerful sunshine yellows and lime greens',
  'Romantic rose golds and blush pinks',
  'Sophisticated navy blues and silver grays',
  'Tropical turquoise and palm greens',
  'Rustic terracotta and burnt oranges',
  'Ethereal pearl whites and misty grays',
  'Bold crimson reds and midnight blacks',
  'Serene pastel blues and cotton whites',
  'Earthy moss greens and bark browns',
  'Electric neon pinks and cyber blues',
  'Autumn amber and copper bronzes',
  'Icy glacier blues and frost whites',
  'Warm honey golds and cinnamon browns'
];

function MintNFTInner() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [colors, setColors] = useState('');
  const [variations, setVariations] = useState('');
  const [mounted, setMounted] = useState(false);

  // State for random color examples (3 out of 21)
  const [randomColorExamples, setRandomColorExamples] = useState<string[]>([]);

  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // State for tracking recent mint
  const [recentMintId, setRecentMintId] = useState<number | null>(null);
  const [showRevealSection, setShowRevealSection] = useState(false);
  const [isNFTGenerating, setIsNFTGenerating] = useState(false);
  const [generatedNFTData, setGeneratedNFTData] = useState<any>(null);
  const [generationTimeout, setGenerationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Read contract data with refetch functions
  const { data: isMintingActive, refetch: refetchMintingActive } = useReadContract({
    address: contractAddress,
    abi: MEMENTO_ABI,
    functionName: 'isMintingActive',
  }) as { data: boolean | undefined; refetch: () => void };

  const { data: remainingSupply, refetch: refetchRemainingSupply } = useReadContract({
    address: contractAddress,
    abi: MEMENTO_ABI,
    functionName: 'getRemainingSupply',
  }) as { data: bigint | undefined; refetch: () => void };

  const { data: remainingTime, refetch: refetchRemainingTime } = useReadContract({
    address: contractAddress,
    abi: MEMENTO_ABI,
    functionName: 'getRemainingMintTime',
  }) as { data: bigint | undefined; refetch: () => void };

  const { data: totalMementos, refetch: refetchTotalMementos } = useReadContract({
    address: contractAddress,
    abi: MEMENTO_ABI,
    functionName: 'totalMementos',
  }) as { data: bigint | undefined; refetch: () => void };

  const { data: currentPrice, refetch: refetchCurrentPrice } = useReadContract({
    address: contractAddress,
    abi: MEMENTO_ABI,
    functionName: 'getCurrentPrice',
  }) as { data: bigint | undefined; refetch: () => void };

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

  // Watch for MementoGenerated events for the user's NFTs
  useWatchContractEvent({
    address: contractAddress as `0x${string}`,
    abi: MEMENTO_ABI,
    eventName: 'MementoGenerated',
    args: {
      creator: address, // Only listen for events where the creator is the current user
    },
    onLogs: (logs) => {
      console.log('🎉 MementoGenerated event received:', logs);
      console.log(`🔍 Looking for Token ID: ${recentMintId} for creator: ${address}`);
      
      logs.forEach((log: any) => {
        const tokenId = log.args?.tokenId;
        const creator = log.args?.creator;
        const imageUri = log.args?.imageUri;
        
        console.log(`📋 Event details - Token ID: ${tokenId}, Creator: ${creator}, Image: ${imageUri}`);
        
        if (!tokenId || !creator || !imageUri) {
          console.log('⚠️ Incomplete event data received');
          return;
        }
        
        const tokenIdNumber = Number(tokenId);
        
        // Check if this is the NFT we're waiting for
        if (recentMintId === tokenIdNumber && creator.toLowerCase() === address?.toLowerCase()) {
          console.log(`🎨 NFT generation completed for Token ID: ${tokenIdNumber}`);
          setIsNFTGenerating(false);
          setGeneratedNFTData({
            tokenId: tokenIdNumber,
            imageUri,
            timestamp: Date.now()
          });
          
          // Clear the timeout since generation is complete
          if (generationTimeout) {
            clearTimeout(generationTimeout);
            setGenerationTimeout(null);
          }
          
          // Refresh contract data to show updated status
          refreshContractState();
          refetchRecentMemento();
        } else {
          console.log(`❌ Event not for us - Expected Token ID: ${recentMintId}, Got: ${tokenIdNumber}`);
        }
      });
    },
    enabled: !!contractAddress && !!address && isNFTGenerating,
  });

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

  // Refresh all contract state
  const refreshContractState = async () => {
    console.log('🔄 Refreshing contract state...');
    try {
      await Promise.all([
        refetchMintingActive(),
        refetchRemainingSupply(),
        refetchRemainingTime(),
        refetchTotalMementos(),
        refetchCurrentPrice(),
        refetchUserMementos(),
      ]);
      console.log('✅ Contract state refreshed');
    } catch (error) {
      console.error('❌ Failed to refresh contract state:', error);
    }
  };

  // Handle successful transaction
  useEffect(() => {
    if (isConfirmed && userMementos && userMementos.length > 0) {
      // Get the latest minted NFT ID (contract starts from 1)
      const latestMintId = Number(userMementos[userMementos.length - 1]);
      setRecentMintId(latestMintId);
      setShowRevealSection(true);
      setIsNFTGenerating(true); // Start monitoring for NFT generation
      setGeneratedNFTData(null); // Reset any previous generation data
      
      // Set a timeout to stop monitoring after 2 minutes
      const timeout = setTimeout(() => {
        console.log('⏰ Generation timeout reached, stopping event monitoring');
        setIsNFTGenerating(false);
      }, 120000); // 2 minutes
      
      setGenerationTimeout(timeout);
      
      // Refresh contract state to show updated counts and pricing
      refreshContractState();
      
      console.log(`🎯 Started monitoring NFT generation for Token ID: ${latestMintId}`);
    }
  }, [isConfirmed, userMementos]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (generationTimeout) {
        clearTimeout(generationTimeout);
      }
    };
  }, [generationTimeout]);

  // Initialize random color examples on component mount
  useEffect(() => {
    const getRandomExamples = () => {
      const shuffled = [...COLOR_COMBINATIONS].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 3);
    };
    setRandomColorExamples(getRandomExamples());
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setColorExample = (colorText: string) => {
    setColors(colorText);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset generation states for new mint
    setIsNFTGenerating(false);
    setGeneratedNFTData(null);
    setRecentMintId(null);
    setShowRevealSection(false);
    
    // Clear any existing timeout
    if (generationTimeout) {
      clearTimeout(generationTimeout);
      setGenerationTimeout(null);
    }
    
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

    // Create user's description (colors + thoughts)
    const userDescription = `${colors}${variations ? ` (${variations})` : ''}`;

    try {
      // Use dynamic price from contract
      const priceToSend = currentPrice ? currentPrice : parseEther('6.66');
      
      writeContract({
        address: contractAddress,
        abi: MEMENTO_ABI,
        functionName: 'requestMemento',
        args: [userDescription, userDescription, fullPrompt],
        value: priceToSend,
      });
    } catch (err) {
      console.error('Error requesting memento:', err);
      alert('Error requesting memento. Please try again.');
    }
  };

  const handleRevealNFT = async () => {
    if (recentMintId !== null) {
      console.log('🔄 Checking NFT generation status...');
      await refetchRecentMemento();
      await refetchUserMementos();
      // Also refresh contract state in case there are updates
      await refreshContractState();
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
          Add your personal touch to our shared geological foundation. Your thoughts become part of this collaborative time capsule of 2025 AI art.
        </p>
      </div>



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
        {/* Early Bird Pricing Section */}
        {totalMementos !== undefined && totalMementos < BigInt(200) && (
          <div className="card mb-8" style={{ 
            border: '1px solid #facc15', 
            background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)'
          }}>
            <div className="text-center">
              <div className="text-3xl mb-2">🌟</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#facc15' }}>
                Early Bird Special
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                First 200 mints at half price! Only {200 - Number(totalMementos)} left
              </p>
              
              <div className="flex items-center justify-center gap-4 mb-2">
                <div className="text-2xl font-bold text-red-400" style={{ textDecoration: 'line-through' }}>
                  6.66 FLOW
                </div>
                <div className="text-2xl font-bold" style={{ color: '#facc15' }}>
                  →
                </div>
                <div className="text-3xl font-bold" style={{ color: '#4ade80' }}>
                  3.33 FLOW
                </div>
              </div>
              
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                50% off regular price
              </div>
            </div>
          </div>
        )}

        {/* Explanation */}
        <div className="card mb-8">
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--accent-primary)' }}>
            Collaborative Art That Endures
          </h3>
          <div className="space-y-3" style={{ color: 'var(--text-secondary)' }}>
            <p><strong>Shared foundation</strong> - Every piece starts from the same geological pattern prompt, creating unity across the collection.</p>
            <p><strong>Your personal story</strong> - Your feelings and thoughts are woven into the shared canvas, making each NFT uniquely yours.</p>
            <p><strong>Built to last</strong> - Stored on Swarm's decentralized network with DeFi-backed preservation, this Vol 1 collection is designed to endure.</p>
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
                {randomColorExamples.map((example) => (
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
                  : `Mint NFT (${currentPrice && totalMementos !== undefined && totalMementos < BigInt(200) ? '3.33' : '6.66'} FLOW)`
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

        {/* Success Message */}
        {isConfirmed && showRevealSection && (
          <div className="card mt-8" style={{ 
            marginTop: '3rem',
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
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-yellow-400">●</span>
                    <span>AI processes your prompt and generates unique artwork</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-yellow-400">●</span>
                    <span>Image is stored permanently on SWARM decentralized network</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-yellow-400">●</span>
                    <span>NFT metadata is updated on the blockchain</span>
                  </div>
                </div>
              </div>

              {recentMintId !== null && (
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Your NFT ID: <span className="font-bold" style={{ color: 'var(--accent-primary)' }}>#{recentMintId}</span>
                    </div>
                  </div>

                  {/* Show different states based on generation status */}
                  {generatedNFTData ? (
                    /* NFT is ready - show the actual NFT */
                    <div className="card p-6" style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid #4ade80' }}>
                      <div className="text-center">
                        <div className="text-4xl mb-4">🎉</div>
                        <p className="text-xl font-bold mb-4" style={{ color: '#4ade80' }}>
                          Your NFT is Ready!
                        </p>
                        
                        {/* Display the actual NFT image */}
                        <div className="mb-4">
                          <img 
                            src={generatedNFTData.imageUri} 
                            alt={`Shared Sediments #${generatedNFTData.tokenId}`}
                            className="mx-auto rounded-lg shadow-lg max-w-sm w-full"
                            style={{ border: '2px solid var(--accent-primary)' }}
                            onError={(e) => {
                              console.log('Image failed to load, showing placeholder');
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400/1a1a2e/00d4ff?text=Loading...';
                            }}
                          />
                        </div>
                        
                        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                          Your unique geological pattern has been generated and stored on the decentralized network
                        </p>
                        
                        <div className="flex gap-2 justify-center">
                          <a 
                            href={generatedNFTData.imageUri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-secondary px-4 py-2 text-sm"
                            style={{ background: 'var(--gradient-button)', border: 'none', color: 'white' }}
                          >
                            🔗 View Full Size
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(generatedNFTData.imageUri);
                              alert('Image URL copied to clipboard!');
                            }}
                            className="btn btn-secondary px-4 py-2 text-sm"
                            style={{ background: 'rgba(0, 212, 255, 0.2)', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)' }}
                          >
                            📋 Copy Link
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : isNFTGenerating ? (
                    /* NFT is being generated - show animated loader */
                    <div className="card p-4" style={{ background: 'rgba(250, 204, 21, 0.1)' }}>
                      <div className="text-center">
                        <div className="text-4xl mb-4">
                          <div className="inline-block animate-spin" style={{ animationDuration: '2s' }}>🎨</div>
                        </div>
                        <p className="text-lg font-bold mb-2" style={{ color: '#facc15' }}>
                          AI is Creating Your NFT...
                        </p>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                          This usually takes 30-60 seconds. We'll automatically show it when ready!
                        </p>
                        
                        {/* Animated progress dots */}
                        <div className="flex justify-center gap-1 mb-4">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Listening for blockchain events...
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Fallback - manual check */
                    <div className="card p-4" style={{ background: 'rgba(250, 204, 21, 0.1)' }}>
                      <div className="text-center">
                        <div className="text-3xl mb-2">⏳</div>
                        <p className="text-lg font-bold" style={{ color: '#facc15' }}>
                          Generation in Progress...
                        </p>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                          Your NFT is being created. This usually takes 30-60 seconds.
                          {!isNFTGenerating && ' Event monitoring has stopped - you can manually check if it\'s ready.'}
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