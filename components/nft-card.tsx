'use client'

import Image from 'next/image'
import { Tilt } from './tilt'
import { NFTMedia } from './nft-media'

interface NFTCardProps {
  id: string
  name: string
  image: string
  totalShares: number
  availableShares: number
  pricePerShare: string
  creator: string
  contract?: string
  isLive?: boolean
}

export function NFTCard({ 
  id, 
  name, 
  image, 
  totalShares, 
  availableShares, 
  pricePerShare, 
  creator,
  contract,
  isLive = false
}: NFTCardProps) {
  const sharePercentage = ((totalShares - availableShares) / totalShares) * 100

  return (
    <div className="card nft-card overflow-hidden">
      <div className="aspect-square relative overflow-hidden">
        <NFTMedia
          src={image}
          alt={name}
          className="object-cover scale-110 blur-2xl opacity-30"
        />
        <Tilt className="absolute inset-0">
          <NFTMedia
            src={image}
            alt={name}
            className="object-contain p-4"
          />
        </Tilt>
        {/* <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" /> */}
        {availableShares === 0 && (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 text-xs font-medium rounded">
            Sold Out
          </div>
        )}
        {isLive && (
          <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 text-xs font-medium rounded flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            LIVE
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2 truncate">{name}</h3>
        <p className="text-sm text-gray-400 mb-4 font-mono">
          {creator.slice(0, 6)}...{creator.slice(-4)}
        </p>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2 text-gray-300">
            <span>Shares Sold</span>
            <span className="font-medium">{totalShares - availableShares}/{totalShares}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-[#238056] transition-all duration-300" 
              style={{ width: `${sharePercentage}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Price per share</p>
            <p className="text-lg font-semibold text-white">{pricePerShare} ETH</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Available</p>
            <p className="text-lg font-semibold text-white">{availableShares}</p>
          </div>
        </div>

        <button 
          className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors ${
            availableShares === 0 
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
              : 'btn-primary'
          }`}
          disabled={availableShares === 0}
        >
          {availableShares === 0 ? 'Sold Out' : 'Buy Shares'}
        </button>
      </div>
    </div>
  )
}
