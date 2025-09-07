import { readContract, writeContract, getPublicClient, getWalletClient } from '@wagmi/core'
import { config } from './web3'
import { parseEther, formatEther } from 'viem'
import { deployContract, waitForTransactionReceipt } from 'viem/actions'


export const DEFAULT_MANAGER_CONTRACT_ADDRESS = "0x9eB4C5E5a8f4891afDeCe633aA1d63906802C820"
export const SEPOLIA_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/aQ_zjf5PpA0kHbAPKeSd9"
export const DEFAULT_REGISTRY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "0x003a6F78dd9EDf8721874e07C68F12e95b5458CD"


export const MANAGER_ABI = [
 
  {
    type: "constructor",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_nft", type: "address" },
      { name: "_tokenId", type: "uint256" },
      { name: "_nftPrice", type: "uint256" },
      { name: "_maxSellablePercentage", type: "uint256" },
    ]
  },
 
  {
    name: "getNFTInfo",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "nftContract", type: "address" },
      { name: "id", type: "uint256" },
      { name: "owner", type: "address" },
      { name: "price", type: "uint256" },
      { name: "maxSellable", type: "uint256" },
      { name: "totalSold", type: "uint256" }
    ]
  },
  {
    name: "getContractStatus",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "nftInContract", type: "bool" },
      { name: "nftTransferredFlag", type: "bool" },
      { name: "currentNFTOwner", type: "address" }
    ]
  },
  {
    name: "isNFTTransferred",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }]
  },
 
  {
    name: "getOwnershipPercentage",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "getRemainingOwnership",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "getTotalSoldPercentage",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "getAvailableForSale",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "getOwnershipBreakdown",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "firstOwner", type: "address" },
      { name: "firstOwnerPercentage", type: "uint256" },
      { name: "totalSold", type: "uint256" },
      { name: "remainingAvailable", type: "uint256" }
    ]
  },
  {
    name: "getAllOwners",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "ownerAddresses", type: "address[]" },
      { name: "percentages", type: "uint256[]" }
    ]
  },
 
  {
    name: "getSharesTokenAddress",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }]
  },
  {
    name: "getSharesBalance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "getSharesForPercentage",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "percentage", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }]
  },
 
  {
    name: "calculateCost",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_percentage", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "canBuyPercentage",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_percentage", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    name: "isOwner",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_address", type: "address" }],
    outputs: [{ name: "", type: "bool" }]
  },
 
  {
    name: "getContractBalance",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
 
  {
    name: "buyPercentage",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "_percentage", type: "uint256" }],
    outputs: []
  },
  {
    name: "transferNFTToContract",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    name: "updatePrice",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_newPrice", type: "uint256" }],
    outputs: []
  },
  {
    name: "updateMaxSellablePercentage",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_newMaxPercentage", type: "uint256" }],
    outputs: []
  },
  {
    name: "setNFTRegistry",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_registry", type: "address" }],
    outputs: []
  },
 
  {
    name: "InsufficientShares",
    type: "error",
    inputs: []
  },
  {
    name: "InvalidPercentage", 
    type: "error",
    inputs: [{ name: "percentage", type: "uint256" }]
  },
  {
    name: "NFTNotTransferred",
    type: "error", 
    inputs: []
  },
  {
    name: "InsufficientPayment",
    type: "error",
    inputs: [{ name: "required", type: "uint256" }, { name: "provided", type: "uint256" }]
  },
  {
    name: "MaxSellableExceeded",
    type: "error",
    inputs: []
  }
] as const


export const REGISTRY_ABI = [
  {
    name: 'getTotalSharedNFTs',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getActiveNFTIndices',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'nftContract', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'managerContract', type: 'address' },
          { name: 'firstOwner', type: 'address' },
          { name: 'isActive', type: 'bool' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'metadataURI', type: 'string' }
        ]
      }
    ]
  }
] as const


export const ERC20_ABI = [
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }]
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }]
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }]
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    name: "transferFrom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  }
] as const


const ERC721_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" }
    ],
    outputs: []
  },
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }]
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }]
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }]
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }]
  }
] as const


export interface NFTInfo {
  nftContract: string
  id: string
  owner: string
  price: string
  maxSellable: number
  totalSold: number
}

export interface ContractStatus {
  nftInContract: boolean
  nftTransferredFlag: boolean
  currentNFTOwner: string
}

export interface OwnershipBreakdown {
  firstOwner: string
  firstOwnerPercentage: number
  totalSold: number
  remainingAvailable: number
}

export interface ShareHolder {
  address: string
  percentage: number
  shares: number
}

export interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
}

export interface FractionalNFT {
  id: string
  name: string
  image: string
  description: string
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
  contractAddress: string
  tokenId: string
  totalShares: number
  availableShares: number
  pricePerShare: string
  originalSeller: string
  shareHolders: ShareHolder[]
}

export interface RegistryIndexEntry {
  nftContract: string
  tokenId: string
  managerContract: string
  firstOwner: string
  isActive: boolean
  createdAt: number
  metadataURI: string
}

export interface MarketplaceItem {
  manager: string
  name: string
  image: string
  totalShares: number
  availableShares: number
  pricePerShare: string
  creator: string
}


export async function getNFTInfo(contractAddress: string = DEFAULT_MANAGER_CONTRACT_ADDRESS): Promise<NFTInfo | null> {
  try {
    const result = await readContract(config, {
      address: contractAddress as `0x${string}`,
      abi: MANAGER_ABI,
      functionName: 'getNFTInfo',
    })

    const [nftContract, id, owner, price, maxSellable, totalSold] = result as [string, bigint, string, bigint, bigint, bigint]

    return {
      nftContract,
      id: id.toString(),
      owner,
      price: formatEther(price),
      maxSellable: Number(maxSellable),
      totalSold: Number(totalSold)
    }
  } catch (error) {
    // Error getting NFT info
    return null
  }
}

export async function getContractStatus(contractAddress: string = DEFAULT_MANAGER_CONTRACT_ADDRESS): Promise<ContractStatus | null> {
  try {
    const result = await readContract(config, {
      address: contractAddress as `0x${string}`,
      abi: MANAGER_ABI,
      functionName: 'getContractStatus',
    })

    const [nftInContract, nftTransferredFlag, currentNFTOwner] = result as [boolean, boolean, string]

    return {
      nftInContract,
      nftTransferredFlag,
      currentNFTOwner
    }
  } catch (error) {
    // Error getting contract status
    return null
  }
}

export async function getAllOwners(contractAddress: string = DEFAULT_MANAGER_CONTRACT_ADDRESS): Promise<ShareHolder[]> {
  try {
    const result = await readContract(config, {
      address: contractAddress as `0x${string}`,
      abi: MANAGER_ABI,
      functionName: 'getAllOwners',
    })

    const [ownerAddresses, percentages] = result as [string[], bigint[]]

    return ownerAddresses.map((address, index) => ({
      address,
      percentage: Number(percentages[index]),
      shares: Number(percentages[index])
    }))
  } catch (error) {
    // Error getting all owners
    return []
  }
}

export async function getOwnershipBreakdown(contractAddress: string = DEFAULT_MANAGER_CONTRACT_ADDRESS): Promise<OwnershipBreakdown | null> {
  try {
    const result = await readContract(config, {
      address: contractAddress as `0x${string}`,
      abi: MANAGER_ABI,
      functionName: 'getOwnershipBreakdown',
    })

    const [firstOwner, firstOwnerPercentage, totalSold, remainingAvailable] = result as [string, bigint, bigint, bigint]

    return {
      firstOwner,
      firstOwnerPercentage: Number(firstOwnerPercentage),
      totalSold: Number(totalSold),
      remainingAvailable: Number(remainingAvailable)
    }
  } catch (error) {
    // Error getting ownership breakdown
    return null
  }
}

export async function calculateCost(percentage: number, contractAddress: string = DEFAULT_MANAGER_CONTRACT_ADDRESS): Promise<string | null> {
  
  try {
    const result = await readContract(config, {
      address: contractAddress as `0x${string}`,
      abi: MANAGER_ABI,
      functionName: 'calculateCost',
      args: [BigInt(percentage)],
    })

    const cost = formatEther(result as bigint)
    
    return cost
  } catch (error) {
    console.error(' Error calculating cost:', error)
    return null
  }
}


export async function calculateCostWei(percentage: number, contractAddress: string): Promise<bigint | null> {
  try {
    const result = await readContract(config, {
      address: contractAddress as `0x${string}`,
      abi: MANAGER_ABI,
      functionName: 'calculateCost',
      args: [BigInt(percentage)],
    })
    return result as bigint
  } catch (error) {
    console.error(' Error calculating cost (wei):', error)
    return null
  }
}

export async function canBuyPercentage(percentage: number, contractAddress: string = DEFAULT_MANAGER_CONTRACT_ADDRESS): Promise<boolean> {
  try {
    const result = await readContract(config, {
      address: contractAddress as `0x${string}`,
      abi: MANAGER_ABI,
      functionName: 'canBuyPercentage',
      args: [BigInt(percentage)],
    })

    return result as boolean
  } catch (error) {
    console.error('Error checking if can buy percentage:', error)
    return false
  }
}

export async function getAvailableForSale(contractAddress: string = DEFAULT_MANAGER_CONTRACT_ADDRESS): Promise<number> {
  try {
    const result = await readContract(config, {
      address: contractAddress as `0x${string}`,
      abi: MANAGER_ABI,
      functionName: 'getAvailableForSale',
    })

    return Number(result as bigint)
  } catch (error) {
    console.error('Error getting available for sale:', error)
    return 0
  }
}

export async function getOwnershipPercentage(address: string, contractAddress: string = DEFAULT_MANAGER_CONTRACT_ADDRESS): Promise<number> {
  try {
    const result = await readContract(config, {
      address: contractAddress as `0x${string}`,
      abi: MANAGER_ABI,
      functionName: 'getOwnershipPercentage',
      args: [address as `0x${string}`],
    })

    return Number(result as bigint)
  } catch (error) {
    console.error('Error getting ownership percentage:', error)
    return 0
  }
}


export async function fetchNFTMetadata(contractAddress: string, tokenId: string): Promise<NFTMetadata | null> {
  try {
   
    const tokenURI = await readContract(config, {
      address: contractAddress as `0x${string}`,
      abi: ERC721_ABI,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    })

   
    let metadata: NFTMetadata = {
      name: `NFT #${tokenId}`,
      description: `NFT from contract ${contractAddress}`,
      image: `https://placehold.co/400x400/6366f1/ffffff?text=NFT%20${tokenId}`,
      attributes: []
    }

    try {
      let metadataUrl = tokenURI as string
      
     
      if (metadataUrl.startsWith('ipfs://')) {
        metadataUrl = `https://ipfs.io/ipfs/${metadataUrl.slice(7)}`
      }

      if (metadataUrl.startsWith('http')) {
        const response = await fetch(metadataUrl)
        if (response.ok) {
          const fetchedMetadata = await response.json()
          metadata = { ...metadata, ...fetchedMetadata }
          
         
          if (metadata.image && metadata.image.startsWith('ipfs://')) {
            metadata.image = `https://ipfs.io/ipfs/${metadata.image.slice(7)}`
          }
        }
      } else if (metadataUrl.startsWith('data:')) {
        const base64Data = metadataUrl.split(',')[1]
        const fetchedMetadata = JSON.parse(atob(base64Data))
        metadata = { ...metadata, ...fetchedMetadata }
      }
    } catch (error) {
      console.warn('Failed to fetch metadata:', error)
    }

    return metadata
  } catch (error) {
    console.error('Error fetching NFT metadata:', error)
    return null
  }
}


export async function getFractionalNFTForMarketplace(contractAddress: string): Promise<{
  id: string
  name: string
  image: string
  totalShares: number
  availableShares: number
  pricePerShare: string
  creator: string
} | null> {
  
  
  try {
    const fractionalNFT = await getFractionalNFTData(contractAddress)
    if (!fractionalNFT) {
      console.error(' No fractional NFT data available for marketplace')
      return null
    }

    const marketplaceNFT = {
      id: fractionalNFT.id,
      name: fractionalNFT.name,
      image: fractionalNFT.image,
      totalShares: fractionalNFT.totalShares,
      availableShares: fractionalNFT.availableShares,
      pricePerShare: fractionalNFT.pricePerShare,
      creator: fractionalNFT.originalSeller
    }

    
    return marketplaceNFT
  } catch (error) {
    console.error(' Error getting fractional NFT for marketplace:', error)
    return null
  }
}


export interface ComprehensiveContractData {
  nftInfo: {
    contract: string
    tokenId: string
    firstOwner: string
    price: string
    maxSellable: string
    totalSold: string
  }
  contractStatus: {
    nftInContract: boolean
    nftTransferredFlag: boolean
    currentNFTOwner: string
  }
  nftTransferred: boolean
  ownershipBreakdown: {
    firstOwner: string
    firstOwnerPercentage: string
    totalSold: string
    remainingAvailable: string
  }
  allOwners: {
    addresses: string[]
    percentages: string[]
  }
  availableForSale: string
  contractBalance: string
  sharesToken: {
    address: string
    name: string
    symbol: string
    decimals: string
    totalSupply: string
  }
  remainingOwnership: string
  totalSoldPercentage: string
  metadata?: NFTMetadata
}


export async function loadComprehensiveContractData(contractAddress: string): Promise<ComprehensiveContractData | null> {
  
  
  try {
   
    if (!contractAddress || !contractAddress.startsWith('0x')) {
      console.error(' Invalid contract address provided:', contractAddress)
      return null
    }

    
    
   
    const [
      nftInfo,
      contractStatus,
      nftTransferred,
      ownershipBreakdown,
      allOwners,
      availableForSale,
      contractBalance,
      sharesTokenAddress,
      remainingOwnership,
      totalSoldPercentage
    ] = await Promise.all([
      getNFTInfo(contractAddress),
      getContractStatus(contractAddress),
      readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: MANAGER_ABI,
        functionName: 'isNFTTransferred',
      }),
      getOwnershipBreakdown(contractAddress),
      getAllOwners(contractAddress),
      getAvailableForSale(contractAddress),
      readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: MANAGER_ABI,
        functionName: 'getContractBalance',
      }),
      readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: MANAGER_ABI,
        functionName: 'getSharesTokenAddress',
      }),
      readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: MANAGER_ABI,
        functionName: 'getRemainingOwnership',
      }),
      readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: MANAGER_ABI,
        functionName: 'getTotalSoldPercentage',
      })
    ])

    if (!nftInfo || !contractStatus || !ownershipBreakdown) {
      console.error(' Failed to get essential contract data')
      return null
    }

    
    

   
    let sharesTokenInfo = {
      address: sharesTokenAddress as string,
      name: "Unknown",
      symbol: "Unknown", 
      decimals: "18",
      totalSupply: "0"
    }

    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        readContract(config, {
          address: sharesTokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'name',
        }),
        readContract(config, {
          address: sharesTokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'symbol',
        }),
        readContract(config, {
          address: sharesTokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }),
        readContract(config, {
          address: sharesTokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'totalSupply',
        })
      ])

      sharesTokenInfo = {
        address: sharesTokenAddress as string,
        name: name as string,
        symbol: symbol as string,
        decimals: (decimals as number).toString(),
        totalSupply: formatEther(totalSupply as bigint)
      }

      
    } catch (err) {
      
    }

    
    let metadata: NFTMetadata | undefined

    try {
      const fetchedMetadata = await fetchNFTMetadata(nftInfo.nftContract, nftInfo.id)
      if (fetchedMetadata) {
        metadata = fetchedMetadata
        
      }
    } catch (err) {
      
    }

    const comprehensiveData: ComprehensiveContractData = {
      nftInfo: {
        contract: nftInfo.nftContract,
        tokenId: nftInfo.id,
        firstOwner: nftInfo.owner,
        price: nftInfo.price,
        maxSellable: nftInfo.maxSellable.toString(),
        totalSold: nftInfo.totalSold.toString()
      },
      contractStatus: {
        nftInContract: contractStatus.nftInContract,
        nftTransferredFlag: contractStatus.nftTransferredFlag,
        currentNFTOwner: contractStatus.currentNFTOwner
      },
      nftTransferred: nftTransferred as boolean,
      ownershipBreakdown: {
        firstOwner: ownershipBreakdown.firstOwner,
        firstOwnerPercentage: ownershipBreakdown.firstOwnerPercentage.toString(),
        totalSold: ownershipBreakdown.totalSold.toString(),
        remainingAvailable: ownershipBreakdown.remainingAvailable.toString()
      },
      allOwners: {
        addresses: allOwners.map(owner => owner.address),
        percentages: allOwners.map(owner => owner.percentage.toString())
      },
      availableForSale: availableForSale.toString(),
      contractBalance: formatEther(contractBalance as bigint),
      sharesToken: sharesTokenInfo,
      remainingOwnership: (remainingOwnership as bigint).toString(),
      totalSoldPercentage: (totalSoldPercentage as bigint).toString(),
      metadata
    }

    
    return comprehensiveData

  } catch (error) {
    console.error(' Error loading comprehensive contract data:', error)
    return null
  }
}


export async function getFractionalNFTData(contractAddress: string): Promise<FractionalNFT | null> {
  
  
  try {
   
    if (!contractAddress || !contractAddress.startsWith('0x')) {
      console.error(' Invalid contract address provided:', contractAddress)
      return null
    }

    
   
    const nftInfo = await getNFTInfo(contractAddress)
    if (!nftInfo) {
      console.error(' Failed to get NFT info from contract')
      return null
    }
    

    
   
    const shareHolders = await getAllOwners(contractAddress)
    const ownershipBreakdown = await getOwnershipBreakdown(contractAddress)
    const availableForSale = await getAvailableForSale(contractAddress)
    
 
    
   
    const metadata = await fetchNFTMetadata(nftInfo.nftContract, nftInfo.id)
    if (!metadata) {
      console.error(' Failed to fetch NFT metadata')
      return null
    }
    

   
    const totalShares = 100
    const availableShares = availableForSale
    const pricePerShare = nftInfo.price

    const fractionalNFT = {
      id: `${contractAddress}-${nftInfo.id}`,
      name: metadata.name,
      image: metadata.image,
      description: metadata.description,
      attributes: metadata.attributes,
      contractAddress: nftInfo.nftContract,
      tokenId: nftInfo.id,
      totalShares,
      availableShares,
      pricePerShare,
      originalSeller: nftInfo.owner,
      shareHolders
    }

    
    return fractionalNFT
  } catch (error) {
    console.error(' Error getting fractional NFT data from contract', contractAddress, ':', error)
    return null
  }
}


export async function fetchMarketplaceFromRegistry(
  registryAddress: string = DEFAULT_REGISTRY_CONTRACT_ADDRESS
): Promise<MarketplaceItem[]> {
  try {
    if (!registryAddress || !registryAddress.startsWith('0x')) return []

    const active = await readContract(config, {
      address: registryAddress as `0x${string}`,
      abi: REGISTRY_ABI,
      functionName: 'getActiveNFTIndices',
      args: [],
    })

    const entries = (active as any[]).map((e: any) => ({
      nftContract: e.nftContract as string,
      tokenId: (e.tokenId as bigint).toString(),
      managerContract: e.managerContract as string,
      firstOwner: e.firstOwner as string,
      isActive: e.isActive as boolean,
      createdAt: Number(e.createdAt as bigint),
      metadataURI: e.metadataURI as string,
    })) as RegistryIndexEntry[]

    const results: MarketplaceItem[] = []
    for (const entry of entries) {
      try {
        const data = await getFractionalNFTData(entry.managerContract)
        if (data) {
          results.push({
            manager: entry.managerContract,
            name: data.name,
            image: data.image,
            totalShares: data.totalShares,
            availableShares: data.availableShares,
            pricePerShare: data.pricePerShare,
            creator: data.originalSeller,
          })
        }
      } catch {}
    }

    return results
  } catch (e) {
    console.error(' Failed to fetch registry entries:', e)
    return []
  }
}


export async function buyShares(percentage: number, contractAddress: string, gasOptions?: {
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}): Promise<{ success: boolean; txHash?: string; error?: string; gasUsed?: string }> {
  
  try {
    
   
    const canBuy = await canBuyPercentage(percentage, contractAddress)
    if (!canBuy) {
      console.error(' Cannot buy this percentage - contract validation failed')
      return { success: false, error: 'Cannot buy this percentage' }
    }
    

    
   
    const costWei = await calculateCostWei(percentage, contractAddress)
    if (costWei === null) {
      console.error(' Could not calculate cost')
      return { success: false, error: 'Could not calculate cost' }
    }

    

    
    
   
    const txConfig: any = {
      address: contractAddress as `0x${string}`,
      abi: MANAGER_ABI,
      functionName: 'buyPercentage',
      args: [BigInt(percentage)],
      value: costWei,
      gas: BigInt(500000),
    }

   
    if (gasOptions) {
      if (gasOptions.gasLimit) {
        txConfig.gas = gasOptions.gasLimit
        
      }
      if (gasOptions.maxFeePerGas) {
        txConfig.maxFeePerGas = gasOptions.maxFeePerGas
        
      }
      if (gasOptions.maxPriorityFeePerGas) {
        txConfig.maxPriorityFeePerGas = gasOptions.maxPriorityFeePerGas
      }
    }

    

   
    const hash = await writeContract(config, txConfig)

    
    return { success: true, txHash: hash }
  } catch (error: any) {
    console.error(' Error buying shares:', error)
    
   
    let errorMessage = error.message || 'Transaction failed'
    
    if (error.message?.includes('gas')) {
      errorMessage = `Gas-related error: ${error.message}\n\nTips to reduce gas:\n• Try during off-peak hours\n• Use lower gas price (slower transaction)\n• Check if contract has gas-intensive operations`
    } else if (error.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds for transaction + gas fees'
    } else if (error.message?.includes('execution reverted')) {
      errorMessage = 'Transaction would fail - contract rejected the purchase'
    }
    
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      contractAddress,
      percentage
    })
    return { success: false, error: errorMessage }
  }
}


export async function estimateGasForPurchase(
  percentage: number,
  contractAddress: string,
  fromAddress?: string,
): Promise<{
  gasEstimate: string;
  gasCostETH: string;
  error?: string;
}> {
  try {
    
    
   
    const costStr = await calculateCost(percentage, contractAddress)
    if (!costStr) {
      return { gasEstimate: '0', gasCostETH: '0', error: 'Could not calculate purchase cost' }
    }

    const value = parseEther(costStr)

   
    const client = getPublicClient(config)

    const estimatedGas = await client.estimateContractGas({
      address: contractAddress as `0x${string}`,
      abi: MANAGER_ABI,
      functionName: 'buyPercentage',
      args: [BigInt(percentage)],
      value,
      account: fromAddress ? (fromAddress as `0x${string}`) : undefined,
    })

    const gasPrice = await client.getGasPrice()
    const gasCost = estimatedGas * gasPrice

    
    
    

    return {
      gasEstimate: estimatedGas.toString(),
      gasCostETH: formatEther(gasCost)
    }
  } catch (error: any) {
    console.error(' Error estimating gas:', error)
    return { 
      gasEstimate: '0', 
      gasCostETH: '0', 
      error: error.message 
    }
  }
}

export async function transferNFTToContract(contractAddress: string = DEFAULT_MANAGER_CONTRACT_ADDRESS): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const hash = await writeContract(config, {
      address: contractAddress as `0x${string}`,
      abi: MANAGER_ABI,
      functionName: 'transferNFTToContract',
    })

    return { success: true, txHash: hash }
  } catch (error: any) {
    console.error('Error transferring NFT to contract:', error)
    return { success: false, error: error.message || 'Transaction failed' }
  }
}


export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatPercentage(percentage: number): string {
  return `${percentage}%`
}

export function calculateSharesFromPercentage(percentage: number, totalShares: number = 100): number {
  return Math.round((percentage / 100) * totalShares)
}

export function calculatePercentageFromShares(shares: number, totalShares: number = 100): number {
  return (shares / totalShares) * 100
}


export async function testQueryFunctions(
  contractAddress: string,
  testAddress: string,
  testPercentage: number
): Promise<{
  ownershipPercentage: string
  sharesBalance: string
  isOwner: boolean
  costForPercentage: string
  canBuyPercentage: boolean
  sharesForPercentage: string
} | null> {
  
  
  if (!contractAddress || !testAddress) {
    console.error(' Missing contract address or test address')
    return null
  }

  try {
    const [
      ownershipPercentage,
      sharesBalance,
      isOwner,
      costForPercentage,
      canBuyResult,
      sharesForPercentage
    ] = await Promise.all([
      getOwnershipPercentage(testAddress, contractAddress),
      readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: MANAGER_ABI,
        functionName: 'getSharesBalance',
        args: [testAddress as `0x${string}`],
      }),
      readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: MANAGER_ABI,
        functionName: 'isOwner',
        args: [testAddress as `0x${string}`],
      }),
      calculateCost(testPercentage, contractAddress),
      canBuyPercentage(testPercentage, contractAddress),
      readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: MANAGER_ABI,
        functionName: 'getSharesForPercentage',
        args: [BigInt(testPercentage)],
      })
    ])

    const results = {
      ownershipPercentage: ownershipPercentage.toString(),
      sharesBalance: formatEther(sharesBalance as bigint),
      isOwner: isOwner as boolean,
      costForPercentage: costForPercentage || '0',
      canBuyPercentage: canBuyResult,
      sharesForPercentage: formatEther(sharesForPercentage as bigint)
    }

    
    return results

  } catch (error) {
    console.error(' Error testing query functions:', error)
    return null
  }
}


export async function refreshContractData(contractAddress: string): Promise<ComprehensiveContractData | null> {
  
  return await loadComprehensiveContractData(contractAddress)
}





export async function fetchManagerBytecode(): Promise<`0x${string}`> {
  const res = await fetch('/api/manager/bytecode', { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to load bytecode (${res.status})`)
  const hex = (await res.text()).trim()
  return (hex.startsWith('0x') ? hex : (`0x${hex}`)) as `0x${string}`
}

export async function deployManagerContract(params: {
  nftContract: `0x${string}`
  tokenId: bigint
  nftPriceWei: bigint
  maxSellablePercentage: bigint
}): Promise<{ address: `0x${string}`; txHash: `0x${string}` }> {
  
  const bytecode = await fetchManagerBytecode()

  const wallet = await getWalletClient(config)
  if (!wallet) throw new Error('Wallet not connected')

 
  const hash = await deployContract(wallet, {
    abi: MANAGER_ABI as unknown as any,
    bytecode,
    args: [params.nftContract, params.tokenId, params.nftPriceWei, params.maxSellablePercentage],
  })
  

  const publicClient = getPublicClient(config)
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  

  const address = receipt.contractAddress as `0x${string}`
  if (!address) throw new Error('No contract address in receipt')
  
  return { address, txHash: hash }
}

export async function approveNFTForManager(nftContract: `0x${string}`, tokenId: bigint, managerAddress: `0x${string}`): Promise<`0x${string}`> {
  


 
  const publicClient = getPublicClient(config)
  const wallet = await getWalletClient(config)
  
  const simulation = await publicClient.simulateContract({
    address: nftContract,
    abi: ERC721_ABI,
    functionName: 'approve',
    args: [managerAddress, tokenId],
    account: wallet?.account,
  })
  

  
  const hash = await writeContract(config, {
    address: nftContract,
    abi: ERC721_ABI,
    functionName: 'approve',
    args: [managerAddress, tokenId],
    gas: simulation.request.gas,
  })
  

  
  await publicClient.waitForTransactionReceipt({ hash })
  
  return hash
}

export async function setManagerRegistry(managerAddress: `0x${string}`, registryAddress: `0x${string}`): Promise<`0x${string}`> {
  

  const publicClient = getPublicClient(config)
  const wallet = await getWalletClient(config)
  
  const simulation = await publicClient.simulateContract({
    address: managerAddress,
    abi: MANAGER_ABI,
    functionName: 'setNFTRegistry',
    args: [registryAddress],
    account: wallet?.account,
  })
  

  
  const hash = await writeContract(config, {
    address: managerAddress,
    abi: MANAGER_ABI,
    functionName: 'setNFTRegistry',
    args: [registryAddress],
    gas: simulation.request.gas,
  })
  

  
  await publicClient.waitForTransactionReceipt({ hash })
  
  return hash
}

export type ListingStep = 'deploy' | 'approve' | 'transfer' | 'setRegistry' | 'registerInRegistry'
export type ListingProgress = { step: ListingStep; status: 'start' | 'success' | 'error'; txHash?: `0x${string}`; manager?: `0x${string}`; message?: string }

export async function fullListingFlow(opts: {
  nftContract: `0x${string}`
  tokenId: string
  pricePerShareEth: string
  maxSellablePercentage: number
  registryAddress: `0x${string}`
}, onProgress?: (update: ListingProgress) => void): Promise<{ manager: `0x${string}`; txs: { deploy: `0x${string}`; approve: `0x${string}`; transfer: `0x${string}`; setRegistry: `0x${string}`; registerInRegistry: `0x${string}` } }> {
  

  const tokenIdBI = BigInt(opts.tokenId)
  const nftPriceWei = parseEther(opts.pricePerShareEth)
  const maxPct = BigInt(opts.maxSellablePercentage)
 

  
  onProgress?.({ step: 'deploy', status: 'start' })
  const { address: manager, txHash: deploy } = await deployManagerContract({
    nftContract: opts.nftContract,
    tokenId: tokenIdBI,
    nftPriceWei,
    maxSellablePercentage: maxPct,
  })
  
  onProgress?.({ step: 'deploy', status: 'success', txHash: deploy, manager })

  
  onProgress?.({ step: 'approve', status: 'start', manager })
  const approve = await approveNFTForManager(opts.nftContract, tokenIdBI, manager)
  
  onProgress?.({ step: 'approve', status: 'success', txHash: approve, manager })

 
  const publicClient = getPublicClient(config)
  const wallet = await getWalletClient(config)
  
  onProgress?.({ step: 'transfer', status: 'start', manager })
  
  const transferSim = await publicClient.simulateContract({
    address: manager,
    abi: MANAGER_ABI,
    functionName: 'transferNFTToContract',
    args: [],
    account: wallet?.account,
  })
  
  
  const transfer = await writeContract(config, {
    address: manager,
    abi: MANAGER_ABI,
    functionName: 'transferNFTToContract',
    gas: transferSim.request.gas,
  })
  
  
  await publicClient.waitForTransactionReceipt({ hash: transfer })
  
  
  onProgress?.({ step: 'transfer', status: 'success', txHash: transfer, manager })

  
  onProgress?.({ step: 'setRegistry', status: 'start', manager })
  const setRegistry = await setManagerRegistry(manager, opts.registryAddress)
  
  onProgress?.({ step: 'setRegistry', status: 'success', txHash: setRegistry, manager })

  
  onProgress?.({ step: 'registerInRegistry', status: 'start', manager })
  
 
  
  let metadataURI = ''
  try {
    const tokenURI = await readContract(config, {
      address: opts.nftContract,
      abi: ERC721_ABI,
      functionName: 'tokenURI',
      args: [tokenIdBI],
    })
    metadataURI = tokenURI as string
  } catch (error) {
    console.warn('⚠️ Could not get NFT tokenURI, using fallback:', error)
    metadataURI = `https://nft-fallback.com/metadata/${opts.nftContract}/${opts.tokenId}`
  }
  
 
  const { registerSharedNFT } = await import('./registry')
  const registerInRegistry = await registerSharedNFT(manager, metadataURI)
  
  onProgress?.({ step: 'registerInRegistry', status: 'success', txHash: registerInRegistry, manager })

  
  return { manager, txs: { deploy, approve, transfer, setRegistry, registerInRegistry } }
}
