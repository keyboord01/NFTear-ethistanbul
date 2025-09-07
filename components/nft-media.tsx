'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { resolveNftImageUrl, isVideoUrl, detectMediaType, TRANSPARENT_BLUR_DATA_URL } from '@/lib/utils'

interface NFTMediaProps {
  src: string
  alt: string
  className?: string
  onClick?: () => void
  priority?: boolean
  fill?: boolean
  onLoadingComplete?: () => void
}

export function NFTMedia({ 
  src, 
  alt, 
  className = '', 
  onClick, 
  priority = false, 
  fill = true,
  onLoadingComplete 
}: NFTMediaProps) {
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'unknown'>('unknown')
  const [imageError, setImageError] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [videoLoading, setVideoLoading] = useState(true)
  const [imageLoading, setImageLoading] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const resolvedSrc = resolveNftImageUrl(src)
  const fallbackSrc = '/nfts/ethistanbulgif.gif'
  
  
  const shouldUseLocalGif = src.includes('QmTYu1P7ue8wFBp8dZZt6GPYiJ2qzVc1e9vAB5qVff9W93')
  const finalSrc = shouldUseLocalGif ? fallbackSrc : resolvedSrc

  useEffect(() => {
    if (shouldUseLocalGif) {
      
      setMediaType('image')
    } else if (isVideoUrl(resolvedSrc)) {
      setMediaType('video')
    } else {
      setMediaType('image')
    }
  }, [resolvedSrc, shouldUseLocalGif])


  const handleVideoLoad = () => {
    
    setVideoLoading(false)
    onLoadingComplete?.()
    if (videoRef.current) {
      videoRef.current.play()
    }
  }

  const handleImageLoad = () => {
    setImageLoading(false)
    onLoadingComplete?.()
  }

  const handleImageError = () => {
    
    setImageError(true)
    setMediaType('video')
  }

  const handleVideoError = () => {
    
    setVideoError(true)
    setVideoLoading(false)
  }

  if (mediaType === 'video' || imageError) {
    if (videoError) {
      
      return (
        <div className="relative w-full h-full group">
          <Image
            src={fallbackSrc}
            alt={alt}
            fill={fill}
            className={`${className} transition-all duration-300`}
            placeholder="blur"
            blurDataURL={TRANSPARENT_BLUR_DATA_URL}
            unoptimized
            priority={priority}
            onClick={onClick}
            onLoadingComplete={handleImageLoad}
          />

          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      )
    }

    return (
      <div className="relative w-full h-full group">
        <video
          ref={videoRef}
          src={finalSrc}
          className={`${className} transition-all duration-300`}
          autoPlay
          loop
          muted
          playsInline
          onClick={onClick}
          onLoadedData={handleVideoLoad}
          onLoadStart={() => setVideoLoading(true)}
          onError={handleVideoError}
          style={fill ? {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: className.includes('object-contain') ? 'contain' : 'cover'
          } : undefined}
        />

        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        {videoLoading && (
          <div 
            className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center"
            style={{ zIndex: 10 }}
          >
            <div className="text-gray-400 text-sm">Loading video...</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative w-full h-full group">
      <Image
        src={imageError ? fallbackSrc : (finalSrc || `https://placehold.co/600x600/0f172a/ffffff?text=${encodeURIComponent(alt)}`)}
        alt={alt}
        fill={fill}
        className={`${className} transition-all duration-300`}
        placeholder="blur"
        blurDataURL={TRANSPARENT_BLUR_DATA_URL}
        unoptimized
        priority={priority}
        onClick={onClick}
        onLoadingComplete={handleImageLoad}
        onError={() => {
          if (!imageError) {
            
            setImageError(true)
          }
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  )
}
