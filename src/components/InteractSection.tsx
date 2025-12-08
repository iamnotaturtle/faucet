import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { getContractABI } from '../lib/contract'
import WalletButton from './WalletButton'

interface InteractSectionProps {
  initialAddress: string
}

type Action = 'mint' | 'transfer' | 'balance' | null

export default function InteractSection({ initialAddress }: InteractSectionProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const [contractAddress, setContractAddress] = useState(initialAddress)
  const [action, setAction] = useState<Action>(null)
  const [mintTo, setMintTo] = useState('')
  const [mintAmount, setMintAmount] = useState('')
  const [transferTo, setTransferTo] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [balanceAddress, setBalanceAddress] = useState('')
  const [balance, setBalance] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const abi = getContractABI()

  // Read contract info
  const isContractAddressValid = !!contractAddress && contractAddress.length === 42 && contractAddress.startsWith('0x')
  
  const { data: name } = useReadContract({
    address: isContractAddressValid ? (contractAddress as `0x${string}`) : undefined,
    abi,
    functionName: 'name',
    query: { enabled: isContractAddressValid },
  })

  const { data: symbol } = useReadContract({
    address: isContractAddressValid ? (contractAddress as `0x${string}`) : undefined,
    abi,
    functionName: 'symbol',
    query: { enabled: isContractAddressValid },
  })

  const { data: decimals } = useReadContract({
    address: isContractAddressValid ? (contractAddress as `0x${string}`) : undefined,
    abi,
    functionName: 'decimals',
    query: { enabled: isContractAddressValid },
  })

  const { data: totalSupply, error: totalSupplyError, isLoading: isLoadingTotalSupply } = useReadContract({
    address: isContractAddressValid ? (contractAddress as `0x${string}`) : undefined,
    abi,
    functionName: 'totalSupply',
    query: { enabled: isContractAddressValid },
  })

  // Update contract address when initialAddress changes
  useEffect(() => {
    if (initialAddress) {
      setContractAddress(initialAddress)
    }
  }, [initialAddress])

  const getEtherscanUrl = (address: string) => {
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

  const handleMint = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet')
      return
    }
    if (!mintTo || !mintAmount) {
      setError('Please fill in all fields')
      return
    }
    if (!contractAddress || contractAddress.length !== 42) {
      setError('Invalid contract address')
      return
    }

    setError(null)
    try {
      const decimalsValue = decimals ? Number(decimals) : 18
      const amount = parseUnits(mintAmount, decimalsValue)
      
      writeContract({
        address: contractAddress as `0x${string}`,
        abi,
        functionName: 'mint',
        args: [mintTo as `0x${string}`, amount],
      })
    } catch (err: any) {
      setError(err.message || 'Failed to mint tokens')
      console.error(err)
    }
  }

  const handleTransfer = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet')
      return
    }
    if (!transferTo || !transferAmount) {
      setError('Please fill in all fields')
      return
    }
    if (!contractAddress || contractAddress.length !== 42) {
      setError('Invalid contract address')
      return
    }

    setError(null)
    try {
      const decimalsValue = decimals ? Number(decimals) : 18
      const amount = parseUnits(transferAmount, decimalsValue)
      
      writeContract({
        address: contractAddress as `0x${string}`,
        abi,
        functionName: 'transfer',
        args: [transferTo as `0x${string}`, amount],
      })
    } catch (err: any) {
      setError(err.message || 'Failed to transfer tokens')
      console.error(err)
    }
  }

  const handleCheckBalance = async () => {
    if (!balanceAddress) {
      setError('Please enter an address')
      return
    }
    if (!contractAddress || contractAddress.length !== 42) {
      setError('Invalid contract address')
      return
    }

    setError(null)
    try {
      if (publicClient) {
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi,
          functionName: 'balanceOf',
          args: [balanceAddress as `0x${string}`],
        })
        const decimalsValue = decimals ? Number(decimals) : 18
        setBalance(formatUnits(result as unknown as bigint, decimalsValue))
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check balance')
      console.error(err)
    }
  }

  const resetAction = () => {
    setAction(null)
    setMintTo('')
    setMintAmount('')
    setTransferTo('')
    setTransferAmount('')
    setBalanceAddress('')
    setBalance(null)
    setError(null)
  }

  return (
    <div
      style={{
        background: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Interact with Contract</h2>

      <WalletButton />

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
          Contract Address:
        </label>
        <input
          type="text"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="0x..."
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '16px',
          }}
        />
      </div>

      {contractAddress && contractAddress.length === 42 && (
        <div
          style={{
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ marginBottom: '15px', color: '#333' }}>Contract Information</h3>
          <div style={{ marginBottom: '10px' }}>
            <strong>Name:</strong> {name || 'Loading...'}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Symbol:</strong> {symbol || 'Loading...'}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Decimals:</strong> {decimals?.toString() || 'Loading...'}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Total Supply:</strong>{' '}
            {totalSupplyError ? (
              <span style={{ color: 'red' }}>Error: {totalSupplyError.message}</span>
            ) : isLoadingTotalSupply ? (
              'Loading...'
            ) : totalSupply !== undefined && totalSupply !== null && decimals !== undefined ? (
              formatUnits(totalSupply as unknown as bigint, Number(decimals))
            ) : (
              'Loading...'
            )}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Address:</strong>{' '}
            <a
              href={getEtherscanUrl(contractAddress)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#667eea', textDecoration: 'none' }}
            >
              {contractAddress}
            </a>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '15px',
            background: '#f8d7da',
            color: '#721c24',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {isSuccess && hash && (
        <div
          style={{
            padding: '15px',
            background: '#d4edda',
            color: '#155724',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <strong>Transaction successful!</strong>{' '}
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

      {!action && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setAction('mint')}
            style={{
              padding: '15px 30px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Mint Tokens
          </button>
          <button
            onClick={() => setAction('transfer')}
            style={{
              padding: '15px 30px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Transfer Tokens
          </button>
          <button
            onClick={() => setAction('balance')}
            style={{
              padding: '15px 30px',
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Check Balance
          </button>
        </div>
      )}

      {action === 'mint' && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>Mint Tokens</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Recipient Address:
            </label>
            <input
              type="text"
              value={mintTo}
              onChange={(e) => setMintTo(e.target.value)}
              placeholder="0x..."
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
              Amount:
            </label>
            <input
              type="text"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              placeholder="1000"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                fontSize: '16px',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleMint}
              disabled={isPending || isConfirming || !isConnected}
              style={{
                padding: '12px 24px',
                background: isPending || isConfirming ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Minting...' : 'Mint'}
            </button>
            <button
              onClick={resetAction}
              style={{
                padding: '12px 24px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {action === 'transfer' && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>Transfer Tokens</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Recipient Address:
            </label>
            <input
              type="text"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              placeholder="0x..."
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
              Amount:
            </label>
            <input
              type="text"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="1000"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                fontSize: '16px',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleTransfer}
              disabled={isPending || isConfirming || !isConnected}
              style={{
                padding: '12px 24px',
                background: isPending || isConfirming ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Transferring...' : 'Transfer'}
            </button>
            <button
              onClick={resetAction}
              style={{
                padding: '12px 24px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {action === 'balance' && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>Check Balance</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Address:
            </label>
            <input
              type="text"
              value={balanceAddress}
              onChange={(e) => setBalanceAddress(e.target.value)}
              placeholder="0x..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                fontSize: '16px',
              }}
            />
          </div>
          {balance !== null && (
            <div
              style={{
                padding: '15px',
                background: '#d1ecf1',
                color: '#0c5460',
                borderRadius: '8px',
                marginBottom: '15px',
              }}
            >
              Balance: {balance} {symbol || ''}
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCheckBalance}
              style={{
                padding: '12px 24px',
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Check Balance
            </button>
            <button
              onClick={resetAction}
              style={{
                padding: '12px 24px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

