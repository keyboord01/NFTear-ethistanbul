import { NextRequest } from 'next/server'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
    'Cross-Origin-Resource-Policy': 'cross-origin',
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() })
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const rawPath = url.searchParams.get('path') || ''
  if (!rawPath) {
    return new Response('Missing path', { status: 400, headers: corsHeaders() })
  }

  
  const path = rawPath.replace(/^ipfs:\/\//, '').replace(/^\/+/, '')

  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${path}`,
    `https://ipfs.io/ipfs/${path}`,
    `https://cloudflare-ipfs.com/ipfs/${path}`,
    `https://nftstorage.link/ipfs/${path}`,
  ]

  for (const gw of gateways) {
    try {
      const upstream = await fetch(gw, {
        
        next: { revalidate: 3600 },
        headers: {
          
          ...(req.headers.get('Range') ? { Range: req.headers.get('Range') as string } : {}),
        },
      })

      if (upstream.ok || upstream.status === 206) {
        const headers = new Headers(corsHeaders())
        const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
        const contentLength = upstream.headers.get('content-length')
        const etag = upstream.headers.get('etag')
        const acceptRanges = upstream.headers.get('accept-ranges')
        const contentRange = upstream.headers.get('content-range')

        headers.set('Content-Type', contentType)
        headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400')
        if (contentLength) headers.set('Content-Length', contentLength)
        if (etag) headers.set('ETag', etag)
        if (acceptRanges) headers.set('Accept-Ranges', acceptRanges)
        if (contentRange) headers.set('Content-Range', contentRange)

        return new Response(upstream.body, { status: upstream.status, headers })
      }
    } catch {
      
    }
  }

  return new Response('Not found', { status: 404, headers: corsHeaders() })
}

