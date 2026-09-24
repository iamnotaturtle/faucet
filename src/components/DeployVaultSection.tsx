import { useState, useEffect } from 'react'
import { useAccount, useWaitForTransactionReceipt, usePublicClient, useWalletClient, useChainId } from 'wagmi'
import { encodeAbiParameters, isAddress, parseAbiParameters } from 'viem'
import { compileERC4626Vault, compileERC7540Vault } from '../lib/contract'
import ChainSelector from './ChainSelector'
import WalletButton from './WalletButton'

interface DeployVaultSectionProps {
  onDeploy: (address: string) => void
  asynchronous: boolean
  onAsynchronousChange: (asynchronous: boolean) => void
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '15px',
  backgroundColor: '#f8f9fa',
}

const labelStyle = {
  display: 'block',
  marginBottom: '10px',
  fontWeight: 600,
  color: '#2d3748',
  fontSize: '14px',
  letterSpacing: '0.01em',
}

export default function DeployVaultSection({ onDeploy, asynchronous, onAsynchronousChange }: DeployVaultSectionProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [hash, setHash] = useState<`0x${string}` | undefined>()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const [asset, setAsset] = useState('')
  const [name, setName] = useState('My Vault')
  const [symbol, setSymbol] = useState('vSHARE')
  const [isCompiling, setIsCompiling] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null)

  const chainNames: Record<number, string> = {
    11155111: 'sepolia',
    5: 'goerli',
    80001: 'mumbai',
    84532: 'sepolia',
    421614: 'sepolia',
  }

  const getEtherscanAddressUrl = (contractAddress: string) => {
    const chainName = chainNames[chainId] || 'sepolia'
    return `https://${chainName}.etherscan.io/address/${contractAddress}`
  }

  const getEtherscanTxUrl = (txHash: string) => {
    const chainName = chainNames[chainId] || 'sepolia'
    return `https://${chainName}.etherscan.io/tx/${txHash}`
  }

  useEffect(() => {
    const getContractAddress = async () => {
      if (isSuccess && hash && publicClient) {
        try {
          const receipt = await publicClient.getTransactionReceipt({ hash })
          if (receipt.contractAddress) {
            setDeployedAddress(receipt.contractAddress)
            onDeploy(receipt.contractAddress)
          }
        } catch (err) {
          console.error('Failed to get contract address:', err)
        }
      }
    }
    getContractAddress()
  }, [isSuccess, hash, publicClient, onDeploy])

  const handleDeploy = async () => {
    if (!isConnected || !address || !walletClient) {
      setError('Please connect your wallet')
      return
    }
    if (!isAddress(asset)) {
      setError('Enter a valid ERC20 asset address')
      return
    }
    if (!name.trim() || !symbol.trim()) {
      setError('Enter a share name and symbol')
      return
    }

    setError(null)
    setIsCompiling(true)

    try {
      const { bytecode } = asynchronous ? await compileERC7540Vault() : await compileERC4626Vault()

      setIsCompiling(false)
      setIsPending(true)

      const constructorAbi = parseAbiParameters('address,string,string')
      const encodedArgs = encodeAbiParameters(constructorAbi, [asset, name, symbol])
      const deploymentBytecode = `${bytecode}${encodedArgs.slice(2)}` as `0x${string}`

      const deployHash = await walletClient.sendTransaction({
        data: deploymentBytecode,
      })

      setHash(deployHash)
      setIsPending(false)
    } catch (err: any) {
      setError(err.message || 'Failed to deploy vault')
      console.error(err)
      setIsCompiling(false)
      setIsPending(false)
    }
  }

  const busy = isPending || isConfirming || isCompiling

  return (
    <div
      style={{
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      <h2
        style={{
          marginBottom: '30px',
          color: '#1a1a1a',
          fontSize: '1.75rem',
          fontWeight: 600,
          letterSpacing: '-0.01em',
        }}
      >
        Deploy Vault
      </h2>

      <WalletButton />
      <ChainSelector />

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Asset token address:</label>
        <input
          type="text"
          value={asset}
          onChange={(e) => setAsset(e.target.value.trim())}
          placeholder="0x... ERC20 deployed from the token tab"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Share name:</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Share symbol:</label>
        <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
          <input
            type="checkbox"
            checked={asynchronous}
            onChange={(e) => onAsynchronousChange(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 600, color: '#2d3748', fontSize: '14px', letterSpacing: '0.01em' }}>
            Asynchronous (EIP-7540)
          </span>
        </label>
        <p style={{ marginTop: '8px', marginLeft: '28px', color: '#4a5568', fontSize: '14px', lineHeight: 1.5 }}>
          {asynchronous
            ? 'Deposits and redemptions stay pending until the vault owner fulfills them. Shareholders then claim shares or assets.'
            : 'Deposits and withdrawals settle in one transaction. One share is always worth one asset.'}
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: '16px',
            background: '#fee',
            color: '#c53030',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #feb2b2',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <button
          onClick={handleDeploy}
          disabled={busy || !isConnected}
          style={{
            padding: '14px 32px',
            background: busy ? '#cbd5e0' : '#0f766e',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: busy ? 'not-allowed' : 'pointer',
            boxShadow: busy ? 'none' : '0 4px 12px rgba(15, 118, 110, 0.3)',
          }}
        >
          {isCompiling ? 'Compiling...' : isPending ? 'Confirm in Wallet...' : isConfirming ? 'Deploying...' : 'Deploy Vault'}
        </button>
      </div>

      {isSuccess && deployedAddress && (
        <div
          style={{
            marginTop: '24px',
            padding: '20px',
            background: '#f0fdf4',
            color: '#166534',
            borderRadius: '10px',
            border: '1px solid #86efac',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '16px' }}>Vault deployed successfully!</div>
          <div style={{ marginTop: '12px', fontSize: '14px' }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Address:</strong>
            <a
              href={getEtherscanAddressUrl(deployedAddress)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#16a34a', textDecoration: 'underline', wordBreak: 'break-all', fontSize: '13px' }}
            >
              {deployedAddress}
            </a>
          </div>
          {hash && (
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>Transaction:</strong>
              <a
                href={getEtherscanTxUrl(hash)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#16a34a', textDecoration: 'underline', wordBreak: 'break-all', fontSize: '13px' }}
              >
                {hash}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
