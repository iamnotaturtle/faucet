import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import https from 'https'
import http from 'http'
import { parseAbiParameters, encodeAbiParameters } from 'viem'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Chain ID to Etherscan API endpoint mapping
// All supported networks use the unified V2 endpoint with chainid parameter
// Etherscan API V2 is required as of August 2025
const CHAIN_CONFIG = {
  // Ethereum networks
  '1': { apiUrl: 'https://api.etherscan.io/v2/api', chainId: '1', name: 'mainnet' },
  '11155111': { apiUrl: 'https://api.etherscan.io/v2/api', chainId: '11155111', name: 'sepolia' },
  '5': { apiUrl: 'https://api.etherscan.io/v2/api', chainId: '5', name: 'goerli' },
  
  // Polygon networks - unified V2 endpoint
  '80001': { apiUrl: 'https://api.etherscan.io/v2/api', chainId: '80001', name: 'mumbai' },
  '137': { apiUrl: 'https://api.etherscan.io/v2/api', chainId: '137', name: 'polygon' },
  
  // Base networks - unified V2 endpoint
  '84532': { apiUrl: 'https://api.etherscan.io/v2/api', chainId: '84532', name: 'base-sepolia' },
  '8453': { apiUrl: 'https://api.etherscan.io/v2/api', chainId: '8453', name: 'base' },
  
  // Arbitrum networks - unified V2 endpoint
  '421614': { apiUrl: 'https://api.etherscan.io/v2/api', chainId: '421614', name: 'arbitrum-sepolia' },
  '42161': { apiUrl: 'https://api.etherscan.io/v2/api', chainId: '42161', name: 'arbitrum' },
}

// Chain name aliases
const CHAIN_ALIASES = {
  sepolia: '11155111',
  goerli: '5',
  mumbai: '80001',
  'base-sepolia': '84532',
  base: '8453',
  'arbitrum-sepolia': '421614',
  arbitrum: '42161',
  mainnet: '1',
  polygon: '137',
}

function parseArgs() {
  const args = process.argv.slice(2)
  const parsed = {}
  
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      const value = args[i + 1]
      if (value && !value.startsWith('--')) {
        parsed[key] = value
        i++
      } else {
        parsed[key] = true
      }
    }
  }
  
  return parsed
}

function getChainConfig(chainInput) {
  // Try as chain ID first
  if (CHAIN_CONFIG[chainInput]) {
    return CHAIN_CONFIG[chainInput]
  }
  
  // Try as chain name/alias
  const chainId = CHAIN_ALIASES[chainInput.toLowerCase()]
  if (chainId && CHAIN_CONFIG[chainId]) {
    return CHAIN_CONFIG[chainId]
  }
  
  throw new Error(`Unsupported chain: ${chainInput}. Supported chains: ${Object.keys(CHAIN_ALIASES).join(', ')}`)
}

function encodeConstructorArgs(argsString) {
  if (!argsString) {
    return ''
  }
  
  // Parse constructor arguments: "MyToken,MTK,18"
  const args = argsString.split(',').map(arg => arg.trim())
  
  if (args.length !== 3) {
    throw new Error('Constructor arguments must be in format: "name,symbol,decimals"')
  }
  
  const [name, symbol, decimals] = args
  const decimalsNum = parseInt(decimals, 10)
  
  if (isNaN(decimalsNum)) {
    throw new Error(`Invalid decimals value: ${decimals}`)
  }
  
  // ABI encode: (string, string, uint8)
  const abiParams = parseAbiParameters('string,string,uint8')
  const encoded = encodeAbiParameters(abiParams, [name, symbol, decimalsNum])
  
  return encoded.slice(2) // Remove '0x' prefix
}

function readContractSource(contractName) {
  const contractPath = join(__dirname, `../src/contracts/${contractName}.sol`)
  
  try {
    return readFileSync(contractPath, 'utf-8')
  } catch (error) {
    throw new Error(`Failed to read contract source: ${error.message}`)
  }
}

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const client = isHttps ? https : http
    
    // For V2 API, chainid should be in both query string and POST body
    const chainid = data.chainid
    
    const postData = new URLSearchParams(data).toString()
    
    // Add chainid as query parameter for V2 API (required)
    let path = urlObj.pathname
    if (chainid) {
      const separator = urlObj.search ? '&' : '?'
      path = `${urlObj.pathname}${separator}chainid=${chainid}`
    } else {
      path = urlObj.pathname + urlObj.search
    }
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    }
    
    const req = client.request(options, (res) => {
      let body = ''
      
      res.on('data', (chunk) => {
        body += chunk
      })
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body)
          resolve(parsed)
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`))
        }
      })
    })
    
    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`))
    })
    
    req.write(postData)
    req.end()
  })
}

async function submitVerification(apiUrl, apiKey, contractAddress, sourceCode, contractName, constructorArgs, compilerVersion, chainId) {
  const data = {
    apikey: apiKey,
    module: 'contract',
    action: 'verifysourcecode',
    contractaddress: contractAddress, // API uses 'contractaddress' not 'address'
    codeformat: 'solidity-single-file',
    contractname: contractName,
    compilerversion: compilerVersion,
    optimizationUsed: '0',
    runs: '200',
    constructorArguments: constructorArgs, // Fixed: API uses 'constructorArguments' not 'constructorArguements'
    sourceCode: sourceCode,
  }
  
  // Add chainid parameter for all networks (unified V2 API approach)
  // chainid is required for V2 API
  if (chainId) {
    data.chainid = chainId
  } else {
    throw new Error('chainid is required for Etherscan API V2')
  }
  
  console.log(`Submitting verification request to ${apiUrl}...`)
  console.log(`Chain ID: ${chainId}`)
  console.log(`Compiler version: ${compilerVersion}`)
  console.log(`Request data keys: ${Object.keys(data).join(', ')}`)
  
  const response = await makeRequest(apiUrl, data)
  
  if (response.status !== '1') {
    // Show full response for debugging
    console.error('Full API response:', JSON.stringify(response, null, 2))
    const errorMsg = response.result || response.message || 'Unknown error'
    
    // Provide helpful guidance for common errors
    if (errorMsg.includes('solc version') || errorMsg.includes('compiler') || errorMsg.includes('solc')) {
      console.error('\n⚠️  Compiler version error detected.')
      console.error('The compiler version must match exactly what was used to deploy the contract.')
      console.error('To find the correct version:')
      console.error('  1. Visit the contract on Etherscan')
      console.error('  2. Check the "Contract" tab for compiler version')
      console.error('  3. Use --compiler-version with the exact version string')
      console.error('  4. See https://etherscan.io/solcversions for supported versions')
      console.error(`\nCurrent compiler version: ${compilerVersion}`)
    }
    
    throw new Error(`Verification submission failed: ${errorMsg}`)
  }
  
  return response.result
}

async function checkVerificationStatus(apiUrl, apiKey, guid, chainId) {
  const data = {
    apikey: apiKey,
    module: 'contract',
    action: 'checkverifystatus',
    guid: guid,
  }
  
  // Add chainid for V2 API
  if (chainId) {
    data.chainid = chainId
  }
  
  const response = await makeRequest(apiUrl, data)
  
  if (response.status === '1') {
    return { success: true, message: response.result }
  } else if (response.result && response.result.includes('Pending')) {
    return { success: false, pending: true, message: response.result }
  } else {
    return { success: false, pending: false, message: response.result || response.message || 'Verification failed' }
  }
}

async function pollVerificationStatus(apiUrl, apiKey, guid, chainId, maxAttempts = 30, delay = 5000) {
  console.log(`Waiting for verification to complete (guid: ${guid})...`)
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, delay))
    
    const status = await checkVerificationStatus(apiUrl, apiKey, guid, chainId)
    
    if (status.success) {
      console.log(`\n✓ Verification successful!`)
      console.log(status.message)
      return true
    }
    
    if (!status.pending) {
      console.error(`\n✗ Verification failed:`)
      console.error(status.message)
      return false
    }
    
    process.stdout.write(`.`)
  }
  
  console.error(`\n✗ Verification timeout after ${maxAttempts} attempts`)
  return false
}

async function main() {
  const args = parseArgs()
  
  // Validate required arguments
  if (!args.address) {
    console.error('Error: --address is required')
    console.error('Usage: npm run verify-contract -- --address <address> --chain <chain> --contract <ERC20|ERC20Faucet> [--constructor-args "name,symbol,decimals"]')
    process.exit(1)
  }
  
  if (!args.chain) {
    console.error('Error: --chain is required')
    console.error('Usage: npm run verify-contract -- --address <address> --chain <chain> --contract <ERC20|ERC20Faucet> [--constructor-args "name,symbol,decimals"]')
    process.exit(1)
  }
  
  if (!args.contract || !['ERC20', 'ERC20Faucet'].includes(args.contract)) {
    console.error('Error: --contract must be either ERC20 or ERC20Faucet')
    console.error('Usage: npm run verify-contract -- --address <address> --chain <chain> --contract <ERC20|ERC20Faucet> [--constructor-args "name,symbol,decimals"]')
    process.exit(1)
  }
  
  // Check for API key
  const apiKey = process.env.ETHERSCAN_API_KEY
  if (!apiKey) {
    console.error('Error: ETHERSCAN_API_KEY environment variable is required')
    console.error('Set it with: export ETHERSCAN_API_KEY=your_api_key')
    process.exit(1)
  }
  
  try {
    // Get chain configuration
    const chainConfig = getChainConfig(args.chain)
    console.log(`Chain: ${chainConfig.name} (${args.chain})`)
    
    // Read contract source
    const contractName = args.contract
    console.log(`Reading contract source: ${contractName}.sol`)
    const sourceCode = readContractSource(contractName)
    
    // Encode constructor arguments
    let constructorArgs = ''
    if (args['constructor-args']) {
      console.log(`Encoding constructor arguments: ${args['constructor-args']}`)
      constructorArgs = encodeConstructorArgs(args['constructor-args'])
    }
    
    // Determine compiler version (matching the contract pragma)
    // Default to Solidity 0.8.30, can be overridden with --compiler-version
    // IMPORTANT: The compiler version must match exactly what was used to deploy the contract
    // Check the deployed contract on Etherscan to see the compiler version used
    // Format: v0.8.30+commit.xxxxxxx (see https://etherscan.io/solcversions for supported versions)
    const compilerVersion = args['compiler-version'] || 'v0.8.30+commit.e11b9ed9'
    
    // Submit verification
    const guid = await submitVerification(
      chainConfig.apiUrl,
      apiKey,
      args.address,
      sourceCode,
      contractName,
      constructorArgs,
      compilerVersion,
      chainConfig.chainId
    )
    
    console.log(`Verification submitted. GUID: ${guid}`)
    
    // Poll for status
    const success = await pollVerificationStatus(chainConfig.apiUrl, apiKey, guid, chainConfig.chainId)
    
    process.exit(success ? 0 : 1)
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
}

main()

