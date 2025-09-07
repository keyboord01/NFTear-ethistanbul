'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { NFTCard } from '@/components/nft-card'
import { getFractionalNFTForMarketplace } from '@/lib/manager-contract'

const COLLECTIONS = {
  'eth-istanbul': {
    name: 'ETH Istanbul Collection',
    banner: '/nfts/ethistanbulgif.gif',
    logo: '/nfts/ethistanbulgif.gif',
    description: 'Exclusive ETH Istanbul fractionalized NFTs and commemorative items.',
    stats: {
      floor: '0.08 ETH',
      volume: '25 ETH',
      items: 3,
      owners: 180,
    },
  },
} as const

const MANAGER_CONTRACTS = [
  '0xEF4fA50e9EC36eBe1C3c3CA54398d29db8459c66',
  '0x139Cff0acE0d8D8CCf08693D59280b7aAbC0D676',
  '0x249D1399aE8B63aaE10b192833a2913974d5e0EB'
] as const

export default function CollectionPage() {
  const params = useParams()
  const slug = String(params?.slug || '')
  const collection = (COLLECTIONS as any)[slug]

  const [visibleCount, setVisibleCount] = useState(9)
  const [items, setItems] = useState<Array<{
    id: string
    name: string
    image: string
    totalShares: number
    availableShares: number
    pricePerShare: string
    creator: string
    contract: string
  }>>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadContracts() {
      try {
        setLoading(true)
        const results = await Promise.all(
          MANAGER_CONTRACTS.map(async (contract) => {
            try {
              const data = await getFractionalNFTForMarketplace(contract)
              if (data) {
                return { ...data, contract }
              }
            } catch {}
            return null
          })
        )
        if (!cancelled) {
          setItems(results.filter(Boolean) as any)
        }
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadContracts()
    return () => {
      cancelled = true
    }
  }, [])
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [visibleCount, items])
  const hasMore = items.length > visibleCount

  
  const dynamicStats = useMemo(() => {
    if (items.length === 0) {
      return {
        floor: '0 ETH',
        volume: '0 ETH',
        items: 0,
        owners: 0,
      }
    }

    
    const prices = items.map(item => parseFloat(item.pricePerShare))
    const floorPrice = Math.min(...prices)

    
    const totalVolume = items.reduce((sum, item) => {
      const sharesSold = item.totalShares - item.availableShares
      const itemVolume = sharesSold * parseFloat(item.pricePerShare) / item.totalShares
      return sum + itemVolume
    }, 0)

    
    const itemsCount = items.length

    
    const uniqueCreators = new Set(items.map(item => item.creator)).size
    const estimatedOwners = uniqueCreators + Math.floor(itemsCount * 2.5) 

    
    const formatETHAmount = (amount: number): string => {
      if (amount >= 0.001) {
        return amount.toFixed(3)
      } else if (amount >= 0.000001) {
        return amount.toFixed(6)
      } else if (amount > 0) {
        return amount.toExponential(3)
      } else {
        return '0'
      }
    }

    return {
      floor: `${formatETHAmount(floorPrice)} ETH`,
      volume: `${formatETHAmount(totalVolume)} ETH`,
      items: itemsCount,
      owners: estimatedOwners,
    }
  }, [items])

  if (!collection) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Collection Not Found</h1>
          <Link href="/" className="btn-primary px-6 py-3 rounded-lg inline-block">Back to Marketplace</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="pt-24">
       
        <section>
          <div className="relative h-56 sm:h-72 lg:h-80">
            <Image src={collection.banner} alt={collection.name} fill className="object-cover" />
            <div className="absolute inset-0 bg-black/70" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-700 relative">
                <Image src={collection.logo} alt={collection.name} fill className="object-cover" />
              </div>
              <div className="pb-2">
                <h1 className="text-3xl font-bold text-white">{collection.name}</h1>
                <p className="text-gray-400 text-sm mt-1">{collection.description}</p>
              </div>
            </div>
          </div>
        </section>

       
        <section className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-4 text-center">
                <div className="text-gray-400 text-sm">Floor</div>
                <div className="text-white text-xl font-semibold">
                  {loading ? (
                    <div className="h-6 bg-gray-700/50 rounded animate-pulse w-16 mx-auto"></div>
                  ) : (
                    dynamicStats.floor
                  )}
                </div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-gray-400 text-sm">Volume</div>
                <div className="text-white text-xl font-semibold">
                  {loading ? (
                    <div className="h-6 bg-gray-700/50 rounded animate-pulse w-16 mx-auto"></div>
                  ) : (
                    dynamicStats.volume
                  )}
                </div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-gray-400 text-sm">Items</div>
                <div className="text-white text-xl font-semibold">
                  {loading ? (
                    <div className="h-6 bg-gray-700/50 rounded animate-pulse w-8 mx-auto"></div>
                  ) : (
                    dynamicStats.items
                  )}
                </div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-gray-400 text-sm">Owners</div>
                <div className="text-white text-xl font-semibold">
                  {loading ? (
                    <div className="h-6 bg-gray-700/50 rounded animate-pulse w-12 mx-auto"></div>
                  ) : (
                    dynamicStats.owners
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

       
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Items</h2>
              {/* <div className="flex gap-3">
                <select className="bg-zinc-700/40 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm">
                  <option>All</option>
                  <option>Available</option>
                  <option>Sold Out</option>
                </select>
                <select className="bg-zinc-700/40 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm">
                  <option>Sort: Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
              </div> */}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleItems.map((nft) => (
                <Link href={`/nft-purchase/${nft.contract}`} key={nft.id} className="cursor-pointer">
                  <NFTCard {...nft} />
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 text-center">
                <button
                  className="btn-secondary px-6 py-3 rounded-lg font-medium"
                  onClick={() => setVisibleCount((c) => Math.min(c + 9, items.length))}
                >
                  Load More Items
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}


