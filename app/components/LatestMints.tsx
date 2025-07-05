'use client';

import { useState, useEffect } from 'react';
import { useReadContract, useChainId } from 'wagmi';
import { MEMENTO_ABI } from '@/lib/wagmi';
import Image from 'next/image';

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  545: process.env.NEXT_PUBLIC_MEMENTO_CONTRACT_FLOW_TESTNET as `0x${string}`, // Flow EVM Testnet
  747: process.env.NEXT_PUBLIC_MEMENTO_CONTRACT_FLOW_MAINNET as `0x${string}`, // Flow EVM Mainnet
};

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface MementoData {
  tokenId: number;
  title: string;
  content: string;
  aiPrompt: string;
  creator: string;
  timestamp: number;
  isActive: boolean;
  imageUri: string;
  isGenerated: boolean;
  metadata?: NFTMetadata;
}

// Custom hook to fetch memento data for a specific token
function useMemento(tokenId: number | null, contractAddress: `0x${string}` | undefined) {
  const { data: mementoData } = useReadContract({
    address: contractAddress,
    abi: MEMENTO_ABI,
    functionName: 'getMemento',
    args: tokenId !== null ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId !== null && !!contractAddress }
  }) as { data: any[] | undefined };

  const [metadata, setMetadata] = useState<NFTMetadata | undefined>();

  useEffect(() => {
    if (mementoData && mementoData[6] && mementoData[7]) { // imageUri exists and isGenerated
      const imageUri = mementoData[6];
      
      console.log(`Token ${tokenId} - Image URI:`, imageUri);
      
      // Fetch metadata from the URI
      const fetchMetadata = async () => {
        try {
          const response = await fetch(imageUri);
          console.log(`Token ${tokenId} - Response status:`, response.status);
          console.log(`Token ${tokenId} - Response headers:`, response.headers.get('content-type'));
          
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            
            // Check if it's a JSON metadata file
            if (contentType && contentType.includes('application/json')) {
              const metadata = await response.json();
              console.log(`Token ${tokenId} - Metadata:`, metadata);
              setMetadata(metadata);
            } 
            // If it's an image file, create metadata object
            else if (contentType && (contentType.includes('image/') || contentType.includes('png') || contentType.includes('jpeg') || contentType.includes('jpg'))) {
              console.log(`Token ${tokenId} - Direct image URL detected`);
              const metadata = {
                name: mementoData[0] || `Memento #${tokenId}`,
                description: mementoData[1] || 'Geological pattern NFT generated with AI',
                image: imageUri
              };
              setMetadata(metadata);
            }
            // Try to parse as JSON anyway (fallback)
            else {
              try {
                const text = await response.text();
                console.log(`Token ${tokenId} - Response text preview:`, text.substring(0, 100));
                
                // Try to parse as JSON
                const metadata = JSON.parse(text);
                console.log(`Token ${tokenId} - Parsed metadata:`, metadata);
                setMetadata(metadata);
              } catch (parseError) {
                console.error(`Token ${tokenId} - Failed to parse as JSON:`, parseError);
                console.log(`Token ${tokenId} - Assuming direct image URL`);
                
                // Assume it's a direct image URL
                const metadata = {
                  name: mementoData[0] || `Memento #${tokenId}`,
                  description: mementoData[1] || 'Geological pattern NFT generated with AI',
                  image: imageUri
                };
                setMetadata(metadata);
              }
            }
          } else {
            console.error(`Token ${tokenId} - HTTP Error:`, response.status, response.statusText);
          }
        } catch (error) {
          console.error(`Token ${tokenId} - Network error:`, error);
          console.log(`Token ${tokenId} - Creating fallback metadata`);
          
          // Create fallback metadata
          const metadata = {
            name: mementoData[0] || `Memento #${tokenId}`,
            description: mementoData[1] || 'Geological pattern NFT generated with AI',
            image: imageUri // Use the URI as is, might be a direct image
          };
          setMetadata(metadata);
        }
      };

      fetchMetadata();
    }
  }, [mementoData, tokenId]);

  if (!mementoData) return null;

  return {
    tokenId: tokenId!,
    title: mementoData[0],
    content: mementoData[1],
    aiPrompt: mementoData[2],
    creator: mementoData[3],
    timestamp: Number(mementoData[4]),
    isActive: mementoData[5],
    imageUri: mementoData[6],
    isGenerated: mementoData[7],
    metadata
  } as MementoData;
}

export default function LatestMints() {
  const chainId = useChainId();
  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  const [tokenIds, setTokenIds] = useState<number[]>([]);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Get total number of mementos with auto-refresh
  const { data: totalMementos, isError: totalError, isLoading: totalLoading, refetch: refetchTotal } = useReadContract({
    address: contractAddress,
    abi: MEMENTO_ABI,
    functionName: 'totalMementos',
    query: { 
      refetchInterval: 30000, // Refresh every 30 seconds
      refetchOnWindowFocus: true
    }
  }) as { data: bigint | undefined; isError: boolean; isLoading: boolean; refetch: () => void };

  // Calculate the last 3 token IDs (contract starts from 1, not 0)
  useEffect(() => {
    if (totalMementos && !totalError) {
      const total = Number(totalMementos);
      if (total > 0) {
        const latestTokenIds = [];
        // Token IDs start from 1, so if total is 3, we have tokens 1, 2, 3
        for (let i = Math.max(1, total - 2); i <= total; i++) {
          latestTokenIds.push(i);
        }
        setTokenIds(latestTokenIds.reverse()); // Newest first
      } else {
        setTokenIds([]);
      }
    }
  }, [totalMementos, totalError]);

  // Fetch memento data for each token
  const memento0 = useMemento(tokenIds[0] ?? null, contractAddress);
  const memento1 = useMemento(tokenIds[1] ?? null, contractAddress);
  const memento2 = useMemento(tokenIds[2] ?? null, contractAddress);

  const mementos = [memento0, memento1, memento2].filter(Boolean) as MementoData[];

  // Manual refresh function
  const handleRefresh = async () => {
    setLastRefresh(Date.now());
    await refetchTotal();
  };

  if (!contractAddress) {
    return (
      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">Latest Mints</h2>
        <div className="text-center py-8">
          <p style={{ color: 'var(--text-secondary)' }}>
            Please connect to Flow EVM Testnet or Mainnet to view latest mints
          </p>
        </div>
      </section>
    );
  }

  if (totalLoading) {
    return (
      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">Latest Mints</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="nft-card">
              <div className="nft-placeholder">
                <div className="nft-placeholder-content">
                  <div className="nft-placeholder-icon">🔄</div>
                  <div className="nft-placeholder-text">Loading...</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-400 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-400 rounded animate-pulse w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (totalError || !totalMementos || Number(totalMementos) === 0) {
    return (
      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">Latest Mints</h2>
        <div className="text-center py-8">
          <div className="text-6xl mb-4 opacity-50">🏔️</div>
          <p style={{ color: 'var(--text-secondary)' }}>
            No mementos have been minted yet. Be the first to create one!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Latest Mints</h2>
        <button
          onClick={handleRefresh}
          className="btn btn-secondary"
          style={{ 
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>🔄</span>
          Refresh
        </button>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {mementos.map((memento) => (
          <div key={memento.tokenId} className="nft-card">
            <div className="nft-image-container">
              {memento.isGenerated && memento.metadata?.image ? (
                <Image
                  src={memento.metadata.image}
                  alt={memento.metadata.name || `Memento #${memento.tokenId}`}
                  width={300}
                  height={300}
                  className="nft-image"
                  onError={(e) => {
                    console.error(`Failed to load image for token ${memento.tokenId}:`, memento.metadata?.image);
                    // Fallback to placeholder if image fails to load
                    e.currentTarget.style.display = 'none';
                    const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                    if (placeholder) placeholder.classList.remove('hidden');
                  }}
                  onLoad={() => {
                    console.log(`Successfully loaded image for token ${memento.tokenId}`);
                  }}
                />
              ) : memento.isGenerated ? (
                <div className="nft-placeholder">
                  <div className="nft-placeholder-content">
                    <div className="nft-placeholder-icon">⚠️</div>
                    <div className="nft-placeholder-text">
                      {memento.imageUri ? 'Loading Image...' : 'Metadata Error'}
                    </div>
                    <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                      {memento.imageUri ? 'Parsing metadata...' : 'No image URI found'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="nft-placeholder">
                  <div className="nft-placeholder-content">
                    <div className="nft-placeholder-icon">🏔️</div>
                    <div className="nft-placeholder-text">AI Generation Pending</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="nft-info">
              <h3 className="nft-title">
                {memento.metadata?.name || memento.title || `Memento #${memento.tokenId}`}
              </h3>
              <p className="nft-description">
                {memento.metadata?.description || memento.content || 'Geological pattern NFT'}
              </p>
              <div className="nft-meta">
                <div className="nft-meta-item">
                  <span className="nft-meta-label">Token ID:</span>
                  <span className="nft-meta-value">#{memento.tokenId}</span>
                </div>
                <div className="nft-meta-item">
                  <span className="nft-meta-label">Status:</span>
                  <span className={`nft-meta-value ${memento.isGenerated ? 'text-green-400' : 'text-yellow-400'}`}>
                    {memento.isGenerated ? 'Generated' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Fill remaining slots with placeholders */}
        {mementos.length < 3 && Array.from({ length: 3 - mementos.length }, (_, i) => (
          <div key={`placeholder-${i}`} className="nft-card">
            <div className="nft-placeholder">
              <div className="nft-placeholder-content">
                <div className="nft-placeholder-icon">🏔️</div>
                <div className="nft-placeholder-text">No NFT Yet</div>
              </div>
            </div>
            <div className="nft-info">
              <h3 className="nft-title">Waiting for mint...</h3>
              <p className="nft-description">This slot will show the next minted NFT</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
} 