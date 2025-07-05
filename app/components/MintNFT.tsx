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
              placeholder="e.g., feeling calm like ocean blues, or energetic like sunset oranges..."
              value={colors}
              onChange={(e) => setColors(e.target.value)}
              required
            />
            
            {/* Color Examples */}
            <div className="example-colors">
              <span className="color-example" onClick={() => setColorExample('peaceful like soft blues and gentle grays')}>
                Peaceful
              </span>
              <span className="color-example" onClick={() => setColorExample('energetic like bright oranges and vibrant yellows')}>
                Energetic
              </span>
              <span className="color-example" onClick={() => setColorExample('nostalgic like warm browns and faded golds')}>
                Nostalgic
              </span>
              <span className="color-example" onClick={() => setColorExample('dreamy like soft purples and misty pinks')}>
                Dreamy
              </span>
              <span className="color-example" onClick={() => setColorExample('grounded like deep greens and earthy browns')}>
                Grounded
              </span>
            </div>
          </div>

          {/* Variations Input */}
          <div className="form-group">
            <label htmlFor="variations" className="form-label">
              What are you thinking of lately or just some random thoughts? (Optional)
            </label>
            <input 
              type="text" 
              id="variations" 
              className="form-input"
              placeholder="Share your recent thoughts, dreams, or anything on your mind..."
              value={variations}
              onChange={(e) => setVariations(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={isPending || isConfirming || !isMintingActive}
          >
            {isPending || isConfirming ? (
              <>
                <div className="spinner"></div>
                {isPending ? 'Confirming Transaction...' : 'Processing...'}
              </>
            ) : !isMintingActive ? (
              'Minting Period Ended'
            ) : (
              'Create My Personal Memento (6.66 FLOW)'
            )}
          </button>
        </form>
      </div>

      {/* Success Message */}
      {isConfirmed && (
        <div className="status-message status-success mt-8">
          <h3 className="text-xl font-bold mb-4">🎉 NFT Minted Successfully!</h3>
          <p className="mb-4">Your geological pattern NFT has been created! Our AI is now generating your unique artwork.</p>
          
          <div className="card">
            <h4 className="font-bold mb-3" style={{ color: 'var(--accent-primary)' }}>What happens next:</h4>
            <ol className="space-y-2 text-sm">
              <li>🤖 AI generates your geological pattern using DALL-E 3</li>
              <li>🌐 Image is stored permanently on SWARM network</li>
              <li>🔗 Your NFT metadata is updated with the final artwork</li>
              <li>✅ You can view your completed NFT in your wallet</li>
            </ol>
          </div>
          
          <div className="mt-4 p-3 bg-black/30 rounded-lg">
            <p className="text-sm font-mono break-all" style={{ color: 'var(--accent-primary)' }}>
              Transaction: {hash}
            </p>
          </div>
        </div>
      )}

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