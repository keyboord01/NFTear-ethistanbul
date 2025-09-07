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
  if (!uri) {
    return ''
  }

  if (uri.startsWith('ipfs://')) {
    const hash = uri.slice(7)
    const resolved = `https://ipfs.io/ipfs/${hash}`
    return resolved
  }

  return uri
}

async function fetchJson(uri: string): Promise<any | null> {
  try {
    const url = resolveIpfs(uri)
    if (!url) {
      return null
    }

    const res = await fetch(url)

    if (!res.ok) {
      return null
    }

    const json = await res.json()
    return json
  } catch (error) {
    return null
  }
}

export async function fetchActiveMarketplaceItems(
  registryAddress: `0x${string}`
): Promise<MarketplaceItem[]> {
  try {
    // Check if we have a valid address
    if (!registryAddress || registryAddress === '0x' || registryAddress.length !== 42) {
      return []
    }

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
    
    
    const items: MarketplaceItem[] = []
    await Promise.all(
      entries.map(async (entry, index) => {
        try {
          const info = await readContract(config, {
            address: entry.managerContract as `0x${string}`,
            abi: MANAGER_MIN_ABI,
            functionName: 'getNFTInfo',
          })
          const [_, __, owner, price, maxSellable, totalSold] = info as [string, bigint, string, bigint, bigint, bigint]

          const meta = await fetchJson(entry.metadataURI)

          let name = meta?.name || `NFT #${entry.tokenId}`

          let image = ''
          if (meta?.image) {
            image = resolveIpfs(meta.image)
          }


          if (!image) {
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

              if (tokenURI) {
                const nftMeta = await fetchJson(tokenURI as string)

                if (nftMeta?.image) {
                  image = resolveIpfs(nftMeta.image)
                  name = nftMeta.name || name
                }
              }
            } catch (nftError) {
              // Could not fetch from NFT contract
            }
          }


          if (!image) {
            image = `data:image/svg+xml;base64,${btoa(`
              <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#1a1a1a"/>
                <text x="50%" y="40%" text-anchor="middle" fill="#666" font-size="24" font-family="monospace">NFT</text>
                <text x="50%" y="60%" text-anchor="middle" fill="#888" font-size="32" font-family="monospace">#${entry.tokenId}</text>
              </svg>
            `.trim())}`
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

          items.push(item)
        } catch (error) {
          // Failed to process entry
        }
      })
    )

  return items
} catch (e) {
  return []
}
}

export async function registerSharedNFT(managerAddress: `0x${string}`, metadataURI: string): Promise<`0x${string}`> {
  const publicClient = getPublicClient(config)
  const wallet = await getWalletClient(config)
  const simulation = await publicClient.simulateContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'registerSharedNFT',
    args: [managerAddress, metadataURI],
    account: wallet?.account,
  })

  const hash = await writeContract(config, {
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'registerSharedNFT',
    args: [managerAddress, metadataURI],
    gas: simulation.request.gas,
  })

  await publicClient.waitForTransactionReceipt({ hash })
  return hash
}


