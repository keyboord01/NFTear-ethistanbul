import { readContract, writeContract, getPublicClient, getWalletClient } from '@wagmi/core'
import { config } from './web3'


export const REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "0x003a6F78dd9EDf8721874e07C68F12e95b5458CD") as `0x${string}`


export const REGISTRY_ABI = [
  {
    name: 'registerSharedNFT',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_managerContract', type: 'address' },
      { name: '_metadataURI', type: 'string' }
    ],
    outputs: []
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
  },
  {
    name: 'getNFTIndicesByOwner',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_owner', type: 'address' }
    ],
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
  },
  {
    name: 'getNFTIndexByManager',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_managerContract', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
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

export const MANAGER_MIN_ABI = [
  {
    name: 'getNFTInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'id', type: 'uint256' },
      { name: 'owner', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'maxSellable', type: 'uint256' },
      { name: 'totalSold', type: 'uint256' },
    ]
  }
] as const

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
  id: string
  name: string
  image: string
  totalShares: number
  availableShares: number
  pricePerShare: string
  creator: string
  contract: string 
}

function resolveIpfs(uri: string): string {
  console.log(`🔗 Resolving IPFS URI: ${uri}`)
  if (!uri) {
    console.log(' Empty URI provided')
    return ''
  }
  
  if (uri.startsWith('ipfs://')) {
    const hash = uri.slice(7)
    const resolved = `https://ipfs.io/ipfs/${hash}`
    console.log(` IPFS URI resolved: ${resolved}`)
    return resolved
  }
  
  console.log(` Non-IPFS URI returned as-is: ${uri}`)
  return uri
}

async function fetchJson(uri: string): Promise<any | null> {
  console.log(`📡 Fetching metadata from URI: ${uri}`)
  try {
    const url = resolveIpfs(uri)
    console.log(`🔗 Resolved URL: ${url}`)
    if (!url) {
      console.log(' No URL to fetch')
      return null
    }
    
    console.log(`🌐 Making fetch request to: ${url}`)
    const res = await fetch(url)
    console.log(`📊 Response status: ${res.status} ${res.statusText}`)
    
    if (!res.ok) {
      console.log(` Fetch failed with status: ${res.status}`)
      return null
    }
    
    const json = await res.json()
    console.log(` Metadata loaded:`, json)
    return json
  } catch (error) {
    console.error(' Error fetching metadata:', error)
    return null
  }
}

export async function fetchActiveMarketplaceItems(
  registryAddress: `0x${string}`
): Promise<MarketplaceItem[]> {
  console.log(`🏪 Starting to fetch marketplace items from registry: ${registryAddress}`)
  
  try {
    console.log('📡 Step 1: Fetching active NFT indices from registry...')
    const raw = await readContract(config, {
      address: registryAddress,
      abi: REGISTRY_ABI,
      functionName: 'getActiveNFTIndices',
      args: [],
    })

    const entries = (raw as any[]).map((e: any) => ({
      nftContract: e.nftContract as string,
      tokenId: (e.tokenId as bigint).toString(),
      managerContract: e.managerContract as string,
      firstOwner: e.firstOwner as string,
      isActive: e.isActive as boolean,
      createdAt: Number(e.createdAt as bigint),
      metadataURI: e.metadataURI as string,
    })) as RegistryIndexEntry[]

    console.log(` Found ${entries.length} registry entries:`)
    entries.forEach((entry, i) => {
      console.log(`  ${i + 1}. Manager: ${entry.managerContract}`)
      console.log(`     Token ID: ${entry.tokenId}`)
      console.log(`     Metadata URI: ${entry.metadataURI}`)
      console.log(`     Active: ${entry.isActive}`)
    })

    console.log('\n📡 Step 2: Hydrating each entry with manager data and metadata...')
    
    
    const items: MarketplaceItem[] = []
    await Promise.all(
      entries.map(async (entry, index) => {
        try {
          console.log(`\n🔍 Processing entry ${index + 1}: Manager ${entry.managerContract}`)
          
          console.log('📊 Fetching manager info...')
          const info = await readContract(config, {
            address: entry.managerContract as `0x${string}`,
            abi: MANAGER_MIN_ABI,
            functionName: 'getNFTInfo',
          })
          const [_, __, owner, price, maxSellable, totalSold] = info as [string, bigint, string, bigint, bigint, bigint]
          
          console.log(` Manager info loaded:`, {
            owner,
            price: (Number(price) / 1e18).toString(),
            maxSellable: Number(maxSellable),
            totalSold: Number(totalSold)
          })

          console.log('🖼️ Fetching metadata...')
          const meta = await fetchJson(entry.metadataURI)
          console.log('📋 Complete metadata object:', meta)
          
          let name = meta?.name || `NFT #${entry.tokenId}`
          console.log(`📝 NFT name: ${name}`)
          
          console.log('🎨 Processing image...')
          console.log(`Raw image from metadata: ${meta?.image}`)
          console.log(`Metadata keys available:`, meta ? Object.keys(meta) : 'No metadata')
          
          
          let image = ''
          if (meta?.image) {
            image = resolveIpfs(meta.image)
            console.log(`🔗 Resolved image URL from metadata: ${image}`)
          }
          
          
          if (!image) {
            console.log('⚠️ No image in metadata, trying to fetch from NFT contract...')
            try {
              const tokenURI = await readContract(config, {
                address: entry.nftContract as `0x${string}`,
                abi: [
                  {
                    name: "tokenURI",
                    type: "function",
                    stateMutability: "view",
                    inputs: [{ name: "tokenId", type: "uint256" }],
                    outputs: [{ name: "", type: "string" }]
                  }
                ],
                functionName: 'tokenURI',
                args: [BigInt(entry.tokenId)],
              })
              
              console.log(`🔗 TokenURI from NFT contract: ${tokenURI}`)
              
              if (tokenURI) {
                const nftMeta = await fetchJson(tokenURI as string)
                console.log('🖼️ NFT contract metadata:', nftMeta)
                
                if (nftMeta?.image) {
                  image = resolveIpfs(nftMeta.image)
                  name = nftMeta.name || name
                  console.log(` Using image from NFT contract: ${image}`)
                }
              }
            } catch (nftError) {
              console.log('⚠️ Could not fetch from NFT contract:', nftError)
            }
          }
          
          
          if (!image) {
            console.log('⚠️ No image found anywhere, using fallback SVG')
            image = `data:image/svg+xml;base64,${btoa(`
              <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#1a1a1a"/>
                <text x="50%" y="40%" text-anchor="middle" fill="#666" font-size="24" font-family="monospace">NFT</text>
                <text x="50%" y="60%" text-anchor="middle" fill="#888" font-size="32" font-family="monospace">#${entry.tokenId}</text>
              </svg>
            `.trim())}`
            console.log(' Generated fallback SVG image')
          } else {
            console.log(` Final image URL: ${image}`)
          }

          const totalShares = 100
          const availableShares = Math.max(0, Number(maxSellable) - Number(totalSold))
          const pricePerShare = (Number(price) / 1e18).toString()

          const item = {
            id: `${entry.managerContract}-${entry.tokenId}`,
            name,
            image,
            totalShares,
            availableShares,
            pricePerShare,
            creator: owner,
            contract: entry.managerContract,
          }
          
          console.log(`🎉 Marketplace item created:`, item)
          items.push(item)
        } catch (error) {
          console.error(` Failed to process entry ${index + 1}:`, error)
        }
      })
    )

  console.log(`\n🎯 Final marketplace items: ${items.length}`)
  return items
} catch (e) {
  console.error(' Failed to load active marketplace items:', e)
  return []
}
}

export async function registerSharedNFT(managerAddress: `0x${string}`, metadataURI: string): Promise<`0x${string}`> {
  console.log('📝 Starting registry registration:', {
    managerAddress,
    metadataURI,
    registryAddress: REGISTRY_ADDRESS,
  })

  const publicClient = getPublicClient(config)
  const wallet = await getWalletClient(config)
  console.log('🔍 Simulating registerSharedNFT transaction...')
  const simulation = await publicClient.simulateContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'registerSharedNFT',
    args: [managerAddress, metadataURI],
    account: wallet?.account,
  })
  console.log(' Registry registration simulation successful, gas:', simulation.request.gas?.toString())

  console.log('📝 Sending registerSharedNFT transaction...')
  const hash = await writeContract(config, {
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'registerSharedNFT',
    args: [managerAddress, metadataURI],
    gas: simulation.request.gas,
  })
  console.log('📝 Registry registration transaction sent, hash:', hash)

  console.log('⏳ Waiting for registry registration receipt...')
  await publicClient.waitForTransactionReceipt({ hash })
  console.log(' Registry registration transaction confirmed')
  return hash
}


