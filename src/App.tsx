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
          <DeploySection onDeploy={setDeployedAddress} />
          <InteractSection initialAddress={deployedAddress} />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App

