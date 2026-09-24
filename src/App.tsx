import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './lib/wagmi'
import DeploySection from './components/DeploySection'
import InteractSection from './components/InteractSection'
import DeployERC721Section from './components/DeployERC721Section'
import InteractERC721Section from './components/InteractERC721Section'
import DeployVaultSection from './components/DeployVaultSection'
import InteractVaultSection from './components/InteractVaultSection'
import { useState } from 'react'

const queryClient = new QueryClient()

type ContractType = 'erc20' | 'erc721' | 'vault'

function App() {
  const [deployedAddress, setDeployedAddress] = useState<string>('')
  const [deployedERC721Address, setDeployedERC721Address] = useState<string>('')
  const [deployedVaultAddress, setDeployedVaultAddress] = useState<string>('')
  const [vaultAsynchronous, setVaultAsynchronous] = useState(false)
  const [contractType, setContractType] = useState<ContractType>('erc20')

  const handleContractTypeChange = (type: ContractType) => {
    setContractType(type)
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div style={{ padding: '20px' }}>
          <h1 style={{
            color: 'white',
            marginBottom: '40px',
            textAlign: 'center',
            fontSize: '3rem',
            fontWeight: 700,
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            letterSpacing: '-0.02em'
          }}>
            {contractType === 'erc20' ? 'ERC20 Faucet' : contractType === 'erc721' ? 'ERC721 NFT Deployer' : 'Tokenized Vault'}
          </h1>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '30px',
          }}>
            <button
              onClick={() => handleContractTypeChange('erc20')}
              style={{
                padding: '14px 32px',
                background: contractType === 'erc20' ? '#667eea' : 'white',
                color: contractType === 'erc20' ? 'white' : '#667eea',
                border: '2px solid #667eea',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: contractType === 'erc20' ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              ERC20 Token
            </button>
            <button
              onClick={() => handleContractTypeChange('erc721')}
              style={{
                padding: '14px 32px',
                background: contractType === 'erc721' ? '#9f7aea' : 'white',
                color: contractType === 'erc721' ? 'white' : '#9f7aea',
                border: '2px solid #9f7aea',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: contractType === 'erc721' ? '0 4px 12px rgba(159, 122, 234, 0.3)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              ERC721 NFT
            </button>
            <button
              onClick={() => handleContractTypeChange('vault')}
              style={{
                padding: '14px 32px',
                background: contractType === 'vault' ? '#0f766e' : 'white',
                color: contractType === 'vault' ? 'white' : '#0f766e',
                border: '2px solid #0f766e',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: contractType === 'vault' ? '0 4px 12px rgba(15, 118, 110, 0.3)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Vault
            </button>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            marginBottom: '30px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}>
            <h2 style={{
              marginBottom: '16px',
              color: '#1a1a1a',
              fontSize: '1.5rem',
              fontWeight: 600,
              letterSpacing: '-0.01em'
            }}>
              How to Use
            </h2>
            {contractType === 'erc20' ? (
              <div style={{ color: '#4a5568', fontSize: '15px', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#2d3748' }}>1. Deploy Contract:</strong> Deploy your ERC20 token contract.
                  To create a faucet contract that holds tokens and allows users to claim them, check the "Enable as a faucet" option.
                </p>
                <p style={{ marginBottom: '0' }}>
                  <strong style={{ color: '#2d3748' }}>2. Interact with Contract:</strong> Once deployed, use the contract address to mint tokens,
                  transfer them, check balances, or call "Money Pweese" (if it's a faucet contract) to receive 5 tokens.
                </p>
              </div>
            ) : contractType === 'erc721' ? (
              <div style={{ color: '#4a5568', fontSize: '15px', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#2d3748' }}>1. Deploy NFT Contract:</strong> Deploy your ERC721 NFT collection.
                  Set the collection name, symbol, and base URI (https:// or ipfs://) for token metadata.
                </p>
                <p style={{ marginBottom: '0' }}>
                  <strong style={{ color: '#2d3748' }}>2. Interact with NFTs:</strong> Once deployed, mint new NFTs (auto-incremented token IDs),
                  transfer them, check balances, verify token ownership, and view token URIs.
                </p>
              </div>
            ) : (
              <div style={{ color: '#4a5568', fontSize: '15px', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#2d3748' }}>1. Deploy a vault:</strong> Deploy an ERC20 first, then point a vault at that token.
                  Leave the async option off for an instant ERC-4626 vault, or turn it on for an ERC-7540 vault whose requests wait for the owner to fulfill them.
                </p>
                <p style={{ marginBottom: '0' }}>
                  <strong style={{ color: '#2d3748' }}>2. Deposit and redeem:</strong> Approve the vault to spend the asset, then deposit or request.
                  One share is always worth one asset. On an async vault, claim shares or assets only after the owner fulfills the request.
                </p>
              </div>
            )}
          </div>

          {contractType === 'erc20' ? (
            <>
              <DeploySection onDeploy={setDeployedAddress} />
              <InteractSection initialAddress={deployedAddress} />
            </>
          ) : contractType === 'erc721' ? (
            <>
              <DeployERC721Section onDeploy={setDeployedERC721Address} />
              <InteractERC721Section initialAddress={deployedERC721Address} />
            </>
          ) : (
            <>
              <DeployVaultSection
                onDeploy={setDeployedVaultAddress}
                asynchronous={vaultAsynchronous}
                onAsynchronousChange={setVaultAsynchronous}
              />
              <InteractVaultSection initialAddress={deployedVaultAddress} asynchronousHint={vaultAsynchronous} />
            </>
          )}
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App

