import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAccount, useChainId, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { formatUnits, isAddress, parseUnits } from 'viem'
import { getAssetABI, getVaultABI } from '../lib/contract'
import WalletButton from './WalletButton'

interface InteractVaultSectionProps {
  initialAddress: string
  asynchronousHint: boolean
}

type Action =
  | 'approve'
  | 'deposit'
  | 'mint'
  | 'withdraw'
  | 'redeem'
  | 'preview'
  | 'requestDeposit'
  | 'requestRedeem'
  | 'requestStatus'
  | 'setOperator'
  | 'fulfillDeposit'
  | 'fulfillRedeem'
  | null

const labelStyle = {
  display: 'block',
  marginBottom: '10px',
  fontWeight: 600,
  color: '#2d3748',
  fontSize: '14px',
  letterSpacing: '0.01em',
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '15px',
  backgroundColor: 'white',
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={labelStyle}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  )
}

function ActionButton({
  label,
  color,
  onClick,
  disabled,
}: {
  label: string
  color: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '14px 28px',
        background: disabled ? '#cbd5e0' : color,
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '16px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.12)',
      }}
    >
      {label}
    </button>
  )
}

export default function InteractVaultSection({ initialAddress, asynchronousHint }: InteractVaultSectionProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const [contractAddress, setContractAddress] = useState(initialAddress)
  const [action, setAction] = useState<Action>(null)
  const [amount, setAmount] = useState('')
  const [receiver, setReceiver] = useState('')
  const [controller, setController] = useState('')
  const [ownerAddress, setOwnerAddress] = useState('')
  const [operator, setOperator] = useState('')
  const [operatorApproved, setOperatorApproved] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [readout, setReadout] = useState<string | null>(null)

  const abi = getVaultABI()
  const assetAbi = getAssetABI()
  const vaultAddress = isAddress(contractAddress) ? (contractAddress as `0x${string}`) : undefined

  const supportsAsync = useReadContract({
    address: vaultAddress,
    abi,
    functionName: 'supportsInterface',
    args: ['0xce3bbe50'],
    query: { enabled: !!vaultAddress },
  })

  const chainSettled = !!vaultAddress && (supportsAsync.isFetched || supportsAsync.isError)
  const isAsync = chainSettled ? (supportsAsync.data as unknown) === true : asynchronousHint

  const nameRead = useReadContract({
    address: vaultAddress,
    abi,
    functionName: 'name',
    query: { enabled: !!vaultAddress },
  })
  const symbolRead = useReadContract({
    address: vaultAddress,
    abi,
    functionName: 'symbol',
    query: { enabled: !!vaultAddress },
  })
  const decimalsRead = useReadContract({
    address: vaultAddress,
    abi,
    functionName: 'decimals',
    query: { enabled: !!vaultAddress },
  })
  const assetRead = useReadContract({
    address: vaultAddress,
    abi,
    functionName: 'asset',
    query: { enabled: !!vaultAddress },
  })
  const { data: totalAssets } = useReadContract({
    address: vaultAddress,
    abi,
    functionName: 'totalAssets',
    query: { enabled: !!vaultAddress },
  })
  const { data: totalSupply } = useReadContract({
    address: vaultAddress,
    abi,
    functionName: 'totalSupply',
    query: { enabled: !!vaultAddress },
  })
  const ownerRead = useReadContract({
    address: vaultAddress,
    abi,
    functionName: 'owner',
    query: { enabled: !!vaultAddress },
  })
  const { data: shareBalance } = useReadContract({
    address: vaultAddress,
    abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!vaultAddress && !!address },
  })

  const name = nameRead.data
  const symbol = symbolRead.data
  const decimals = decimalsRead.data
  const asset = assetRead.data
  const vaultOwner = ownerRead.data
  const assetAddress = typeof asset === 'string' && isAddress(asset) ? (asset as `0x${string}`) : undefined
  const { data: assetBalance } = useReadContract({
    address: assetAddress,
    abi: assetAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!assetAddress && !!address },
  })

  const requestArgs = address ? [0n, address] : undefined
  const requestQuery = { enabled: !!vaultAddress && isAsync && !!address }
  const { data: pendingDeposit } = useReadContract({
    address: vaultAddress,
    abi,
    functionName: 'pendingDepositRequest',
    args: requestArgs,
    query: requestQuery,
  })
  const { data: claimableDeposit } = useReadContract({
    address: vaultAddress,
    abi,
    functionName: 'claimableDepositRequest',
    args: requestArgs,
    query: requestQuery,
  })
  const { data: pendingRedeem } = useReadContract({
    address: vaultAddress,
    abi,
    functionName: 'pendingRedeemRequest',
    args: requestArgs,
    query: requestQuery,
  })
  const { data: claimableRedeem } = useReadContract({
    address: vaultAddress,
    abi,
    functionName: 'claimableRedeemRequest',
    args: requestArgs,
    query: requestQuery,
  })

  const decimalsValue = decimals !== undefined ? Number(decimals as unknown as number) : 18
  const ownerValue = vaultOwner as unknown
  const isOwner = !!address && typeof ownerValue === 'string' && address.toLowerCase() === ownerValue.toLowerCase()

  useEffect(() => {
    if (initialAddress) {
      setContractAddress(initialAddress)
    }
  }, [initialAddress])

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries()
    }
  }, [isSuccess, hash, queryClient])

  const chainNames: Record<number, string> = {
    11155111: 'sepolia',
    5: 'goerli',
    80001: 'mumbai',
    84532: 'sepolia',
    421614: 'sepolia',
  }

  const explorerAddress = (value: string) => {
    const chainName = chainNames[chainId] || 'sepolia'
    return `https://${chainName}.etherscan.io/address/${value}`
  }

  const explorerTx = (value: string) => {
    const chainName = chainNames[chainId] || 'sepolia'
    return `https://${chainName}.etherscan.io/tx/${value}`
  }

  const formatAmount = (value: unknown) => {
    if (typeof value !== 'bigint') return '—'
    return formatUnits(value, decimalsValue)
  }

  const openAction = (next: Action) => {
    setAction(next)
    setAmount('')
    setReceiver('')
    setController('')
    setOwnerAddress('')
    setOperator('')
    setOperatorApproved(true)
    setError(null)
    setReadout(null)
  }

  const resolveAddress = (value: string, fallback?: string) => {
    const chosen = value.trim() || fallback || ''
    if (!isAddress(chosen)) return null
    return chosen as `0x${string}`
  }

  const parseAmount = (value: string) => {
    if (!value.trim()) {
      throw new Error('Enter an amount')
    }
    return parseUnits(value.trim(), decimalsValue)
  }

  const requireContract = () => {
    if (!vaultAddress) {
      setError('Enter a valid vault address')
      return null
    }
    return vaultAddress
  }

  const handleSubmit = async () => {
    setError(null)
    setReadout(null)
    const vault = requireContract()
    if (!vault) return

    const needsWallet = action !== 'preview' && action !== 'requestStatus'
    if (needsWallet && (!isConnected || !address)) {
      setError('Please connect your wallet')
      return
    }

    try {
      if (action === 'approve') {
        if (!assetAddress) {
          setError('Vault asset address is not available yet')
          return
        }
        writeContract({
          address: assetAddress,
          abi: assetAbi,
          functionName: 'approve',
          args: [vault, parseAmount(amount)],
        })
        return
      }

      if (action === 'deposit' || action === 'mint') {
        const receiverAddress = resolveAddress(receiver, address)
        if (!receiverAddress) {
          setError('Enter a receiver address')
          return
        }
        const parsed = parseAmount(amount)
        if (isAsync) {
          const controllerAddress = resolveAddress(controller, address)
          if (!controllerAddress) {
            setError('Enter a controller address')
            return
          }
          writeContract({
            address: vault,
            abi,
            functionName: action,
            args: [parsed, receiverAddress, controllerAddress],
          })
        } else {
          writeContract({
            address: vault,
            abi,
            functionName: action,
            args: [parsed, receiverAddress],
          })
        }
        return
      }

      if (action === 'withdraw' || action === 'redeem') {
        const receiverAddress = resolveAddress(receiver, address)
        const party = resolveAddress(controller, address)
        if (!receiverAddress || !party) {
          setError(isAsync ? 'Enter a receiver and controller' : 'Enter a receiver and owner')
          return
        }
        writeContract({
          address: vault,
          abi,
          functionName: action,
          args: [parseAmount(amount), receiverAddress, party],
        })
        return
      }

      if (action === 'requestDeposit' || action === 'requestRedeem') {
        const controllerAddress = resolveAddress(controller, address)
        const tokenOwner = resolveAddress(ownerAddress, address)
        if (!controllerAddress || !tokenOwner) {
          setError('Enter a controller and owner')
          return
        }
        writeContract({
          address: vault,
          abi,
          functionName: action,
          args: [parseAmount(amount), controllerAddress, tokenOwner],
        })
        return
      }

      if (action === 'setOperator') {
        const operatorAddress = resolveAddress(operator)
        if (!operatorAddress) {
          setError('Enter an operator address')
          return
        }
        writeContract({
          address: vault,
          abi,
          functionName: 'setOperator',
          args: [operatorAddress, operatorApproved],
        })
        return
      }

      if (action === 'fulfillDeposit' || action === 'fulfillRedeem') {
        const controllerAddress = resolveAddress(controller, address)
        if (!controllerAddress) {
          setError('Enter a controller address')
          return
        }
        writeContract({
          address: vault,
          abi,
          functionName: action,
          args: [controllerAddress],
        })
        return
      }

      if (!publicClient) {
        setError('No network client available')
        return
      }

      if (action === 'preview') {
        const parsed = parseAmount(amount)
        const calls = [
          'convertToShares',
          'convertToAssets',
          'previewDeposit',
          'previewMint',
          'previewWithdraw',
          'previewRedeem',
        ] as const
        const lines: string[] = []
        for (const functionName of calls) {
          try {
            const result = await publicClient.readContract({
              address: vault,
              abi,
              functionName,
              args: [parsed],
            })
            lines.push(`${functionName}: ${formatUnits(result as unknown as bigint, decimalsValue)}`)
          } catch (err: any) {
            const message = err.shortMessage || err.message || 'reverted'
            lines.push(`${functionName}: ${message}`)
          }
        }
        setReadout(lines.join('\n'))
        return
      }

      if (action === 'requestStatus') {
        const controllerAddress = resolveAddress(controller, address)
        if (!controllerAddress) {
          setError('Enter a controller address')
          return
        }
        const [pendingDepositAssets, claimableDepositAssets, pendingRedeemShares, claimableRedeemShares] =
          await Promise.all([
            publicClient.readContract({
              address: vault,
              abi,
              functionName: 'pendingDepositRequest',
              args: [0n, controllerAddress],
            }),
            publicClient.readContract({
              address: vault,
              abi,
              functionName: 'claimableDepositRequest',
              args: [0n, controllerAddress],
            }),
            publicClient.readContract({
              address: vault,
              abi,
              functionName: 'pendingRedeemRequest',
              args: [0n, controllerAddress],
            }),
            publicClient.readContract({
              address: vault,
              abi,
              functionName: 'claimableRedeemRequest',
              args: [0n, controllerAddress],
            }),
          ])
        setReadout(
          [
            `Pending deposit: ${formatUnits(pendingDepositAssets as unknown as bigint, decimalsValue)} assets`,
            `Claimable deposit: ${formatUnits(claimableDepositAssets as unknown as bigint, decimalsValue)} assets`,
            `Pending redeem: ${formatUnits(pendingRedeemShares as unknown as bigint, decimalsValue)} shares`,
            `Claimable redeem: ${formatUnits(claimableRedeemShares as unknown as bigint, decimalsValue)} shares`,
          ].join('\n'),
        )
      }
    } catch (err: any) {
      setError(err.shortMessage || err.message || 'Request failed')
    }
  }

  const busy = isPending || isConfirming
  const vaultTypeLabel = !vaultAddress
    ? asynchronousHint
      ? 'Asynchronous ERC-7540 (selected)'
      : 'Synchronous ERC-4626 (selected)'
    : !chainSettled
      ? 'Detecting...'
      : isAsync
        ? 'Asynchronous ERC-7540'
        : 'Synchronous ERC-4626'

  const actionCopy: Record<Exclude<Action, null>, { title: string; detail: string }> = {
    approve: {
      title: 'Approve asset',
      detail: 'Allow this vault to pull the underlying ERC20 before a deposit or deposit request.',
    },
    deposit: {
      title: isAsync ? 'Claim deposit' : 'Deposit',
      detail: isAsync
        ? 'Mint shares for assets that are already claimable. This does not transfer assets again.'
        : 'Pull assets from your wallet and mint the same amount of shares to the receiver.',
    },
    mint: {
      title: isAsync ? 'Claim mint' : 'Mint',
      detail: isAsync
        ? 'Mint a chosen number of shares from a claimable deposit. One share equals one asset.'
        : 'Mint an exact number of shares. The vault pulls that many assets from your wallet.',
    },
    withdraw: {
      title: isAsync ? 'Claim withdraw' : 'Withdraw',
      detail: isAsync
        ? 'Send assets from a claimable redemption to the receiver.'
        : 'Burn shares from the owner and send the same amount of assets to the receiver.',
    },
    redeem: {
      title: isAsync ? 'Claim redeem' : 'Redeem',
      detail: isAsync
        ? 'Send assets from a claimable redemption to the receiver.'
        : 'Burn an exact number of shares and send that many assets to the receiver.',
    },
    preview: {
      title: 'Convert and preview',
      detail: isAsync
        ? 'Conversion stays 1:1. Preview functions revert on an asynchronous vault.'
        : 'At this fixed rate, every conversion and preview returns the same amount.',
    },
    requestDeposit: {
      title: 'Request deposit',
      detail: 'Pull assets into the vault and leave them pending until the owner fulfills the request.',
    },
    requestRedeem: {
      title: 'Request redeem',
      detail: 'Burn shares now and leave the redemption pending until the owner fulfills it.',
    },
    requestStatus: {
      title: 'Request status',
      detail: 'Read pending and claimable amounts for request id 0.',
    },
    setOperator: {
      title: 'Set operator',
      detail: 'Let another account request and claim on your behalf.',
    },
    fulfillDeposit: {
      title: 'Fulfill deposit',
      detail: 'Move a controller’s pending deposit into the claimable state. Only the vault owner can do this.',
    },
    fulfillRedeem: {
      title: 'Fulfill redeem',
      detail: 'Move a controller’s pending redemption into the claimable state. Only the vault owner can do this.',
    },
  }

  const settledText = (value: unknown, read: { isFetched: boolean; isError: boolean }) => {
    if (typeof value === 'string' && value) return value
    if (typeof value === 'number' || typeof value === 'bigint') return String(value)
    return read.isFetched || read.isError ? 'Unavailable' : 'Loading...'
  }

  const infoRow = (label: string, value: string) => (
    <div style={{ marginBottom: '12px', fontSize: '14px', color: '#4a5568' }}>
      <strong style={{ color: '#2d3748', display: 'inline-block', minWidth: '170px' }}>{label}:</strong> {value}
    </div>
  )

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
      <h2
        style={{
          marginBottom: '30px',
          color: '#1a1a1a',
          fontSize: '1.75rem',
          fontWeight: 600,
          letterSpacing: '-0.01em',
        }}
      >
        Interact with Vault
      </h2>

      <WalletButton />

      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Vault address:</label>
        <input
          type="text"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value.trim())}
          placeholder="0x..."
          style={{ ...inputStyle, backgroundColor: '#f8f9fa' }}
        />
      </div>

      <div
        style={{
          padding: '24px',
          background: '#f8f9fa',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid #e2e8f0',
        }}
      >
        <h3 style={{ marginBottom: '20px', color: '#1a1a1a', fontSize: '1.25rem', fontWeight: 600 }}>Vault information</h3>
        {infoRow('Type', vaultTypeLabel)}
        {vaultAddress && (
          <>
            {infoRow('Name', settledText(name, nameRead))}
            {infoRow('Symbol', settledText(symbol, symbolRead))}
            {infoRow('Decimals', settledText(decimals, decimalsRead))}
            {infoRow('Total assets', formatAmount(totalAssets))}
            {infoRow('Total shares', formatAmount(totalSupply))}
            <div style={{ marginBottom: '12px', fontSize: '14px', color: '#4a5568' }}>
              <strong style={{ color: '#2d3748', display: 'inline-block', minWidth: '170px' }}>Asset:</strong>{' '}
              {assetAddress ? (
                <a href={explorerAddress(assetAddress)} target="_blank" rel="noopener noreferrer" style={{ color: '#0f766e' }}>
                  {assetAddress}
                </a>
              ) : (
                settledText(asset, assetRead)
              )}
            </div>
            {infoRow('Owner', settledText(vaultOwner, ownerRead))}
            {address && (
              <>
                {infoRow('Your shares', formatAmount(shareBalance))}
                {infoRow('Your assets', formatAmount(assetBalance))}
              </>
            )}
            {isAsync && address && (
              <>
                {infoRow('Pending deposit', formatAmount(pendingDeposit))}
                {infoRow('Claimable deposit', formatAmount(claimableDeposit))}
                {infoRow('Pending redeem', formatAmount(pendingRedeem))}
                {infoRow('Claimable redeem', formatAmount(claimableRedeem))}
              </>
            )}
          </>
        )}
      </div>

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
            href={explorerTx(hash)}
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
          <ActionButton label="Approve asset" color="#d97706" onClick={() => openAction('approve')} disabled={busy} />
          {isAsync && (
            <>
              <ActionButton label="Request deposit" color="#2563eb" onClick={() => openAction('requestDeposit')} disabled={busy} />
              <ActionButton label="Request redeem" color="#1d4ed8" onClick={() => openAction('requestRedeem')} disabled={busy} />
            </>
          )}
          <ActionButton
            label={isAsync ? 'Claim deposit' : 'Deposit'}
            color="#059669"
            onClick={() => openAction('deposit')}
            disabled={busy}
          />
          <ActionButton
            label={isAsync ? 'Claim mint' : 'Mint'}
            color="#0d9488"
            onClick={() => openAction('mint')}
            disabled={busy}
          />
          <ActionButton
            label={isAsync ? 'Claim withdraw' : 'Withdraw'}
            color="#dc2626"
            onClick={() => openAction('withdraw')}
            disabled={busy}
          />
          <ActionButton
            label={isAsync ? 'Claim redeem' : 'Redeem'}
            color="#b45309"
            onClick={() => openAction('redeem')}
            disabled={busy}
          />
          <ActionButton label="Preview" color="#0891b2" onClick={() => openAction('preview')} disabled={busy} />
          {isAsync && (
            <>
              <ActionButton label="Request status" color="#0369a1" onClick={() => openAction('requestStatus')} disabled={busy} />
              <ActionButton label="Set operator" color="#4b5563" onClick={() => openAction('setOperator')} disabled={busy} />
            </>
          )}
          {isAsync && isOwner && (
            <>
              <ActionButton label="Fulfill deposit" color="#7c3aed" onClick={() => openAction('fulfillDeposit')} disabled={busy} />
              <ActionButton label="Fulfill redeem" color="#6d28d9" onClick={() => openAction('fulfillRedeem')} disabled={busy} />
            </>
          )}
        </div>
      )}

      {action && (
        <div style={{ marginTop: '24px', padding: '24px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginBottom: '8px', color: '#1a1a1a', fontSize: '1.25rem', fontWeight: 600 }}>{actionCopy[action].title}</h3>
          <p style={{ marginBottom: '20px', color: '#4a5568', fontSize: '14px', lineHeight: 1.5 }}>{actionCopy[action].detail}</p>

          {(action === 'approve' ||
            action === 'deposit' ||
            action === 'mint' ||
            action === 'withdraw' ||
            action === 'redeem' ||
            action === 'preview' ||
            action === 'requestDeposit' ||
            action === 'requestRedeem') && (
            <Field
              label={action === 'mint' || action === 'redeem' || action === 'requestRedeem' ? 'Shares:' : 'Assets:'}
              value={amount}
              onChange={setAmount}
              placeholder="1.0"
            />
          )}

          {(action === 'deposit' || action === 'mint' || action === 'withdraw' || action === 'redeem') && (
            <Field label="Receiver:" value={receiver} onChange={setReceiver} placeholder={address || '0x...'} />
          )}

          {(action === 'withdraw' || action === 'redeem' || action === 'requestDeposit' || action === 'requestRedeem' || action === 'requestStatus' || action === 'fulfillDeposit' || action === 'fulfillRedeem' || (isAsync && (action === 'deposit' || action === 'mint'))) && (
            <Field
              label={isAsync || action === 'requestDeposit' || action === 'requestRedeem' || action === 'requestStatus' || action === 'fulfillDeposit' || action === 'fulfillRedeem' ? 'Controller:' : 'Owner:'}
              value={controller}
              onChange={setController}
              placeholder={address || '0x...'}
            />
          )}

          {(action === 'requestDeposit' || action === 'requestRedeem') && (
            <Field label="Owner:" value={ownerAddress} onChange={setOwnerAddress} placeholder={address || '0x...'} />
          )}

          {action === 'setOperator' && (
            <>
              <Field label="Operator:" value={operator} onChange={setOperator} placeholder="0x..." />
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={operatorApproved}
                  onChange={(e) => setOperatorApproved(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontWeight: 600, color: '#2d3748', fontSize: '14px' }}>Approved</span>
              </label>
            </>
          )}

          {readout && (
            <pre
              style={{
                marginBottom: '20px',
                padding: '16px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                color: '#1a1a1a',
                fontSize: '14px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {readout}
            </pre>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={handleSubmit}
              disabled={busy}
              style={{
                padding: '12px 24px',
                background: busy ? '#cbd5e0' : '#0f766e',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: busy ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Waiting...' : actionCopy[action].title}
            </button>
            <button
              onClick={() => openAction(null)}
              style={{
                padding: '12px 24px',
                background: '#718096',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
