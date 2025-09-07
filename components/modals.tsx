'use client'

import { useState } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title: string
}

function Modal({ isOpen, onClose, children, title }: ModalProps) {
  if (!isOpen) return null

  if (typeof document !== 'undefined') {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="card max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ExploreNFTsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Explore NFTs">
      <div className="space-y-6">
        <p className="text-gray-300">
          Discover fractional NFTs where you can buy shares and participate in the ecosystem.
        </p>
        
        <div className="space-y-4">
          <div className="card p-4">
            <h4 className="text-lg font-semibold text-white mb-2">🎨 Art Collections</h4>
            <p className="text-gray-400 text-sm">Premium digital art pieces available for fractional ownership</p>
          </div>
          
          <div className="card p-4">
            <h4 className="text-lg font-semibold text-white mb-2">🎮 Gaming Assets</h4>
            <p className="text-gray-400 text-sm">In-game items and characters with utility benefits</p>
          </div>
          
          <div className="card p-4">
            <h4 className="text-lg font-semibold text-white mb-2">🎵 Music NFTs</h4>
            <p className="text-gray-400 text-sm">Music tracks and albums with royalty sharing</p>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="btn-primary w-full py-3 rounded-lg font-medium"
        >
          Start Exploring
        </button>
      </div>
    </Modal>
  )
}

export function LearnMoreModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How It Works">
      <div className="space-y-6">
        <p className="text-gray-300">
          NFTear uses decentralized multisig wallets with threshold cryptography to enable trustless fractional NFT ownership.
        </p>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="size-8 rounded-full bg-[#238056] flex items-center justify-center text-white font-bold text-sm">1</div>
            <div>
              <h4 className="text-white font-semibold mb-1">List Your NFT</h4>
              <p className="text-gray-400 text-sm">Transfer your NFT to our decentralized manager contract</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="size-8 rounded-full bg-[#238056] flex items-center justify-center text-white font-bold text-sm">2</div>
            <div>
              <h4 className="text-white font-semibold mb-1">Set Fractions</h4>
              <p className="text-gray-400 text-sm">Choose how many shares to sell and at what price</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="size-8 rounded-full bg-[#238056] flex items-center justify-center text-white font-bold text-sm">3</div>
            <div>
              <h4 className="text-white font-semibold mb-1">Share Utilities</h4>
              <p className="text-gray-400 text-sm">All airdrops, yields, and benefits are automatically distributed</p>
            </div>
          </div>
        </div>
        
        <div className="bg-zinc-950/40 p-4 rounded-lg">
          <h4 className="text-white font-semibold mb-2">🔒 Security</h4>
          <p className="text-gray-300 text-sm">
            Uses BLS signatures and slashing mechanisms to prevent malicious behavior. 
            66% consensus required for any actions.
          </p>
        </div>
        
        <button 
          onClick={onClose}
          className="btn-primary w-full py-3 rounded-lg font-medium"
        >
          Got It
        </button>
      </div>
    </Modal>
  )
}

export function BuySharesModal({ 
  isOpen, 
  onClose, 
  nft 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  nft: { name: string; image: string; pricePerShare: string; availableShares: number; id: string } | null 
}) {
  const [sharesToBuy, setSharesToBuy] = useState(1)

  if (!nft) return null

  const totalCost = (parseFloat(nft.pricePerShare) * sharesToBuy).toFixed(4)

  const handleBuy = () => {
    alert(`Purchase initiated: ${sharesToBuy} shares for ${totalCost} ETH`)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buy NFT Shares">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <img
            src={nft.image}
            alt={nft.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div>
            <h3 className="text-lg font-semibold text-white">{nft.name}</h3>
            <p className="text-gray-400 text-sm">{nft.pricePerShare} ETH per share</p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Number of Shares
          </label>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSharesToBuy(Math.max(1, sharesToBuy - 1))}
              className="btn-secondary px-3 py-2 rounded-lg"
            >
              -
            </button>
            <span className="text-xl font-semibold text-white min-w-[3rem] text-center">
              {sharesToBuy}
            </span>
            <button
              onClick={() => setSharesToBuy(Math.min(nft.availableShares, sharesToBuy + 1))}
              className="btn-secondary px-3 py-2 rounded-lg"
            >
              +
            </button>
          </div>
          <input
            type="range"
            min="1"
            max={nft.availableShares}
            value={sharesToBuy}
            onChange={(e) => setSharesToBuy(parseInt(e.target.value))}
            className="w-full mt-3 accent-[#186F47]"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1 share</span>
            <span>{nft.availableShares} shares available</span>
          </div>
        </div>

        <div className="bg-zinc-950/40 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Shares:</span>
            <span className="text-white font-semibold">{sharesToBuy}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Price per share:</span>
            <span className="text-white font-semibold">{nft.pricePerShare} ETH</span>
          </div>
          <div className="border-t border-gray-700 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-white font-semibold">Total Cost:</span>
              <span className="text-xl font-bold text-white">{totalCost} ETH</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1 py-3 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleBuy}
            className="btn-primary flex-1 py-3 rounded-lg font-medium"
          >
            Buy Shares
          </button>
        </div>
      </div>
    </Modal>
  )
}
