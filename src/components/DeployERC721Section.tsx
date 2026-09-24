import { useState, useEffect } from 'react'
import { useAccount, useWaitForTransactionReceipt, usePublicClient, useWalletClient, useChainId } from 'wagmi'
import { encodeAbiParameters, parseAbiParameters } from 'viem'
import { compileERC721Contract } from '../lib/contract'
import ChainSelector from './ChainSelector'
import WalletButton from './WalletButton'

interface DeployERC721SectionProps {
  onDeploy: (address: string) => void
}

export default function DeployERC721Section({ onDeploy }: DeployERC721SectionProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [hash, setHash] = useState<`0x${string}` | undefined>()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const [name, setName] = useState('MyNFT')
  const [symbol, setSymbol] = useState('MNFT')
  const [baseURI, setBaseURI] = useState('')
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
      // Compile ERC721 contract
      const { bytecode } = await compileERC721Contract()

      setIsCompiling(false)
      setIsPending(true)

      // Encode constructor parameters (name, symbol, baseURI)
      const constructorAbi = parseAbiParameters('string,string,string')
      const encodedArgs = encodeAbiParameters(constructorAbi, [name, symbol, baseURI])
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
        Deploy ERC721 Contract (NFT)
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
          Collection Name:
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

      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          marginBottom: '10px',
          fontWeight: 600,
          color: '#2d3748',
          fontSize: '14px',
          letterSpacing: '0.01em'
        }}>
          Base URI:
        </label>
        <input
          type="text"
          value={baseURI}
          onChange={(e) => setBaseURI(e.target.value)}
          placeholder="https://example.com/metadata/ or ipfs://..."
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '15px',
            backgroundColor: '#f8f9fa',
          }}
        />
        <p style={{
          marginTop: '8px',
          fontSize: '13px',
          color: '#718096',
          lineHeight: '1.5'
        }}>
          The base URI for token metadata. Token URI will be: baseURI + tokenId
        </p>
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
            background: isPending || isConfirming || isCompiling ? '#cbd5e0' : '#9f7aea',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: isPending || isConfirming || isCompiling ? 'not-allowed' : 'pointer',
            boxShadow: isPending || isConfirming || isCompiling ? 'none' : '0 4px 12px rgba(159, 122, 234, 0.3)',
          }}
        >
        {isCompiling
          ? 'Compiling...'
          : isPending
          ? 'Confirm in Wallet...'
          : isConfirming
          ? 'Deploying...'
          : 'Deploy NFT Contract'}
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
          <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '16px' }}>NFT Contract deployed successfully!</div>
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
