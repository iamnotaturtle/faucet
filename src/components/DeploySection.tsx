import { useState, useEffect } from 'react'
import { useAccount, useWaitForTransactionReceipt, usePublicClient, useWalletClient, useChainId } from 'wagmi'
import { encodeAbiParameters, parseAbiParameters } from 'viem'
import { compileContract, compileFaucetContract } from '../lib/contract'
import ChainSelector from './ChainSelector'
import WalletButton from './WalletButton'

interface DeploySectionProps {
  onDeploy: (address: string) => void
}

export default function DeploySection({ onDeploy }: DeploySectionProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [hash, setHash] = useState<`0x${string}` | undefined>()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const [name, setName] = useState('MyToken')
  const [symbol, setSymbol] = useState('MTK')
  const [decimals, setDecimals] = useState(18)
  const [isFaucet, setIsFaucet] = useState(false)
  const [isCompiling, setIsCompiling] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null)

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

  const getEtherscanTxUrl = (txHash: string) => {
    const chainNames: Record<number, string> = {
      11155111: 'sepolia', // Sepolia
      5: 'goerli', // Goerli
      80001: 'mumbai', // Mumbai
      84532: 'sepolia', // Base Sepolia
      421614: 'sepolia', // Arbitrum Sepolia
    }
    const chainName = chainNames[chainId] || 'sepolia'
    return `https://${chainName}.etherscan.io/tx/${txHash}`
  }

  // Extract contract address from transaction receipt
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

    setError(null)
    setIsCompiling(true)

    try {
      // Compile contract (regular or faucet based on checkbox)
      const { bytecode } = isFaucet 
        ? await compileFaucetContract()
        : await compileContract()

      setIsCompiling(false)
      setIsPending(true)

      // Encode constructor parameters and combine with bytecode
      const constructorAbi = parseAbiParameters('string,string,uint8')
      const encodedArgs = encodeAbiParameters(constructorAbi, [name, symbol, decimals])
      const deploymentBytecode = `${bytecode}${encodedArgs.slice(2)}` as `0x${string}`

      // Deploy contract by sending transaction with bytecode
      const deployHash = await walletClient.sendTransaction({
        data: deploymentBytecode,
      })

      setHash(deployHash)
      setIsPending(false)
    } catch (err: any) {
      setError(err.message || 'Failed to deploy contract')
      console.error(err)
      setIsCompiling(false)
      setIsPending(false)
    }
  }

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
      <h2 style={{ 
        marginBottom: '30px', 
        color: '#1a1a1a',
        fontSize: '1.75rem',
        fontWeight: 600,
        letterSpacing: '-0.01em'
      }}>
        Deploy ERC20 Contract
      </h2>
      
      <WalletButton />
      <ChainSelector />

      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '10px', 
          fontWeight: 600, 
          color: '#2d3748',
          fontSize: '14px',
          letterSpacing: '0.01em'
        }}>
          Token Name:
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '15px',
            backgroundColor: '#f8f9fa',
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '10px', 
          fontWeight: 600, 
          color: '#2d3748',
          fontSize: '14px',
          letterSpacing: '0.01em'
        }}>
          Symbol:
        </label>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '15px',
            backgroundColor: '#f8f9fa',
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '10px', 
          fontWeight: 600, 
          color: '#2d3748',
          fontSize: '14px',
          letterSpacing: '0.01em'
        }}>
          Decimals:
        </label>
        <input
          type="number"
          value={decimals}
          onChange={(e) => setDecimals(Number(e.target.value))}
          min="0"
          max="18"
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '15px',
            backgroundColor: '#f8f9fa',
          }}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center',
          cursor: 'pointer',
          gap: '10px'
        }}>
          <input
            type="checkbox"
            checked={isFaucet}
            onChange={(e) => setIsFaucet(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer',
            }}
          />
          <span style={{ 
            fontWeight: 600, 
            color: '#2d3748',
            fontSize: '14px',
            letterSpacing: '0.01em'
          }}>
            Enable as a faucet
          </span>
        </label>
      </div>

      {error && (
        <div style={{ 
          padding: '16px', 
          background: '#fee', 
          color: '#c53030', 
          borderRadius: '8px', 
          marginBottom: '24px',
          border: '1px solid #feb2b2',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <button
          onClick={handleDeploy}
          disabled={isPending || isConfirming || isCompiling || !isConnected}
          style={{
            padding: '14px 32px',
            background: isPending || isConfirming || isCompiling ? '#cbd5e0' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: isPending || isConfirming || isCompiling ? 'not-allowed' : 'pointer',
            boxShadow: isPending || isConfirming || isCompiling ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)',
          }}
        >
        {isCompiling
          ? 'Compiling...'
          : isPending
          ? 'Confirm in Wallet...'
          : isConfirming
          ? 'Deploying...'
          : 'Deploy Contract'}
        </button>
      </div>

      {isSuccess && deployedAddress && (
        <div style={{ 
          marginTop: '24px', 
          padding: '20px', 
          background: '#f0fdf4', 
          color: '#166534', 
          borderRadius: '10px',
          border: '1px solid #86efac'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '16px' }}>Contract deployed successfully!</div>
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

