'use client'

import { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { NFTCard } from '@/components/nft-card'
import { ExploreNFTsModal, LearnMoreModal } from '@/components/modals'
import { Footer } from '@/components/footer'
import { fetchActiveMarketplaceItems, REGISTRY_ADDRESS, type MarketplaceItem } from '@/lib/registry'


const featuredCollections = [
  { 
    slug: 'eth-istanbul',
    name: 'ETH Istanbul Collection', 
    floor: '0.08 ETH', 
    volume: '425 ETH', 
    image: '/nfts/ethistanbulgif.gif'
  },
 
]

export default function Home() {
  const [showLearnModal, setShowLearnModal] = useState(false)
  const [visibleCount, setVisibleCount] = useState(9)
  const [items, setItems] = useState<MarketplaceItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  
  useEffect(() => {
    async function fetchNFTs() {
      try {
        setLoading(true)
        setError(null)
        
        
        
        
        if (!REGISTRY_ADDRESS) {
          
          setError('Registry address not configured. Please set NEXT_PUBLIC_REGISTRY_ADDRESS in your environment.')
          setItems([])
          return
        }
        
        const registryItems = await fetchActiveMarketplaceItems(REGISTRY_ADDRESS)
        
        setItems(registryItems)
        
      } catch (err: any) {
        console.error(' Error fetching marketplace items:', err)
        // Don't show error immediately, just set empty items to prevent app crash
        setError(null)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    // Add a small delay to ensure providers are initialized
    const timer = setTimeout(fetchNFTs, 100)
    return () => clearTimeout(timer)
  }, [])

  
  const registryNFTs = items || []
  const visibleNFTs = useMemo(() => registryNFTs.slice(0, visibleCount), [registryNFTs, visibleCount])
  const hasMore = registryNFTs.length > visibleCount

  const handleExploreNFTs = () => {
    const nftSection = document.getElementById('nft-marketplace')
    if (nftSection) {
      nftSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-black relative">
      
      <div className="abstract-bg"></div>
      <div className="bg-blob-1"></div>
      <div className="bg-blob-2"></div>
      <div className="bg-blob-3"></div>
      <div className="floating-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>
      
      <Navbar />
      
      
      <section className="pt-32 pb-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                  Fractional NFT Marketplace
                </h1>
                
                <div className="space-y-4">
                  <p className="text-xl text-gray-300 leading-relaxed">
                    Share NFT ownership and utilities through decentralized fractionalization.
                  </p>
                  <p className="text-lg text-gray-400 leading-relaxed">
                    Buy and sell fractions while keeping all the benefits — airdrops, yields, and exclusive access.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleExploreNFTs}
                  className="btn-primary px-8 py-4 rounded-lg font-medium text-lg"
                >
                  Explore NFTs
                </button>
                <button 
                  onClick={() => setShowLearnModal(true)}
                  className="btn-secondary px-8 py-4 rounded-lg font-medium text-lg"
                >
                  Learn More
                </button>
              </div>

              
              {items && items.length > 0 && (
                <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-800">
                  <div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {loading ? (
                        <div className="h-8 bg-gray-700/50 rounded animate-pulse w-16"></div>
                      ) : (
                        items.length
                      )}
                    </div>
                    <div className="text-sm text-gray-400">NFTs Fractionalized</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {loading ? (
                        <div className="h-8 bg-gray-700/50 rounded animate-pulse w-20"></div>
                      ) : (
                        `${items.reduce((sum, item) => {
                          const sharesSold = item.totalShares - item.availableShares
                          const itemVolume = sharesSold * parseFloat(item.pricePerShare) / item.totalShares
                          return sum + itemVolume
                        }, 0).toFixed(2)} ETH`
                      )}
                    </div>
                    <div className="text-sm text-gray-400">Total Volume</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {loading ? (
                        <div className="h-8 bg-gray-700/50 rounded animate-pulse w-16"></div>
                      ) : (
                        new Set(items.map(item => item.creator)).size + Math.floor(items.length * 2.5)
                      )}
                    </div>
                    <div className="text-sm text-gray-400">Estimated Users</div>
                  </div>
                </div>
              )}
            </div>

            
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Link 
                    href={items && items.length > 0 ? `/nft-purchase/${items[0].contract}` : '#'} 
                    className={`card p-4 transform rotate-2 block ${loading || !items || items.length === 0 ? 'pointer-events-none' : 'cursor-pointer'}`}
                  >
                    <div className="relative w-full h-32 rounded-lg mb-3 overflow-hidden">
                      {loading || !items || items.length === 0 ? (
                        <div className="w-full h-full bg-gray-700/50 animate-pulse flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-gray-500 border-t-gray-300 rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <Image 
                          src={items[0]?.image || "/nfts/ethistanbulgif.gif"}
                          alt={items[0]?.name || "NFT"} 
                          fill
                          className={`object-cover ${loading ? 'grayscale' : ''}`}
                        />
                      )}
                    </div>
                    <div className="text-sm text-white font-medium">
                      {loading || !items || items.length === 0 ? (
                        <div className="h-4 bg-gray-700/50 rounded animate-pulse w-24"></div>
                      ) : (
                        items[0]?.name || "Loading..."
                      )}
                    </div>
                    <div className="text-xs">
                      {loading || !items || items.length === 0 ? (
                        <div className="h-3 bg-gray-600/50 rounded animate-pulse w-20"></div>
                      ) : items[0]?.availableShares === 0 ? (
                        <span className="text-red-400">Sold Out</span>
                      ) : (
                        <span className="text-green-400">{items[0]?.availableShares} shares available</span>
                      )}
                    </div>
                  </Link>
                  
                  <Link 
                    href={items && items.length > 1 ? `/nft-purchase/${items[1].contract}` : '#'} 
                    className={`card p-4 transform -rotate-1 block ${loading || !items || items.length < 2 ? 'pointer-events-none' : 'cursor-pointer'}`}
                  >
                    <div className="relative w-full h-32 rounded-lg mb-3 overflow-hidden">
                      {loading || !items || items.length < 2 ? (
                        <div className="w-full h-full bg-gray-700/50 animate-pulse flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-gray-500 border-t-gray-300 rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <Image 
                          src={items[1]?.image || "/nfts/ethistanbulgif.gif"}
                          alt={items[1]?.name || "NFT"} 
                          fill
                          className={`object-cover ${loading ? 'grayscale' : ''}`}
                        />
                      )}
                    </div>
                    <div className="text-sm text-white font-medium">
                      {loading || !items || items.length < 2 ? (
                        <div className="h-4 bg-gray-700/50 rounded animate-pulse w-24"></div>
                      ) : (
                        items[1]?.name || "Loading..."
                      )}
                    </div>
                    <div className="text-xs">
                      {loading || !items || items.length < 2 ? (
                        <div className="h-3 bg-gray-600/50 rounded animate-pulse w-20"></div>
                      ) : items[1]?.availableShares === 0 ? (
                        <span className="text-red-400">Sold Out</span>
                      ) : (
                        <span className="text-gray-400">{items[1]?.availableShares} shares available</span>
                      )}
                    </div>
                  </Link>
                </div>
                
                <div className="space-y-4 mt-8">
                  <Link 
                    href={items && items.length > 2 ? `/nft-purchase/${items[2].contract}` : '#'} 
                    className={`card p-4 transform -rotate-2 block ${loading || !items || items.length < 3 ? 'pointer-events-none' : 'cursor-pointer'}`}
                  >
                    <div className="relative w-full h-32 rounded-lg mb-3 overflow-hidden">
                      {loading || !items || items.length < 3 ? (
                        <div className="w-full h-full bg-gray-700/50 animate-pulse flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-gray-500 border-t-gray-300 rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <Image 
                          src={items[2]?.image || "/nfts/ethistanbulgif.gif"}
                          alt={items[2]?.name || "NFT"} 
                          fill
                          className={`object-cover ${loading ? 'grayscale' : ''}`}
                        />
                      )}
                    </div>
                    <div className="text-sm text-white font-medium">
                      {loading || !items || items.length < 3 ? (
                        <div className="h-4 bg-gray-700/50 rounded animate-pulse w-24"></div>
                      ) : (
                        items[2]?.name || "Loading..."
                      )}
                    </div>
                    <div className="text-xs">
                      {loading || !items || items.length < 3 ? (
                        <div className="h-3 bg-gray-600/50 rounded animate-pulse w-20"></div>
                      ) : items[2]?.availableShares === 0 ? (
                        <span className="text-red-400">Sold Out</span>
                      ) : (
                        <span className="text-gray-400">{items[2]?.availableShares} shares available</span>
                      )}
                    </div>
                  </Link>
                  
                  {/* <Link 
                    href={items && items.length > 3 ? `/nft-purchase/${items[3].contract}` : '#'} 
                    className={`card p-4 transform rotate-1 block ${loading || !items || items.length < 4 ? 'pointer-events-none' : 'cursor-pointer'}`}
                  >
                    <div className="relative w-full h-32 rounded-lg mb-3 overflow-hidden">
                      {loading || !items || items.length < 4 ? (
                        <div className="w-full h-full bg-gray-700/50 animate-pulse flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-gray-500 border-t-gray-300 rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <Image 
                          src={items[3]?.image || "/nfts/ethistanbulgif.gif"}
                          alt={items[3]?.name || "NFT"} 
                          fill
                          className={`object-cover ${loading ? 'grayscale' : ''}`}
                        />
                      )}
                    </div>
                    <div className="text-sm text-white font-medium">
                      {loading || !items || items.length < 4 ? (
                        <div className="h-4 bg-gray-700/50 rounded animate-pulse w-24"></div>
                      ) : (
                        items[3]?.name || "Loading..."
                      )}
                    </div>
                    <div className="text-xs">
                      {loading || !items || items.length < 4 ? (
                        <div className="h-3 bg-gray-600/50 rounded animate-pulse w-20"></div>
                      ) : items[3]?.availableShares === 0 ? (
                        <span className="text-red-400">Sold Out</span>
                      ) : (
                        <span className="text-gray-400">{items[3]?.availableShares} shares available</span>
                      )}
                    </div>
                  </Link> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-zinc-950/80 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Featured Collections</h2>
            <p className="text-gray-400">Discover the most popular fractional NFT collections</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCollections.map((collection, index) => (
              <Link href={`/collection/${collection.slug}`} key={index} className="card p-6 cursor-pointer">
                <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
                  <Image 
                    src={collection.image} 
                    alt={collection.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{collection.name}</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Floor: <span className="text-white font-medium">{collection.floor}</span></span>
                  <span className="text-gray-400">Volume: <span className="text-white font-medium">{collection.volume}</span></span>
                </div>
              </Link>
            ))}

            {Array.from({ length: Math.max(0, 3 - featuredCollections.length) }).map((_, i) => (
              <div key={`placeholder-${i}`} className="card p-6 border border-dashed border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700 transition-colors">
                <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-zinc-800/40 flex items-center justify-center">
                  <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider bg-zinc-800/80 text-gray-300 px-2 py-1 rounded border border-zinc-700">Upcoming</span>
                  <Image src="/window.svg" alt="Upcoming collection" width={40} height={40} className="opacity-60" />
                </div>
                <h3 className="text-lg font-semibold text-white/90 mb-2">Coming Soon</h3>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Floor: —</span>
                  <span>Volume: —</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      <section id="nft-marketplace" className="py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Fractional NFTs</h2>
              <div className="flex items-center gap-3">
                <p className="text-gray-400">Buy fractions of premium NFTs</p>
                {!loading && (
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${items && items.length > 0 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                    <span className="text-xs text-gray-500">
                      {items && items.length > 0 ? `${items.length} Live NFTs` : 'No NFTs Available'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* <div className="flex gap-3">
              <select className="bg-zinc-700/40 border border-gray-700 text-white px-4 py-2 rounded-lg text-sm">
                <option>All Categories</option>
                <option>Art</option>
                <option>Gaming</option>
                <option>Music</option>
                <option>Sports</option>
              </select>
              <select className="bg-zinc-700/40 border border-gray-700 text-white px-4 py-2 rounded-lg text-sm">
                <option>Sort by</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Most Shares Available</option>
                <option>Recently Listed</option>
              </select>
            </div> */}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="aspect-square bg-zinc-800/60 rounded mb-4"></div>
                  <div className="h-4 bg-zinc-800/60 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-zinc-800/60 rounded w-1/3 mb-3"></div>
                  <div className="h-3 bg-zinc-800/60 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-zinc-800/60 rounded"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4"></div>
              <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Registry</h3>
              <p className="text-gray-400 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="btn-primary px-4 py-2 rounded-lg text-sm"
              >
                Try Again
              </button>
            </div>
          ) : (!loading && registryNFTs.length === 0) ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">📭</div>
              <h3 className="text-lg font-semibold text-white mb-2">No NFTs Available</h3>
              <p className="text-gray-400 mb-4">No fractional NFTs are currently available in the registry.</p>
              <p className="text-sm text-gray-500">Register your first NFT to get started!</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {!loading && visibleNFTs.map((nft) => (
              <Link href={`/nft-purchase/${nft.contract || nft.id}`} prefetch key={nft.id} className="cursor-pointer">
                <NFTCard {...nft} />
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="mt-12 text-center">
              <button 
                className="btn-secondary px-6 py-3 rounded-lg font-medium"
                onClick={() => setVisibleCount((c) => Math.min(c + 9, registryNFTs.length))}
              >
                Load More NFTs
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />

      <LearnMoreModal 
        isOpen={showLearnModal} 
        onClose={() => {
          setShowLearnModal(false)
          
          if (typeof document !== 'undefined') {
            document.body.style.overflow = 'unset'
          }
        }} 
      />
    </div>
  );
}
