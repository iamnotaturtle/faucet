# ERC20 Token & Faucet Deployer

A web application for quickly deploying ERC20 tokens and ERC20 token faucets on supported testnets. Connect your wallet, configure token parameters, and deploy in minutes.

## How It Works

1. **Connect Wallet**: Connect your Web3 wallet (MetaMask, WalletConnect, etc.)
2. **Configure Token**: Set token name, symbol, and decimals
3. **Deploy**: Choose to deploy a standard ERC20 token or enable faucet functionality
4. **Interact**: Once deployed, mint tokens, transfer them, check balances, or claim from the faucet

The faucet contract includes a "Money Pweese" function that allows anyone to claim 5 tokens per request.

## Supported Networks

The application supports multiple testnets including Sepolia, Goerli, Mumbai, Base Sepolia, and Arbitrum Sepolia.

## Try It Out

Live demo: https://iamnotaturtle.github.io/faucet/

## Development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```
