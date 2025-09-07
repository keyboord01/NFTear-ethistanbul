'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { metaMask } from 'wagmi/connectors'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (isConnected) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-lg"
        >
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-sm text-green-400 font-mono">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <svg className={`w-4 h-4 text-green-400 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-black border border-gray-800 rounded-lg shadow-lg z-50">
            <button
              onClick={() => { setOpen(false); router.push('/my-nfts') }}
              className="w-full text-left px-4 py-3 text-sm text-white hover:bg-gray-700/40 rounded-t-lg cursor-pointer"
            >
              My NFTs
            </button>
            {/* <div className="px-4 py-2 border-t border-gray-800 text-xs text-gray-400 font-mono">
            {address?.slice(0, 6)}...{address?.slice(-4)}
            </div> */}
            <button
              onClick={() => { setOpen(false); disconnect() }}
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-b-lg"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => connect({ connector: metaMask() })}
      className="text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border border-gray-700 hover:border-gray-600"
    >
      Connect Wallet
    </button>
  )
}
                  