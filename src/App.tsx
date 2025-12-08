import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './lib/wagmi'
import DeploySection from './components/DeploySection'
import InteractSection from './components/InteractSection'
import { useState } from 'react'

const queryClient = new QueryClient()

function App() {
  const [deployedAddress, setDeployedAddress] = useState<string>('')

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
            ERC20 Faucet
          </h1>
          
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
          </div>

          <DeploySection onDeploy={setDeployedAddress} />
          <InteractSection initialAddress={deployedAddress} />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App

