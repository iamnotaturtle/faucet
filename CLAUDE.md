# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Web3 React application for deploying ERC20 tokens and ERC20 faucet contracts on Ethereum testnets. Users connect their wallet, configure token parameters, deploy contracts, and interact with them (mint, transfer, balance check, faucet claims).

**Live:** https://iamnotaturtle.github.io/faucet/

**Supported Networks:** Sepolia, Goerli, Polygon Mumbai, Base Sepolia, Arbitrum Sepolia

## Commands

```bash
npm install              # Install dependencies
npm run dev              # Start development server (Vite)
npm run build            # Compile contracts + TypeScript + Vite build
npm run preview          # Preview production build locally
npm run compile-contract # Compile Solidity contracts only
npm run verify-contract  # Verify contracts on Etherscan
npm run deploy           # Deploy to GitHub Pages
```

**Note:** No test or lint commands configured.

## Architecture

**Tech Stack:** React 18 + TypeScript + Vite + wagmi/viem (Web3) + solc (Solidity compiler)

### Key Directories

- `src/components/` - React UI components (DeploySection, InteractSection, WalletButton, ChainSelector)
- `src/lib/` - Web3 configuration and contract utilities
- `src/contracts/` - Solidity source files (ERC20.sol, ERC20Faucet.sol)
- `scripts/` - Build scripts for contract compilation and verification

### Smart Contracts

1. **ERC20.sol** - Standard ERC20 with owner minting
2. **ERC20Faucet.sol** - ERC20 with `money_pweese()` function allowing anyone to claim 5 tokens

### Contract Compilation Flow

- **Build time:** `scripts/compile-contract.js` uses solc to generate `src/lib/compiled-contract.json` and `compiled-faucet-contract.json`
- **Runtime fallback:** If pre-compiled files unavailable, compiles via Remix compiler API
- Build step runs `compile-contract` before Vite build

### Deployment Flow

1. User fills token parameters in DeploySection
2. Contract bytecode + encoded constructor args sent via `walletClient.sendTransaction()`
3. Contract address extracted from transaction receipt
4. Address passed to InteractSection for interactions

### Wagmi Integration

- Configuration in `src/lib/wagmi.ts`
- Chain definitions in `src/lib/chains.ts`
- Uses wagmi hooks: `useReadContract`, `useWriteContract`, `useWaitForTransactionReceipt`

## Important Notes

- Vite base path is `/faucet/` for GitHub Pages subdirectory deployment
- Pre-compiled contract JSONs are copied to `public/` for production
- TypeScript strict mode enabled
- Faucet detection works by simulating `money_pweese` function call
