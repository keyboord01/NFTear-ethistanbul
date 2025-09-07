import { readContract } from '@wagmi/core'
import { config } from './web3'
import { REGISTRY_ADDRESS, REGISTRY_ABI, MANAGER_MIN_ABI } from './registry'


const ERC721_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "uint256", "name": "index", "type": "uint256"}],
    "name": "tokenOfOwnerByIndex",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
}

export interface UserNFT {
  contractAddress: string
  tokenId: string
  metadata: NFTMetadata
  tokenURI: string
  managerContract?: string 
}


export const MANAGER_CONTRACT_ADDRESS = '0x183074b3251c5de2868E60562f763f6A2a65afD2' 


export async function checkContractForNFTs(contractAddress: string, userAddress: string): Promise<UserNFT[]> {
  const userNFTs: UserNFT[] = []

  try {
    console.log(`Checking contract: ${contractAddress} for user: ${userAddress}`)
    
    
    const balance = await readContract(config, {
      address: contractAddress as `0x${string}`,
      abi: ERC721_ABI,
      functionName: 'balanceOf',
      args: [userAddress as `0x${string}`],
    })

    const balanceNum = Number(balance)
    console.log(`Balance for ${contractAddress}: ${balanceNum}`)
    
    if (balanceNum > 0) {
      
      try {
        for (let i = 0; i < Math.min(balanceNum, 20); i++) {
          try {
            const tokenId = await readContract(config, {
              address: contractAddress as `0x${string}`,
              abi: ERC721_ABI,
              functionName: 'tokenOfOwnerByIndex',
              args: [userAddress as `0x${string}`, BigInt(i)],
            })

            const nft = await fetchNFTDetails(contractAddress, tokenId.toString())
            if (nft) {
              userNFTs.push(nft)
            }
          } catch (error) {
            console.warn('Failed to fetch token at index', i, error)
          }
        }
      } catch (error) {
        console.warn('tokenOfOwnerByIndex not supported, trying alternative method', error)
        
        
        for (let tokenId = 1; tokenId <= 100 && userNFTs.length < 10; tokenId++) {
          try {
            const owner = await readContract(config, {
              address: contractAddress as `0x${string}`,
              abi: ERC721_ABI,
              functionName: 'ownerOf',
              args: [BigInt(tokenId)],
            })

            if (owner.toLowerCase() === userAddress.toLowerCase()) {
              const nft = await fetchNFTDetails(contractAddress, tokenId.toString())
              if (nft) {
                userNFTs.push(nft)
              }
            }
          } catch (error) {
            
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to check contract:', contractAddress, error)
  }

  return userNFTs
}

async function fetchNFTDetails(contractAddress: string, tokenId: string): Promise<UserNFT | null> {
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
        image: `https://placehold.co/400x400/6366f1/ffffff?text=NFT%20${tokenId}`
      }

    try {
      if (tokenURI.startsWith('http')) {
        const response = await fetch(tokenURI)
        if (response.ok) {
          const fetchedMetadata = await response.json()
          metadata = { ...metadata, ...fetchedMetadata }
        }
      } else if (tokenURI.startsWith('data:')) {
        const base64Data = tokenURI.split(',')[1]
        const fetchedMetadata = JSON.parse(atob(base64Data))
        metadata = { ...metadata, ...fetchedMetadata }
      }
    } catch (error) {
      console.warn('Failed to fetch metadata for token:', tokenId, error)
    }

    return {
      contractAddress,
      tokenId,
      metadata,
      tokenURI,
    }
  } catch (error) {
    console.warn('Failed to fetch NFT details:', error)
    return null
  }
}


export async function fetchOwnedNFTs(userAddress: string): Promise<UserNFT[]> {
  const ownedNFTs: UserNFT[] = []

  try {
    console.log('🔍 Fetching owned NFTs for:', userAddress)
    
    
    try {
      console.log('📡 Using Moralis API...')
      
      const moralisApiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY
      if (!moralisApiKey) {
        throw new Error('Moralis API key not found')
      }

      const response = await fetch(
        `https://deep-index.moralis.io/api/v2.2/${userAddress}/nft?chain=sepolia&format=decimal&media_items=false`,
        {
          headers: {
            'X-API-Key': moralisApiKey,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log(' Moralis response:', data)
        
        if (data.result && data.result.length > 0) {
          for (const nft of data.result.slice(0, 50)) { 
            try {
              
              let metadata: NFTMetadata = {
                name: nft.name || `NFT #${nft.token_id}`,
                description: nft.metadata?.description || `NFT from ${nft.name || 'Unknown Collection'}`,
                image: nft.metadata?.image || `https://placehold.co/400x400/6366f1/ffffff?text=${encodeURIComponent(nft.name || 'NFT')}`,
                attributes: nft.metadata?.attributes || []
              }

              
              if (typeof nft.metadata === 'string') {
                try {
                  const parsedMetadata = JSON.parse(nft.metadata)
                  metadata = {
                    name: parsedMetadata.name || nft.name || `NFT #${nft.token_id}`,
                    description: parsedMetadata.description || `NFT from ${nft.name || 'Unknown Collection'}`,
                    image: parsedMetadata.image || `https://placehold.co/400x400/6366f1/ffffff?text=${encodeURIComponent(parsedMetadata.name || nft.name || 'NFT')}`,
                    attributes: parsedMetadata.attributes || []
                  }
                } catch (parseError) {
                  console.warn('Failed to parse metadata JSON:', parseError)
                }
              }

              ownedNFTs.push({
                contractAddress: nft.token_address,
                tokenId: nft.token_id,
                metadata,
                tokenURI: nft.token_uri || '',
              })
            } catch (error) {
              console.warn(' Failed to process Moralis NFT:', error)
            }
          }
          
          console.log(` Found ${ownedNFTs.length} NFTs via Moralis`)
          return ownedNFTs
        } else {
          console.log('📭 Moralis returned no NFTs')
        }
      } else {
        console.log(' Moralis API failed:', response.status, await response.text())
      }
    } catch (error) {
      console.warn(' Moralis API error:', error)
    }

    
    console.log('📡 Falling back to contract checking...')
    
    const SEPOLIA_NFT_CONTRACTS = [
      '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844', 
      '0x5FbDB2315678afecb367f032d93F642f64180aa3', 
      '0x25ed58c027921E14D86380eA2646E3a1B5C55A8b', 
      '0x4C4a2f8c81640e47606d3fd77B353E87Ba015584', 
    ]

    for (const contractAddress of SEPOLIA_NFT_CONTRACTS) {
      console.log(`🔍 Checking contract: ${contractAddress}`)
      const nfts = await checkContractForNFTs(contractAddress, userAddress)
      if (nfts.length > 0) {
        console.log(` Found ${nfts.length} NFTs in contract ${contractAddress}`)
        ownedNFTs.push(...nfts)
      }
    }

  } catch (error) {
    console.error(' Error fetching owned NFTs:', error)
  }

  console.log(`🎯 Total owned NFTs found: ${ownedNFTs.length}`)
  
  
  if (ownedNFTs.length === 0) {
    console.log('🤔 No NFTs found. This could mean:')
    console.log('  1. You don\'t own any NFTs on Sepolia testnet')
    console.log('  2. Your NFTs are on different contracts not checked yet')
    console.log('  3. There might be an API issue')
    console.log('  💡 Try using the "Add Contract" feature with your specific NFT contract address')
    console.log('  🔍 Check your wallet on https://sepolia.etherscan.io/address/' + userAddress)
  }
  
  return ownedNFTs
}


export async function fetchSharedNFTs(userAddress: string): Promise<UserNFT[]> {
  const sharedNFTs: UserNFT[] = []

  try {
    console.log('🔍 Fetching shared NFTs via registry for:', userAddress)
    if (!REGISTRY_ADDRESS) {
      console.warn(' Registry address not configured (NEXT_PUBLIC_REGISTRY_ADDRESS)')
      return []
    }

    const resolveIpfs = (uri: string): string => {
      if (!uri) return ''
      if (uri.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${uri.slice(7)}`
      return uri
    }

    const fetchJson = async (uri: string): Promise<any | null> => {
      try {
        const url = resolveIpfs(uri)
        if (!url) return null
        const res = await fetch(url)
        if (!res.ok) return null
        return await res.json()
      } catch {
        return null
      }
    }

    const raw = await readContract(config, {
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'getNFTIndicesByOwner',
      args: [userAddress as `0x${string}`],
    })

    const entries = (raw as any[]).map((e: any) => ({
      nftContract: e.nftContract as string,
      tokenId: (e.tokenId as bigint).toString(),
      managerContract: e.managerContract as string,
      firstOwner: e.firstOwner as string,
      isActive: e.isActive as boolean,
      createdAt: Number(e.createdAt as bigint),
      metadataURI: e.metadataURI as string,
    }))

    await Promise.all(entries.map(async (entry) => {
      try {
        
        try {
          await readContract(config, {
            address: entry.managerContract as `0x${string}`,
            abi: MANAGER_MIN_ABI,
            functionName: 'getNFTInfo',
          })
        } catch {}

        let metadata: NFTMetadata = {
          name: `NFT #${entry.tokenId}`,
          description: `Shared NFT from manager ${entry.managerContract}`,
          image: `https://placehold.co/400x400/9333ea/ffffff?text=NFT%20${entry.tokenId}`,
        }

        
        if (entry.metadataURI) {
          const meta = await fetchJson(entry.metadataURI)
          if (meta) {
            metadata = {
              name: meta.name || metadata.name,
              description: meta.description || metadata.description,
              image: meta.image ? resolveIpfs(meta.image) : metadata.image,
              attributes: Array.isArray(meta.attributes) ? meta.attributes : metadata.attributes,
            }
          }
        }

        
        if (!metadata.image || metadata.image.length === 0) {
          try {
            const tokenURI = await readContract(config, {
              address: entry.nftContract as `0x${string}`,
              abi: [
                {
                  name: 'tokenURI',
                  type: 'function',
                  stateMutability: 'view',
                  inputs: [{ name: 'tokenId', type: 'uint256' }],
                  outputs: [{ name: '', type: 'string' }],
                },
              ] as const,
              functionName: 'tokenURI',
              args: [BigInt(entry.tokenId)],
            })
            const meta = await fetchJson(tokenURI as string)
            if (meta?.image) {
              metadata.image = resolveIpfs(meta.image)
              metadata.name = meta.name || metadata.name
              metadata.description = meta.description || metadata.description
              metadata.attributes = Array.isArray(meta.attributes) ? meta.attributes : metadata.attributes
            }
          } catch {}
        }

        sharedNFTs.push({
          contractAddress: entry.nftContract,
          tokenId: entry.tokenId,
          metadata,
          tokenURI: entry.metadataURI || '',
        })
      } catch (err) {
        console.warn('Failed to process shared entry', entry.managerContract, err)
      }
    }))
  } catch (error) {
    console.error(' Error fetching shared NFTs:', error)
  }

  console.log(`🎯 Total shared NFTs found: ${sharedNFTs.length}`)
  return sharedNFTs
}


export async function fetchUserNFTs(userAddress: string, customContracts: string[] = []): Promise<UserNFT[]> {
  
  
  if (customContracts.length > 0) {
    const customNFTs: UserNFT[] = []
    for (const contractAddress of customContracts) {
      if (contractAddress && contractAddress.startsWith('0x')) {
        const nfts = await checkContractForNFTs(contractAddress, userAddress)
        customNFTs.push(...nfts)
      }
    }
    return customNFTs
  }
  
  return await fetchOwnedNFTs(userAddress)
}

export async function transferNFTToManager(contractAddress: string, tokenId: string) {
  
  
  console.log(`Transferring NFT ${tokenId} from contract ${contractAddress} to manager ${MANAGER_CONTRACT_ADDRESS}`)
  
  
  
  
  
}