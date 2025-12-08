import { supportedChains } from '../lib/chains'
import { useChainId, useSwitchChain } from 'wagmi'

export default function ChainSelector() {
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '10px', 
        fontWeight: 600, 
        color: '#2d3748',
        fontSize: '14px',
        letterSpacing: '0.01em'
      }}>
        Select Chain:
      </label>
      <select
        value={chainId}
        onChange={(e) => switchChain({ chainId: Number(e.target.value) })}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          fontSize: '15px',
          backgroundColor: '#f8f9fa',
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

