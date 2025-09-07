'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import Image from 'next/image'
import { Tilt } from '@/components/tilt'
import { NFTMedia } from '@/components/nft-media'
import { Navbar } from '@/components/navbar'
import { fetchOwnedNFTs, fetchSharedNFTs, UserNFT, MANAGER_CONTRACT_ADDRESS } from '@/lib/nft-utils'
import { resolveNftImageUrl, TRANSPARENT_BLUR_DATA_URL } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MyNFTs() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const [ownedNFTs, setOwnedNFTs] = useState<UserNFT[]>([])
  const [sharedNFTs, setSharedNFTs] = useState<UserNFT[]>([])
  const [sharedNFTsWithOwnership, setSharedNFTsWithOwnership] = useState<(UserNFT & { ownershipPercentage?: number; availableShares?: number; totalShares?: number; pricePerShare?: string })[]>([])
  const [loadingOwned, setLoadingOwned] = useState(false)
  const [loadingShared, setLoadingShared] = useState(false)
  const [activeTab, setActiveTab] = useState<'owned' | 'shared'>('owned')
  const [customContract, setCustomContract] = useState('')
  const [showAddContract, setShowAddContract] = useState(false)
  const [fetchingEnabled, setFetchingEnabled] = useState(() => {
    
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nft-fetching-enabled')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })

  useEffect(() => {
    if (isConnected && address && fetchingEnabled) {
      loadOwnedNFTs()
    }
  }, [isConnected, address, fetchingEnabled])

  
  useEffect(() => {
    if (isConnected && address) {
      loadSharedNFTs()
    }
  }, [isConnected, address])

  const loadOwnedNFTs = async () => {
    if (!address || !fetchingEnabled) return
    
    setLoadingOwned(true)
    try {
      
      const nfts = await fetchOwnedNFTs(address)
      setOwnedNFTs(nfts)
      
    } catch (error) {
      console.error(' Error loading owned NFTs:', error)
    } finally {
      setLoadingOwned(false)
    }
  }

  const loadSharedNFTs = async () => {
    if (!address) return
    
    setLoadingShared(true)
    try {
      
      
      
      const { fetchActiveMarketplaceItems, REGISTRY_ADDRESS } = await import('@/lib/registry')
      
      if (!REGISTRY_ADDRESS) {
        console.warn(' Registry address not configured')
        setSharedNFTsWithOwnership([])
        return
      }

      
      const marketplaceItems = await fetchActiveMarketplaceItems(REGISTRY_ADDRESS)
      

      
      
      const { getOwnershipPercentage } = await import('@/lib/manager-contract')
      
      const userSharedNFTs = []
      
      for (const item of marketplaceItems) {
        try {
          const ownershipPercentage = await getOwnershipPercentage(address, item.contract)
          
          if (ownershipPercentage > 0) {
            
            const userNFT = {
              contractAddress: item.contract, 
              tokenId: item.id.split('-')[1] || '1', 
              metadata: {
                name: item.name,
                description: `Fractional NFT with ${item.totalShares} total shares`,
                image: item.image,
                attributes: []
              },
              tokenURI: item.image,
              managerContract: item.contract,
              ownershipPercentage,
              availableShares: item.availableShares,
              totalShares: item.totalShares,
              pricePerShare: item.pricePerShare
            }
            userSharedNFTs.push(userNFT)
            
          }
        } catch (error) {
          console.warn(' Could not check ownership for manager:', item.contract, error)
        }
      }

      setSharedNFTsWithOwnership(userSharedNFTs)
      
      
    } catch (error) {
      console.error(' Error loading shared NFTs:', error)
      setSharedNFTsWithOwnership([])
    } finally {
      
      setTimeout(() => {
        setLoadingShared(false)
      }, 400)
    }
  }

  const toggleFetching = () => {
    const newState = !fetchingEnabled
    setFetchingEnabled(newState)
    
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('nft-fetching-enabled', JSON.stringify(newState))
    }
    
    
  }

  const handleAddCustomContract = async () => {
    if (!customContract.trim() || !address) return
    
    setLoadingOwned(true)
    try {
      
      const contracts = customContract.split(',').map(c => c.trim()).filter(c => c.startsWith('0x'))
      
      if (contracts.length > 0) {
        const { checkContractForNFTs } = await import('@/lib/nft-utils')
        
        for (const contractAddress of contracts) {
          const nfts = await checkContractForNFTs(contractAddress, address)
          if (nfts.length > 0) {
            
            setOwnedNFTs(prev => [...prev, ...nfts])
          } else {
            
          }
        }
        
        setCustomContract('')
        setShowAddContract(false)
      }
    } catch (error) {
      console.error(' Error checking custom contract:', error)
      alert('Error checking contract. Make sure it\'s a valid NFT contract address.')
    } finally {
      setLoadingOwned(false)
    }
  }

  const handleSellNFT = (nft: UserNFT) => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('selectedNFT', JSON.stringify(nft))
      }
    } catch {}
    router.push(`/my-nfts/list/${nft.contractAddress}/${nft.tokenId}`)
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          <div className="text-center py-20">
            <div className="card max-w-md mx-auto p-8">
              <div className="text-gray-400 mb-6">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h3>
              <p className="text-gray-400 mb-6">Please connect your MetaMask wallet to view your NFTs on Sepolia testnet</p>
            </div>
          </div>
        </main>
      </div>
    )
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            My NFT Portfolio
          </h1>
          <p className="text-gray-400 text-lg">
            Manage your owned NFTs and track your fractional investments
          </p>
        </div>

        
        <div className="mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${fetchingEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-white font-medium">
                    NFT Fetching: {fetchingEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <span className="text-gray-400 text-sm">
                  {fetchingEnabled ? 'Using Moralis API credits' : 'Saving API credits'}
                </span>
              </div>
              <button
                onClick={toggleFetching}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  fetchingEnabled 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'btn-primary'
                }`}
              >
                {fetchingEnabled ? 'Disable Fetching' : 'Enable Fetching'}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Connected Wallet</h3>
              <p className="text-sm font-mono text-gray-300">{address?.slice(0, 10)}...{address?.slice(-8)}</p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Owned NFTs</h3>
              <p className="text-3xl font-bold text-white">{ownedNFTs.length}</p>
              <p className="text-xs text-gray-400">Ready to sell fractions</p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Shared NFTs</h3>
              <p className="text-3xl font-bold text-white">{sharedNFTsWithOwnership.length}</p>
              <p className="text-xs text-gray-400">Fractional ownership</p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Network</h3>
              <p className="text-sm text-green-500 font-medium flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Sepolia Testnet
              </p>
            </div>
          </div>
        </div>

        
        <div className="mb-8">
          <div className="card p-1">
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('owned')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'owned'
                    ? 'bg-[#186F47] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-400/10'
                }`}
              >
                My Owned NFTs ({ownedNFTs.length})
              </button>
              <button
                onClick={() => setActiveTab('shared')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'shared'
                    ? 'bg-[#186F47] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-400/10'
                }`}
              >
                Shared NFTs ({sharedNFTsWithOwnership.length})
              </button>
            </nav>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">
            {activeTab === 'owned' ? 'NFTs You Own' : 'NFTs You Have Shares In'}
          </h2>
          <div className="flex gap-3">
            {activeTab === 'owned' && (
              <button
                onClick={() => setShowAddContract(!showAddContract)}
                className="btn-secondary px-4 py-2 rounded-lg text-sm font-medium"
              >
                Add Contract
              </button>
            )}
            {activeTab === 'owned' ? (
              <button
                onClick={loadOwnedNFTs}
                disabled={loadingOwned || !fetchingEnabled}
                className="btn-primary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingOwned ? 'Loading...' : 'Refresh Owned'}
              </button>
            ) : (
              <button
                onClick={loadSharedNFTs}
                disabled={loadingShared}
                className="btn-primary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {loadingShared ? 'Loading...' : 'Refresh Shared'}
              </button>
            )}
          </div>
        </div>

        
        {showAddContract && activeTab === 'owned' && (
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Add NFT Contract Address</h3>
            <p className="text-sm text-gray-400 mb-4">
              Enter the contract address of your NFT collection on Sepolia testnet. 
              You can add multiple addresses separated by commas.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={customContract}
                onChange={(e) => setCustomContract(e.target.value)}
                placeholder="0x1234567890123456789012345678901234567890"
                className="flex-1 px-3 py-2 rounded-lg text-white placeholder-gray-500"
              />
              <button
                onClick={handleAddCustomContract}
                disabled={!customContract.trim() || loadingOwned}
                className="btn-primary px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
              >
                Check
              </button>
            </div>
            <div className="mt-3 text-xs text-gray-400">
              💡 Find your NFT contract address on <a href={`https://sepolia.etherscan.io/address/${address}`} target="_blank" rel="noopener noreferrer" className="text-[#238056] hover:text-[#238056] transition-colors">Sepolia Etherscan</a>
            </div>
          </div>
        )}

        
        {activeTab === 'owned' && (
          <>
            {loadingOwned ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#238056] mx-auto mb-4"></div>
                <p className="text-gray-300">Fetching your owned NFTs from Sepolia testnet...</p>
                <p className="text-xs text-gray-500 mt-2">Check browser console for detailed logs</p>
              </div>
            ) : ownedNFTs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ownedNFTs.map((nft) => (
                  <Link href={`/my-nfts/list/${nft.contractAddress}/${nft.tokenId}`} key={`${nft.contractAddress}/${nft.tokenId}`} className="cursor-pointer">
                    <div className="card nft-card overflow-hidden group">
                      <div className="aspect-square relative overflow-hidden bg-zinc-900">
                        <NFTMedia
                          src={nft.metadata.image}
                          alt={nft.metadata.name}
                          className="object-cover scale-110 blur-2xl opacity-30"
                          priority={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                        <Tilt className="absolute inset-0">
                          <NFTMedia
                            src={nft.metadata.image}
                            alt={nft.metadata.name}
                            className="object-contain p-6"
                            priority={false}
                          />
                        </Tilt>
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                      <div className="p-4">
                        <h3 className="text-base font-semibold text-white truncate">{nft.metadata.name}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">Token #{nft.tokenId}</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              handleSellNFT(nft)
                            }}
                            className="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                          >
                            Partially Sell
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className=" p-8 max-w-md mx-auto">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Owned NFTs Found</h3>
                  <p className="text-gray-400 mb-4">
                    {fetchingEnabled 
                      ? "No NFTs found in your wallet on Sepolia testnet. Make sure you have NFTs in your connected wallet."
                      : "Enable fetching to search for NFTs in your wallet."
                    }
                  </p>
                  <div className="text-sm text-gray-500">
                    <p>Connected to: {address?.slice(0, 10)}...{address?.slice(-8)}</p>
                    <p>Network: Sepolia Testnet</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        
        {activeTab === 'shared' && (
          <>
            {loadingShared ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#238056] mx-auto mb-4"></div>
                <p className="text-gray-300">Scanning marketplace for your fractional ownership...</p>
                <p className="text-xs text-gray-500 mt-2">Checking ownership percentages across all listed NFTs</p>
              </div>
            ) : sharedNFTsWithOwnership.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sharedNFTsWithOwnership.map((nft) => (
                  <Link href={`/nft-purchase/${nft.managerContract}`} key={`shared-${nft.contractAddress}-${nft.tokenId}`} className="cursor-pointer">
                    <div className="card nft-card overflow-hidden group">
                      <div className="aspect-square relative overflow-hidden bg-zinc-900">
                        <NFTMedia
                          src={nft.metadata.image}
                          alt={nft.metadata.name}
                          className="object-cover scale-110 blur-2xl opacity-30"
                          priority={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                        <Tilt className="absolute inset-0">
                          <NFTMedia
                            src={nft.metadata.image}
                            alt={nft.metadata.name}
                            className="object-contain p-6"
                            priority={false}
                          />
                        </Tilt>
                        
                        
                        <div className="absolute top-3 right-3 bg-emerald-600 text-white px-2 py-1 rounded text-xs font-semibold">
                          {nft.availableShares || 0}% Owned
                        </div>
                        
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                      <div className="p-4">
                        <h3 className="text-base font-semibold text-white truncate">{nft.metadata.name}</h3>
                        <div className="flex items-center justify-between mt-2 mb-3">
                          <span className="text-xs text-gray-400">Token #{nft.tokenId}</span>
                          <span className="text-xs text-emerald-400 font-medium">
                            {nft.availableShares || 0} available
                          </span>
                        </div>
                        
                        
                        <div className="bg-zinc-700/40 p-3 rounded-lg mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-400">Available Shares</span>
                            <span className="text-sm font-bold text-white">{nft.availableShares || 0}</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-400">Price per Share</span>
                            <span className="text-sm font-semibold text-emerald-400">{nft.pricePerShare || '0'} ETH</span>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="h-1.5 bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(((nft.totalShares || 100) - (nft.availableShares || 0)) / (nft.totalShares || 100) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {((nft.totalShares || 100) - (nft.availableShares || 0))} of {nft.totalShares || 100} shares sold
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              window.location.href = `/nft-purchase/${nft.managerContract}`
                            }}
                            className="flex-1 btn-primary px-3 py-2 rounded-lg text-sm font-medium"
                          >
                            Buy More
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              window.location.href = `/my-nfts/list/${nft.managerContract}/sell?mode=sell&userShares=${nft.ownershipPercentage}&availableShares=${nft.availableShares}&name=${encodeURIComponent(nft.metadata.name)}&image=${encodeURIComponent(nft.metadata.image)}`
                            }}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Sell Shares
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="card p-8 max-w-md mx-auto">
                  <div className="text-gray-400 mb-6">
                    <div className="relative mx-auto h-16 w-16 mb-4">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full animate-pulse" />
                      <svg className="relative h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">No Fractional Ownership Yet</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    You don't own shares in any NFTs yet. Start building your fractional portfolio by purchasing shares from the marketplace.
                  </p>
                  <div className="space-y-2 text-sm text-gray-500 mb-6">
                    <p>Connected: {address?.slice(0, 10)}...{address?.slice(-8)}</p>
                    <p>Network: Sepolia Testnet</p>
                  </div>
                  <Link href="/" className="inline-block">
                    <button className="btn-primary px-6 py-3 rounded-lg font-medium">
                      Explore Marketplace
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

        
      </main>
    </div>
  )
}
