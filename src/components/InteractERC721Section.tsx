import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient } from 'wagmi'
import { getERC721ContractABI } from '../lib/contract'
import WalletButton from './WalletButton'

interface InteractERC721SectionProps {
  initialAddress: string
}

type Action = 'mint' | 'transfer' | 'balance' | 'owner' | 'tokenURI' | null

export default function InteractERC721Section({ initialAddress }: InteractERC721SectionProps) {
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
  const [transferTokenId, setTransferTokenId] = useState('')
  const [transferTo, setTransferTo] = useState('')
  const [balanceAddress, setBalanceAddress] = useState('')
  const [balance, setBalance] = useState<string | null>(null)
  const [ownerTokenId, setOwnerTokenId] = useState('')
  const [tokenOwner, setTokenOwner] = useState<string | null>(null)
  const [tokenURIId, setTokenURIId] = useState('')
  const [tokenURIResult, setTokenURIResult] = useState<string | null>(null)
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const abi = getERC721ContractABI()

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

  const { data: baseURI } = useReadContract({
    address: isContractAddressValid ? (contractAddress as `0x${string}`) : undefined,
    abi,
    functionName: 'baseURI',
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

  // Extract minted token ID from transaction logs
  useEffect(() => {
    const getMintedTokenId = async () => {
      if (isSuccess && hash && publicClient && action === 'mint') {
        try {
          const receipt = await publicClient.getTransactionReceipt({ hash })
          // Find Transfer event log (from address(0))
          for (const log of receipt.logs) {
            // Transfer event topic: keccak256("Transfer(address,address,uint256)")
            if (log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
              // log.topics[3] contains the tokenId (indexed)
              if (log.topics[3]) {
                const tokenId = BigInt(log.topics[3]).toString()
                setMintedTokenId(tokenId)
                break
              }
            }
          }
        } catch (err) {
          console.error('Failed to get minted token ID:', err)
        }
      }
    }
    getMintedTokenId()
  }, [isSuccess, hash, publicClient, action])

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
    if (!mintTo) {
      setError('Please enter a recipient address')
      return
    }
    if (!contractAddress || contractAddress.length !== 42) {
      setError('Invalid contract address')
      return
    }

    setError(null)
    setMintedTokenId(null)
    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi,
        functionName: 'mint',
        args: [mintTo as `0x${string}`],
      })
    } catch (err: any) {
      setError(err.message || 'Failed to mint NFT')
      console.error(err)
    }
  }

  const handleTransfer = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet')
      return
    }
    if (!transferTo || !transferTokenId) {
      setError('Please fill in all fields')
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
        abi,
        functionName: 'transferFrom',
        args: [address as `0x${string}`, transferTo as `0x${string}`, BigInt(transferTokenId)],
      })
    } catch (err: any) {
      setError(err.message || 'Failed to transfer NFT')
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
        setBalance((result as unknown as bigint).toString())
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check balance')
      console.error(err)
    }
  }

  const handleCheckOwner = async () => {
    if (!ownerTokenId) {
      setError('Please enter a token ID')
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
          functionName: 'ownerOf',
          args: [BigInt(ownerTokenId)],
        })
        setTokenOwner(result as unknown as string)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check owner. Token may not exist.')
      console.error(err)
    }
  }

  const handleCheckTokenURI = async () => {
    if (!tokenURIId) {
      setError('Please enter a token ID')
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
          functionName: 'tokenURI',
          args: [BigInt(tokenURIId)],
        })
        setTokenURIResult(result as unknown as string)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get token URI. Token may not exist.')
      console.error(err)
    }
  }

  const resetAction = () => {
    setAction(null)
    setMintTo('')
    setTransferTo('')
    setTransferTokenId('')
    setBalanceAddress('')
    setBalance(null)
    setOwnerTokenId('')
    setTokenOwner(null)
    setTokenURIId('')
    setTokenURIResult(null)
    setMintedTokenId(null)
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
        Interact with NFT Contract
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
            NFT Collection Information
          </h3>
          <div style={{ marginBottom: '12px', fontSize: '14px', color: '#4a5568' }}>
            <strong style={{ color: '#2d3748', display: 'inline-block', minWidth: '120px' }}>Name:</strong> {name || 'Loading...'}
          </div>
          <div style={{ marginBottom: '12px', fontSize: '14px', color: '#4a5568' }}>
            <strong style={{ color: '#2d3748', display: 'inline-block', minWidth: '120px' }}>Symbol:</strong> {symbol || 'Loading...'}
          </div>
          <div style={{ marginBottom: '12px', fontSize: '14px', color: '#4a5568' }}>
            <strong style={{ color: '#2d3748', display: 'inline-block', minWidth: '120px' }}>Base URI:</strong>{' '}
            <span style={{ wordBreak: 'break-all' }}>{baseURI || 'Loading...'}</span>
          </div>
          <div style={{ marginBottom: '12px', fontSize: '14px', color: '#4a5568' }}>
            <strong style={{ color: '#2d3748', display: 'inline-block', minWidth: '120px' }}>Total Supply:</strong>{' '}
            {totalSupplyError ? (
              <span style={{ color: '#e53e3e' }}>Error: {totalSupplyError.message}</span>
            ) : isLoadingTotalSupply ? (
              'Loading...'
            ) : totalSupply !== undefined && totalSupply !== null ? (
              (totalSupply as unknown as bigint).toString()
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
              style={{ color: '#9f7aea', textDecoration: 'none', wordBreak: 'break-all' }}
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
          {mintedTokenId && (
            <div style={{ marginBottom: '8px', fontSize: '15px' }}>
              Minted Token ID: <strong>{mintedTokenId}</strong>
            </div>
          )}
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
            Mint NFT
          </button>
          <button
            onClick={() => setAction('transfer')}
            style={{
              padding: '14px 28px',
              background: '#9f7aea',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(159, 122, 234, 0.3)',
            }}
          >
            Transfer NFT
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
            onClick={() => setAction('owner')}
            style={{
              padding: '14px 28px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
            }}
          >
            Check Owner
          </button>
          <button
            onClick={() => setAction('tokenURI')}
            style={{
              padding: '14px 28px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            }}
          >
            View Token URI
          </button>
        </div>
      )}

      {action === 'mint' && (
        <div style={{ marginTop: '24px', padding: '24px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginBottom: '20px', color: '#1a1a1a', fontSize: '1.25rem', fontWeight: 600 }}>Mint NFT</h3>
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
          <h3 style={{ marginBottom: '20px', color: '#1a1a1a', fontSize: '1.25rem', fontWeight: 600 }}>Transfer NFT</h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: 600,
              color: '#2d3748',
              fontSize: '14px',
              letterSpacing: '0.01em'
            }}>
              Token ID:
            </label>
            <input
              type="text"
              value={transferTokenId}
              onChange={(e) => setTransferTokenId(e.target.value)}
              placeholder="0"
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
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={handleTransfer}
              disabled={isPending || isConfirming || !isConnected}
              style={{
                padding: '12px 24px',
                background: isPending || isConfirming ? '#cbd5e0' : '#9f7aea',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
                boxShadow: isPending || isConfirming ? 'none' : '0 4px 12px rgba(159, 122, 234, 0.3)',
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
              NFT Balance: {balance}
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

      {action === 'owner' && (
        <div style={{ marginTop: '24px', padding: '24px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginBottom: '20px', color: '#1a1a1a', fontSize: '1.25rem', fontWeight: 600 }}>Check Token Owner</h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: 600,
              color: '#2d3748',
              fontSize: '14px',
              letterSpacing: '0.01em'
            }}>
              Token ID:
            </label>
            <input
              type="text"
              value={ownerTokenId}
              onChange={(e) => setOwnerTokenId(e.target.value)}
              placeholder="0"
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
          {tokenOwner !== null && (
            <div
              style={{
                padding: '16px',
                background: '#fef3c7',
                color: '#92400e',
                borderRadius: '10px',
                marginBottom: '20px',
                border: '1px solid #fcd34d',
                fontSize: '15px',
                fontWeight: 500,
                wordBreak: 'break-all',
              }}
            >
              Owner: {tokenOwner}
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={handleCheckOwner}
              style={{
                padding: '12px 24px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              }}
            >
              Check Owner
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

      {action === 'tokenURI' && (
        <div style={{ marginTop: '24px', padding: '24px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginBottom: '20px', color: '#1a1a1a', fontSize: '1.25rem', fontWeight: 600 }}>View Token URI</h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: 600,
              color: '#2d3748',
              fontSize: '14px',
              letterSpacing: '0.01em'
            }}>
              Token ID:
            </label>
            <input
              type="text"
              value={tokenURIId}
              onChange={(e) => setTokenURIId(e.target.value)}
              placeholder="0"
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
          {tokenURIResult !== null && (
            <div
              style={{
                padding: '16px',
                background: '#eef2ff',
                color: '#3730a3',
                borderRadius: '10px',
                marginBottom: '20px',
                border: '1px solid #a5b4fc',
                fontSize: '15px',
                fontWeight: 500,
                wordBreak: 'break-all',
              }}
            >
              Token URI: {tokenURIResult}
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={handleCheckTokenURI}
              style={{
                padding: '12px 24px',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              }}
            >
              View Token URI
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
