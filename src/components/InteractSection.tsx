import { useState, useEffect, useMemo } from 'react'
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
  const [hasMoneyPweese, setHasMoneyPweese] = useState<boolean | null>(null)

  const abi = getContractABI()
  
  // Extended ABI that includes money_pweese function
  const extendedAbi = useMemo(() => [
    ...getContractABI(),
    {
      inputs: [],
      name: 'money_pweese',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ], [])

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

  // Check if contract supports money_pweese function
  useEffect(() => {
    const checkMoneyPweese = async () => {
      if (!isContractAddressValid || !publicClient || !address) {
        setHasMoneyPweese(null)
        return
      }

      try {
        // Try to simulate a call to money_pweese to see if it exists
        await publicClient.simulateContract({
          address: contractAddress as `0x${string}`,
          abi: extendedAbi,
          functionName: 'money_pweese',
          account: address as `0x${string}`,
        })
        setHasMoneyPweese(true)
      } catch (err: any) {
        // If the function doesn't exist, the error will indicate that
        // Check for common "function not found" errors
        const errorMessage = err?.message?.toLowerCase() || ''
        const errorCode = err?.code || ''
        const errorName = err?.name || ''
        
        // Check for function selector errors or invalid function errors
        if (
          errorMessage.includes('function') && 
          (errorMessage.includes('not found') || 
           errorMessage.includes('does not exist') ||
           errorMessage.includes('invalid function') ||
           errorMessage.includes('function selector'))
        ) {
          setHasMoneyPweese(false)
        } else if (
          errorCode === 'UNPREDICTABLE_GAS_LIMIT' ||
          errorName === 'ContractFunctionExecutionError'
        ) {
          // These errors usually mean the function exists but failed for other reasons
          setHasMoneyPweese(true)
        } else {
          // For other errors, assume function exists (could be insufficient balance, etc.)
          setHasMoneyPweese(true)
        }
      }
    }

    checkMoneyPweese()
  }, [contractAddress, isContractAddressValid, publicClient, address, extendedAbi])

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

  const handleMoneyPweese = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet')
      return
    }
    if (!contractAddress || contractAddress.length !== 42) {
      setError('Invalid contract address')
      return
    }

    setError(null)
    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: extendedAbi,
        functionName: 'money_pweese',
      })
    } catch (err: any) {
      setError(err.message || 'Failed to call money_pweese')
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
        padding: '40px',
        borderRadius: '16px',
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
        Interact with Contract
      </h2>

      <WalletButton />

      <div style={{ marginBottom: '24px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '10px', 
          fontWeight: 600, 
          color: '#2d3748',
          fontSize: '14px',
          letterSpacing: '0.01em'
        }}>
          Contract Address:
        </label>
        <input
          type="text"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="0x..."
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

      {contractAddress && contractAddress.length === 42 && (
        <div
          style={{
            padding: '24px',
            background: '#f8f9fa',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid #e2e8f0',
          }}
        >
          <h3 style={{ 
            marginBottom: '20px', 
            color: '#1a1a1a',
            fontSize: '1.25rem',
            fontWeight: 600
          }}>
            Contract Information
          </h3>
          <div style={{ marginBottom: '12px', fontSize: '14px', color: '#4a5568' }}>
            <strong style={{ color: '#2d3748', display: 'inline-block', minWidth: '120px' }}>Name:</strong> {name || 'Loading...'}
          </div>
          <div style={{ marginBottom: '12px', fontSize: '14px', color: '#4a5568' }}>
            <strong style={{ color: '#2d3748', display: 'inline-block', minWidth: '120px' }}>Symbol:</strong> {symbol || 'Loading...'}
          </div>
          <div style={{ marginBottom: '12px', fontSize: '14px', color: '#4a5568' }}>
            <strong style={{ color: '#2d3748', display: 'inline-block', minWidth: '120px' }}>Decimals:</strong> {decimals?.toString() || 'Loading...'}
          </div>
          <div style={{ marginBottom: '12px', fontSize: '14px', color: '#4a5568' }}>
            <strong style={{ color: '#2d3748', display: 'inline-block', minWidth: '120px' }}>Total Supply:</strong>{' '}
            {totalSupplyError ? (
              <span style={{ color: '#e53e3e' }}>Error: {totalSupplyError.message}</span>
            ) : isLoadingTotalSupply ? (
              'Loading...'
            ) : totalSupply !== undefined && totalSupply !== null && decimals !== undefined ? (
              formatUnits(totalSupply as unknown as bigint, Number(decimals))
            ) : (
              'Loading...'
            )}
          </div>
          <div style={{ marginBottom: '12px', fontSize: '14px', color: '#4a5568' }}>
            <strong style={{ color: '#2d3748', display: 'inline-block', minWidth: '120px' }}>Address:</strong>{' '}
            <a
              href={getEtherscanUrl(contractAddress)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#667eea', textDecoration: 'none', wordBreak: 'break-all' }}
            >
              {contractAddress}
            </a>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '16px',
            background: '#fee',
            color: '#c53030',
            borderRadius: '10px',
            marginBottom: '24px',
            border: '1px solid #feb2b2',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {isSuccess && hash && (
        <div
          style={{
            padding: '20px',
            background: '#f0fdf4',
            color: '#166534',
            borderRadius: '10px',
            marginBottom: '24px',
            border: '1px solid #86efac',
          }}
        >
          <strong style={{ display: 'block', marginBottom: '8px', fontSize: '16px' }}>Transaction successful!</strong>
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

      {!action && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => setAction('mint')}
            style={{
              padding: '14px 28px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
            }}
          >
            Mint Tokens
          </button>
          <button
            onClick={() => setAction('transfer')}
            style={{
              padding: '14px 28px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            }}
          >
            Transfer Tokens
          </button>
          <button
            onClick={() => setAction('balance')}
            style={{
              padding: '14px 28px',
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(23, 162, 184, 0.3)',
            }}
          >
            Check Balance
          </button>
          <button
            onClick={handleMoneyPweese}
            disabled={!hasMoneyPweese || isPending || isConfirming || !isConnected}
            style={{
              padding: '14px 28px',
              background: !hasMoneyPweese || isPending || isConfirming ? '#cbd5e0' : '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: !hasMoneyPweese || isPending || isConfirming ? 'not-allowed' : 'pointer',
              boxShadow: !hasMoneyPweese || isPending || isConfirming ? 'none' : '0 4px 12px rgba(245, 158, 11, 0.3)',
              opacity: hasMoneyPweese === false ? 0.5 : 1,
            }}
          >
            Money Pweese
          </button>
        </div>
      )}

      {action === 'mint' && (
        <div style={{ marginTop: '24px', padding: '24px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginBottom: '20px', color: '#1a1a1a', fontSize: '1.25rem', fontWeight: 600 }}>Mint Tokens</h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontWeight: 600, 
              color: '#2d3748',
              fontSize: '14px',
              letterSpacing: '0.01em'
            }}>
              Recipient Address:
            </label>
            <input
              type="text"
              value={mintTo}
              onChange={(e) => setMintTo(e.target.value)}
              placeholder="0x..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '15px',
                backgroundColor: 'white',
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
              Amount:
            </label>
            <input
              type="text"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              placeholder="1000"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '15px',
                backgroundColor: 'white',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={handleMint}
              disabled={isPending || isConfirming || !isConnected}
              style={{
                padding: '12px 24px',
                background: isPending || isConfirming ? '#cbd5e0' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
                boxShadow: isPending || isConfirming ? 'none' : '0 4px 12px rgba(40, 167, 69, 0.3)',
              }}
            >
              {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Minting...' : 'Mint'}
            </button>
            <button
              onClick={resetAction}
              style={{
                padding: '12px 24px',
                background: '#718096',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(113, 128, 150, 0.3)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {action === 'transfer' && (
        <div style={{ marginTop: '24px', padding: '24px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginBottom: '20px', color: '#1a1a1a', fontSize: '1.25rem', fontWeight: 600 }}>Transfer Tokens</h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontWeight: 600, 
              color: '#2d3748',
              fontSize: '14px',
              letterSpacing: '0.01em'
            }}>
              Recipient Address:
            </label>
            <input
              type="text"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              placeholder="0x..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '15px',
                backgroundColor: 'white',
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
              Amount:
            </label>
            <input
              type="text"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="1000"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '15px',
                backgroundColor: 'white',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={handleTransfer}
              disabled={isPending || isConfirming || !isConnected}
              style={{
                padding: '12px 24px',
                background: isPending || isConfirming ? '#cbd5e0' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
                boxShadow: isPending || isConfirming ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)',
              }}
            >
              {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Transferring...' : 'Transfer'}
            </button>
            <button
              onClick={resetAction}
              style={{
                padding: '12px 24px',
                background: '#718096',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(113, 128, 150, 0.3)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {action === 'balance' && (
        <div style={{ marginTop: '24px', padding: '24px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginBottom: '20px', color: '#1a1a1a', fontSize: '1.25rem', fontWeight: 600 }}>Check Balance</h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontWeight: 600, 
              color: '#2d3748',
              fontSize: '14px',
              letterSpacing: '0.01em'
            }}>
              Address:
            </label>
            <input
              type="text"
              value={balanceAddress}
              onChange={(e) => setBalanceAddress(e.target.value)}
              placeholder="0x..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '15px',
                backgroundColor: 'white',
              }}
            />
          </div>
          {balance !== null && (
            <div
              style={{
                padding: '16px',
                background: '#e6fffa',
                color: '#234e52',
                borderRadius: '10px',
                marginBottom: '20px',
                border: '1px solid #81e6d9',
                fontSize: '15px',
                fontWeight: 500,
              }}
            >
              Balance: {balance} {symbol || ''}
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={handleCheckBalance}
              style={{
                padding: '12px 24px',
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(23, 162, 184, 0.3)',
              }}
            >
              Check Balance
            </button>
            <button
              onClick={resetAction}
              style={{
                padding: '12px 24px',
                background: '#718096',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(113, 128, 150, 0.3)',
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

