'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import { ImageLightbox } from '@/components/image-lightbox'
import { Tilt } from '@/components/tilt'
import { Footer } from '@/components/footer'
import { 
  getFractionalNFTData, 
  loadComprehensiveContractData,
  buyShares, 
  calculateCost,
  canBuyPercentage,
  formatAddress,
  getAvailableForSale,
  getOwnershipPercentage,
  getContractStatus,
  transferNFTToContract,
  testQueryFunctions,
  refreshContractData,
  estimateGasForPurchase,
  type FractionalNFT,
  type ComprehensiveContractData
} from '@/lib/manager-contract'



function formatETHAmount(amount: number): string {
  if (amount >= 0.0001) {
    
    return amount.toFixed(4)
  } else if (amount >= 0.000001) {
    
    return amount.toFixed(6)
  } else if (amount >= 0.000000001) {
    
    return amount.toFixed(9)
  } else if (amount > 0) {
    
    return amount.toExponential(6)
  } else {
    return '0'
  }
}

export default function NFTPurchasePage() {
  const params = useParams()
  const router = useRouter()
  const { address, isConnected } = useAccount()
  
  const [nft, setNft] = useState<FractionalNFT | null>(null)
  const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveContractData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sharesToBuy, setSharesToBuy] = useState(1)
  const [open, setOpen] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [totalCost, setTotalCost] = useState<string>('0')
  const [gasEstimate, setGasEstimate] = useState<{ units: string; eth: string } | null>(null)
  
  
  const [testAddress, setTestAddress] = useState('')
  const [testPercentage, setTestPercentage] = useState(10)
  const [showTestPanel, setShowTestPanel] = useState(false)

  const contractAddress = params.contract as string

  
  useEffect(() => {
    async function loadNFTData() {
      try {
        setLoading(true)
        setError(null)
        
        console.log(`🚀 Starting to load NFT data for contract: ${contractAddress}`)
        
        if (!contractAddress || !contractAddress.startsWith('0x')) {
          console.error(' Invalid contract address format:', contractAddress)
          setError('Invalid contract address format. Please check the URL.')
          return
        }
        
        console.log(' Contract address is valid, proceeding with data loading...')
        
        
        const [nftData, comprehensiveContractData] = await Promise.all([
          getFractionalNFTData(contractAddress),
          loadComprehensiveContractData(contractAddress)
        ])
        
        if (!nftData) {
          console.log(' No data returned from contract - this could mean:')
          console.log('  1. Contract does not exist')
          console.log('  2. Contract is not deployed on this network')
          console.log('  3. Contract does not have an NFT associated with it')
          console.log('  4. Contract functions are not implemented correctly')
          setError('No NFT data found for this contract')
          return
        }
        
        console.log('🎉 Successfully loaded NFT data, setting state...')
        setNft(nftData)
        setComprehensiveData(comprehensiveContractData)
      } catch (err: any) {
        console.error(' Critical error loading NFT data:', err)
        console.error('Error details:', {
          message: err.message,
          code: err.code,
          contractAddress
        })
        setError(`Failed to load NFT data: ${err.message || 'Unknown error'}`)
      } finally {
        setLoading(false)
        console.log('📊 Loading process completed')
      }
    }

    if (contractAddress) {
    loadNFTData()
    }
  }, [contractAddress])

  
  useEffect(() => {
    async function updateCost() {
      if (!nft || sharesToBuy <= 0 || !contractAddress) return
      
      try {
        
        const percentage = Math.round((sharesToBuy / nft.totalShares) * 100)
        console.log(`💰 Calculating cost for ${sharesToBuy} shares = ${percentage}%`)
        
        const cost = await calculateCost(percentage, contractAddress)
        if (cost) {
          const formattedCost = formatETHAmount(parseFloat(cost))
          setTotalCost(formattedCost)
          console.log(` Cost calculated: ${formattedCost} ETH for ${percentage}%`)

          
          try {
            const est = await estimateGasForPurchase(percentage, contractAddress, address || undefined)
            if (!est.error) {
              setGasEstimate({ units: est.gasEstimate, eth: est.gasCostETH })
            } else {
              setGasEstimate(null)
            }
          } catch (e) {
            setGasEstimate(null)
          }
        }
      } catch (err) {
        console.error(' Error calculating cost:', err)
        
        const fallbackCostNumber = parseFloat(nft.pricePerShare) * sharesToBuy
        const fallbackCost = formatETHAmount(fallbackCostNumber)
        
        setTotalCost(fallbackCost)
        console.log(`⚠️ Using fallback cost calculation: ${fallbackCost} ETH`)
      }
    }

    updateCost()
  }, [sharesToBuy, nft, contractAddress])

  const handleBuyShares = async () => {
    if (!nft || !isConnected || !address || !contractAddress) {
      alert('Please connect your wallet to purchase shares')
      return
    }

    try {
      setPurchasing(true)
      
      const percentage = Math.round((sharesToBuy / nft.totalShares) * 100)
      console.log(`🛒 Attempting to purchase ${sharesToBuy} shares = ${percentage}%`)
      
      
      console.log('🔍 Running comprehensive pre-purchase checks...')
      
      try {
        
        const status = await getContractStatus(contractAddress)
        console.log('📊 Contract Status:', status)
        
        if (!status || !status.nftInContract || !status.nftTransferredFlag) {
          alert(' NFT has not been transferred to the manager contract yet. Please wait for the transfer to complete before buying.')
          return
        }
        
        
        const available = await getAvailableForSale(contractAddress)
        console.log(`📊 Available for sale: ${available}%`)
        
        if (percentage > available) {
          alert(` Cannot buy ${percentage}%. Only ${available}% available for sale.`)
          return
        }
        
        
        const userOwnership = await getOwnershipPercentage(address!, contractAddress)
        console.log(`📊 User current ownership: ${userOwnership}%`)
        
        
        const exactCost = await calculateCost(percentage, contractAddress)
        console.log(`💰 Exact cost for ${percentage}%: ${exactCost} ETH`)
        
        if (!exactCost) {
          alert(' Could not calculate purchase cost')
          return
        }
        
        console.log(' All pre-purchase checks passed')
        
      } catch (statusError) {
        console.error(' Pre-purchase check failed:', statusError)
        alert(` Pre-purchase validation failed: ${(statusError as Error).message}`)
        return
      }
      
      
      console.log(`🔍 Validating purchase: ${percentage}% for address ${address}`)
      const canBuy = await canBuyPercentage(percentage, contractAddress)
      if (!canBuy) {
        
        try {
          const availableShares = await getAvailableForSale(contractAddress)
          const userOwnership = await getOwnershipPercentage(address!, contractAddress)
          
          alert(` Cannot purchase ${percentage}% shares.

Possible reasons:
• Only ${availableShares}% shares available for sale
• You already own ${userOwnership}% 
• Contract may have purchase restrictions
• Not enough shares remaining

Try purchasing a smaller percentage or check available shares.`)
        } catch {
          alert(' Cannot purchase this amount of shares. Check available shares and try a smaller percentage.')
        }
        return
      }

      console.log(' Purchase validation passed')

      const result = await buyShares(percentage, contractAddress)
      
      if (result.success) {
        alert(`Successfully purchased ${sharesToBuy} shares! Transaction hash: ${result.txHash}`)
        
        const [updatedNFTData, updatedComprehensiveData] = await Promise.all([
          getFractionalNFTData(contractAddress),
          loadComprehensiveContractData(contractAddress)
        ])
        if (updatedNFTData) {
          setNft(updatedNFTData)
          setComprehensiveData(updatedComprehensiveData)
        }
      } else {
        alert(`Purchase failed: ${result.error}`)
      }
    } catch (err: any) {
      console.error('Error purchasing shares:', err)
      alert(`Purchase failed: ${err.message}`)
    } finally {
      setPurchasing(false)
    }
  }

  
  const handleTransferToContract = async () => {
    if (!contractAddress) return
    try {
      setTransferring(true)
      const res = await transferNFTToContract(contractAddress)
      if (res.success) {
        alert(`Transfer initiated! Tx: ${res.txHash}`)
        const [nftData, compData] = await Promise.all([
          getFractionalNFTData(contractAddress),
          loadComprehensiveContractData(contractAddress)
        ])
        if (nftData) setNft(nftData)
        setComprehensiveData(compData)
      } else {
        alert(`Transfer failed: ${res.error}`)
      }
    } catch (e: any) {
      alert(`Transfer failed: ${e.message || 'Unknown error'}`)
    } finally {
      setTransferring(false)
    }
  }

  
  const handleTestQueries = async () => {
    if (!testAddress || !contractAddress) {
      alert('Please enter a test address')
      return
    }

    
    if (!testAddress.startsWith('0x') || testAddress.length !== 42) {
      alert('Please enter a valid Ethereum address (0x... with 42 characters)')
      return
    }

    try {
      console.log(`🧪 Testing contract queries for address: ${testAddress}`)
      const results = await testQueryFunctions(contractAddress, testAddress, testPercentage)
      
      if (results) {
        
        const formattedCost = formatETHAmount(parseFloat(results.costForPercentage))
        
        
        const resultMessage = `Query Results for ${formatAddress(testAddress)}:

📊 CURRENT OWNERSHIP:
• Ownership Percentage: ${results.ownershipPercentage}%
• Shares Balance: ${results.sharesBalance}
• Is Owner: ${results.isOwner ? 'Yes' : 'No'}

💰 PURCHASE TEST (${testPercentage}%):
• Cost: ${formattedCost} ETH
• Can Buy: ${results.canBuyPercentage ? 'Yes ' : 'No '}
• Shares Amount: ${results.sharesForPercentage}

${results.canBuyPercentage ? 
  ' This address CAN purchase the specified percentage' : 
  ' This address CANNOT purchase - check available shares or balance'
}

${results.isOwner ? 
  '🎯 This address already owns shares in this NFT' : 
  '🆕 This would be a new purchase for this address'
}`

        alert(resultMessage)
        
        
        console.log('🎯 Query Results:', results)
      } else {
        alert(' Failed to query contract. The contract may not be deployed or accessible.')
      }
    } catch (err: any) {
      console.error(' Error testing query functions:', err)
      alert(` Error testing query functions: ${err.message}

This could mean:
• Contract is not deployed on this network
• Contract functions are not working properly
• Network connectivity issues
• Invalid address format

Check the console for more details.`)
    }
  }

  
  const handleRefreshData = async () => {
    if (!contractAddress) return
    
    try {
      setLoading(true)
      const [refreshedNFTData, refreshedComprehensiveData] = await Promise.all([
        getFractionalNFTData(contractAddress),
        refreshContractData(contractAddress)
      ])
      
      if (refreshedNFTData) {
        setNft(refreshedNFTData)
        setComprehensiveData(refreshedComprehensiveData)
        console.log('🔄 Data refreshed successfully')
      }
    } catch (err: any) {
      console.error('Error refreshing data:', err)
      setError('Failed to refresh contract data.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <div className="fixed inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-br from-gray-900/50 via-black/50 to-gray-900/50 animate-pulse"></div>
          <div className="absolute inset-0 backdrop-blur-3xl"></div>
          <div className="absolute inset-0 bg-black/90"></div>
        </div>

        <div className="relative z-10">
          <Navbar />
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Marketplace
            </button>

            <div className="mb-8">
              <div className="h-8 bg-gray-700/50 rounded-lg w-96 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-800/50 rounded-lg w-2/3 animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="card p-6">
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden mb-6 bg-gray-800/50 animate-pulse">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#186F47]"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="h-8 bg-gray-700/50 rounded-lg w-3/4 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-800/50 rounded-lg w-full animate-pulse"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-700/40 rounded-lg">
                      <div>
                        <div className="h-3 bg-gray-800/50 rounded w-16 mb-1 animate-pulse"></div>
                        <div className="h-4 bg-gray-700/50 rounded w-24 animate-pulse"></div>
                      </div>
                      <div>
                        <div className="h-3 bg-gray-800/50 rounded w-16 mb-1 animate-pulse"></div>
                        <div className="h-4 bg-gray-700/50 rounded w-12 animate-pulse"></div>
                      </div>
                    </div>

                    <div>
                      <div className="h-6 bg-gray-700/50 rounded-lg w-24 mb-3 animate-pulse"></div>
                      <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="bg-zinc-700/40 p-3 rounded-lg">
                            <div className="h-3 bg-gray-800/50 rounded w-16 mb-1 animate-pulse"></div>
                            <div className="h-4 bg-gray-700/50 rounded w-20 animate-pulse"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky top-24">
                <div className="space-y-4">
                  <div className="card p-4">
                    <div className="h-6 bg-gray-700/50 rounded-lg w-36 mb-3 animate-pulse"></div>
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-2">
                        <div className="h-3 bg-gray-800/50 rounded w-20 animate-pulse"></div>
                        <div className="h-3 bg-gray-700/50 rounded w-12 animate-pulse"></div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="h-2 rounded-full bg-[#186F47]/50 w-3/4 animate-pulse"></div>
                      </div>
                      <div className="h-3 bg-gray-800/50 rounded w-16 mt-1 animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-5 bg-gray-700/50 rounded-lg w-32 mb-2 animate-pulse"></div>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-zinc-700/40 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-gray-600/50 rounded-full animate-pulse"></div>
                            <div>
                              <div className="h-3 bg-gray-700/50 rounded w-20 mb-1 animate-pulse"></div>
                              <div className="h-2 bg-gray-800/50 rounded w-16 animate-pulse"></div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="h-4 bg-gray-700/50 rounded w-12 mb-1 animate-pulse"></div>
                            <div className="h-3 bg-gray-800/50 rounded w-8 animate-pulse"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card p-4">
                    <div className="h-6 bg-gray-700/50 rounded-lg w-24 mb-3 animate-pulse"></div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-zinc-700/40 rounded-lg">
                          <div className="h-3 bg-gray-800/50 rounded w-8 mb-1 animate-pulse"></div>
                          <div className="h-4 bg-gray-700/50 rounded w-16 animate-pulse"></div>
                        </div>
                        <div className="p-2 bg-zinc-700/40 rounded-lg">
                          <div className="h-3 bg-gray-800/50 rounded w-12 mb-1 animate-pulse"></div>
                          <div className="h-4 bg-gray-700/50 rounded w-8 animate-pulse"></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="h-4 bg-gray-700/50 rounded w-40 mb-2 animate-pulse"></div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-gray-600/50 rounded-lg animate-pulse"></div>
                          <div className="h-6 bg-gray-700/50 rounded w-8 animate-pulse"></div>
                          <div className="w-8 h-8 bg-gray-600/50 rounded-lg animate-pulse"></div>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full animate-pulse"></div>
                      </div>
                      
                      <div className="p-3 bg-zinc-700/40 rounded-lg space-y-2">
                        <div className="h-4 bg-gray-700/50 rounded w-32 animate-pulse"></div>
                        <div className="h-4 bg-gray-700/50 rounded w-28 animate-pulse"></div>
                        <div className="border-t border-zinc-700/50 pt-2 mt-2">
                          <div className="h-6 bg-gray-700/50 rounded w-24 animate-pulse"></div>
                        </div>
                      </div>
                      
                      <div className="w-full h-12 bg-gray-600/50 rounded-lg animate-pulse"></div>
                    </div>
                  </div>

                  <div className="card p-4">
                    <div className="h-5 bg-gray-700/50 rounded w-28 mb-3 animate-pulse"></div>
                    <div className="flex items-center gap-3 p-3 bg-zinc-700/40 rounded-lg">
                      <div className="w-10 h-10 bg-gray-600/50 rounded-full animate-pulse"></div>
                      <div>
                        <div className="h-3 bg-gray-700/50 rounded w-24 mb-1 animate-pulse"></div>
                        <div className="h-3 bg-gray-800/50 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="fixed bottom-8 right-8 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#186F47]"></div>
              <span className="text-sm text-gray-300">Loading from {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}</span>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    )
  }

  if (error || (!loading && !nft)) {
    return (
      <div className="min-h-screen relative">
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        
        <div className="relative z-10">
          <Navbar />
          
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Marketplace
            </button>

        <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Contract Data Unavailable</h1>
                <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                  {error || 'Unable to load NFT data from this contract. This could be due to network issues, contract deployment status, or the contract may not have fractional NFT data available.'}
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-white mb-3">Contract Address</h3>
                <div className="bg-gray-900/50 rounded-lg p-3 font-mono text-sm text-gray-300 break-all">
                  {contractAddress}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Check the browser console for detailed debugging information
                </p>
              </div>

              <div className="space-y-4">
                <div className="text-sm text-gray-400 mb-4">
                  <p className="mb-2">Possible reasons:</p>
                  <ul className="text-left max-w-md mx-auto space-y-1">
                    <li>• Contract is not deployed on Sepolia testnet</li>
                    <li>• Contract does not have an NFT associated</li>
                    <li>• Network connectivity issues</li>
                    <li>• Contract functions are not properly implemented</li>
                  </ul>
                </div>
                
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => window.location.reload()}
                    className="btn-secondary px-6 py-3 rounded-lg"
                  >
                    Try Again
                  </button>
          <button 
            onClick={() => router.push('/')}
            className="btn-primary px-6 py-3 rounded-lg"
          >
            Back to Marketplace
          </button>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    )
  }

  
  if (!nft) {
    return null
  }

  const soldPercentage = ((nft.totalShares - nft.availableShares) / nft.totalShares) * 100

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0">
        <Image
          src={nft.image}
          alt={nft.name}
          fill
          className="object-cover"
          unoptimized={nft.image.includes('.gif')}
        />
        <div className="absolute inset-0 backdrop-blur-3xl"></div>
        <div className="absolute inset-0 bg-black/90"></div>
      </div>

      <div className="relative z-10">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Marketplace
          </button>

          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Buy Shares of {nft.name}</h1>
            {nft.description && (
              <p className="text-gray-300 mt-2 max-w-3xl">{nft.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="card p-6">
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden mb-6">
                  <div className="absolute inset-0">
                    <Image
                      src={nft.image}
                      alt={nft.name}
                      fill
                      className="object-cover scale-110 blur-2xl opacity-30"
                      unoptimized={nft.image.includes('.gif')}
                    />
                  </div>
                  <Tilt className="absolute inset-0">
                    <Image
                      src={nft.image}
                      alt={nft.name}
                      fill
                      className="object-contain p-8 cursor-zoom-in"
                      onClick={() => setOpen(true)}
                      unoptimized={nft.image.includes('.gif')}
                    />
                  </Tilt>
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
                <ImageLightbox src={nft.image} alt={nft.name} isOpen={open} onClose={() => setOpen(false)} />
                
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{nft.name}</h1>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-700/40 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-400">Contract</div>
                      <div className="text-white font-mono text-sm">
                        {nft.contractAddress.slice(0, 10)}...{nft.contractAddress.slice(-8)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Token ID</div>
                      <div className="text-white font-semibold">{nft.tokenId}</div>
                    </div>
                  </div>

                  {/* <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Attributes</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {nft.attributes.map((attr, index) => (
                        <div key={index} className="bg-zinc-700/40 p-3 rounded-lg">
                          <div className="text-xs text-gray-400 uppercase tracking-wide">{attr.trait_type}</div>
                          <div className="text-white font-medium">{attr.value}</div>
                        </div>
                      ))}
                    </div>
                  </div> */}
                </div>
              </div>
            </div>

            <div className="sticky top-24">
              <div className="space-y-4">
                <div className="card p-4">
                  <h2 className="text-xl font-semibold text-white mb-3">Share Distribution</h2>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-400">Shares Sold</span>
                      <span className="text-white font-medium">{nft.totalShares - nft.availableShares}/{nft.totalShares}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="h-2 rounded-full bg-[#186F47] transition-all duration-300" style={{ width: `${soldPercentage}%` }} />
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">{soldPercentage.toFixed(1)}% sold</div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-white">Current Shareholders</h3>
                    {nft.shareHolders.map((holder, index) => (
                      <div key={index} className="flex items-center justify-between p-2.5 bg-zinc-700/40 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-[#186F47] rounded-full flex items-center justify-center text-white text-[11px] font-bold">{index + 1}</div>
                          <div>
                            <div className="text-white font-mono text-xs">{formatAddress(holder.address)}</div>
                            {holder.address === nft.originalSeller && (<div className="text-[10px] text-blue-400">Original Seller</div>)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white text-sm">{holder.shares} shares</div>
                          <div className="text-[11px] text-gray-400">{holder.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {nft.availableShares > 0 ? (
                  <div className="card p-4">
                    <h2 className="text-xl font-semibold text-white mb-3">Buy Shares</h2>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-zinc-700/40 rounded-lg text-sm flex items-center justify-between">
                          <span className="text-gray-400">Price</span>
                          <span className="text-white font-semibold">{nft.pricePerShare} ETH</span>
                        </div>
                        <div className="p-2 bg-zinc-700/40 rounded-lg text-sm flex items-center justify-between">
                          <span className="text-gray-400">Available</span>
                          <span className="text-white font-semibold">{nft.availableShares}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Number of Shares to Buy</label>
                        <div className="flex items-center gap-3 mb-2">
                          <button onClick={() => setSharesToBuy(Math.max(1, sharesToBuy - 1))} className="btn-secondary px-3 py-1.5 rounded-lg">-</button>
                          <span className="text-xl font-bold text-white min-w-[3rem] text-center">{sharesToBuy}</span>
                          <button onClick={() => setSharesToBuy(Math.min(nft.availableShares, sharesToBuy + 1))} className="btn-secondary px-3 py-1.5 rounded-lg">+</button>
                        </div>
                        <input type="range" min="1" max={nft.availableShares} value={sharesToBuy} onChange={(e) => setSharesToBuy(parseInt(e.target.value))} className="w-full accent-[#186F47]" />
                        <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                          <span>1 share</span>
                          <span>{nft.availableShares} shares available</span>
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-700/40 border border-zinc-700/50 rounded-lg">
                        <div className="flex justify-between items-center mb-1 text-sm">
                          <span className="text-gray-300">Shares to buy:</span>
                          <span className="text-white font-semibold">{sharesToBuy}</span>
                        </div>
                        <div className="flex justify-between items-center mb-1 text-sm">
                          <span className="text-gray-300">Price per share:</span>
                          <span className="text-white font-semibold">{nft.pricePerShare} ETH</span>
                        </div>
                        <div className="border-t border-zinc-700/50 pt-2 mt-2">
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-white font-semibold">Total Cost:</span>
                            <div className="text-right">
                              <div className="text-xl font-bold text-white font-mono">{totalCost} ETH</div>
                              {gasEstimate && (
                                <div className="text-[11px] text-gray-400 mt-1">
                                  Estimated gas: ~{gasEstimate.eth} ETH ({gasEstimate.units} units)
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={handleBuyShares} 
                        disabled={purchasing || !isConnected}
                        className="w-full btn-primary py-3 rounded-lg text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {purchasing ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                          </div>
                        ) : !isConnected ? (
                          'Connect Wallet to Buy'
                        ) : (
                          `Buy ${sharesToBuy} Share${sharesToBuy > 1 ? 's' : ''} for ${totalCost} ETH`
                        )}
                      </button>
                      <div className="text-[11px] text-gray-400 text-center">You'll receive {((sharesToBuy / nft.totalShares) * 100).toFixed(2)}% of all future airdrops and utilities</div>
                    </div>
                  </div>
                ) : (
                  <div className="card p-4 text-center">
                    <div className="text-red-400 mb-3">
                      <svg className="mx-auto h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    </div>
                    <h2 className="text-lg font-bold text-white mb-1">Sold Out</h2>
                    <p className="text-gray-400 text-sm">All shares of this NFT have been sold.</p>
                  </div>
                )}

                <div className="card p-4">
                  <h3 className="text-base font-semibold text-white mb-3">Original Seller</h3>
                  <div className="flex items-center gap-3 p-3 bg-zinc-700/40 rounded-lg">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">OS</div>
                    <div>
                      <div className="text-white font-mono text-xs">{formatAddress(nft.originalSeller)}</div>
                      <div className="text-[11px] text-gray-400">Retains {((nft.shareHolders.find(h => h.address === nft.originalSeller)?.percentage || 0))}% ownership</div>
                    </div>
                  </div>
                </div>

                <div className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">Contract Info</h3>
                      <p className="text-xs text-gray-400">Live blockchain data & testing tools</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRefreshData}
                        className="btn-secondary px-3 py-1.5 rounded text-xs"
                        disabled={loading}
                        title="Refresh all contract data from blockchain"
                      >
                        🔄 Refresh
                      </button>
                      <button
                        onClick={() => setShowTestPanel(!showTestPanel)}
                        className="btn-secondary px-3 py-1.5 rounded text-xs"
                        title="Test contract functions with any address"
                      >
                        🧪 Query
                      </button>
                    </div>
                  </div>
                  
                  {comprehensiveData && (
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-zinc-700/40 rounded">
                          <div className="text-gray-400">Contract Balance</div>
                          <div className="text-white font-semibold">{comprehensiveData.contractBalance} ETH</div>
                        </div>
                        <div className="p-2 bg-zinc-700/40 rounded">
                          <div className="text-gray-400">NFT Transferred</div>
                          <div className="text-white font-semibold">{comprehensiveData.nftTransferred ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                      <div className="p-2 bg-zinc-700/40 rounded">
                        <div className="text-gray-400">Shares Token</div>
                        <div className="text-white font-mono text-xs">{comprehensiveData.sharesToken.symbol} ({comprehensiveData.sharesToken.name})</div>
                        <div className="text-gray-400 text-xs">{formatAddress(comprehensiveData.sharesToken.address)}</div>
                      </div>
                    </div>
                  )}

                  {showTestPanel && (
                    <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-white">Address Query Tool</h4>
                        <p className="text-xs text-gray-400 mt-1">
                          Check ownership data for any wallet address and test purchase scenarios
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-300 block mb-1">Wallet Address to Query</label>
                          <input
                            type="text"
                            placeholder="0x742d35Cc6634C0532925a3b8D404fBf4cf7F..."
                            value={testAddress}
                            onChange={(e) => setTestAddress(e.target.value)}
                            className="w-full p-2 bg-zinc-700/50 rounded text-white text-xs font-mono"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Enter any Ethereum address to check their ownership & purchase ability
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-gray-300 block mb-1">Test Percentage</label>
                            <input
                              type="number"
                              placeholder="10"
                              min="1"
                              max="100"
                              value={testPercentage}
                              onChange={(e) => setTestPercentage(parseInt(e.target.value) || 0)}
                              className="w-full p-2 bg-zinc-700/50 rounded text-white text-xs"
                            />
                          </div>
                          <div className="flex items-end gap-1">
                            {isConnected && address && (
                              <button
                                onClick={() => setTestAddress(address)}
                                className="btn-secondary px-2 py-2 rounded text-xs"
                                title="Use your connected wallet address"
                              >
                                👤
                              </button>
                            )}
                            <button
                              onClick={handleTestQueries}
                              className="btn-primary px-4 py-2 rounded text-xs"
                              disabled={!testAddress}
                            >
                              Query
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 bg-zinc-900/50 p-2 rounded">
                          <strong>What this does:</strong> Queries the contract to check if the address owns shares, 
                          can buy the specified percentage, and calculates costs - useful for testing and debugging.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}
