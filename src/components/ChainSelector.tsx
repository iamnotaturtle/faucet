import { supportedChains } from '../lib/chains'
import { useChainId, useSwitchChain } from 'wagmi'

export default function ChainSelector() {
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', color: 'white', fontWeight: 'bold' }}>
        Select Chain:
      </label>
      <select
        value={chainId}
        onChange={(e) => switchChain({ chainId: Number(e.target.value) })}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          fontSize: '16px',
        }}
      >
        {supportedChains.map((chain) => (
          <option key={chain.id} value={chain.id}>
            {chain.name}
          </option>
        ))}
      </select>
    </div>
  )
}

