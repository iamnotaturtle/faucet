import { createConfig, http } from 'wagmi'
import { injected, metaMask } from 'wagmi/connectors'
import { supportedChains } from './chains'

export const config = createConfig({
  chains: supportedChains as [typeof supportedChains[0], ...typeof supportedChains[number][]],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [supportedChains[0].id]: http(),
    [supportedChains[1].id]: http(),
    [supportedChains[2].id]: http(),
    [supportedChains[3].id]: http(),
    [supportedChains[4].id]: http(),
  } as Record<typeof supportedChains[number]['id'], ReturnType<typeof http>>,
})

