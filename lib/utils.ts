export function formatAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatEther(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return num.toFixed(3)
}

export function calculateSharePercentage(totalShares: number, availableShares: number): number {
  if (totalShares === 0) return 0
  return ((totalShares - availableShares) / totalShares) * 100
}

export function formatSharePercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`
}

export function validateEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}



export function resolveNftImageUrl(raw?: string | null): string {
  if (!raw || typeof raw !== 'string' || raw.trim() === '') return ''
  const url = raw.trim()

  
  if (url.startsWith('data:')) return url

  
  if (url.startsWith('ipfs://')) {
    const cidPath = url.replace('ipfs://', '')
    return `/api/ipfs/resolve?path=${encodeURIComponent(cidPath)}`
  }
  if (url.includes('ipfs/')) {
    
    const idx = url.indexOf('ipfs/')
    const cidPath = url.slice(idx + 5)
    return `/api/ipfs/resolve?path=${encodeURIComponent(cidPath)}`
  }

  
  if (url.startsWith('ar://')) {
    const id = url.replace('ar://', '')
    return `https://arweave.net/${id}`
  }

  
  try {
    const u = new URL(url)
    
    if (u.hostname.includes('pinata.cloud') || u.hostname.includes('ipfs.io') || u.hostname.includes('infura') || u.hostname.includes('nftstorage.link')) {
      
      const ipfsIdx = url.indexOf('ipfs/')
      if (ipfsIdx !== -1) {
        const cidPath = url.slice(ipfsIdx + 5)
        return `/api/ipfs/resolve?path=${encodeURIComponent(cidPath)}`
      }
    }
    return url
  } catch {
    return url
  }
}


export const TRANSPARENT_BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='

export function isVideoUrl(url: string): boolean {
  if (!url) return false
  
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v', '.3gp', '.flv']
  const lowercaseUrl = url.toLowerCase()
  
  if (videoExtensions.some(ext => lowercaseUrl.includes(ext))) {
    return true
  }
  
  if (lowercaseUrl.includes('video/') || lowercaseUrl.includes('mime=video')) {
    return true
  }
  
  if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('vimeo.com')) {
    return true
  }
  
  if (lowercaseUrl.includes('/video/') || lowercaseUrl.includes('_video') || lowercaseUrl.includes('video_')) {
    return true
  }
  
  return false
}

export async function detectMediaType(url: string): Promise<'image' | 'video' | 'unknown'> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    const contentType = response.headers.get('content-type') || ''
    
    if (contentType.startsWith('video/')) return 'video'
    if (contentType.startsWith('image/')) return 'image'
    
    return 'unknown'
  } catch {
    return 'unknown'
  }
}
