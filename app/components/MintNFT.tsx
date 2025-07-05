'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
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
        <h2 className="text-3xl font-bold mb-4">Create Your NFT</h2>
        <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
          Design your unique geological pattern with AI
        </p>
      </div>

      <div className="mint-form">
        {/* Explanation */}
        <div className="card mb-8">
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--accent-primary)' }}>
            What You'll Get
          </h3>
          <div className="space-y-3" style={{ color: 'var(--text-secondary)' }}>
            <p><strong>Horizontal layered patterns</strong> that look like cross-sections of canyon walls, rock formations, or sedimentary deposits.</p>
            <p><strong>Natural wavy boundaries</strong> between each layer, creating an organic, earthy appearance.</p>
            <p><strong>Cohesive color palettes</strong> that work together harmoniously.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Color Palette Input */}
          <div className="form-group">
            <label htmlFor="colors" className="form-label">
              Color Palette Description
            </label>
            <input 
              type="text" 
              id="colors" 
              className="form-input"
              placeholder="e.g., warm earth tones with deep reds and browns..."
              value={colors}
              onChange={(e) => setColors(e.target.value)}
              required
            />
            
            {/* Color Examples */}
            <div className="example-colors">
              <span className="color-example" onClick={() => setColorExample('warm earth tones with deep reds and browns')}>
                Earth & Red
              </span>
              <span className="color-example" onClick={() => setColorExample('cool blues and grays like ocean sediments')}>
                Ocean Blues
              </span>
              <span className="color-example" onClick={() => setColorExample('desert colors with oranges, tans, and sandy yellows')}>
                Desert Tones
              </span>
              <span className="color-example" onClick={() => setColorExample('forest colors with deep greens and browns')}>
                Forest Greens
              </span>
              <span className="color-example" onClick={() => setColorExample('sunset colors with purples, oranges, and pinks')}>
                Sunset
              </span>
            </div>
          </div>

          {/* Variations Input */}
          <div className="form-group">
            <label htmlFor="variations" className="form-label">
              Special Effects (Optional)
            </label>
            <input 
              type="text" 
              id="variations" 
              className="form-input"
              placeholder="Add special effects, textures, or modifications..."
              value={variations}
              onChange={(e) => setVariations(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={isPending || isConfirming}
          >
            {isPending || isConfirming ? (
              <>
                <div className="spinner"></div>
                {isPending ? 'Confirming Transaction...' : 'Processing...'}
              </>
            ) : (
              'Generate Geological Pattern NFT (6.66 FLOW)'
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