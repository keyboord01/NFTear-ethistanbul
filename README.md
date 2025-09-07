# NFTear - Fractional NFT Marketplace

A decentralized marketplace for fractional NFT ownership, built with Next.js and deployed on Ethereum Sepolia testnet.

## Features

- 🎨 Fractionalize NFTs into tradeable shares
- 💰 Buy and sell NFT fractions
- 🔗 Maintain all NFT utilities (airdrops, yields, exclusive access)
- 🌐 Decentralized registry system
- 📱 Modern, responsive UI

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask or compatible Web3 wallet

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nftshare
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your values:
```env
NEXT_PUBLIC_REGISTRY_ADDRESS=0x003a6F78dd9EDf8721874e07C68F12e95b5458CD
NEXT_PUBLIC_MORALIS_API_KEY=your_moralis_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_REGISTRY_ADDRESS` | Smart contract registry address on Sepolia | Yes |
| `NEXT_PUBLIC_MORALIS_API_KEY` | Moralis API key for NFT data | Optional |

## Deployment on Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<your-repo-url>)

### Manual Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_REGISTRY_ADDRESS`
   - `NEXT_PUBLIC_MORALIS_API_KEY`
4. Deploy

### Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the required variables:
   - `NEXT_PUBLIC_REGISTRY_ADDRESS`: `0x003a6F78dd9EDf8721874e07C68F12e95b5458CD`
   - `NEXT_PUBLIC_MORALIS_API_KEY`: Your Moralis API key

## Troubleshooting

### 404 Error on Vercel

If you're getting a 404 error on Vercel deployment:

1. **Check Environment Variables**: Ensure all required environment variables are set in Vercel dashboard
2. **Check Build Logs**: Look for any build errors in Vercel deployment logs
3. **Verify Network**: Make sure you're connected to Sepolia testnet
4. **Registry Contract**: Verify the registry contract address is correct

### Common Issues

- **"Registry address not configured"**: Set `NEXT_PUBLIC_REGISTRY_ADDRESS` environment variable
- **NFTs not loading**: Check Moralis API key and network connection
- **Web3 connection issues**: Ensure MetaMask is connected to Sepolia testnet

## Architecture

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Web3**: Wagmi + Viem
- **NFT Data**: Moralis API
- **Network**: Ethereum Sepolia Testnet
- **Deployment**: Vercel

## Smart Contracts

- **Registry Contract**: `0x003a6F78dd9EDf8721874e07C68F12e95b5458CD`
- **Network**: Sepolia Testnet
- **Chain ID**: 11155111
