import { useState, useEffect } from 'react'
import { useAccount, useWaitForTransactionReceipt, usePublicClient, useWalletClient, useChainId } from 'wagmi'
import { encodeAbiParameters, parseAbiParameters } from 'viem'
import { compileContract } from '../lib/contract'
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
  const [totalSupply, setTotalSupply] = useState('1000000')
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
      // Compile contract
      const { bytecode } = await compileContract()

      // Calculate total supply with decimals
      const totalSupplyBigInt = BigInt(totalSupply) * BigInt(10 ** decimals)

      setIsCompiling(false)
      setIsPending(true)

      // Encode constructor parameters and combine with bytecode
      const constructorAbi = parseAbiParameters('string,string,uint8,uint256')
      const encodedArgs = encodeAbiParameters(constructorAbi, [name, symbol, decimals, totalSupplyBigInt])
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
        padding: '30px',
        borderRadius: '12px',
        marginBottom: '30px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Deploy ERC20 Contract</h2>
      
      <WalletButton />
      <ChainSelector />

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
          Token Name:
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '16px',
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
          Symbol:
        </label>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '16px',
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
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
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '16px',
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
          Total Supply:
        </label>
        <input
          type="text"
          value={totalSupply}
          onChange={(e) => setTotalSupply(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '16px',
          }}
        />
      </div>

      {error && (
        <div style={{ padding: '15px', background: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <button
          onClick={handleDeploy}
          disabled={isPending || isConfirming || isCompiling || !isConnected}
          style={{
            padding: '15px',
            background: isPending || isConfirming || isCompiling ? '#ccc' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: isPending || isConfirming || isCompiling ? 'not-allowed' : 'pointer',
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
        <div style={{ marginTop: '20px', padding: '15px', background: '#d4edda', color: '#155724', borderRadius: '8px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Contract deployed successfully!</div>
          <div style={{ marginTop: '10px' }}>
            <strong>Address:</strong>{' '}
            <a
              href={getEtherscanAddressUrl(deployedAddress)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#155724', textDecoration: 'underline', wordBreak: 'break-all' }}
            >
              {deployedAddress}
            </a>
          </div>
          {hash && (
            <div style={{ marginTop: '5px', fontSize: '14px' }}>
              <strong>Transaction:</strong>{' '}
              <a
                href={getEtherscanTxUrl(hash)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#155724', textDecoration: 'underline', wordBreak: 'break-all' }}
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

