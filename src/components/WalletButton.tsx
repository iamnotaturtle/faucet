import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi'
import { injected } from 'wagmi/connectors'

export default function WalletButton() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  const getEtherscanAddressUrl = (address: string) => {
    const chainNames: Record<number, string> = {
      11155111: 'sepolia', // Sepolia
      5: 'goerli', // Goerli
      80001: 'mumbai', // Mumbai
      84532: 'sepolia', // Base Sepolia
      421614: 'sepolia', // Arbitrum Sepolia
    }
    const chainName = chainNames[chainId] || 'sepolia'
    return `https://${chainName}.etherscan.io/address/${address}`
  }

  if (isConnected && address) {
    return (
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#333', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}>
            Connected wallet:
          </div>
          <a
            href={getEtherscanAddressUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#667eea',
              textDecoration: 'underline',
              fontSize: '14px',
              wordBreak: 'break-all',
              display: 'block',
            }}
          >
            {address}
          </a>
        </div>
        <button
          onClick={() => disconnect()}
          style={{
            padding: '12px 24px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          Disconnect wallet
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      style={{
        padding: '12px 24px',
        background: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: '20px',
      }}
    >
      Connect Wallet
    </button>
  )
}

