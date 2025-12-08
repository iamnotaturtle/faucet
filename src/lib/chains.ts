import { sepolia, goerli, polygonMumbai, baseSepolia, arbitrumSepolia } from 'viem/chains'

export const supportedChains = [
  sepolia,
  goerli,
  polygonMumbai,
  baseSepolia,
  arbitrumSepolia,
]

export type SupportedChain = typeof supportedChains[number]

