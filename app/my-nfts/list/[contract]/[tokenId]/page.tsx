'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import Image from 'next/image'
import { Tilt } from '@/components/tilt'
import { NFTMedia } from '@/components/nft-media'
import { ImageLightbox } from '@/components/image-lightbox'
import { resolveNftImageUrl, TRANSPARENT_BLUR_DATA_URL } from '@/lib/utils'
import { fullListingFlow, type ListingProgress } from '@/lib/manager-contract'
import { REGISTRY_ADDRESS } from '@/lib/registry'
import { useAccount } from 'wagmi'

export default function ListNFTPage() {
  const params = useParams() as { contract: string; tokenId: string }
  const router = useRouter()
  const search = useSearchParams()
  const { isConnected, address } = useAccount()

  
  const isSellMode = search.get('mode') === 'sell'
  const userOwnershipPercent = parseInt(search.get('userShares') || '0') 
  const userOwnedShares = parseInt(search.get('availableShares') || '0') 
  
  const [pricePerShare, setPricePerShare] = useState('0.01')
  const [percentage, setPercentage] = useState(isSellMode ? Math.min(1, userOwnedShares) : 25)
  const [nftImage, setNftImage] = useState<string>('')
  const [nftName, setNftName] = useState<string>('')
  const [nftDescription, setNftDescription] = useState<string>('')
  const [nftAttributes, setNftAttributes] = useState<Array<{ trait_type: string; value: string | number }>>([])
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [bgHeroLoaded, setBgHeroLoaded] = useState(false)
  const [previewBgLoaded, setPreviewBgLoaded] = useState(false)
  const [previewLoaded, setPreviewLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [currentStep, setCurrentStep] = useState<'idle' | 'deploy' | 'approve' | 'transfer' | 'setRegistry' | 'registerInRegistry' | 'done'>('idle')
  const [txHashes, setTxHashes] = useState<{ [k: string]: string }>({})
  const [selling, setSelling] = useState(false)

  
  
  const totalShares = 100
  const maxSellableShares = isSellMode ? userOwnedShares : 99 
  const sharesToSell = isSellMode ? percentage : Math.floor((percentage / 100) * totalShares)
  const totalValue = useMemo(() => sharesToSell * parseFloat(pricePerShare || '0'), [sharesToSell, pricePerShare])

  useEffect(() => {
    const qpImg = search.get('image')
    const qpName = search.get('name')
    const qpDesc = search.get('description')

    if (qpImg || qpName || qpDesc) {
      setNftImage(qpImg || '')
      setNftName(qpName || '')
      setNftDescription(qpDesc || '')
    } else {
      try {
        const raw = typeof window !== 'undefined' ? sessionStorage.getItem('selectedNFT') : null
        if (raw) {
          const parsed = JSON.parse(raw)
          setNftImage(parsed?.metadata?.image || '')
          setNftName(parsed?.metadata?.name || '')
          setNftDescription(parsed?.metadata?.description || '')
          if (Array.isArray(parsed?.metadata?.attributes)) {
            setNftAttributes(parsed.metadata.attributes)
          }
        }
      } catch {}
    }
  }, [search])
  const onConfirmListing = async () => {
    try {
      setErrorMsg('')
      if (!isConnected) {
        setErrorMsg('Connect wallet to list')
        return
      }
      if (!REGISTRY_ADDRESS) {
        setErrorMsg('Registry not configured')
        return
      }
      setSubmitting(true)
      setCurrentStep('deploy')
      const { manager } = await fullListingFlow({
        nftContract: params.contract as `0x${string}`,
        tokenId: params.tokenId,
        pricePerShareEth: pricePerShare,
        maxSellablePercentage: percentage,
        registryAddress: REGISTRY_ADDRESS,
      }, (u: ListingProgress) => {
        
        if (u.status === 'start') {
          
          setCurrentStep(u.step)
        }
        if (u.txHash) {
          
          setTxHashes(prev => ({ ...prev, [u.step]: u.txHash as string }))
        }
        if (u.status === 'success' && u.step === 'registerInRegistry') {
          
          setCurrentStep('done')
        }
      })
      router.push(`/nft-purchase/${manager}`)
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to list NFT')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSellShares = async () => {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
  }

  const handleTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = previewRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    const rotX = (0.5 - py) * 8
    const rotY = (px - 0.5) * 8
    el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`
  }

  const resetTilt = () => {
    const el = previewRef.current
    if (!el) return
    el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)'
  }

  return (
    <div className="min-h-screen bg-black relative">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0">
          {!nftImage ? (
            <div className="w-full h-full bg-zinc-900 animate-pulse" />
          ) : (
            <>
              <Image
                src={resolveNftImageUrl(nftImage)}
                alt={nftName || ''}
                fill
                className="object-cover scale-105 blur-3xl opacity-20"
                placeholder="blur"
                blurDataURL={TRANSPARENT_BLUR_DATA_URL}
                unoptimized
                onLoadingComplete={() => setBgHeroLoaded(true)}
              />
              {!bgHeroLoaded && <div className="absolute inset-0 bg-zinc-900/60 animate-pulse" />}
            </>
          )}
        </div>
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/my-nfts')}
            className="text-gray-400 hover:text-white"
          >
            ← Back to My NFTs
          </button>
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-400">
            <span className="px-2 py-1 bg-zinc-800 rounded">{params.contract.slice(0, 10)}...{params.contract.slice(-6)}</span>
            <span className="px-2 py-1 bg-zinc-800 rounded">Token #{params.tokenId}</span>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {nftName || (isSellMode ? 'Sell Your Shares' : 'List NFT Fractions')}
          </h1>
          {nftDescription && (
            <p className="text-gray-300 mt-2 max-w-3xl">{nftDescription}</p>
          )}
          {isSellMode && (
            <p className="text-orange-400 mt-2">You own {userOwnedShares} shares ({userOwnershipPercent}% of this NFT) and can sell up to {userOwnedShares} shares</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <div className="card p-6">
              <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-zinc-900">
                <div className="aspect-[4/5] relative">
                <div className="absolute inset-0">
                  {!nftImage ? (
                    <div className="w-full h-full bg-zinc-900 animate-pulse" />
                  ) : (
                    <>
                      <NFTMedia
                        src={nftImage}
                        alt={nftName || ''}
                        className="object-cover scale-110 blur-2xl opacity-30"
                        onLoadingComplete={() => setPreviewBgLoaded(true)}
                      />
                      {!previewBgLoaded && <div className="absolute inset-0 bg-zinc-900/50 animate-pulse" />}
                    </>
                  )}
                </div>
                <Tilt className="absolute inset-0">
                  {!nftImage ? (
                    <div className="w-full h-full bg-zinc-800 animate-pulse" />
                  ) : (
                    <>
                      <NFTMedia
                        src={nftImage}
                        alt={nftName || ''}
                        className="object-contain p-8 cursor-zoom-in"
                        onClick={() => setOpen(true)}
                        onLoadingComplete={() => setPreviewLoaded(true)}
                      />
                      {!previewLoaded && <div className="absolute inset-0 bg-zinc-900/20 animate-pulse" />}
                    </>
                  )}
                </Tilt>
                </div>
              <ImageLightbox src={nftImage} alt={nftName || ''} isOpen={open} onClose={() => setOpen(false)} />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
            </div>

            <div className="space-y-4 mt-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{nftName}</h2>
                {nftDescription && <p className="text-gray-400">{nftDescription}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-700/40 rounded-lg">
                <div>
                  <div className="text-sm text-gray-400">Contract</div>
                  <div className="text-white font-mono text-sm break-all">
                    {params.contract.slice(0, 10)}...{params.contract.slice(-8)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Token ID</div>
                  <div className="text-white font-semibold">{params.tokenId}</div>
                </div>
              </div>

              {nftAttributes && nftAttributes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Attributes</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {nftAttributes.map((attr, index) => (
                      <div key={index} className="bg-zinc-700/40 p-3 rounded-lg">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">{attr.trait_type}</div>
                        <div className="text-white font-medium">{String(attr.value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

                <div className={`p-3 rounded-lg ${isSellMode ? 'bg-orange-900/30 border border-orange-700/50' : 'bg-green-900/30 border border-green-700/50'}`}>
                  <p className={`text-sm font-medium ${isSellMode ? 'text-orange-400' : 'text-green-400'}`}>
                    {isSellMode ? `🔸 Your Ownership: ${userOwnedShares} shares (${userOwnershipPercent}%)` : '✓ 100% Ownership'}
                  </p>
                  <p className={`text-xs ${isSellMode ? 'text-orange-500' : 'text-green-500'}`}>
                    {isSellMode ? 'You can sell your fractional shares back to the market' : 'You receive all airdrops & utilities until listing completes'}
                  </p>
                </div>
            </div>
          </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  {isSellMode ? 'Sell Details' : 'Sale Details'}
                </h2>
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-white">
                        {isSellMode ? 'Shares to Sell' : 'Percentage to Sell'}
                      </label>
                      <span className="text-sm text-gray-300">
                        {isSellMode ? `${percentage} shares` : `${percentage}%`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max={maxSellableShares}
                      value={percentage}
                      onChange={(e) => setPercentage(parseInt(e.target.value))}
                      className={`w-full ${isSellMode ? 'accent-orange-600' : 'accent-[#186F47]'}`}
                    />
                    <div className="flex gap-2 mt-3">
                      {isSellMode ? (
                        [Math.ceil(userOwnedShares * 0.25), Math.ceil(userOwnedShares * 0.5), Math.ceil(userOwnedShares * 0.75)].filter(v => v <= userOwnedShares && v > 0).map(v => (
                          <button key={v} onClick={() => setPercentage(v)} className="btn-secondary px-3 py-1.5 rounded-md text-xs">{v} shares</button>
                        ))
                      ) : (
                        [25, 50, 75].map(v => (
                          <button key={v} onClick={() => setPercentage(v)} className="btn-secondary px-3 py-1.5 rounded-md text-xs">{v}%</button>
                        ))
                      )}
                    </div>
                    {isSellMode && (
                      <div className="text-xs text-gray-400 mt-2">
                        You own {userOwnedShares} shares ({userOwnershipPercent}% of total) and can sell up to {userOwnedShares} shares.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Price per Share (ETH)</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={pricePerShare}
                      onChange={(e) => setPricePerShare(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg"
                      disabled={isSellMode}
                    />
                    {isSellMode && (
                      <p className="text-xs text-gray-400 mt-1">Price is set by the original listing</p>
                    )}
                  </div>

                  <div className="p-4 bg-zinc-700/40 border border-zinc-700/50 rounded-lg">
                    {submitting && (
                      <div className="mb-3">
                        <div className="text-white font-medium mb-2">Listing in progress</div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <div className="text-gray-300">
                            {currentStep === 'deploy' && 'Deploying Manager contract...'}
                            {currentStep === 'approve' && 'Approving NFT to Manager...'}
                            {currentStep === 'transfer' && 'Transferring NFT to Manager...'}
                            {currentStep === 'setRegistry' && 'Setting registry...'}
                            {currentStep === 'registerInRegistry' && 'Registering in marketplace...'}
                            {currentStep === 'done' && 'Finalizing...'}
                          </div>
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-gray-400">
                          {txHashes['deploy'] && <div>Deploy tx: {txHashes['deploy'].slice(0, 10)}...{txHashes['deploy'].slice(-6)}</div>}
                          {txHashes['approve'] && <div>Approve tx: {txHashes['approve'].slice(0, 10)}...{txHashes['approve'].slice(-6)}</div>}
                          {txHashes['transfer'] && <div>Transfer tx: {txHashes['transfer'].slice(0, 10)}...{txHashes['transfer'].slice(-6)}</div>}
                          {txHashes['setRegistry'] && <div>Registry tx: {txHashes['setRegistry'].slice(0, 10)}...{txHashes['setRegistry'].slice(-6)}</div>}
                          {txHashes['registerInRegistry'] && <div>Marketplace tx: {txHashes['registerInRegistry'].slice(0, 10)}...{txHashes['registerInRegistry'].slice(-6)}</div>}
                        </div>
                        <div className="mt-2 text-xs text-amber-400">Please keep this tab open until completion.</div>
                      </div>
                    )}
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Shares to {isSellMode ? 'sell' : 'sell'}</span>
                      <span className="text-white font-semibold">
                        {isSellMode ? `${sharesToSell} / ${userOwnedShares}` : `${sharesToSell} / ${totalShares}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Price per share</span>
                      <span className="text-white font-semibold">{pricePerShare} ETH</span>
                    </div>
                    <div className="border-t border-zinc-700/50 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold">{isSellMode ? "You'll receive" : 'Total earnings'}</span>
                        <span className={`text-2xl font-bold ${isSellMode ? 'text-orange-400' : 'text-white'}`}>
                          {totalValue.toFixed(3)} ETH
                        </span>
                      </div>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="text-red-400 text-sm mb-2">{errorMsg}</div>
                  )}
                  {isSellMode && (
                    <div className="bg-amber-900/20 border border-amber-700/50 p-3 rounded-lg">
                      <p className="text-sm text-amber-400 font-medium">⚠️ Selling Notice</p>
                      <p className="text-xs text-amber-300 mt-1">
                        This feature is currently only available for the original NFT owner. 
                        General marketplace selling will be available soon.
                      </p>
                    </div>
                  )}
                  
                  <button 
                    onClick={isSellMode ? handleSellShares : onConfirmListing} 
                    disabled={submitting || selling || isSellMode} 
                    className={`w-full py-4 rounded-lg text-lg disabled:opacity-60 ${
                      isSellMode 
                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                        : 'btn-primary'
                    }`}
                  >
                    {isSellMode 
                      ? `Sell ${sharesToSell} shares for ${totalValue.toFixed(3)} ETH (Coming Soon)`
                      : (submitting ? 'Listing…' : 'Confirm Listing')
                    }
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-3 text-center">
                Contract: {params.contract.slice(0, 10)}...{params.contract.slice(-6)} • Token #{params.tokenId}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}


