'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseEther } from 'viem';
import { MEMENTO_ABI } from '@/lib/wagmi';

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  545: process.env.NEXT_PUBLIC_MEMENTO_CONTRACT_FLOW_TESTNET as `0x${string}`, // Flow EVM Testnet
  747: process.env.NEXT_PUBLIC_MEMENTO_CONTRACT_FLOW_MAINNET as `0x${string}`, // Flow EVM Mainnet
};

export default function MintNFT() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [colors, setColors] = useState('');
  const [variations, setVariations] = useState('');

  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

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
        value: parseEther('0.003'),
      });
    } catch (err) {
      console.error('Error requesting memento:', err);
      alert('Error requesting memento. Please try again.');
    }
  };

  if (!isConnected) {
    return (
      <div className="container">
        <div className="header">
          <h1>🏔️ Geological Pattern Generator</h1>
          <p className="subtitle">Connect your wallet to mint geological patterns</p>
        </div>
      </div>
    );
  }

  if (!contractAddress) {
    return (
      <div className="container">
        <div className="header">
          <h1>🚫 Unsupported Network</h1>
          <p className="subtitle">Please switch to Flow EVM Testnet or Mainnet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🏔️ Geological Pattern Generator</h1>
        <p className="subtitle">Create beautiful layered rock formation patterns</p>
      </div>

      <div className="explanation">
        <h3>What you'll get:</h3>
        <p><strong>Horizontal layered patterns</strong> that look like cross-sections of canyon walls, rock formations, or sedimentary deposits.</p>
        <p><strong>Natural wavy boundaries</strong> between each layer, creating an organic, earthy appearance.</p>
        <p><strong>Cohesive color palettes</strong> that work together harmoniously.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-section">
        <div className="input-group">
          <label htmlFor="colors">Color Palette Description</label>
          <input 
            type="text" 
            id="colors" 
            className="main-input"
            placeholder="e.g., warm earth tones with deep reds and browns..."
            value={colors}
            onChange={(e) => setColors(e.target.value)}
            required
          />
          <div className="example-colors">
            <span className="color-example" onClick={() => setColorExample('warm earth tones with deep reds and browns')}>Earth & Red</span>
            <span className="color-example" onClick={() => setColorExample('cool blues and grays like ocean sediments')}>Ocean Blues</span>
            <span className="color-example" onClick={() => setColorExample('desert colors with oranges, tans, and sandy yellows')}>Desert Tones</span>
            <span className="color-example" onClick={() => setColorExample('forest colors with deep greens and browns')}>Forest Greens</span>
            <span className="color-example" onClick={() => setColorExample('sunset colors with purples, oranges, and pinks')}>Sunset</span>
          </div>
          
          <input 
            type="text" 
            id="variations" 
            className="variations-input"
            placeholder="Optional: Add special effects, textures, or modifications..."
            value={variations}
            onChange={(e) => setVariations(e.target.value)}
          />
        </div>

        <div className="generate-section">
          <button type="submit" disabled={isPending || isConfirming}>
            {isPending || isConfirming ? (
              <>
                <div className="spinner"></div>
                {isPending ? 'Confirming...' : 'Processing...'}
              </>
            ) : (
              'Generate Geological Pattern NFT (0.003 FLOW)'
            )}
          </button>
        </div>
      </form>

      {/* Success Message */}
      {isConfirmed && (
        <div className="success-message">
          <h3>🎉 NFT Request Submitted Successfully!</h3>
          <p>Your geological pattern NFT has been minted! Our AI is now generating your unique artwork.</p>
          <div className="process-steps">
            <h4>What happens next:</h4>
            <ol>
              <li>🤖 AI generates your geological pattern using DALL-E 3</li>
              <li>🌐 Image is stored permanently on SWARM network</li>
              <li>🔗 Your NFT metadata is updated with the final artwork</li>
              <li>✅ You can view your completed NFT in your wallet</li>
            </ol>
          </div>
          <p className="transaction-hash">
            <strong>Transaction Hash:</strong> {hash}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <h3>Transaction Failed</h3>
          <p>{error.message}</p>
        </div>
      )}
    </div>
  );
} 