'use client'

import Image from 'next/image'

interface ImageLightboxProps {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
}

export function ImageLightbox({ src, alt, isOpen, onClose }: ImageLightboxProps) {
  if (!isOpen) return null

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-300 hover:text-white"
        aria-label="Close"
      >
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <div className="relative max-w-5xl w-full aspect-[4/3]">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          unoptimized
          priority={false}
        />
      </div>
    </div>
  )
}


