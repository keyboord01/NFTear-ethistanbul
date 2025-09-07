'use client'

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-black/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-black font-bold text-lg">N</span>
            </div>
            <div>
              <div className="text-white font-semibold">NFTear</div>
              <div className="text-gray-400 text-sm">Fractional NFT Marketplace</div>
            </div>
          </div>

          <div className="text-gray-400 text-sm">
            © {new Date().getFullYear()} NFTear — All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}


