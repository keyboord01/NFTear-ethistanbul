'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletConnect } from './wallet-connect'
import Image from 'next/image'

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <div className="flex items-center justify-center space-x-3">
               <Image src="/NFTear.png" alt="NFTShare" width={100} height={100} className="object-contain" />
              </div>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:items-center sm:space-x-2">
              <Link
                href="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                  pathname === '/' 
                    ? 'text-white bg-[#186F47]' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
                }`}
              >
                Marketplace
              </Link>
              <Link
                href="/my-nfts"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                  pathname === '/my-nfts' 
                    ? 'text-white bg-[#186F47]' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
                }`}
              >
                My NFTs
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
         
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  )
}
